import QuizDetailModal from "@/components/coach/course/session/QuizDetailModal";
import { BuildExercise } from "@/helper/BuildExercise";
import { get } from "@/services/http/httpService";
import http from "@/services/http/interceptor";
import type { Session } from "@/types/session";
import type { VideoType } from "@/types/video";
import { formatStatus } from "@/utils/SessionFormat";
import { Ionicons } from "@expo/vector-icons";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const formatTime = (time?: string | null) => {
  if (!time) return "—";
  return time.substring(0, 5);
};

const formatDate = (date?: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN");
};

const extractSessionPayload = (payload: any): Session | null => {
  if (!payload || typeof payload !== "object") return null;
  if ("id" in payload && "sessionNumber" in payload) {
    return payload as Session;
  }
  if ("data" in payload) {
    const nested = extractSessionPayload((payload as any).data);
    if (nested) return nested;
  }
  if ("metadata" in payload) {
    const nested = extractSessionPayload((payload as any).metadata);
    if (nested) return nested;
  }
  return null;
};

const getCoachVideos = (session?: Session | null): VideoType | undefined => {
  return session?.video;
};

const SessionDetailScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionId, sessionData } = useLocalSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [expandedDrill, setExpandedDrill] = useState<number | null>(null);

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      // If session data is passed via params (from assignment tab), use it directly initially
      // But we still want to fetch fresh data if we are focusing back
      if (loading && sessionData && typeof sessionData === "string") {
        // ... (existing logic for initial load from params can stay if needed,
        // but for simplicity and correctness on refresh, we might prefer API)
      }

      // Always fetch from API to get latest status
      const res = await get<Session>(`/v1/sessions/${sessionId}`);
      const normalized = extractSessionPayload(res.data);
      if (!normalized) {
        setSession(null);
        return;
      }
      setSession(normalized);
    } catch {
      Alert.alert("Lỗi", "Không thể tải thông tin buổi học");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    setLoading(true);
    fetchSession();
  }, [fetchSession]);

  useFocusEffect(
    useCallback(() => {
      fetchSession();
    }, [fetchSession])
  );

  const exercises = useMemo(
    () => (session ? BuildExercise(session) : []),
    [session]
  );
  const videoExercises = useMemo(() => {
    return exercises.filter((ex) => ex.type === "video");
  }, [exercises]);

  const coachVideos = useMemo(() => getCoachVideos(session), [session]);

  const deleteQuiz = async (quizId: number, quizTitle: string) => {
    try {
      await http.delete(`/v1/quizzes/${quizId}`);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: `Xóa quiz "${quizTitle}" thành công`,
        position: "top",
        visibilityTime: 3000,
      });
      fetchSession();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể xóa quiz. Vui lòng thử lại.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const deleteVideo = async (videoId: number, videoTitle: string) => {
    try {
      await http.delete(`/v1/videos/${videoId}`);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: `Xóa video "${videoTitle}" thành công`,
        position: "top",
        visibilityTime: 3000,
      });
      fetchSession();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể xóa video. Vui lòng thử lại.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const updateVideo = (videoId: number, video: VideoType) => {
    router.push({
      pathname: "/(coach)/menu/lesson/uploadVideo",
      params: {
        // lessonId is not strictly needed for update if the API only needs videoId,
        // but we might need to pass something if the screen requires it.
        // Based on uploadVideo.tsx, it uses lessonId for CREATE, but videoId for UPDATE.
        // We can pass a dummy lessonId or the current session's courseId if available,
        // but let's try passing just what's needed.
        lessonId: "", // Not used for update
        videoId: String(videoId),
        videoTitle: video.title,
        videoDescription: video.description || "",
        drillName: video.drillName || "",
        drillDescription: video.drillDescription || "",
        drillPracticeSets: video.drillPracticeSets
          ? String(video.drillPracticeSets)
          : "",
      },
    });
  };

  const handleOpenCoachVideo = (url: string) => {
    setSelectedVideoUrl(url);
    setVideoModalVisible(true);
  };

  const videoSource = useMemo(() => {
    if (!selectedVideoUrl) return null;
    return { uri: selectedVideoUrl, contentType: "auto" as const };
  }, [selectedVideoUrl]);

  const videoPlayer = useVideoPlayer(videoSource, (player) => {
    if (player) player.loop = false;
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {session?.name || "Chi tiết buổi học"}
          </Text>
          {!!session?.course?.subject?.name && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {session.course.subject.name}
            </Text>
          )}
        </View>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      ) : !session ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>Không tìm thấy buổi học</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchSession()}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={18} color="#059669" />
              <Text style={styles.sectionTitle}>Thông tin buổi học</Text>
            </View>
            <View style={styles.infoContent}>
              <InfoRow
                icon="book-outline"
                label="Tên bài học"
                value={session.name}
              />
              <InfoRow
                icon="document-text-outline"
                label="Mô tả"
                value={session.description}
                multiline
              />
              <InfoRow
                icon="layers-outline"
                label="Buổi số"
                value={String(session.sessionNumber)}
              />
              <InfoRow
                icon="calendar-outline"
                label="Ngày học"
                value={formatDate(session.scheduleDate)}
              />
              <InfoRow
                icon="time-outline"
                label="Thời gian"
                value={`${formatTime(session.startTime)} - ${formatTime(
                  session.endTime
                )}`}
              />
              <InfoRow
                icon="radio-button-on-outline"
                label="Trạng thái"
                value={formatStatus(session.status).text || "—"}
                valueStyle={{
                  color: formatStatus(session.status).color,
                  fontWeight: "700",
                }}
              />
            </View>
          </View>

          {/* Quiz Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="help-circle" size={18} color="#059669" />
              <Text style={styles.sectionTitle}>Bài kiểm tra (Quiz)</Text>
            </View>

            {session.quiz ? (
              <TouchableOpacity
                style={styles.quizCardRefined}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedQuiz(session.quiz);
                  setQuizModalVisible(true);
                }}
              >
                <View style={styles.quizCardContent}>
                  <View style={styles.quizIconWrapper}>
                    <Ionicons name="help-circle" size={24} color="#059669" />
                  </View>
                  <View style={styles.quizInfoBody}>
                    <Text style={styles.quizCardTitleText} numberOfLines={2}>
                      {session.quiz.title}
                    </Text>
                    <View style={styles.quizMetaRow}>
                      <View style={styles.quizMetaBadge}>
                        <Ionicons name="list" size={12} color="#059669" />
                        <Text style={styles.quizMetaText}>
                          {session.quiz.questions?.length || 0} câu hỏi
                        </Text>
                      </View>
                      <View style={styles.statusBadgeSoft}>
                        <View style={styles.statusDotGreen} />
                        <Text style={styles.statusTextGreen}>Sẵn sàng</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
                {!!session.quiz.description && (
                  <View style={styles.quizDescriptionBox}>
                    <Text style={styles.quizDescText} numberOfLines={2}>
                      {session.quiz.description}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyStateBox}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons
                    name="help-circle-outline"
                    size={32}
                    color="#D1D5DB"
                  />
                </View>
                <Text style={styles.emptyStateText}>
                  Chưa có quiz cho buổi học này
                </Text>
              </View>
            )}
          </View>

          {/* Video Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="videocam" size={18} color="#059669" />
              <Text style={styles.sectionTitle}>Video giáo trình</Text>
            </View>

            {coachVideos ? (
              <CoachVideoCard
                video={coachVideos}
                onOpen={handleOpenCoachVideo}
                onUpdate={updateVideo}
                onDelete={deleteVideo}
              />
            ) : (
              <View style={styles.emptyStateBox}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="videocam-outline" size={32} color="#D1D5DB" />
                </View>
                <Text style={styles.emptyStateText}>Chưa có video mẫu</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Quiz Details Modal */}
      <QuizDetailModal
        visible={quizModalVisible}
        quiz={selectedQuiz}
        sessionId={sessionId}
        onClose={() => {
          setQuizModalVisible(false);
          setTimeout(() => setSelectedQuiz(null), 300);
        }}
        onDelete={deleteQuiz}
        onQuizUpdated={() => {
          if (sessionId) fetchSession();
        }}
      />

      {/* Video Modal - Premium Dark Theme */}
      <Modal
        visible={videoModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setVideoModalVisible(false);
          setSelectedVideoUrl(null);
        }}
      >
        <View style={styles.videoModalContainer}>
          <View style={styles.videoModalBackdrop} />
          <View style={styles.videoModalContent}>
            {/* Dark Header */}
            <View
              style={[
                styles.videoModalHeaderPremium,
                { paddingTop: insets.top + 12 },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  setVideoModalVisible(false);
                  setSelectedVideoUrl(null);
                }}
                style={styles.videoModalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.videoModalTitleContainer}>
                <Text style={styles.videoModalTitleText} numberOfLines={1}>
                  {coachVideos?.title || "Video bài giảng"}
                </Text>
                <Text style={styles.videoModalSubtitleText}>
                  {session?.name || ""}
                </Text>
              </View>
              <View style={{ width: 44 }} />
            </View>

            {/* Video Player Area */}
            <View style={styles.videoModalPlayerArea}>
              {videoSource ? (
                <View style={styles.videoPlayerWrapperPremium}>
                  <VideoView
                    style={styles.premiumVideoView}
                    player={videoPlayer}
                    nativeControls
                    contentFit="contain"
                  />
                </View>
              ) : (
                <View style={styles.videoLoadingCenter}>
                  <ActivityIndicator size="large" color="#059669" />
                  <Text style={styles.videoLoadingText}>
                    Đang chuẩn bị video...
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

function InfoRow({
  icon,
  label,
  value,
  multiline,
  valueStyle,
}: {
  icon: string;
  label: string;
  value?: string | null;
  multiline?: boolean;
  valueStyle?: any;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelWrapper}>
        <View style={styles.infoIconContainer}>
          <Ionicons name={icon as any} size={16} color="#059669" />
        </View>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text
        style={[styles.infoValue, valueStyle]}
        numberOfLines={multiline ? undefined : 2}
      >
        {value || "—"}
      </Text>
    </View>
  );
}

function getStatusBadgeColors(status?: string | null) {
  switch (status) {
    case "READY":
      return { backgroundColor: "#ECFDF5", color: "#059669" };
    case "UPLOADING":
      return { backgroundColor: "#FEF3C7", color: "#B45309" };
    case "ERROR":
      return { backgroundColor: "#FEE2E2", color: "#B91C1C" };
    case "ANALYZING":
      return { backgroundColor: "#DBEAFE", color: "#1D4ED8" };
    case "PENDING":
      return { backgroundColor: "#E0E7FF", color: "#4338CA" };
    case "PAID":
      return { backgroundColor: "#DCFCE7", color: "#15803D" };
    default:
      return { backgroundColor: "#F3F4F6", color: "#4B5563" };
  }
}

function CoachVideoCard({
  video,
  onOpen,
  onUpdate,
  onDelete,
}: {
  video: VideoType;
  onOpen: (url: string) => void;
  onUpdate?: (videoId: number, video: VideoType) => void;
  onDelete?: (videoId: number, videoTitle: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const badgeColors = getStatusBadgeColors(video.status);

  return (
    <View style={styles.coachCardRefined}>
      <View style={styles.coachCardMain}>
        {/* Playable Thumbnail Area */}
        <TouchableOpacity
          style={styles.coachThumbnailWrapper}
          activeOpacity={0.8}
          onPress={() => video.publicUrl && onOpen(video.publicUrl)}
        >
          {video.thumbnailUrl ? (
            <Image
              source={{ uri: video.thumbnailUrl }}
              style={styles.coachThumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.coachThumbnailPlaceholder}>
              <Ionicons
                name="film"
                size={32}
                color="rgba(255, 255, 255, 0.4)"
              />
            </View>
          )}
          <View style={styles.coachThumbnailPlayOverlay}>
            <View style={styles.coachPlayIconGlass}>
              <Ionicons
                name="play"
                size={20}
                color="#FFFFFF"
                style={{ marginLeft: 2 }}
              />
            </View>
          </View>
          {!!video.duration && (
            <View style={styles.coachDurationBadge}>
              <Text style={styles.coachDurationText}>
                {`${Math.floor(video.duration / 60)}:${String(
                  video.duration % 60
                ).padStart(2, "0")}`}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Info Area */}
        <View style={styles.coachInfoArea}>
          <View style={styles.coachTitleRow}>
            <Text style={styles.coachTitleText} numberOfLines={2}>
              {video.title}
            </Text>
            <View
              style={[
                styles.coachStatusBadgeRefined,
                { backgroundColor: badgeColors.backgroundColor },
              ]}
            >
              <View
                style={[
                  styles.coachStatusDot,
                  { backgroundColor: badgeColors.color },
                ]}
              />
              <Text
                style={[
                  styles.coachStatusTextRefined,
                  { color: badgeColors.color },
                ]}
              >
                {video.status === "READY"
                  ? "Sẵn sàng"
                  : video.status === "ANALYZING"
                  ? "Đang xử lý"
                  : "Lỗi"}
              </Text>
            </View>
          </View>

          <View style={styles.coachActionsRow}>
            {onUpdate && (
              <TouchableOpacity
                style={styles.coachActionBtnSecondary}
                onPress={() => onUpdate(video.id, video)}
              >
                <Ionicons name="create-outline" size={16} color="#4B5563" />
                <Text style={styles.coachActionBtnTextSecondary}>Sửa</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={styles.coachActionBtnDanger}
                onPress={() => {
                  Alert.alert(
                    "Xác nhận xóa",
                    `Bạn có chắc chắn muốn xóa video "${video.title}" không?`,
                    [
                      { text: "Hủy", style: "cancel" },
                      {
                        text: "Xóa",
                        style: "destructive",
                        onPress: () => onDelete(video.id, video.title),
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
                <Text style={styles.coachActionBtnTextDanger}>Xóa</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Expandable Drill Info */}
      {(!!video.drillName || !!video.drillDescription) && (
        <View style={styles.drillExpansionWrapper}>
          <TouchableOpacity
            style={styles.drillExpandHeader}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.drillHeaderLeft}>
              <Ionicons name="fitness-outline" size={16} color="#059669" />
              <Text style={styles.drillHeaderTitle}>Thông tin bài tập</Text>
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.drillExpandContent}>
              <View style={styles.drillInfoCard}>
                <View style={styles.drillInfoRow}>
                  <Text style={styles.drillInfoLabel}>Tên bài tập:</Text>
                  <Text style={styles.drillInfoValue}>
                    {video.drillName || "—"}
                  </Text>
                </View>
                {!!video.drillPracticeSets && (
                  <View style={styles.drillInfoRow}>
                    <Text style={styles.drillInfoLabel}>Số SET tập luyện:</Text>
                    <Text style={styles.drillInfoValue}>
                      {video.drillPracticeSets} bộ
                    </Text>
                  </View>
                )}
                {!!video.drillDescription && (
                  <View style={styles.drillDescriptionBox}>
                    <Text style={styles.drillDescLabel}>Hướng dẫn:</Text>
                    <Text style={styles.drillDescText}>
                      {video.drillDescription}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  scroll: {
    flex: 1,
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
  },
  infoContent: {
    gap: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  infoLabelWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  infoIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(5, 150, 105, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#059669",
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  // Quiz Card Refined
  quizCardRefined: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  quizCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quizIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quizInfoBody: {
    flex: 1,
  },
  quizCardTitleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  quizMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quizMetaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(5, 150, 105, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  quizMetaText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  statusBadgeSoft: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(5, 150, 105, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statusTextGreen: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  quizDescriptionBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  quizDescText: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
  emptyStateBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderStyle: "dashed",
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  // Video Card Premium
  coachCardRefined: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },
  coachCardMain: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
  },
  coachThumbnailWrapper: {
    width: 120,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#111827",
    overflow: "hidden",
    position: "relative",
  },
  coachThumbnailImage: {
    width: "100%",
    height: "100%",
  },
  coachThumbnailPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  coachThumbnailPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  coachPlayIconGlass: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  coachDurationBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coachDurationText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  coachInfoArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  coachTitleRow: {
    gap: 4,
  },
  coachTitleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 18,
  },
  coachStatusBadgeRefined: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  coachStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  coachStatusTextRefined: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  coachActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  coachActionBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  coachActionBtnTextSecondary: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
  },
  coachActionBtnDanger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  coachActionBtnTextDanger: {
    fontSize: 11,
    fontWeight: "600",
    color: "#DC2626",
  },
  // Drill Expansion
  drillExpansionWrapper: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#F9FAFB",
  },
  drillExpandHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  drillHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  drillHeaderTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  drillExpandContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  drillInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  drillInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  drillInfoLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  drillInfoValue: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "600",
  },
  drillDescriptionBox: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 4,
  },
  drillDescLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
  },
  drillDescText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
  // Video Modal
  videoModalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  videoModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.9)",
  },
  videoModalContent: {
    flex: 1,
  },
  videoModalHeaderPremium: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 10,
  },
  videoModalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoModalTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  videoModalTitleText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  videoModalSubtitleText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  videoModalPlayerArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayerWrapperPremium: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000000",
  },
  premiumVideoView: {
    width: "100%",
    height: "100%",
  },
  videoLoadingCenter: {
    alignItems: "center",
    gap: 12,
  },
  videoLoadingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 12,
    fontWeight: "500",
  },
});

export default SessionDetailScreen;
