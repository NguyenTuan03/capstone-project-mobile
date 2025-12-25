import { get } from "@/services/http/httpService";
import { AiVideoCompareResult, LessonResourcesTabsProps } from "@/types/ai";
import { Ionicons } from "@expo/vector-icons";
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

    const handleTabPress = async (key: LessonResourcesTab) => {
      if (key !== activeTab) {
        import("expo-haptics").then((Haptics) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        });
        setTabLoading(true);
        setActiveTab(key);
        try {
          await refresh();
        } catch (err) {
        } finally {
          setTabLoading(false);
        }
      }
    };

    const tabs: { key: LessonResourcesTab; label: string; icon: any }[] =
      useMemo(
        () => [
          { key: "videos", label: "Luyện tập", icon: "videocam-outline" },
          { key: "quizzes", label: "Kiểm tra", icon: "help-circle-outline" },
        ],
        []
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
      setLocalVideo({
        uri: video.uri,
        name: video.name,
        duration: video.duration,
        uploaded: false,
      });
    };

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
        const videoUri = localVideo.uri.startsWith("file://")
          ? localVideo.uri
          : `file://${localVideo.uri}`;

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

        if (localVideo.duration != null) {
          fd.append("duration", String(Math.round(localVideo.duration)));
        }

        if (localVideo.tags && localVideo.tags.length > 0) {
          fd.append("tags", JSON.stringify(localVideo.tags));
        }

        await http.post("/v1/learner-videos", fd, {});

        Alert.alert("Thành công", "Video đã được upload thành công!");
        setLocalVideo((prev) => (prev ? { ...prev, uploaded: true } : null));

        // Refresh all lesson data
        await Promise.all([
          refresh(),
          loadSubmittedVideo(),
          loadAiAnalysisResult(),
        ]);

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
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="help-buoy-outline" size={40} color="#94A3B8" />
            </View>
            <Text style={styles.emptyText}>Chưa có bài kiểm tra.</Text>
          </View>
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

    if (!lessonId) return null;

    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <View style={styles.tabContainer}>
            {tabs.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => handleTabPress(tab.key)}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={tab.icon}
                    size={16}
                    color={isActive ? "#FFFFFF" : "#64748B"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.content}>
          {loading || tabLoading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color="#059669" />
              <View style={styles.loadingTextContainer}>
                <Text style={styles.loadingMainText}>
                  Đang chuẩn bị nội dung
                </Text>
                <Text style={styles.loadingSubText}>
                  Vui lòng chờ trong giây lát...
                </Text>
              </View>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={32} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
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
    marginTop: 12,
    backgroundColor: "transparent",
    gap: 12,
  },
  header: {
    paddingHorizontal: 2,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#059669",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
  },
  tabLabelActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  content: {
    paddingBottom: 16,
  },
  loadingWrapper: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 16,
  },
  loadingTextContainer: {
    alignItems: "center",
    gap: 2,
  },
  loadingMainText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },
  loadingSubText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  errorContainer: {
    padding: 24,
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    textAlign: "center",
    fontWeight: "600",
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "600",
  },
  resourceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 4,
  },
});

export default LessonResourcesTabs;
