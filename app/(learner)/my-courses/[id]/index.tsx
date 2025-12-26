import { CoachDetailModal } from "@/components/coach/CoachDetailModal";
import GoogleMeetConference from "@/components/common/GoogleMeetConference";
import coachService from "@/services/coach.service";
import { get, patch, post } from "@/services/http/httpService";
import { useJWTAuth } from "@/services/jwt-auth/JWTAuthProvider";
import type { CoachDetail } from "@/types/coach";
import { CourseStatus, type Course as BaseCourse } from "@/types/course";
import type { Enrollment } from "@/types/enrollments";
import { Feedback } from "@/types/feecbacks";
import { SessionStatus, type Session } from "@/types/session";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  const [coachDetail, setCoachDetail] = useState<CoachDetail | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [cancellingCourse, setCancellingCourse] = useState(false);
  const [isVCVisible, setIsVCVisible] = useState(false);
  const [meetLink, setMeetLink] = useState("");
  const [feedbackForm, setFeedbackForm] = useState({
    comment: "",
    rating: 5,
    isAnonymous: false,
  });
  const [showSessions, setShowSessions] = useState(true);
  const [showFeedbacks, setShowFeedbacks] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setFeedbacks([]);
      setCoachDetail(null);

      const [courseRes, feedbacksRes] = await Promise.allSettled([
        get<LearnerCourseDetail>(`/v1/courses/${courseId}`),
        get<Feedback[]>(`/v1/feedbacks/courses/${courseId}`),
      ]);

      if (courseRes.status === "fulfilled") {
        const courseData = courseRes.value.data ?? null;
        setCourse(courseData);

        // Fetch coach details if course has createdBy user
        if (courseData?.createdBy?.id) {
          try {
            const coachData = await coachService.getCoachById(
              courseData.createdBy.id
            );
            setCoachDetail(coachData);
          } catch (coachError) {}
        }
      } else {
        setCourse(null);
      }

      if (feedbacksRes.status === "fulfilled") {
        setFeedbacks(feedbacksRes.value.data || []);
      } else {
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải chi tiết khóa học");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleCancelCourse = async (enrollment: Enrollment) => {
    if (!enrollment) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin đăng ký của bạn.");
      return;
    }

    Alert.alert(
      "Xác nhận hủy khóa học",
      "Bạn có chắc chắn muốn hủy khóa học này? Hành động này không thể hoàn tác.",
      [
        { text: "Không", onPress: () => {} },
        {
          text: "Hủy khóa học",
          style: "destructive",
          onPress: async () => {
            try {
              setCancellingCourse(true);
              await patch(`/v1/courses/${courseId}/learners/cancel`, {});

              Alert.alert(
                "Thành công",
                "Khóa học đã được hủy. Bạn sẽ nhận được hoàn tiền ở ví của mình.",
                [
                  {
                    text: "OK",
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (err: any) {
              Alert.alert(
                "Lỗi",
                err?.response?.data?.message ||
                  "Không thể hủy khóa học. Vui lòng thử lại."
              );
            } finally {
              setCancellingCourse(false);
            }
          },
        },
      ]
    );
  };

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
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message ||
          "Không thể gửi đánh giá. Vui lòng thử lại."
      );
    } finally {
      setSubmittingFeedback(false);
    }
  }, [courseId, feedbackForm, fetchDetail]);

  const handleJoinVideoConference = async () => {
    if (!courseId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin khóa học");
      return;
    }

    try {
      // For now, create a Google Meet URL format
      // Backend should return meetLink in future
      const meetUrl = `https://meet.google.com/${course?.googleMeetLink}`;
      setMeetLink(meetUrl);
      setIsVCVisible(true);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tham gia lớp học trực tuyến");
    }
  };

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
        return "Chờ đủ học viên";
      case "UNPAID":
        return "Chưa thanh toán";
      case "DONE":
        return "Đã hoàn thành";
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
      case "DONE":
        return { color: "#3B82F6" };
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
  const sessions = (course.sessions ?? []).sort(
    (a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0)
  );

  // Kiểm tra xem user hiện tại đã viết feedback chưa
  const hasUserFeedback = feedbacks.some((feedback) => {
    const feedbackUserId =
      (feedback as any).createdBy?.id || feedback.created_by?.id;
    return feedbackUserId === currentUserId;
  });

  return (
    <View style={styles.safe}>
      {/* Header - Premium */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(learner)/my-courses")}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Chi tiết khóa học
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={{ gap: 10 }}>
          {/* Course Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.courseName} numberOfLines={2}>
                {course.name}
              </Text>
              {course.status && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {getCourseStatusLabel(course.status)}
                  </Text>
                </View>
              )}
            </View>

            {course.description && (
              <Text style={styles.courseDescription} numberOfLines={3}>
                {course.description}
              </Text>
            )}

            {/* Compact Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Ionicons name="school-outline" size={16} color="#059669" />
                <Text style={styles.statLabel}>Trình độ</Text>
                <Text style={styles.statValue}>
                  {getLevelLabel(course.level)}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Ionicons name="people-outline" size={16} color="#059669" />
                <Text style={styles.statLabel}>Hình thức</Text>
                <Text style={styles.statValue}>
                  {translateLearningFormat(course.learningFormat)}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Ionicons name="time-outline" size={16} color="#059669" />
                <Text style={styles.statLabel}>Buổi học</Text>
                <Text style={styles.statValue}>
                  {course.totalSessions ?? 0}
                </Text>
              </View>
            </View>

            {/* Price Banner */}
            <View style={styles.priceBanner}>
              <View style={styles.priceRow}>
                <Ionicons name="cash-outline" size={18} color="#059669" />
                <Text style={styles.priceLabel}>Học phí</Text>
              </View>
              <Text style={styles.priceValue}>
                {formatPrice(course.pricePerParticipant)}
              </Text>
            </View>

            {/* Participant Progress Compact */}
            <View style={styles.participantSection}>
              <View style={styles.participantHeader}>
                <View style={styles.participantCount}>
                  <Ionicons name="people" size={14} color="#059669" />
                  <Text style={styles.participantText}>
                    {course.currentParticipants}/{course.maxParticipants} học
                    viên
                  </Text>
                </View>
                <Text style={styles.minText}>
                  Tối thiểu {course.minParticipants}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        (course.currentParticipants / course.maxParticipants) *
                          100,
                        100
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Date Row Compact */}
            <View style={styles.dateRow}>
              <View style={styles.dateBox}>
                <Ionicons
                  name="play-circle-outline"
                  size={14}
                  color="#059669"
                />
                <Text style={styles.dateText}>
                  {formatDate(course.startDate)}
                </Text>
              </View>
              {course.endDate && (
                <>
                  <Ionicons name="arrow-forward" size={12} color="#D1D5DB" />
                  <View style={styles.dateBox}>
                    <Ionicons name="flag-outline" size={14} color="#EF4444" />
                    <Text style={styles.dateText}>
                      {formatDate(course.endDate)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Location Compact */}
            {course.court && (
              <View style={styles.locationSection}>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color="#059669" />
                  <View style={styles.locationContent}>
                    <Text style={styles.locationName}>{course.court.name}</Text>
                    <Text style={styles.locationAddress}>
                      {course.court.address}, {course.court.district?.name}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Coach Info Button */}
            {coachDetail && (
              <TouchableOpacity
                style={styles.coachButton}
                onPress={() => setShowCoachModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="person-circle" size={20} color="#059669" />
                <View style={styles.coachInfo}>
                  <Text style={styles.coachName}>
                    {coachDetail.user?.fullName}
                  </Text>
                  <Text style={styles.coachPhone}>
                    {coachDetail.user?.phoneNumber}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}

            {/* Video Conference Button */}
            <TouchableOpacity
              style={styles.vcButton}
              onPress={handleJoinVideoConference}
              activeOpacity={0.8}
            >
              <Ionicons name="videocam" size={18} color="#FFFFFF" />
              <Text style={styles.vcButtonText}>
                Tham gia lớp học trực tuyến
              </Text>
            </TouchableOpacity>
          </View>

          {/* Enrollment Info */}
          {learnerEnrollment && (
            <View style={styles.card}>
              <View style={styles.enrollmentHeader}>
                <Ionicons name="receipt-outline" size={18} color="#059669" />
                <Text style={styles.enrollmentTitle}>Thông tin đăng ký</Text>
              </View>
              <View style={styles.enrollmentGrid}>
                <View style={styles.enrollmentItem}>
                  <Text style={styles.enrollmentLabel}>Trạng thái</Text>
                  <Text
                    style={[
                      styles.enrollmentValue,
                      enrollmentStatusStyle(learnerEnrollment.status),
                    ]}
                  >
                    {getEnrollmentStatusLabel(learnerEnrollment.status)}
                  </Text>
                </View>
                <View style={styles.enrollmentItem}>
                  <Text style={styles.enrollmentLabel}>Ngày đăng ký</Text>
                  <Text style={styles.enrollmentValue}>
                    {formatDateTime(learnerEnrollment.enrolledAt)}
                  </Text>
                </View>
                <View style={styles.enrollmentItem}>
                  <Text style={styles.enrollmentLabel}>Đã đóng</Text>
                  <Text style={styles.enrollmentValue}>
                    {formatPrice(learnerEnrollment.paymentAmount)}
                  </Text>
                </View>
              </View>

              {learnerEnrollment?.status !== "CANCELLED" &&
                (course.status === "APPROVED" ||
                  course.status === "READY_OPENED" ||
                  course.status === "FULL") && (
                  <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      cancellingCourse && styles.cancelButtonDisabled,
                    ]}
                    onPress={() => handleCancelCourse(learnerEnrollment)}
                    disabled={cancellingCourse}
                    activeOpacity={0.8}
                  >
                    {cancellingCourse ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name="close-circle"
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text style={styles.cancelButtonText}>
                          Hủy khóa học
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
            </View>
          )}

          {/* Sessions List */}
          <View style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.sectionHeaderRow}
              onPress={() => setShowSessions(!showSessions)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="calendar" size={18} color="#059669" />
                <Text style={styles.sectionHeader}>Lịch trình học tập</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{sessions.length}</Text>
                </View>
              </View>
              <Ionicons
                name={showSessions ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>

            {showSessions &&
              (sessions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyText}>Chưa có lịch học</Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {sessions.map((session, index) => (
                    <View key={session.id} style={styles.sessionCard}>
                      <View style={styles.sessionLeft}>
                        <View style={styles.sessionIndex}>
                          <Text style={styles.sessionIndexText}>
                            {session.sessionNumber || index + 1}
                          </Text>
                        </View>
                        <View style={styles.connectorLine} />
                      </View>

                      <View style={styles.sessionRight}>
                        <View style={styles.sessionHeader}>
                          <Text style={styles.sessionTitle}>
                            {session.name || `Buổi ${session.sessionNumber}`}
                          </Text>
                          <View
                            style={[
                              styles.sessionStatusBadge,
                              session.status === "COMPLETED" && {
                                backgroundColor: "#DCFCE7",
                              },
                              session.status === "IN_PROGRESS" && {
                                backgroundColor: "#DBEAFE",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.sessionStatusText,
                                session.status === "COMPLETED" && {
                                  color: "#059669",
                                },
                                session.status === "IN_PROGRESS" && {
                                  color: "#2563EB",
                                },
                              ]}
                            >
                              {getSessionStatusLabel(session.status)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.sessionMetaRow}>
                          <View style={styles.metaItem}>
                            <Ionicons
                              name="calendar-outline"
                              size={14}
                              color="#6B7280"
                            />
                            <Text style={styles.metaValue}>
                              {formatDate(session.scheduleDate)}
                            </Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Ionicons
                              name="time-outline"
                              size={14}
                              color="#6B7280"
                            />
                            <Text style={styles.metaValue}>
                              {session.startTime} - {session.endTime}
                            </Text>
                          </View>
                        </View>

                        {/* Lesson Content */}
                        <View style={styles.lessonContainer}>
                          <View style={styles.lessonHeader}>
                            <Ionicons
                              name="book-outline"
                              size={16}
                              color="#059669"
                            />
                            <Text style={styles.lessonLabel}>
                              Nội dung bài học
                            </Text>
                          </View>

                          <View style={styles.lessonStats}>
                            {session.video && (
                              <View style={styles.statTag}>
                                <Ionicons
                                  name="play-circle-outline"
                                  size={12}
                                  color="#4B5563"
                                />
                                <Text style={styles.statText}>Video</Text>
                              </View>
                            )}
                            {session.quiz && (
                              <View style={styles.statTag}>
                                <Ionicons
                                  name="help-circle-outline"
                                  size={12}
                                  color="#4B5563"
                                />
                                <Text style={styles.statText}>Quiz</Text>
                              </View>
                            )}
                          </View>

                          {session.status === SessionStatus.COMPLETED && (
                            <TouchableOpacity
                              style={styles.accessButton}
                              activeOpacity={0.8}
                              onPress={() =>
                                router.push({
                                  pathname:
                                    "/(learner)/my-courses/[id]/lesson/[lessonId]",
                                  params: {
                                    id: courseId?.toString() ?? "",
                                    lessonId: session.id.toString(),
                                    lessonName:
                                      session.name ||
                                      `Buổi ${session.sessionNumber}`,
                                    sessionId: session.id.toString(),
                                  },
                                })
                              }
                            >
                              <Text style={styles.accessButtonText}>
                                Vào học ngay
                              </Text>
                              <Ionicons
                                name="arrow-forward"
                                size={16}
                                color="#FFFFFF"
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
          </View>

          {/* Feedbacks Section */}
          {course.status === CourseStatus.COMPLETED && (
            <View style={styles.sectionContainer}>
              <TouchableOpacity
                style={styles.sectionHeaderRow}
                onPress={() => setShowFeedbacks(!showFeedbacks)}
                activeOpacity={0.7}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="chatbubbles" size={18} color="#059669" />
                  <Text style={styles.sectionHeader}>Đánh giá</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{feedbacks.length}</Text>
                  </View>
                </View>
                <Ionicons
                  name={showFeedbacks ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>

              {!hasUserFeedback && (
                <TouchableOpacity
                  style={styles.writeFeedbackButton}
                  onPress={() => setShowFeedbackModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create" size={16} color="#FFFFFF" />
                  <Text style={styles.writeFeedbackButtonText}>
                    Viết đánh giá
                  </Text>
                </TouchableOpacity>
              )}

              {showFeedbacks &&
                (feedbacks.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    {feedbacks.map((feedback, index) => (
                      <View
                        key={feedback.id || index}
                        style={styles.feedbackCard}
                      >
                        <View style={styles.feedbackTop}>
                          <View style={styles.userInfo}>
                            <View style={styles.avatarPlaceholder}>
                              <Text style={styles.avatarText}>
                                {feedback.isAnonymous
                                  ? "A"
                                  : (feedback as any).createdBy
                                      ?.fullName?.[0] || "U"}
                              </Text>
                            </View>
                            <View>
                              <Text style={styles.userName}>
                                {feedback.isAnonymous
                                  ? "Ẩn danh"
                                  : (feedback as any).createdBy?.fullName ||
                                    "Người dùng"}
                              </Text>
                              <Text style={styles.feedbackTime}>
                                {formatDateTime(feedback.createdAt)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons
                                key={star}
                                name={
                                  star <= feedback.rating
                                    ? "star"
                                    : "star-outline"
                                }
                                size={14}
                                color={
                                  star <= feedback.rating
                                    ? "#F59E0B"
                                    : "#E5E7EB"
                                }
                              />
                            ))}
                          </View>
                        </View>
                        {feedback.comment && (
                          <Text style={styles.commentText}>
                            {feedback.comment}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Coach Modal */}
      <CoachDetailModal
        visible={showCoachModal}
        coachDetail={coachDetail}
        feedbacks={feedbacks}
        courseStatus={course?.status}
        onClose={() => setShowCoachModal(false)}
        onCredentialPress={() => {}}
      />

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đánh giá khóa học</Text>
              <TouchableOpacity
                onPress={() => setShowFeedbackModal(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.ratingWrapper}>
                <Text style={styles.ratingTitle}>Bạn cảm thấy thế nào?</Text>
                <View style={styles.starSelectRow}>
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
                        size={42}
                        color={
                          star <= feedbackForm.rating ? "#F59E0B" : "#E5E7EB"
                        }
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>
                  Chia sẻ trải nghiệm của bạn
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Nội dung bài học, giảng viên, cơ sở vật chất..."
                  placeholderTextColor="#9CA3AF"
                  value={feedbackForm.comment}
                  onChangeText={(text) =>
                    setFeedbackForm({ ...feedbackForm, comment: text })
                  }
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() =>
                  setFeedbackForm({
                    ...feedbackForm,
                    isAnonymous: !feedbackForm.isAnonymous,
                  })
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name={
                    feedbackForm.isAnonymous ? "checkbox" : "square-outline"
                  }
                  size={22}
                  color={feedbackForm.isAnonymous ? "#059669" : "#9CA3AF"}
                />
                <Text style={styles.checkboxLabel}>Gửi đánh giá ẩn danh</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowFeedbackModal(false)}
              >
                <Text style={styles.cancelText}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  submittingFeedback && styles.disabledBtn,
                ]}
                onPress={handleSubmitFeedback}
                disabled={submittingFeedback}
              >
                {submittingFeedback ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitText}>Gửi đánh giá</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Credential Image Modal - Removed: Images shown directly in CoachDetailModal */}

      {/* Video Conference Modal */}
      <GoogleMeetConference
        isVisible={isVCVisible}
        onClose={() => setIsVCVisible(false)}
        meetLink={meetLink}
        userName={user?.fullName || "Bạn"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F4F6" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 10,
  },
  backButton: { padding: 4 },
  infoButton: { padding: 4 },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    textAlign: "center",
  },
  container: { padding: 12, paddingBottom: 30 },

  /* Card Styles */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 6,
  },
  cardListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  chevronBox: {
    padding: 4,
  },
  quickInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  quickInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  quickInfoText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
  },
  quickInfoDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#D1D5DB",
  },
  courseName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
    lineHeight: 24,
  },
  statusBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    color: "#059669",
    fontSize: 10,
    fontWeight: "700",
  },
  courseDescription: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 10,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 16,
  },

  /* Compact Stats Grid */
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  statBox: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "700",
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#E5E7EB",
  },

  /* Price Banner */
  priceBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priceLabel: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  priceValue: {
    fontSize: 15,
    color: "#059669",
    fontWeight: "800",
  },

  /* Participant Section Compact */
  participantSection: {
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 10,
  },
  participantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  participantCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  participantText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  minText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
  },
  progressBar: {
    height: 5,
    backgroundColor: "#D1FAE5",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#059669",
    borderRadius: 3,
  },

  /* Date Row Compact */
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "600",
  },

  /* Location Section Compact */
  locationSection: {
    marginTop: 10,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  locationContent: {
    flex: 1,
    gap: 2,
  },
  locationName: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "700",
  },
  locationAddress: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 16,
  },

  /* Coach Button Compact */
  coachButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginTop: 10,
  },
  coachInfo: {
    flex: 1,
    gap: 2,
  },
  coachName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  coachPhone: {
    fontSize: 11,
    color: "#6B7280",
  },

  /* Enrollment Section Compact */
  enrollmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  enrollmentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  enrollmentGrid: {
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  enrollmentItem: {
    gap: 4,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  cancelButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },

  /* Section Header Row with Collapse */
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  writeFeedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#059669",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  writeFeedbackButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  /* Grid Info */
  gridInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  gridItem: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  gridLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  gridValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
  },

  /* Meta Section */
  metaSection: { gap: 12 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  metaHighlight: {
    fontWeight: "700",
    color: "#111827",
  },
  locationBox: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  addressText: {
    fontSize: 12,
    color: "#6B7280",
    paddingLeft: 28,
  },

  /* Enrollment Info */
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  enrollmentList: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  enrollmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  dividerLight: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  enrollmentLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  enrollmentValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "700",
    marginTop: 2,
  },

  /* Sessions List */
  sectionContainer: { gap: 8 },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  countBadge: {
    backgroundColor: "#059669",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emptyState: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    gap: 8,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
  },

  /* Session Card */
  sessionCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sessionLeft: {
    width: 40,
    alignItems: "center",
    paddingTop: 12,
    backgroundColor: "#F9FAFB",
    borderRightWidth: 1,
    borderRightColor: "#F3F4F6",
  },
  sessionIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  sessionIndexText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E5E7EB",
    marginTop: -3,
    marginBottom: 12,
  },
  sessionRight: {
    flex: 1,
    padding: 12,
    gap: 8,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 6,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  sessionStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  sessionStatusText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#6B7280",
  },
  sessionMetaRow: {
    flexDirection: "row",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaValue: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },

  /* Lesson Content */
  lessonContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  lessonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  lessonLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
  },
  lessonStats: {
    flexDirection: "row",
    gap: 6,
  },
  statTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statText: {
    fontSize: 10,
    color: "#4B5563",
    fontWeight: "500",
  },
  accessButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#059669",
    paddingVertical: 8,
    borderRadius: 6,
  },
  accessButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  /* Feedback Section */
  feedbackHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  writeFeedbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  writeFeedbackText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  feedbackCard: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  feedbackTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },
  userName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  feedbackTime: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  starsRow: {
    flexDirection: "row",
    gap: 1,
  },
  commentText: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  closeBtn: { padding: 4 },
  modalContent: { padding: 16 },
  ratingWrapper: { alignItems: "center", marginBottom: 20 },
  ratingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
  },
  starSelectRow: { flexDirection: "row", gap: 10 },
  inputWrapper: { gap: 6, marginBottom: 16 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: "#111827",
    minHeight: 100,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  checkboxLabel: {
    fontSize: 13,
    color: "#4B5563",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  cancelText: {
    fontWeight: "600",
    color: "#6B7280",
    fontSize: 13,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#059669",
    alignItems: "center",
  },
  disabledBtn: { backgroundColor: "#9CA3AF" },
  submitText: {
    fontWeight: "700",
    color: "#FFFFFF",
    fontSize: 13,
  },
  vcButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#059669",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  vcButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  cancelCourseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  cancelCourseButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
  },
  cancelCourseText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  participantInfoSection: {
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  participantProgressContainer: {
    gap: 8,
  },
  participantProgressBar: {
    height: 6,
    backgroundColor: "#D1FAE5",
    borderRadius: 3,
    overflow: "hidden",
  },
  participantProgressFill: {
    height: "100%",
    backgroundColor: "#059669",
    borderRadius: 3,
  },
  participantStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  participantStat: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  participantStatText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  participantStatTextSmall: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },
  participantDividerSmall: {
    width: 1,
    height: 18,
    backgroundColor: "#D1FAE5",
  },
  dateSection: {
    gap: 12,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  coachButtonCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  coachButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  coachButtonText: {
    gap: 2,
    flex: 1,
  },
  coachButtonName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  coachButtonPhone: {
    fontSize: 12,
    color: "#6B7280",
  },
  credentialImageOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  credentialImageContainer: {
    width: "100%",
    maxHeight: "85%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  credentialCloseBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  credentialImageContent: {
    flex: 1,
    width: "100%",
  },
  credentialImageContentScroll: {
    padding: 16,
    paddingTop: 50,
    alignItems: "center",
    gap: 12,
  },
  credentialImageTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  credentialImage: {
    width: "100%",
    height: 400,
    borderRadius: 8,
  },
  credentialImageDescription: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  credentialNoImage: {
    backgroundColor: "#FFFFFF",
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    gap: 12,
  },
  credentialNoImageText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  /* Video Conference Button */
  videoConferenceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 8,
  },
  videoConferenceButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  /* Credential modal styles removed - Images shown directly in CoachDetailModal */
});
