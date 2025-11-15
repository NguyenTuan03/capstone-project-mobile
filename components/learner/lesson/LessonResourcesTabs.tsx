import { get } from "@/services/http/httpService";
import { AiVideoCompareResult, LessonResourcesTabsProps } from "@/types/ai";
import { useEvent } from "expo";
import * as ImagePicker from "expo-image-picker";
import type { PlayerError } from "expo-video";
import { useVideoPlayer, VideoView } from "expo-video";
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
import { LearnerVideo, VideoType } from "../../../types/video";
import QuizAttemptCard from "../quiz/QuizAttempCard";

type LessonResourcesTab = "videos" | "quizzes";

const LessonResourcesTabs: React.FC<LessonResourcesTabsProps> = React.memo(
  ({ lessonId, sessionId, style }) => {
    const { quizzes, videos, loading, error } = useLessonResources(lessonId);
    const [activeTab, setActiveTab] = useState<LessonResourcesTab>("videos");
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

    const tabs: { key: LessonResourcesTab; label: string; count: number }[] =
      useMemo(
        () => [
          { key: "videos", label: "Video", count: videos.length },
          { key: "quizzes", label: "Quiz", count: quizzes.length },
        ],
        [quizzes.length, videos.length]
      );

    const renderTags = (tags: VideoType["tags"]) => {
      if (!tags) return null;

      const normalizedTags = Array.isArray(tags)
        ? tags
        : typeof tags === "string"
        ? parseTags(tags)
        : [];

      if (normalizedTags.length === 0) return null;

      return (
        <View style={styles.tagContainer}>
          {normalizedTags.map((tag: string) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      );
    };

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

    const loadSubmittedVideo = useCallback(async () => {
      console.log("🔍 loadSubmittedVideo called, sessionId:", sessionId);

      if (!sessionId) {
        console.log("⚠️ No sessionId, skipping loadSubmittedVideo");
        setSubmittedVideo(null);
        return;
      }

      try {
        console.log("✅ Starting to load submitted video...");
        // Lấy userId từ storage
        const user = await storageService.getUser();
        console.log("👤 User from storage:", user);
        if (!user?.id) {
          console.warn("❌ User not found, cannot load learner video");
          setSubmittedVideo(null);
          return;
        }

        // Gọi API mới với userId và sessionId
        const res = await get<LearnerVideo[]>(
          `/v1/learner-videos/user/${user.id}?sessionId=${sessionId}`
        );
        console.log("res", res);
        // API trả về array trong res.data
        const list = Array.isArray(res?.data) ? res.data : [];
        console.log("📹 Loaded learner videos:", list.length);
        if (list.length > 0) {
          console.log("📹 First video:", {
            id: list[0]?.id,
            hasPublicUrl: !!list[0]?.publicUrl,
            publicUrl: list[0]?.publicUrl?.substring(0, 50),
            status: list[0]?.status,
          });
        }

        if (list.length === 0) {
          console.log("📹 No learner videos found");
          setSubmittedVideo(null);
          return;
        }

        // Lấy video mới nhất (sắp xếp theo createdAt giảm dần)
        const picked =
          list
            .slice()
            .sort(
              (a: any, b: any) =>
                new Date(b?.createdAt ?? 0).getTime() -
                new Date(a?.createdAt ?? 0).getTime()
            )[0] ?? list[0];

        console.log("📹 Picked video:", {
          id: picked?.id,
          hasPublicUrl: !!picked?.publicUrl,
          status: picked?.status,
        });

        // Kiểm tra chặt chẽ: publicUrl phải tồn tại và không rỗng
        if (picked?.publicUrl && picked.publicUrl.trim().length > 0) {
          setSubmittedVideo({
            publicUrl: picked.publicUrl,
            thumbnailUrl: picked.thumbnailUrl,
            status: picked.status,
            createdAt: picked.createdAt,
            id: picked.id,
          });
          console.log("✅ Set submitted video successfully");
        } else {
          console.log("⚠️ Video found but no valid publicUrl");
          setSubmittedVideo(null);
        }
      } catch (err) {
        console.error("❌ Failed to load learner video:", err);
        // ignore silently; not critical to block UI
        setSubmittedVideo(null);
      }
    }, [sessionId]);

    const handleUploadVideo = async (coachVideoId: number) => {
      if (!localVideo) return;

      setIsUploading(true);
      try {
        const fd = new FormData();

        fd.append("video", {
          uri: localVideo.uri.startsWith("file://")
            ? localVideo.uri
            : localVideo.uri,
          type: "video/mp4",
          name: localVideo.name?.endsWith(".mp4")
            ? localVideo.name
            : "video.mp4",
        } as any);

        fd.append("coachVideoId", String(coachVideoId));
        fd.append("sessionId", String(lessonId));
        if (localVideo.duration != null)
          fd.append("duration", String(Math.round(localVideo.duration)));
        if (localVideo.tags?.length) {
          fd.append("tags", JSON.stringify(localVideo.tags));
        }

        await http.post("/v1/learner-videos", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        Alert.alert("Thành công", "Video đã được upload thành công!");
        // mark uploaded, then fetch submitted video and replace local preview
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

    const renderVideos = (items: VideoType[]) => {
      return (
        <>
          {submittedVideo && (
            <View style={styles.submittedVideoCard}>
              <View style={styles.submittedVideoHeader}>
                <View>
                  <Text style={styles.submittedVideoTitle}>
                    📹 Video bạn đã nộp
                  </Text>
                  {submittedVideo.status && (
                    <View style={styles.statusBadgeContainer}>
                      <View
                        style={[
                          styles.statusBadge,
                          submittedVideo.status === "PROCESSING" &&
                            styles.statusProcessing,
                          submittedVideo.status === "COMPLETED" &&
                            styles.statusCompleted,
                          submittedVideo.status === "FAILED" &&
                            styles.statusFailed,
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {submittedVideo.status}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
              {submittedVideo.createdAt && (
                <Text style={styles.submittedVideoMeta}>
                  Nộp lúc: {new Date(submittedVideo.createdAt).toLocaleString()}
                </Text>
              )}
              <LessonVideoPlayer source={submittedVideo.publicUrl} />
            </View>
          )}

          {loadingAnalysis ? (
            <View style={styles.resourceCard}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ActivityIndicator size="small" color="#059669" />
                <Text style={styles.metaText}>
                  Đang tải kết quả phân tích...
                </Text>
              </View>
            </View>
          ) : aiAnalysisResult ? (
            <View style={[styles.resourceCard, { backgroundColor: "#FFFBEB" }]}>
              <Text style={styles.resourceTitle}>📊 Kết quả phân tích AI</Text>
              {aiAnalysisResult.learnerScore !== null && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "baseline",
                    gap: 8,
                    marginVertical: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: "#059669",
                    }}
                  >
                    ⭐ {aiAnalysisResult.learnerScore}
                  </Text>
                  <Text style={styles.metaText}>/100</Text>
                </View>
              )}
              {aiAnalysisResult.summary && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisLabel}>📝 Tóm tắt:</Text>
                  <Text style={styles.analysisText}>
                    {aiAnalysisResult.summary}
                  </Text>
                </View>
              )}
              {aiAnalysisResult.coachNote && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisLabel}>
                    💬 Feedback từ coach:
                  </Text>
                  <Text style={styles.analysisText}>
                    {aiAnalysisResult.coachNote}
                  </Text>
                </View>
              )}
              {aiAnalysisResult.keyDifferents &&
                aiAnalysisResult.keyDifferents.length > 0 && (
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisLabel}>
                      🔍 Các điểm khác biệt chính:
                    </Text>
                    {aiAnalysisResult.keyDifferents.map((diff, index) => (
                      <View key={index} style={styles.differenceItem}>
                        <Text style={styles.differenceAspect}>
                          {diff.aspect}
                        </Text>
                        <Text style={styles.analysisText}>
                          Kỹ thuật của bạn: {diff.learnerTechnique}
                        </Text>
                        <Text style={styles.analysisText}>
                          Tác động: {diff.impact}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              {aiAnalysisResult.recommendationDrills &&
                aiAnalysisResult.recommendationDrills.length > 0 && (
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisLabel}>💡 Khuyến nghị:</Text>
                    {aiAnalysisResult.recommendationDrills.map((rec, index) => (
                      <View key={index} style={styles.recommendationItem}>
                        <Text style={styles.analysisText}>
                          <Text style={{ fontWeight: "700" }}>
                            {index + 1}. {rec.name || "Bài tập"}
                          </Text>
                        </Text>
                        {rec.description && (
                          <Text style={styles.analysisText}>
                            Mô tả: {rec.description}
                          </Text>
                        )}
                        {rec.practiceSets && (
                          <Text style={styles.analysisText}>
                            Số hiệp tập: {rec.practiceSets}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              {aiAnalysisResult.createdAt && (
                <Text
                  style={{
                    ...styles.metaText,
                    marginTop: 6,
                    fontStyle: "italic",
                  }}
                >
                  Phân tích lúc:{" "}
                  {new Date(aiAnalysisResult.createdAt).toLocaleString()}
                </Text>
              )}
            </View>
          ) : null}

          {!localVideo && !submittedVideo && (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePickVideo}
              activeOpacity={0.7}
            >
              <Text style={styles.uploadButtonText}>
                📤 Upload video của bạn tại đây
              </Text>
            </TouchableOpacity>
          )}

          {localVideo && (
            <View style={[styles.resourceCard, { backgroundColor: "#F0F9FF" }]}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.resourceTitle}>{localVideo.name}</Text>
                  <Text style={styles.metaText}>Từ thiết bị của bạn</Text>
                </View>
                {localVideo.uploaded && (
                  <View style={styles.uploadedBadge}>
                    <Text style={styles.uploadedBadgeText}>✓ Đã upload</Text>
                  </View>
                )}
              </View>
              {localVideo.duration && (
                <Text style={{ ...styles.metaText, marginTop: 5 }}>
                  ⏱ {localVideo.duration} phút
                </Text>
              )}
              <LessonVideoPlayer source={localVideo.uri} />
              {!localVideo.uploaded && (
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isUploading && styles.submitButtonDisabled,
                  ]}
                  onPress={() => handleUploadVideo(videos[0].id)}
                  disabled={isUploading}
                  activeOpacity={0.85}
                >
                  {isUploading ? (
                    <View style={styles.submitButtonContent}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>
                        Đang upload...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.submitButtonText}>📤 Nộp bài</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {items.length === 0 && !localVideo ? (
            <Text style={styles.emptyText}>
              Chưa có video nào cho bài học này.
            </Text>
          ) : null}

          {items.map((video) => (
            <View key={video.id} style={styles.resourceCard}>
              <Text style={styles.resourceTitle}>{video.title}</Text>
              {video.description && (
                <Text style={styles.resourceDescription}>
                  {video.description}
                </Text>
              )}
              <View style={{ gap: 5, marginTop: 4 }}>
                {video.drillName && (
                  <Text
                    style={{
                      ...styles.metaText,
                      fontWeight: "600",
                      color: "#059669",
                    }}
                  >
                    🎯 {video.drillName}
                  </Text>
                )}
                {video.drillDescription && (
                  <Text style={styles.metaText}>{video.drillDescription}</Text>
                )}
              </View>
              <View style={styles.metaRow}>
                {video.duration != null && (
                  <Text style={styles.metaText}>⏱ {video.duration} phút</Text>
                )}
                {video.drillPracticeSets && (
                  <Text style={styles.metaText}>
                    📊 {video.drillPracticeSets} hiệp tập
                  </Text>
                )}
              </View>
              {renderTags(video.tags)}
              <View style={{ marginTop: 6 }}>
                {video.publicUrl ? (
                  <LessonVideoPlayer source={video.publicUrl} />
                ) : (
                  <View
                    style={{
                      backgroundColor: "#FEE2E2",
                      padding: 8,
                      borderRadius: 6,
                      borderLeftWidth: 3,
                      borderLeftColor: "#EF4444",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#7F1D1D",
                        fontWeight: "500",
                      }}
                    >
                      ⚠️ Video hiện chưa khả dụng
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </>
      );
    };

    // Load submitted video on mount or when lesson changes
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

      return items.map((quiz) => (
        <View key={quiz.id} style={styles.resourceCard}>
          <QuizAttemptCard quiz={quiz} />
        </View>
      ));
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
                onPress={() => setActiveTab(tab.key)}
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
          {loading ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : activeTab === "videos" ? (
            renderVideos(videos)
          ) : (
            renderQuizzes(quizzes)
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
  },
  // Submitted Video Card
  submittedVideoCard: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBEF63",
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  submittedVideoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  submittedVideoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#047857",
    marginBottom: 4,
  },
  submittedVideoMeta: {
    fontSize: 10,
    color: "#059669",
    fontStyle: "italic",
  },
  statusBadgeContainer: {
    flexDirection: "row",
    gap: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#FEF08A",
    borderWidth: 0.5,
    borderColor: "#EAB308",
  },
  statusProcessing: {
    backgroundColor: "#FEF08A",
    borderColor: "#EAB308",
  },
  statusCompleted: {
    backgroundColor: "#DCFCE7",
    borderColor: "#34D399",
  },
  statusFailed: {
    backgroundColor: "#FEE2E2",
    borderColor: "#F87171",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#854D0E",
  },
  // Upload Button
  uploadButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#059669",
    borderStyle: "dashed",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  uploadButtonText: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  submitButton: {
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3.5,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.8,
    shadowOpacity: 0.1,
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  uploadedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: "#34D399",
  },
  uploadedBadgeText: {
    color: "#047857",
    fontSize: 11,
    fontWeight: "600",
  },
  reuploadButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  reuploadButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  // Resource Cards
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
  resourceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  resourceDescription: {
    fontSize: 11,
    color: "#4B5563",
    lineHeight: 15,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: "#6B7280",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  linkButton: {
    backgroundColor: "#059669",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  linkButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#059669",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  outlineButtonText: {
    color: "#047857",
    fontWeight: "600",
    fontSize: 12,
  },
  emptyText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 20,
    fontStyle: "italic",
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    textAlign: "center",
  },
  // Analysis Section
  analysisSection: {
    marginTop: 9,
    gap: 6,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#059669",
  },
  analysisLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  analysisText: {
    fontSize: 11,
    color: "#374151",
    lineHeight: 16,
  },
  differenceItem: {
    marginTop: 6,
    padding: 7,
    backgroundColor: "#FFF7ED",
    borderRadius: 6,
    gap: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#FB923C",
  },
  differenceAspect: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  recommendationItem: {
    marginTop: 6,
    padding: 7,
    backgroundColor: "#F0FDF4",
    borderRadius: 6,
    gap: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#34D399",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#E0F2FE",
    borderWidth: 0.5,
    borderColor: "#0EA5E9",
  },
  tagText: {
    fontSize: 10,
    color: "#0369A1",
    fontWeight: "500",
  },
  questionList: {
    marginTop: 10,
    gap: 9,
  },
  questionItem: {
    gap: 6,
    padding: 9,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.04,
    shadowRadius: 1.5,
    elevation: 1,
  },
  questionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  questionExplanation: {
    fontSize: 11,
    color: "#4B5563",
    lineHeight: 15,
  },
  optionList: {
    gap: 5,
    marginTop: 5,
  },
  optionItem: {
    padding: 7,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionItemCorrect: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#34D399",
  },
  optionText: {
    fontSize: 11,
    color: "#374151",
  },
  optionTextCorrect: {
    color: "#047857",
    fontWeight: "600",
  },
  optionBadge: {
    marginTop: 3,
    fontSize: 10,
    color: "#047857",
    fontWeight: "600",
  },
  videoContainer: {
    marginTop: 9,
    gap: 8,
    padding: 8,
    borderRadius: 9,
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  videoPlayer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  videoControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  controlButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#4B5563",
  },
  controlButtonLabel: {
    color: "#F9FAFB",
    fontWeight: "600",
    fontSize: 11,
  },
});

export default LessonResourcesTabs;

const LessonVideoPlayer: React.FC<{ source: string }> = ({ source }) => {
  const player = useVideoPlayer(
    { uri: source, contentType: "auto" }, // MP4 -> auto là đủ
    (p) => {
      p.loop = false;
    }
  );

  const statusEvent = useEvent(player, "statusChange", {
    status: player.status,
  });
  const status = statusEvent?.status ?? player.status;
  const playerError: PlayerError | undefined = statusEvent?.error ?? undefined;

  return (
    <View style={styles.videoContainer}>
      <VideoView
        style={styles.videoPlayer}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        crossOrigin="anonymous" // quan trọng cho web
      />
      {status === "error" && (
        <Text style={styles.errorText}>
          Không phát được video trong app: {String(playerError ?? "Unknown")}
        </Text>
      )}
      {/* controls giữ nguyên */}
    </View>
  );
};

const parseTags = (raw: string): string[] => {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    return raw
      .replace(/[{}"]/g, "")
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};
