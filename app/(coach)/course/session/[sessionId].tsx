import { BuildExercise } from "@/helper/BuildExercise";
import { get } from "@/services/http/httpService";
import http from "@/services/http/interceptor";
import type { Session } from "@/types/session";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { QuizDetailModal } from "./components/QuizDetailModal";

const formatTime = (time?: string | null) => {
  if (!time) return "—";
  return time.substring(0, 5);
};

const formatDate = (date?: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN");
};

const SessionDetailScreen: React.FC = () => {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [learnerVideos, setLearnerVideos] = useState<any[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [quizModalVisible, setQuizModalVisible] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      try {
        setLoading(true);
        const res = await get<Session>(`/v1/sessions/${sessionId}`);
        setSession(res.data);
      } catch {
        Alert.alert("Lỗi", "Không thể tải thông tin buổi học");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  const exercises = useMemo(
    () => (session ? BuildExercise(session) : []),
    [session]
  );
  const videoExercises = useMemo(
    () => exercises.filter((ex) => ex.type === "video"),
    [exercises]
  );

  useEffect(() => {
    const fetchLearnerVideos = async () => {
      if (!sessionId) return;
      try {
        const res = await get<any[]>(
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

      // Remove quiz from session state
      setSession((prev) =>
        prev
          ? {
              ...prev,
              quizzes: prev.quizzes?.filter((q) => q.id !== quizId) || [],
            }
          : null
      );

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: `Xóa quiz "${quizTitle}" thành công`,
        position: "top",
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error("Lỗi khi xóa quiz:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể xóa quiz. Vui lòng thử lại.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

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
              value={session.status || "—"}
              valueStyle={{ color: "#059669", fontWeight: "600" }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Video {videoExercises.length ? `(${videoExercises.length})` : ""}
            </Text>

            {videoExercises.length ? (
              videoExercises.map((ex) => (
                <View key={ex.id} style={styles.exerciseWrap}>
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseIcon}>
                      <Ionicons name="film-outline" size={20} color="#7C3AED" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exerciseTitle} numberOfLines={1}>
                        {ex.title}
                      </Text>
                      {ex.subtitle ? (
                        <Text style={styles.exerciseSubtitle} numberOfLines={2}>
                          {ex.subtitle}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.badgeRow}>
                    {!!ex.dueDate && (
                      <View
                        style={[styles.badge, { backgroundColor: "#EFF6FF" }]}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color="#2563EB"
                        />
                        <Text style={[styles.badgeText, { color: "#2563EB" }]}>
                          Hạn: {formatDate(ex.dueDate)}
                        </Text>
                      </View>
                    )}
                    <View
                      style={[styles.badge, { backgroundColor: "#F3E8FF" }]}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={12}
                        color="#7C3AED"
                      />
                      <Text style={[styles.badgeText, { color: "#7C3AED" }]}>
                        {learnerVideos.length} bài nộp
                      </Text>
                    </View>
                    {ex.hasSample && (
                      <View
                        style={[styles.badge, { backgroundColor: "#ECFDF5" }]}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={12}
                          color="#059669"
                        />
                        <Text style={[styles.badgeText, { color: "#059669" }]}>
                          Có video mẫu
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.actionRow}>
                    {learnerVideos.length > 0 ? (
                      <TouchableOpacity
                        style={[styles.btn, styles.btnPrimaryPurple]}
                        onPress={() =>
                          router.push({
                            pathname:
                              "/(coach)/course/session/submissions/[sessionId]",
                            params: { sessionId: String(sessionId) },
                          })
                        }
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color="#fff"
                        />
                        <Text style={[styles.btnText, { color: "#fff" }]}>
                          {`Xem Bài Nộp (${learnerVideos.length})`}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View
                        style={[
                          styles.btn,
                          styles.btnPrimaryPurple,
                          { backgroundColor: "#9CA3AF" },
                        ]}
                      >
                        <Text style={[styles.btnText, { color: "#FFFFFF" }]}>
                          Chưa có bài nộp
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="document-text-outline"
                  size={36}
                  color="#9CA3AF"
                />
                <Text style={styles.emptyText}>Chưa có bài tập nào</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Quiz{" "}
              {session.quizzes && session.quizzes.length
                ? `(${session.quizzes.length})`
                : ""}
            </Text>
            {session.quizzes && session.quizzes.length > 0 ? (
              session.quizzes.map((quiz, index) => (
                <TouchableOpacity
                  key={quiz.id}
                  style={styles.quizCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedQuiz(quiz);
                    setQuizModalVisible(true);
                  }}
                >
                  {/* Quiz Header */}
                  <View style={styles.quizCardHeader}>
                    <View style={styles.quizCardTitle}>
                      <Text style={styles.quizStepLabel}>Quiz {index + 1}</Text>
                      <Text style={styles.quizCardTitleText} numberOfLines={2}>
                        {quiz.title}
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
                  {quiz.description && (
                    <View style={styles.quizDescriptionSection}>
                      <Text style={styles.quizDescText}>
                        {quiz.description}
                      </Text>
                    </View>
                  )}

                  {/* Quick Metadata Row */}
                  <View style={styles.quickMetadataRow}>
                    <View style={styles.quickMetadataItem}>
                      <Ionicons name="help-circle" size={14} color="#2563EB" />
                      <Text style={styles.quickMetadataTextBlue}>
                        {(quiz as any).questions?.length || 0} câu hỏi
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
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
              } catch (error) {
                console.error("Error refreshing session:", error);
              }
            };
            fetchSession();
          }
        }}
      />
    </View>
  );
};

const InfoRow = ({
  label,
  value,
  multiline,
  valueStyle,
}: {
  label: string;
  value?: string | null;
  multiline?: boolean;
  valueStyle?: any;
}) => (
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
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
    padding: 16,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
    marginRight: 12,
  },
  infoValue: {
    fontSize: 13,
    color: "#111827",
    flex: 1,
    textAlign: "right",
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
  emptyCard: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
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

  actionRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

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
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  quizCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  quizCardTitle: {
    flex: 1,
  },
  quizStepLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  quizCardTitleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 17,
  },
  quizStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    minWidth: 75,
    alignItems: "center",
    fontWeight: "600",
  },
  quizDescriptionSection: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#2563EB",
  },
  quizDescText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "400",
    lineHeight: 15,
  },
  quickMetadataRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  quickMetadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    flex: 1,
  },
  quickMetadataTextBlue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
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
});

export default SessionDetailScreen;
