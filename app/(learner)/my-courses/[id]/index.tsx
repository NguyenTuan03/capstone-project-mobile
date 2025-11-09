import { get } from "@/services/http/httpService";
import { Enrollment } from "@/types/enrollments";
import { Feedback } from "@/types/feecbacks";
import { Session } from "@/types/session";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EnrollmentDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const enrollmentId = id ? parseInt(id, 10) : null;

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!enrollmentId) return;

    try {
      setLoading(true);
      setSessions([]);
      setFeedbacks([]);

      // Fetch enrollment detail
      const enrollmentRes = await get<Enrollment>(
        `/v1/enrollments/${enrollmentId}`
      );
      setEnrollment(enrollmentRes.data);

      const courseId = enrollmentRes.data.course.id;

      // Fetch sessions and feedbacks in parallel
      const [sessionsRes, feedbacksRes] = await Promise.allSettled([
        get<Session[]>(`/v1/sessions/courses/${courseId}`),
        get<Feedback[]>(`/v1/feedbacks/courses/${courseId}`),
      ]);

      if (sessionsRes.status === "fulfilled") {
        setSessions(sessionsRes.value.data || []);
      } else {
        console.error("Lỗi khi tải sessions:", sessionsRes.reason);
      }

      if (feedbacksRes.status === "fulfilled") {
        setFeedbacks(feedbacksRes.value.data || []);
      } else {
        console.error("Lỗi khi tải feedbacks:", feedbacksRes.reason);
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết enrollment:", error);
      Alert.alert("Lỗi", "Không thể tải chi tiết khóa học");
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safe,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      </SafeAreaView>
    );
  }

  if (!enrollment) {
    return (
      <SafeAreaView
        style={[
          styles.safe,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.loadingContainer}>
          <Text style={{ color: "#6B7280" }}>Không tìm thấy khóa học</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết khóa học</Text>
        <TouchableOpacity
          onPress={() =>
            router.push(`/(learner)/my-courses/${enrollmentId}/info`)
          }
          activeOpacity={0.7}
          style={styles.infoButton}
        >
          <Ionicons
            name="information-circle-outline"
            size={24}
            color="#111827"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={{ gap: 16 }}>
          {/* Sessions Info */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>
              Buổi học ({sessions.length})
            </Text>
            {sessions.length === 0 ? (
              <Text style={{ color: "#6B7280", fontSize: 14 }}>
                Chưa có buổi học nào
              </Text>
            ) : (
              <View style={{ gap: 12 }}>
                {sessions.map((session) => (
                  <View key={session.id} style={styles.sessionItem}>
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionNumberBadge}>
                        <Text style={styles.sessionNumberText}>
                          {session.sessionNumber}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionName}>{session.name}</Text>
                        <Text style={styles.sessionStatus}>
                          {session.status === "SCHEDULED"
                            ? "Đã lên lịch"
                            : session.status === "COMPLETED"
                            ? "Đã hoàn thành"
                            : session.status}
                        </Text>
                      </View>
                    </View>
                    {session.description && (
                      <Text style={styles.sessionDescription}>
                        {session.description}
                      </Text>
                    )}
                    <View style={styles.sessionInfo}>
                      <View style={styles.sessionInfoRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color="#6B7280"
                        />
                        <Text style={styles.sessionInfoText}>
                          {formatDate(session.scheduleDate)}
                        </Text>
                      </View>
                      <View style={styles.sessionInfoRow}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#6B7280"
                        />
                        <Text style={styles.sessionInfoText}>
                          {session.startTime} - {session.endTime}
                        </Text>
                      </View>
                    </View>
                    {session.lesson && (
                      <View style={styles.lessonInfo}>
                        <Text style={styles.lessonTitle}>
                          Bài học: {session.lesson.name}
                        </Text>
                        {session.lesson.videos &&
                          session.lesson.videos.length > 0 && (
                            <Text style={styles.lessonMeta}>
                              {session.lesson.videos.length} video
                            </Text>
                          )}
                        {session.lesson.quizzes &&
                          session.lesson.quizzes.length > 0 && (
                            <Text style={styles.lessonMeta}>
                              {session.lesson.quizzes.length} quiz
                            </Text>
                          )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Feedbacks Info */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>
              Đánh giá ({feedbacks.length})
            </Text>
            {feedbacks.length === 0 ? (
              <Text style={{ color: "#6B7280", fontSize: 14 }}>
                Chưa có đánh giá nào
              </Text>
            ) : (
              <View style={{ gap: 12 }}>
                {feedbacks.map((feedback, index) => (
                  <View key={feedback.id || index} style={styles.feedbackItem}>
                    <View style={styles.feedbackHeader}>
                      <View style={styles.ratingContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={
                              star <= feedback.rating ? "star" : "star-outline"
                            }
                            size={16}
                            color={
                              star <= feedback.rating ? "#FBBF24" : "#D1D5DB"
                            }
                          />
                        ))}
                      </View>
                      <Text style={styles.feedbackAuthor}>
                        {feedback.isAnonymous
                          ? "Ẩn danh"
                          : feedback.created_by?.fullName || "Người dùng"}
                      </Text>
                    </View>
                    {feedback.comment && (
                      <Text style={styles.feedbackComment}>
                        {feedback.comment}
                      </Text>
                    )}
                    {feedback.createdAt && (
                      <Text style={styles.feedbackDate}>
                        {formatDateTime(feedback.createdAt)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  infoButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  container: { padding: 16, gap: 16 },
  detailSection: {
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    gap: 12,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  sessionItem: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sessionNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  sessionNumberText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  sessionName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  sessionStatus: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  sessionDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  sessionInfo: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  sessionInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sessionInfoText: {
    fontSize: 12,
    color: "#6B7280",
  },
  lessonInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 4,
  },
  lessonTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  lessonMeta: {
    fontSize: 11,
    color: "#6B7280",
  },
  feedbackItem: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 2,
  },
  feedbackAuthor: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  feedbackComment: {
    fontSize: 14,
    color: "#111827",
    marginTop: 4,
  },
  feedbackDate: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },
});
