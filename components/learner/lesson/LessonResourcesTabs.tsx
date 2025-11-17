import { get, post } from "@/services/http/httpService";
import { AiVideoCompareResult, LessonResourcesTabsProps } from "@/types/ai";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLessonResources } from "../../../hooks/useLessonResources";
import http from "../../../services/http/interceptor";
import storageService from "../../../services/storageService";
import { QuizType } from "../../../types/quiz";
import { LearnerVideo } from "../../../types/video";
import QuizAttemptCard from "../quiz/QuizAttempCard";
import OverlayVideoModal from "./OverlayVideoModal";
import VideoList from "./VideoList";

type LessonResourcesTab = "videos" | "quizzes";

const LessonResourcesTabs: React.FC<LessonResourcesTabsProps> = React.memo(
  ({ lessonId, sessionId, style }) => {
    const { quizzes, videos, loading, error, refresh } =
      useLessonResources(lessonId);
    const [activeTab, setActiveTab] = useState<LessonResourcesTab>("videos");
    const [tabLoading, setTabLoading] = useState(false);
    const [localVideo, setLocalVideo] = useState<{
      uri: string;
      name: string;
      duration?: number;
      tags?: string[];
      uploaded?: boolean;
    } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [submittedVideo, setSubmittedVideo] = useState<{
      publicUrl: string;
      thumbnailUrl?: string | null;
      status?: string;
      createdAt?: string;
      id?: number;
    } | null>(null);
    const [aiAnalysisResult, setAiAnalysisResult] =
      useState<AiVideoCompareResult | null>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [overlayVideoUrl, setOverlayVideoUrl] = useState<string | null>(null);
    const [generatingOverlay, setGeneratingOverlay] = useState(false);
    const [showOverlayModal, setShowOverlayModal] = useState(false);

    const tabs: { key: LessonResourcesTab; label: string; count: number }[] =
      useMemo(
        () => [
          { key: "videos", label: "Video", count: videos.length },
          { key: "quizzes", label: "Quiz", count: quizzes.length },
        ],
        [quizzes.length, videos.length]
      );

    const handlePickVideo = async () => {
      try {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Quyền truy cập",
            "Cần quyền truy cập thư viện để chọn video."
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: false,
          quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setLocalVideo({
            uri: asset.uri,
            name: asset.fileName || "Video của bạn",
            duration: asset.duration
              ? Math.round(asset.duration / 60)
              : undefined,
            uploaded: false,
          });
        }
      } catch (err) {
        console.error("Lỗi khi chọn video:", err);
        Alert.alert("Lỗi", "Không thể chọn video. Vui lòng thử lại.");
      }
    };

    const handleVideoCapture = (video: { uri: string; name: string; duration?: number }) => {
      // Update parent localVideo state with captured video including duration
      setLocalVideo({
        uri: video.uri,
        name: video.name,
        duration: video.duration,
        uploaded: false,
      });
    };

    // UPDATED: Load both submitted video and overlayVideoUrl
    const loadSubmittedVideo = useCallback(async () => {
      console.log("🔍 loadSubmittedVideo called, sessionId:", sessionId);

      if (!sessionId) {
        console.log("⚠️ No sessionId, skipping loadSubmittedVideo");
        setSubmittedVideo(null);
        setOverlayVideoUrl(null);
        return;
      }

      try {
        console.log("✅ Starting to load submitted video...");
        const user = await storageService.getUser();
        console.log("👤 User from storage:", user);
        if (!user?.id) {
          console.warn("❌ User not found, cannot load learner video");
          setSubmittedVideo(null);
          setOverlayVideoUrl(null);
          return;
        }

        const res = await get<LearnerVideo[]>(
          `/v1/learner-videos/user/${user.id}?sessionId=${sessionId}`
        );
        console.log("📹 API Response:", res);
        const list = Array.isArray(res?.data) ? res.data : [];
        console.log("📹 Loaded learner videos:", list.length);

        if (list.length === 0) {
          console.log("📹 No learner videos found");
          setSubmittedVideo(null);
          setOverlayVideoUrl(null);
          return;
        }

        // Get the latest video
        const picked =
          list
            .slice()
            .sort(
              (a: any, b: any) =>
                new Date(b?.createdAt ?? 0).getTime() -
                new Date(a?.createdAt ?? 0).getTime()
            )[0] ?? list[0];

        console.log("📹 Picked video:", picked);

        if (picked?.publicUrl && picked.publicUrl.trim().length > 0) {
          setSubmittedVideo({
            publicUrl: picked.publicUrl,
            thumbnailUrl: picked.thumbnailUrl,
            status: picked.status,
            createdAt: picked.createdAt,
            id: picked.id,
          });
          console.log("✅ Set submitted video successfully");

          // IMPORTANT: Check and set overlayVideoUrl if it exists
          if (
            picked.overlayVideoUrl &&
            picked.overlayVideoUrl.trim().length > 0
          ) {
            setOverlayVideoUrl(picked.overlayVideoUrl);
            console.log(
              "✅ Found existing overlay video URL:",
              picked.overlayVideoUrl
            );
          } else {
            setOverlayVideoUrl(null);
            console.log("⚠️ No overlay video URL found");
          }
        } else {
          console.log("⚠️ Video found but no valid publicUrl");
          setSubmittedVideo(null);
          setOverlayVideoUrl(null);
        }
      } catch (err) {
        console.error("❌ Failed to load learner video:", err);
        setSubmittedVideo(null);
        setOverlayVideoUrl(null);
      }
    }, [sessionId]);

    const handleUploadVideo = async (coachVideoId: number) => {
      console.log(
        "🔍 handleUploadVideo called with coachVideoId:",
        coachVideoId
      );
      if (!localVideo) return;

      console.log("🔍 Local video to upload:", JSON.stringify(localVideo));

      setIsUploading(true);
      try {
        const fd = new FormData();

        // Ensure URI has file:// prefix
        const videoUri = localVideo.uri.startsWith("file://")
          ? localVideo.uri
          : `file://${localVideo.uri}`;

        // Ensure filename ends with .mp4
        const videoName = localVideo.name?.endsWith(".mp4")
          ? localVideo.name
          : `${localVideo.name || "video"}.mp4`;

        fd.append("video", {
          uri: videoUri,
          type: "video/mp4",
          name: videoName,
        } as any);

        fd.append("coachVideoId", String(coachVideoId));
        fd.append("sessionId", String(lessonId));

        // Only append duration if available (captured videos may not have it)
        if (localVideo.duration != null) {
          fd.append("duration", String(Math.round(localVideo.duration)));
        }

        // Append tags if available
        if (localVideo.tags && localVideo.tags.length > 0) {
          fd.append("tags", JSON.stringify(localVideo.tags));
        }

        await http.post("/v1/learner-videos", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        Alert.alert("Thành công", "Video đã được upload thành công!");
        setLocalVideo((prev) => (prev ? { ...prev, uploaded: true } : null));
        await loadSubmittedVideo();
        setLocalVideo(null);
      } catch (err: any) {
        console.error("Upload error:", err?.response?.data || err);
        Alert.alert(
          "Lỗi",
          err?.response?.data?.message ?? "Không thể upload video"
        );
      } finally {
        setIsUploading(false);
      }
    };

    const handleGenerateOverlay = async () => {
      if (!submittedVideo?.id) {
        Alert.alert("Lỗi", "Không tìm thấy video để so sánh");
        return;
      }

      const coachVideo = videos.length > 0 ? videos[0] : null;
      if (!coachVideo?.id) {
        Alert.alert("Lỗi", "Không tìm thấy video của coach để so sánh");
        return;
      }

      try {
        setGeneratingOverlay(true);

        console.log("🔍 Learner video ID:", submittedVideo.id);
        console.log("🔍 Coach video ID:", coachVideo.id);

        const response = await post(
          `/v1/learner-videos/${submittedVideo.id}/overlay-video/${coachVideo.id}`
        );

        console.log("✅ Generate overlay response:", response);

        if (response.data && typeof response.data === "string") {
          if (response.data.startsWith("http")) {
            // Reload submitted video to get updated overlayVideoUrl from database
            await loadSubmittedVideo();
            setShowOverlayModal(true);
            Alert.alert("Thành công", "Video overlay đã được tạo!");
          } else {
            Alert.alert(
              "Thông báo",
              "Đang tạo video lồng nhau, vui lòng đợi và thử lại sau"
            );
          }
        } else {
          Alert.alert(
            "Thông báo",
            "Đang tạo video lồng nhau, vui lòng đợi và thử lại sau"
          );
        }
      } catch (err: any) {
        console.error("❌ Error generating overlay video:", err);
        Alert.alert(
          "Lỗi",
          err?.response?.data?.message || "Không thể tạo video overlay"
        );
      } finally {
        setGeneratingOverlay(false);
      }
    };

    const handleViewOverlay = () => {
      setShowOverlayModal(true);
    };

    const loadAiAnalysisResult = useCallback(async () => {
      if (!sessionId) {
        setAiAnalysisResult(null);
        return;
      }

      try {
        setLoadingAnalysis(true);
        const res = await get<AiVideoCompareResult[]>(
          `/v1/ai-video-compare-results/sessions/${sessionId}`
        );

        const list = Array.isArray(res?.data) ? res.data : [];
        if (list.length > 0) {
          const latest = list
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0];
          setAiAnalysisResult(latest);
        } else {
          setAiAnalysisResult(null);
        }
      } catch (err) {
        console.error("Failed to load AI analysis result:", err);
        setAiAnalysisResult(null);
      } finally {
        setLoadingAnalysis(false);
      }
    }, [sessionId]);

    useEffect(() => {
      void loadSubmittedVideo();
    }, [loadSubmittedVideo]);

    useEffect(() => {
      void loadAiAnalysisResult();
    }, [loadAiAnalysisResult]);

    const renderQuizzes = (items: QuizType[]) => {
      if (items.length === 0) {
        return (
          <Text style={styles.emptyText}>
            Chưa có quiz nào cho bài học này.
          </Text>
        );
      }

      return items.map((quiz) => {
        const transformedQuiz = {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          totalQuestions: quiz.totalQuestions,
          questions: quiz.questions.map((q) => ({
            id: q.id,
            title: q.title,
            explanation: q.explanation,
            options: q.options
              .filter((opt) => opt.id !== undefined)
              .map((opt) => ({
                id: opt.id!,
                content: opt.content,
                isCorrect: opt.isCorrect,
              })),
          })),
        };

        return (
          <View key={quiz.id} style={styles.resourceCard}>
            <QuizAttemptCard quiz={transformedQuiz} />
          </View>
        );
      });
    };

    if (!lessonId) {
      return null;
    }

    return (
      <View style={[styles.container, style]}>
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={async () => {
                  if (tab.key !== activeTab) {
                    setTabLoading(true);
                    setActiveTab(tab.key);
                    try {
                      await refresh();
                    } catch (err) {
                      console.error("Error refreshing resources:", err);
                    } finally {
                      setTabLoading(false);
                    }
                  }
                }}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                >
                  {tab.label}
                  <Text style={styles.tabCounter}> ({tab.count})</Text>
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.content}>
          {loading || tabLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadingText}>
                {activeTab === "videos"
                  ? "Đang tải video..."
                  : "Đang tải quiz..."}
              </Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : activeTab === "videos" ? (
            <VideoList
              videos={videos}
              submittedVideo={submittedVideo}
              localVideo={localVideo}
              overlayVideoUrl={overlayVideoUrl}
              generatingOverlay={generatingOverlay}
              loadingAnalysis={loadingAnalysis}
              aiAnalysisResult={aiAnalysisResult}
              onGenerateOverlay={handleGenerateOverlay}
              onViewOverlay={handleViewOverlay}
              onPickVideo={handlePickVideo}
              onUploadVideo={handleUploadVideo}
              onVideoCapture={handleVideoCapture}
              isUploading={isUploading}
              coachVideoId={videos.length > 0 ? videos[0].id : undefined}
              coachVideoDuration={
                videos.length > 0 ? videos[0].duration : undefined
              }
            />
          ) : (
            renderQuizzes(quizzes)
          )}
        </View>

        <OverlayVideoModal
          visible={showOverlayModal}
          overlayVideoUrl={overlayVideoUrl}
          onClose={() => setShowOverlayModal(false)}
        />
      </View>
    );
  }
);

LessonResourcesTabs.displayName = "LessonResourcesTabs";

// Styles remain the same... (copy from previous file)
const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  tabRow: {
    flexDirection: "row",
    padding: 6,
    gap: 6,
    backgroundColor: "#F3F4F6",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  tabButtonActive: {
    backgroundColor: "#059669",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  tabCounter: {
    fontWeight: "500",
    fontSize: 12,
  },
  content: {
    padding: 10,
    gap: 10,
    minHeight: 200,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 20,
    fontStyle: "italic",
  },
  resourceCard: {
    padding: 10,
    borderRadius: 9,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.04,
    shadowRadius: 1.5,
    elevation: 1,
  },
});

export default LessonResourcesTabs;
