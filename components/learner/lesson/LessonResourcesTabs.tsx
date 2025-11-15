// Key updates in this version:
// 1. Auto-load overlayVideoUrl from API response when entering video tab
// 2. Show "Xem so sánh" button if overlayVideoUrl exists
// 3. Show "So sánh với Coach" button if overlayVideoUrl doesn't exist
// 4. After generating new overlay, reload the submitted video to get latest overlayVideoUrl

import { get, post } from "@/services/http/httpService";
import { AiVideoCompareResult, LessonResourcesTabsProps } from "@/types/ai";
import { useEvent } from "expo";
import * as ImagePicker from "expo-image-picker";
import type { PlayerError } from "expo-video";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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

    // Create video player at top level to avoid conditional hook call
    const overlayVideoPlayer = useVideoPlayer(
      overlayVideoUrl ? { uri: overlayVideoUrl, contentType: "auto" } : null,
      (p) => {
        p.loop = false;
      }
    );

    // Update player source when overlayVideoUrl changes
    useEffect(() => {
      if (overlayVideoUrl && overlayVideoPlayer) {
        overlayVideoPlayer.replaceAsync({ uri: overlayVideoUrl, contentType: "auto" });
      }
    }, [overlayVideoUrl, overlayVideoPlayer]);

    // Track overlay video player status for loading state
    const overlayStatusEvent = useEvent(overlayVideoPlayer, "statusChange", {
      status: overlayVideoPlayer.status,
    });
    const overlayStatus = overlayStatusEvent?.status ?? overlayVideoPlayer.status;
    const overlayPlayerError: PlayerError | undefined = overlayStatusEvent?.error ?? undefined;
    const isOverlayLoading = overlayStatus === "loading";

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
      if (!localVideo) return;

      if (!localVideo.duration) {
        Alert.alert("Lỗi", "Vui lòng chọn video có thông tin độ dài");
        return;
      }

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

              {/* Conditional rendering: Show different buttons based on overlayVideoUrl */}
              {overlayVideoUrl ? (
                // If overlayVideoUrl exists, show "Xem so sánh" button
                <TouchableOpacity
                  style={styles.viewOverlayButton}
                  onPress={() => setShowOverlayModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewOverlayButtonText}>
                    👁️ Xem so sánh với Coach
                  </Text>
                </TouchableOpacity>
              ) : (
                // If overlayVideoUrl doesn't exist, show "So sánh với Coach" button
                <TouchableOpacity
                  style={[
                    styles.compareButton,
                    generatingOverlay && styles.compareButtonDisabled,
                  ]}
                  onPress={handleGenerateOverlay}
                  disabled={generatingOverlay}
                  activeOpacity={0.7}
                >
                  {generatingOverlay ? (
                    <View style={styles.compareButtonContent}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.compareButtonText}>
                        Đang tạo video overlay...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.compareButtonText}>
                      🔄 So sánh với Coach
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

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
              {!localVideo.uploaded && videos.length > 0 && (
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
        </>
      );
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
            renderVideos(videos)
          ) : (
            renderQuizzes(quizzes)
          )}
        </View>

        {/* Modal hiển thị video overlay */}
        <Modal
          visible={showOverlayModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowOverlayModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  📊 Video So Sánh với Coach
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowOverlayModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                contentContainerStyle={styles.modalContentContainer}
              >
                {overlayVideoUrl && (
                  <View style={styles.modalVideoWrapper}>
                    <LessonVideoPlayer source={overlayVideoUrl} />
                    <Text style={styles.modalVideoDescription}>
                      Video này là kết quả so sánh giữa kỹ thuật của bạn và
                      coach. Video của bạn được hiển thị với độ mờ 50% chồng lên
                      video mẫu của coach.
                    </Text>
                  </View>
                )}
              </ScrollView>
              <View style={styles.modalVideoContainer}>
                {isOverlayLoading && (
                  <View style={styles.videoLoadingOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.videoLoadingText}>Đang tải video...</Text>
                  </View>
                )}
                <VideoView
                  style={styles.videoPlayer}
                  player={overlayVideoPlayer}
                  allowsFullscreen
                  allowsPictureInPicture
                  crossOrigin="anonymous"
                />
                {overlayStatus === "error" && (
                  <View style={styles.videoErrorOverlay}>
                    <Text style={styles.errorText}>
                      Không phát được video: {String(overlayPlayerError ?? "Unknown")}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalFooterButton}
                  onPress={() => setShowOverlayModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalFooterButtonText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  compareButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3.5,
    elevation: 3,
  },
  compareButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.8,
  },
  compareButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compareButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  viewOverlayButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3.5,
    elevation: 3,
  },
  viewOverlayButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
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
  videoLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    gap: 8,
  },
  videoLoadingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
  },
  videoErrorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.95,
    maxHeight: SCREEN_HEIGHT * 0.9,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#059669",
    borderBottomWidth: 1,
    borderBottomColor: "#047857",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 16,
  },
  modalVideoWrapper: {
    gap: 12,
  },
  modalVideoDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  modalVideoContainer: {
    marginTop: 9,
    marginHorizontal: 16,
    marginBottom: 9,
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
    position: "relative",
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  modalFooterButton: {
    backgroundColor: "#059669",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  modalFooterButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

export default LessonResourcesTabs;

const LessonVideoPlayer: React.FC<{ source: string }> = ({ source }) => {
  const player = useVideoPlayer({ uri: source, contentType: "auto" }, (p) => {
    p.loop = false;
  });

  const statusEvent = useEvent(player, "statusChange", {
    status: player.status,
  });
  const status = statusEvent?.status ?? player.status;
  const playerError: PlayerError | undefined = statusEvent?.error ?? undefined;

  const isLoading = status === "loading";

  return (
    <View style={styles.videoContainer}>
      {isLoading && (
        <View style={styles.videoLoadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.videoLoadingText}>Đang tải video...</Text>
        </View>
      )}
      <VideoView
        style={styles.videoPlayer}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        crossOrigin="anonymous"
      />
      {status === "error" && (
        <View style={styles.videoErrorOverlay}>
          <Text style={styles.errorText}>
            Không phát được video: {String(playerError ?? "Unknown")}
          </Text>
        </View>
      )}
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
