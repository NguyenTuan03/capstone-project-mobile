import { get, post } from "@/services/http/httpService";
import { useJWTAuth } from "@/services/jwt-auth/JWTAuthProvider";
import { CourseStatus, type Course as BaseCourse } from "@/types/course";
import type { Enrollment } from "@/types/enrollments";
import { Feedback } from "@/types/feecbacks";
import type { Session } from "@/types/session";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    comment: "",
    rating: 5,
    isAnonymous: false,
  });

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

  const handleSubmitFeedback = useCallback(async () => {
    if (!courseId) {
      Alert.alert("Lỗi", "Không tìm thấy khóa học.");
      return;
    }

    if (!feedbackForm.comment.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đánh giá của bạn.");
      return;
    }

    if (feedbackForm.rating < 1 || feedbackForm.rating > 5) {
      Alert.alert("Lỗi", "Vui lòng chọn điểm đánh giá từ 1 đến 5.");
      return;
    }

    setSubmittingFeedback(true);
    try {
      await post(`/v1/feedbacks/courses/${courseId}`, {
        comment: feedbackForm.comment.trim(),
        rating: feedbackForm.rating,
        isAnonymous: feedbackForm.isAnonymous,
      });

      Alert.alert("Thành công", "Cảm ơn bạn đã đánh giá khóa học!", [
        {
          text: "OK",
          onPress: () => {
            setShowFeedbackModal(false);
            setFeedbackForm({
              comment: "",
              rating: 5,
              isAnonymous: false,
            });
            // Refresh feedbacks
            fetchDetail();
          },
        },
      ]);
    } catch (err: any) {
      console.error("Failed to submit feedback:", err);
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message ||
          "Không thể gửi đánh giá. Vui lòng thử lại."
      );
    } finally {
      setSubmittingFeedback(false);
    }
  }, [courseId, feedbackForm, fetchDetail]);

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

  const getCourseStatusLabel = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Chờ đủ người";
      case "FULL":
        return "Sắp học";
      case "READY_OPENED":
        return "Sắp học";
      case "ON_GOING":
        return "Đang diễn ra";
      default:
        return "";
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
  const getLevelLabel = (level: string) => {
    switch (level) {
      case "INTERMEDIATE":
        return "Trung bình";
      case "ADVANCED":
        return "Nâng cao";
      case "PROFESSIONAL":
        return "Chuyên nghiệp";
      default:
        return "Cơ bản";
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
    (user as unknown as { metadata?: { user?: { id?: number } } })?.metadata
      ?.user?.id;

  const learnerEnrollment =
    course.enrollments?.find(
      (item: Enrollment) => item.user?.id === currentUserId
    ) ?? course.enrollments?.[0];
  const sessions = course.sessions ?? [];
  const schedules = course.schedules ?? [];

  // Kiểm tra xem user hiện tại đã viết feedback chưa
  const hasUserFeedback = feedbacks.some((feedback) => {
    const feedbackUserId =
      (feedback as any).createdBy?.id || feedback.created_by?.id;
    return feedbackUserId === currentUserId;
  });

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
        <View style={{ gap: 12 }}>
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Thông tin khóa học</Text>
            <View style={{ gap: 8 }}>
              <View style={styles.infoHeader}>
                <Text style={styles.courseName}>{course.name}</Text>
                {course.status ? (
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>
                      {getCourseStatusLabel(course.status)}
                    </Text>
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
                <Text style={styles.infoValue}>
                  {getLevelLabel(course.level)}
                </Text>
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
                <View style={{ gap: 4 }}>
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
                <View style={{ gap: 4 }}>
                  <Text style={styles.infoLabel}>Lịch học</Text>
                  <View style={{ gap: 3 }}>
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
              <View style={{ gap: 10 }}>
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
                                      sessionId: session.id.toString(),
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
          {course.status === CourseStatus.COMPLETED && (
            <View style={styles.detailSection}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <Text style={styles.detailSectionTitle}>
                  Đánh giá ({feedbacks.length})
                </Text>
                {!hasUserFeedback && (
                  <TouchableOpacity
                    style={styles.writeFeedbackButton}
                    onPress={() => setShowFeedbackModal(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.writeFeedbackButtonText}>
                      Viết đánh giá
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {feedbacks.length === 0 ? (
                <Text style={{ color: "#6B7280", fontSize: 14 }}>
                  Chưa có đánh giá nào
                </Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {feedbacks.map((feedback, index) => (
                    <View
                      key={feedback.id || index}
                      style={styles.feedbackItem}
                    >
                      <View style={styles.feedbackHeader}>
                        <View style={styles.ratingContainer}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name={
                                star <= feedback.rating
                                  ? "star"
                                  : "star-outline"
                              }
                              size={16}
                              color={
                                star <= feedback.rating ? "#FBBF24" : "#D1D5DB"
                              }
                            />
                          ))}
                        </View>
                        <View style={styles.feedbackAuthorContainer}>
                          {feedback.isAnonymous ? (
                            <>
                              <Ionicons
                                name="eye-off-outline"
                                size={14}
                                color="#6B7280"
                              />
                              <Text style={styles.feedbackAuthor}>Ẩn danh</Text>
                            </>
                          ) : (
                            <Text style={styles.feedbackAuthor}>
                              {(feedback as any).createdBy?.fullName ||
                                feedback.created_by?.fullName ||
                                "Người dùng"}
                            </Text>
                          )}
                        </View>
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
          )}
        </View>
      </ScrollView>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Viết đánh giá</Text>
              <TouchableOpacity
                onPress={() => setShowFeedbackModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {/* Rating Selection */}
              <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>Đánh giá của bạn</Text>
                <View style={styles.starContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() =>
                        setFeedbackForm({ ...feedbackForm, rating: star })
                      }
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={
                          star <= feedbackForm.rating ? "star" : "star-outline"
                        }
                        size={40}
                        color={
                          star <= feedbackForm.rating ? "#FBBF24" : "#D1D5DB"
                        }
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Comment Input */}
              <View style={styles.commentSection}>
                <Text style={styles.commentLabel}>Nhận xét</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Chia sẻ trải nghiệm của bạn về khóa học này..."
                  placeholderTextColor="#9CA3AF"
                  value={feedbackForm.comment}
                  onChangeText={(text) =>
                    setFeedbackForm({ ...feedbackForm, comment: text })
                  }
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              {/* Anonymous Option */}
              <TouchableOpacity
                style={styles.anonymousOption}
                onPress={() =>
                  setFeedbackForm({
                    ...feedbackForm,
                    isAnonymous: !feedbackForm.isAnonymous,
                  })
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    feedbackForm.isAnonymous ? "checkbox" : "checkbox-outline"
                  }
                  size={24}
                  color={feedbackForm.isAnonymous ? "#059669" : "#9CA3AF"}
                />
                <Text style={styles.anonymousLabel}>Đánh giá ẩn danh</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowFeedbackModal(false)}
                disabled={submittingFeedback}
              >
                <Text style={styles.modalCancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  submittingFeedback && styles.modalSubmitButtonDisabled,
                ]}
                onPress={handleSubmitFeedback}
                disabled={submittingFeedback}
              >
                {submittingFeedback ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Gửi đánh giá</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  infoButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  container: { padding: 12, gap: 12, paddingBottom: 20 },

  /* Detail Section - Compact */
  detailSection: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  courseName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 18,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#DCFCE7",
    alignSelf: "flex-start",
  },
  statusPillText: {
    color: "#047857",
    fontWeight: "600",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  courseDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    width: "40%",
  },
  infoValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
  },
  infoValueBold: {
    fontWeight: "700",
  },
  courtCard: {
    gap: 4,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  courtAddress: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "500",
  },
  courtMeta: {
    fontSize: 11,
    color: "#6B7280",
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  scheduleText: {
    fontSize: 11,
    color: "#1F2937",
    fontWeight: "500",
  },

  /* Session Item - Compact */
  sessionItem: {
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sessionNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sessionNumberText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  sessionName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  sessionStatus: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
  },
  sessionDescription: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  sessionInfo: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  sessionInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  sessionInfoText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  lessonInfo: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 3,
  },
  lessonTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  lessonMeta: {
    fontSize: 10,
    color: "#6B7280",
  },
  lessonResourcesButton: {
    marginTop: 8,
    backgroundColor: "#059669",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  lessonResourcesButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },

  /* Feedback Item - Compact */
  feedbackItem: {
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 1,
  },
  feedbackAuthorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  feedbackAuthor: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  feedbackComment: {
    fontSize: 12,
    color: "#111827",
    lineHeight: 16,
  },
  feedbackDate: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  writeFeedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#059669",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  writeFeedbackButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },

  /* Modal Styles - Compact */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "90%",
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: 12,
    maxHeight: 450,
  },
  ratingSection: {
    marginBottom: 16,
    alignItems: "center",
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
  },
  starContainer: {
    flexDirection: "row",
    gap: 6,
  },
  commentSection: {
    marginBottom: 16,
  },
  commentLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  commentInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: "#111827",
    minHeight: 100,
    textAlignVertical: "top",
  },
  anonymousOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  anonymousLabel: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButtonText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  modalSubmitButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
