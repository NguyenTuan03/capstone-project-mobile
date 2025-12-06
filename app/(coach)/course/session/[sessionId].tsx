import QuizDetailModal from "@/components/coach/course/session/QuizDetailModal";
import { BuildExercise } from "@/helper/BuildExercise";
import { get } from "@/services/http/httpService";
import http from "@/services/http/interceptor";
import type { Session } from "@/types/session";
import type { LearnerVideo, VideoType } from "@/types/video";
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
  const [learnerVideos, setLearnerVideos] = useState<LearnerVideo[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchLearnerVideos = async () => {
      if (!sessionId) return;
      try {
        const res = await get<LearnerVideo[]>(
          `/v1/learner-videos?sessionId=${sessionId}`
        );
        setLearnerVideos(Array.isArray(res.data) ? res.data : []);
      } catch {
        // ignore
      }
    };
    fetchLearnerVideos();
  }, [sessionId]);

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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {session?.name || "Chi tiết buổi học"}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : !session ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>Không tìm thấy buổi học</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin buổi học</Text>
            <InfoRow label="Tên bài học" value={session.name} />
            <InfoRow label="Mô tả" value={session.description} multiline />
            <InfoRow label="Buổi số" value={String(session.sessionNumber)} />
            <InfoRow label="Ngày" value={formatDate(session.scheduleDate)} />
            <InfoRow
              label="Thời gian"
              value={`${formatTime(session.startTime)} - ${formatTime(
                session.endTime
              )}`}
            />
            <InfoRow
              label="Trạng thái"
              value={formatStatus(session.status).text || "—"}
              valueStyle={{
                color: formatStatus(session.status).color,
                fontWeight: "600",
              }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quiz</Text>
            {session.quiz ? (
              <TouchableOpacity
                style={styles.quizCard}
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedQuiz(session.quiz);
                  setQuizModalVisible(true);
                }}
              >
                {/* Quiz Header */}
                <View style={styles.quizCardHeader}>
                  <View style={styles.quizCardTitle}>
                    <Text style={styles.quizStepLabel}>Quiz</Text>
                    <Text style={styles.quizCardTitleText} numberOfLines={2}>
                      {session.quiz.title}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.quizStatusBadge,
                      {
                        backgroundColor: "#EFF6FF",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: "#2563EB",
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      Sẵn sàng
                    </Text>
                  </View>
                </View>

                {/* Quiz Description */}
                {session.quiz.description && (
                  <View style={styles.quizDescriptionSection}>
                    <Text style={styles.quizDescText}>
                      {session.quiz.description}
                    </Text>
                  </View>
                )}

                {/* Quick Metadata Row */}
                <View style={styles.quickMetadataRow}>
                  <View style={styles.quickMetadataItem}>
                    <Ionicons name="help-circle" size={14} color="#2563EB" />
                    <Text style={styles.quickMetadataTextBlue}>
                      {session.quiz.questions?.length || 0} câu hỏi
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="help-circle-outline"
                  size={36}
                  color="#9CA3AF"
                />
                <Text style={styles.emptyText}>Chưa có quiz cho buổi này</Text>
              </View>
            )}
          </View>
          <View style={[styles.section, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.sectionTitle}>Video</Text>
            {coachVideos ? (
              <CoachVideoCard
                video={coachVideos}
                onOpen={handleOpenCoachVideo}
                onUpdate={updateVideo}
                onDelete={deleteVideo}
              />
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="videocam-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Chưa có video mẫu</Text>
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
          // Refresh session data after quiz update
          if (sessionId) {
            const fetchSession = async () => {
              try {
                const res = await get<Session>(`/v1/sessions/${sessionId}`);
                setSession(res.data);
              } catch (error) {}
            };
            fetchSession();
          }
        }}
      />

      {/* Video Modal */}
      <Modal
        visible={videoModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setVideoModalVisible(false);
          setSelectedVideoUrl(null);
        }}
      >
        <View style={[styles.videoModalContainer, { paddingTop: insets.top }]}>
          <View style={styles.videoModalHeader}>
            <TouchableOpacity
              style={styles.videoModalCloseButton}
              onPress={() => {
                setVideoModalVisible(false);
                setSelectedVideoUrl(null);
              }}
            >
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.videoModalTitle}>Video</Text>
            <View style={{ width: 40 }} />
          </View>
          {videoSource && (
            <View style={styles.videoPlayerContainer}>
              <VideoView
                style={styles.videoPlayer}
                player={videoPlayer}
                fullscreenOptions={{
                  enable: true,
                }}
              />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

function InfoRow({
  label,
  value,
  multiline,
  valueStyle,
}: {
  label: string;
  value?: string | null;
  multiline?: boolean;
  valueStyle?: any;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
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
  const badgeStyle = getStatusBadgeColors(video.status);
  return (
    <View style={styles.coachCard}>
      {/* Header Section */}
      <View style={styles.coachHeaderRow}>
        <View style={styles.coachTitleContainer}>
          <View style={styles.videoIconBadge}>
            <Ionicons name="videocam" size={16} color="#7C3AED" />
          </View>
          <Text style={styles.coachTitle} numberOfLines={2}>
            {video.title}
          </Text>
        </View>
      </View>

      {/* Description */}
      {video.description ? (
        <Text style={styles.coachDescription} numberOfLines={3}>
          {video.description}
        </Text>
      ) : null}

      {/* Metadata Tags */}
      <View style={styles.metaTagsRow}>
        {video.duration != null && (
          <View style={styles.metaTag}>
            <Ionicons name="time-outline" size={12} color="#6B7280" />
            <Text style={styles.metaTagText}>{video.duration} phút</Text>
          </View>
        )}
        {video.drillName ? (
          <View style={styles.metaTag}>
            <Ionicons name="tennisball-outline" size={12} color="#6B7280" />
            <Text style={styles.metaTagText}>{video.drillName}</Text>
          </View>
        ) : null}
        {video.drillPracticeSets ? (
          <View style={styles.metaTag}>
            <Ionicons name="repeat-outline" size={12} color="#6B7280" />
            <Text style={styles.metaTagText}>{video.drillPracticeSets}</Text>
          </View>
        ) : null}
      </View>

      {/* Drill Description (if separate from main description) */}
      {video.drillDescription ? (
        <View style={styles.drillDescContainer}>
          <Text style={styles.drillDescLabel}>Bài tập:</Text>
          <Text style={styles.drillDescText} numberOfLines={2}>
            {video.drillDescription}
          </Text>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.cardActions}>
        {video.publicUrl ? (
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => onOpen(video.publicUrl!)}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={16} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Xem video</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.processingBadge}>
            <ActivityIndicator size="small" color="#6B7280" />
            <Text style={styles.processingText}>Đang xử lý...</Text>
          </View>
        )}

        <View style={styles.secondaryActions}>
          {onUpdate && (
            <TouchableOpacity
              style={styles.iconActionButton}
              onPress={() => onUpdate(video.id, video)}
            >
              <Ionicons name="pencil-outline" size={18} color="#4B5563" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.iconActionButton, styles.deleteActionButton]}
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
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    maxWidth: 220,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    marginTop: 10,
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
    marginRight: 10,
  },
  infoValue: {
    fontSize: 12,
    color: "#111827",
    flex: 1,
    textAlign: "right",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  cardDescription: {
    fontSize: 12,
    color: "#4B5563",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  meta: {
    fontSize: 12,
    color: "#6B7280",
  },
  // Coach Video Card Styles
  coachCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    gap: 8,
  },
  coachHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  coachTitleContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  videoIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  coachTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  coachDescription: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
  },
  metaTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaTagText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },
  drillDescContainer: {
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  drillDescLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  drillDescText: {
    fontSize: 13,
    color: "#374151",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  processingBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  processingText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "500",
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconActionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  deleteActionButton: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  learnerCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    gap: 6,
  },
  learnerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  learnerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  learnerMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  learnerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  emptyCard: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 140,
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "500",
  },
  exerciseWrap: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  exerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  exerciseSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  btnGhostGreen: {
    borderWidth: 1,
    borderColor: "#A7F3D0",
    backgroundColor: "#F0FDF4",
  },
  btnPrimaryPurple: {
    backgroundColor: "#7C3AED",
  },
  btnText: { fontSize: 13, fontWeight: "700" },
  // Quiz Card Styles
  quizCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  quizCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 6,
  },
  quizCardTitle: {
    flex: 1,
  },
  quizStepLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  quizCardTitleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 15,
  },
  quizStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    minWidth: 65,
    alignItems: "center",
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  quizDescriptionSection: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#059669",
  },
  quizDescText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "400",
    lineHeight: 14,
  },
  quickMetadataRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  quickMetadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ECFDF5",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    flex: 1,
  },
  quickMetadataTextBlue: {
    fontSize: 10,
    fontWeight: "600",
    color: "#059669",
  },
  quizActionsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  quizActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  quizActionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  videoModalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  videoModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  videoModalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  videoModalTitle: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
});

export default SessionDetailScreen;
