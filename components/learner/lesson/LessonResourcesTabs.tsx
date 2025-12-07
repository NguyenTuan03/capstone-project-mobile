import { get } from "@/services/http/httpService";
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
import VideoList from "./VideoList";

type LessonResourcesTab = "videos" | "quizzes";

const LessonResourcesTabs: React.FC<LessonResourcesTabsProps> = React.memo(
  ({ lessonId, sessionId, style }) => {
    const { quiz, video, loading, error, refresh } =
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
    const [showOverlayModal, setShowOverlayModal] = useState(false);

    const tabs: { key: LessonResourcesTab; label: string }[] = useMemo(
      () => [
        { key: "videos", label: "Video" },
        { key: "quizzes", label: "Quiz" },
      ],
      [quiz, video]
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
              ? Math.round(asset.duration / 1000)
              : undefined,
            uploaded: false,
          });
        }
      } catch (err) {
        Alert.alert("Lỗi", "Không thể chọn video. Vui lòng thử lại.");
      }
    };

    const handleVideoCapture = (video: {
      uri: string;
      name: string;
      duration?: number;
    }) => {
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
      if (!sessionId) {
        setSubmittedVideo(null);
        setOverlayVideoUrl(null);
        return;
      }

      try {
        const user = await storageService.getUser();
        if (!user?.id) {
          setSubmittedVideo(null);
          setOverlayVideoUrl(null);
          return;
        }

        const res = await get<LearnerVideo[]>(
          `/v1/learner-videos/user/${user.id}?sessionId=${sessionId}`
        );
        const list = Array.isArray(res?.data) ? res.data : [];

        if (list.length === 0) {
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

        if (picked?.publicUrl && picked.publicUrl.trim().length > 0) {
          setSubmittedVideo({
            publicUrl: picked.publicUrl,
            thumbnailUrl: picked.thumbnailUrl,
            status: picked.status,
            createdAt: picked.createdAt,
            id: picked.id,
          });

          // IMPORTANT: Check and set overlayVideoUrl if it exists
          if (
            picked.overlayVideoUrl &&
            picked.overlayVideoUrl.trim().length > 0
          ) {
            setOverlayVideoUrl(picked.overlayVideoUrl);
          } else {
            setOverlayVideoUrl(null);
          }
        } else {
          setSubmittedVideo(null);
          setOverlayVideoUrl(null);
        }
      } catch (err) {
        setSubmittedVideo(null);
        setOverlayVideoUrl(null);
      }
    }, [sessionId]);

    const handleUploadVideo = async (coachVideoId: number) => {
      if (!localVideo) return;

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
          // Don't set Content-Type manually - let axios set it with boundary
        });

        Alert.alert("Thành công", "Video đã được upload thành công!");
        setLocalVideo((prev) => (prev ? { ...prev, uploaded: true } : null));
        await loadSubmittedVideo();
        setLocalVideo(null);
      } catch (err: any) {
        Alert.alert(
          "Lỗi",
          err?.response?.data?.message ?? "Không thể upload video"
        );
      } finally {
        setIsUploading(false);
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

    const renderQuizzes = (item: QuizType | undefined) => {
      if (!item) {
        return (
          <Text style={styles.emptyText}>
            Chưa có quiz nào cho bài học này.
          </Text>
        );
      }

      const transformedQuiz = {
        id: item.id,
        title: item.title,
        description: item.description,
        totalQuestions: item.totalQuestions,
        questions: item.questions.map((q) => ({
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
        <View key={item.id} style={styles.resourceCard}>
          <QuizAttemptCard quiz={transformedQuiz} onRefresh={refresh} />
        </View>
      );
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
              video={video}
              submittedVideo={submittedVideo}
              localVideo={localVideo}
              overlayVideoUrl={overlayVideoUrl}
              loadingAnalysis={loadingAnalysis}
              aiAnalysisResult={aiAnalysisResult}
              onViewOverlay={handleViewOverlay}
              onPickVideo={handlePickVideo}
              onUploadVideo={handleUploadVideo}
              onVideoCapture={handleVideoCapture}
              isUploading={isUploading}
              coachVideoId={video?.id}
              coachVideoDuration={video?.duration}
            />
          ) : (
            renderQuizzes(quiz)
          )}
        </View>
      </View>
    );
  }
);

LessonResourcesTabs.displayName = "LessonResourcesTabs";

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
