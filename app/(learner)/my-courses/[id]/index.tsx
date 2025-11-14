import { get } from "@/services/http/httpService";
import { useJWTAuth } from "@/services/jwt-auth/JWTAuthProvider";
import type { Course as BaseCourse } from "@/types/course";
import type { Enrollment } from "@/types/enrollments";
import { Feedback } from "@/types/feecbacks";
import type { Session } from "@/types/session";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type LearnerCourseDetail = BaseCourse & {
  sessions?: Session[];
};

export default function CourseDetailScreen() {
  const router = useRouter();
  const { user } = useJWTAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const courseId = id ? parseInt(id, 10) : null;

  const [course, setCourse] = useState<LearnerCourseDetail | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setFeedbacks([]);

      const [courseRes, feedbacksRes] = await Promise.allSettled([
        get<LearnerCourseDetail>(`/v1/courses/${courseId}`),
        get<Feedback[]>(`/v1/feedbacks/courses/${courseId}`),
      ]);

      if (courseRes.status === "fulfilled") {
        setCourse(courseRes.value.data ?? null);
      } else {
        console.error("Lỗi khi tải chi tiết khóa học:", courseRes.reason);
        setCourse(null);
      }

      if (feedbacksRes.status === "fulfilled") {
        setFeedbacks(feedbacksRes.value.data || []);
      } else {
        console.error("Lỗi khi tải feedbacks:", feedbacksRes.reason);
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết khóa học:", error);
      Alert.alert("Lỗi", "Không thể tải chi tiết khóa học");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

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

const formatPrice = (price: string | null | undefined) => {
  if (!price) return "N/A";
  const numeric = Number(price);
  if (Number.isNaN(numeric)) return price;
  return `${new Intl.NumberFormat("vi-VN").format(numeric)} VNĐ`;
};

const translateLearningFormat = (format?: string | null) => {
  if (!format) return "N/A";
  switch (format) {
    case "INDIVIDUAL":
      return "Cá nhân";
    case "GROUP":
      return "Nhóm";
    default:
      return format;
  }
};

const getSessionStatusLabel = (status: string) => {
  switch (status) {
    case "SCHEDULED":
      return "Đã lên lịch";
    case "COMPLETED":
      return "Đã hoàn thành";
    case "IN_PROGRESS":
      return "Đang diễn ra";
    case "CANCELLED":
      return "Đã hủy";
    case "PENDING":
      return "Đang chờ";
    default:
      return status;
  }
};

const getEnrollmentStatusLabel = (status: Enrollment["status"]) => {
  switch (status) {
    case "CONFIRMED":
      return "Đã xác nhận";
    case "LEARNING":
      return "Đang học";
    case "PENDING_GROUP":
      return "Chờ ghép lớp";
    case "UNPAID":
      return "Chưa thanh toán";
    case "REFUNDED":
      return "Đã hoàn tiền";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status;
  }
};

const enrollmentStatusStyle = (status?: Enrollment["status"]) => {
  switch (status) {
    case "CONFIRMED":
    case "LEARNING":
      return { color: "#10B981" };
    case "PENDING_GROUP":
    case "UNPAID":
      return { color: "#F59E0B" };
    default:
      return { color: "#EF4444" };
  }
};

  if (loading) {
    return (
      <View style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: "#6B7280" }}>Không tìm thấy khóa học</Text>
        </View>
      </View>
    );
  }

  const currentUserId =
    user?.id ??
    (user as unknown as { metadata?: { user?: { id?: number } } })?.metadata?.user
      ?.id;

  const learnerEnrollment =
    course.enrollments?.find(
      (item: Enrollment) => item.user?.id === currentUserId
    ) ?? course.enrollments?.[0];
  const sessions = course.sessions ?? [];
  const schedules = course.schedules ?? [];

  return (
    <View style={styles.safe}>
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
          onPress={() => {
            if (learnerEnrollment) {
              router.push(`/(learner)/my-courses/${learnerEnrollment.id}/info`);
            } else {
              Alert.alert(
                "Thông báo",
                "Không tìm thấy thông tin đăng ký của bạn."
              );
            }
          }}
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
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Thông tin khóa học</Text>
            <View style={{ gap: 12 }}>
              <View style={styles.infoHeader}>
                <Text style={styles.courseName}>{course.name}</Text>
                {course.status ? (
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>{course.status}</Text>
                  </View>
                ) : null}
              </View>
              {course.description ? (
                <Text style={styles.courseDescription}>
                  {course.description}
                </Text>
              ) : null}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Trình độ</Text>
                <Text style={styles.infoValue}>{course.level}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Hình thức</Text>
                <Text style={styles.infoValue}>
                  {translateLearningFormat(course.learningFormat)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Số buổi</Text>
                <Text style={styles.infoValue}>
                  {course.totalSessions ?? 0}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Học phí</Text>
                <Text style={styles.infoValue}>
                  {formatPrice(course.pricePerParticipant)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày bắt đầu</Text>
                <Text style={styles.infoValue}>
                  {formatDate(course.startDate)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày kết thúc</Text>
                <Text style={styles.infoValue}>
                  {formatDate(course.endDate)}
                </Text>
              </View>
              {course.subject?.name ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Môn học</Text>
                  <Text style={styles.infoValue}>{course.subject.name}</Text>
                </View>
              ) : null}
              {course.createdBy?.fullName ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Huấn luyện viên</Text>
                  <Text style={styles.infoValue}>
                    {course.createdBy.fullName}
                  </Text>
                </View>
              ) : null}
              {course.court ? (
                <View style={{ gap: 6 }}>
                  <Text style={styles.infoLabel}>Địa điểm</Text>
                  <View style={styles.courtCard}>
                    <Text style={styles.infoValue}>{course.court.name}</Text>
                    {course.court.address ? (
                      <Text style={styles.courtAddress}>
                        {course.court.address}
                      </Text>
                    ) : null}
                    <Text style={styles.courtMeta}>
                      {[
                        course.court.district?.name,
                        course.court.province?.name,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </Text>
                    {course.court.phoneNumber ? (
                      <Text style={styles.courtMeta}>
                        Liên hệ: {course.court.phoneNumber}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}
              {schedules.length > 0 ? (
                <View style={{ gap: 6 }}>
                  <Text style={styles.infoLabel}>Lịch học</Text>
                  <View style={{ gap: 4 }}>
                    {schedules.map((schedule) => (
                      <View key={schedule.id} style={styles.scheduleRow}>
                        <Ionicons
                          name="calendar-clear-outline"
                          size={16}
                          color="#10B981"
                        />
                        <Text style={styles.scheduleText}>
                          {schedule.dayOfWeek} • {schedule.startTime} -{" "}
                          {schedule.endTime}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          {learnerEnrollment ? (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Thông tin đăng ký</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Trạng thái</Text>
                <Text
                  style={[
                    styles.infoValue,
                    styles.infoValueBold,
                    enrollmentStatusStyle(learnerEnrollment.status),
                  ]}
                >
                  {getEnrollmentStatusLabel(learnerEnrollment.status)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày đăng ký</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(learnerEnrollment.enrolledAt)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Học phí đã đóng</Text>
                <Text style={styles.infoValue}>
                  {formatPrice(learnerEnrollment.paymentAmount)}
                </Text>
              </View>
            </View>
          ) : null}

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
                        <Text style={styles.sessionName}>
                          {session.name || `Buổi học ${session.sessionNumber}`}
                        </Text>
                        <Text style={styles.sessionStatus}>
                          {getSessionStatusLabel(session.status)}
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
                          {session.startTime && session.endTime
                            ? `${session.startTime} - ${session.endTime}`
                            : session.startTime || session.endTime || "N/A"}
                        </Text>
                      </View>
                    </View>
                    {session.lesson &&
                      (() => {
                        const lesson = session;
                        const lessonLabel =
                          lesson.name ||
                          (lesson.sessionNumber != null
                            ? `Bài học ${lesson.sessionNumber}`
                            : "Bài học");

                        return (
                          <View style={styles.lessonInfo}>
                            <Text style={styles.lessonTitle}>
                              Bài học: {lessonLabel}
                            </Text>
                            {lesson.videos && lesson.videos.length > 0 && (
                              <Text style={styles.lessonMeta}>
                                {lesson.videos.length} video
                              </Text>
                            )}
                            {lesson.quizzes && lesson.quizzes.length > 0 && (
                              <Text style={styles.lessonMeta}>
                                {lesson.quizzes.length} quiz
                              </Text>
                            )}
                            {lesson.id ? (
                              <TouchableOpacity
                                style={styles.lessonResourcesButton}
                                activeOpacity={0.85}
                                onPress={() =>
                                  router.push({
                                    pathname:
                                      "/(learner)/my-courses/[id]/lesson/[lessonId]",
                                    params: {
                                      id: courseId?.toString() ?? "",
                                      lessonId: lesson.id.toString(),
                                      lessonName: lessonLabel,
                                    },
                                  })
                                }
                              >
                                <Text style={styles.lessonResourcesButtonText}>
                                  Xem video & quiz
                                </Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        );
                      })()}
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
    </View>
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
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  courseName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E0F2F1",
    alignSelf: "flex-start",
  },
  statusPillText: {
    color: "#047857",
    fontWeight: "600",
    fontSize: 12,
    textTransform: "uppercase",
  },
  courseDescription: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  infoValueBold: {
    fontWeight: "700",
  },
  courtCard: {
    gap: 4,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  courtAddress: {
    fontSize: 13,
    color: "#111827",
  },
  courtMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scheduleText: {
    fontSize: 12,
    color: "#1F2937",
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
  lessonResourcesButton: {
    marginTop: 12,
    backgroundColor: "#10B981",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  lessonResourcesButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
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
