import { get } from "@/services/http/httpService";
import type { Course, CoursesResponse } from "@/types/course";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Map course status to Vietnamese
const getStatusInVietnamese = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING_APPROVAL: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn thành",
    FULL: "Đã đủ người",
    READY_OPENED: "Sẵn sàng mở",
    ON_GOING: "Đang diễn ra",
  };
  return statusMap[status] || status;
};

// Get status badge color
const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    PENDING_APPROVAL: "#F59E0B",
    APPROVED: "#10B981",
    REJECTED: "#EF4444",
    CANCELLED: "#6B7280",
    COMPLETED: "#3B82F6",
    FULL: "#8B5CF6",
    READY_OPENED: "#10B981",
    ON_GOING: "#10B981",
  };
  return colorMap[status] || "#6B7280";
};

// Map course level to Vietnamese
const getLevelInVietnamese = (level: string): string => {
  const levelMap: Record<string, string> = {
    BEGINNER: "Cơ bản",
    INTERMEDIATE: "Trung bình",
    ADVANCED: "Nâng cao",
    PROFESSIONAL: "Chuyên nghiệp",
  };
  return levelMap[level] || level;
};

// Map learning format to Vietnamese
const getLearningFormatInVietnamese = (format: string): string => {
  return format === "GROUP" ? "Nhóm" : "Cá nhân";
};

export default function MyCoursesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await get<CoursesResponse>("/v1/courses/learner");
      const { items = [], page = 1, pageSize = 10, total = 0 } = res.data ?? {};
      setCourses(items);
      setPagination({ page, pageSize, total });
    } catch (error) {
      console.error("Lỗi khi tải danh sách khóa học đã đăng ký:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEnrollments();
    }, [fetchEnrollments])
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <View style={[styles.safe, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Khóa học của tôi</Text>
          <Text style={styles.headerSubtitle}>Theo dõi tiến độ học tập</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#059669" />
          </View>
        ) : courses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>Chưa có khóa học nào</Text>
            <Text style={styles.emptyStateSubtitle}>
              Hãy khám phá các khóa học mới để bắt đầu học tập
            </Text>
            <TouchableOpacity
              style={styles.exploreCourseBtn}
              activeOpacity={0.8}
              onPress={() => router.push("/(learner)/courses")}
            >
              <Ionicons name="search" size={16} color="#FFFFFF" />
              <Text style={styles.exploreCourseText}>Khám phá khóa học</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconContainer}>
                  <Ionicons name="book" size={24} color="#059669" />
                </View>
                <View>
                  <Text style={styles.summaryValue}>{pagination.total}</Text>
                  <Text style={styles.summaryLabel}>Khóa học</Text>
                </View>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </View>
                <View>
                  <Text style={styles.summaryValue}>
                    {courses.filter((c) => c.status === "COMPLETED").length}
                  </Text>
                  <Text style={styles.summaryLabel}>Hoàn thành</Text>
                </View>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconContainer}>
                  <Ionicons name="play-circle" size={24} color="#F59E0B" />
                </View>
                <View>
                  <Text style={styles.summaryValue}>
                    {courses.filter((c) => c.status === "ON_GOING").length}
                  </Text>
                  <Text style={styles.summaryLabel}>Đang học</Text>
                </View>
              </View>
            </View>

            {/* Course Cards */}
            {courses.map((course) => {
              const progress = course.progressPct || 0;

              return (
                <TouchableOpacity
                  key={course.id}
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(`/(learner)/my-courses/${course.id}`)
                  }
                >
                  {/* Image Container */}
                  <View style={styles.cardImageWrapper}>
                    <Image
                      source={{
                        uri: "https://via.placeholder.com/400x160?text=Course",
                      }}
                      style={styles.cover}
                    />
                    {/* Status Badge Overlay */}
                    <View style={styles.statusBadgeOverlay}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: getStatusColor(course.status),
                          },
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {getStatusInVietnamese(course.status)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Course Info */}
                  <View style={styles.cardContent}>
                    {/* Title & Coach */}
                    <View>
                      <Text style={styles.courseTitle} numberOfLines={2}>
                        {course.name}
                      </Text>
                      <View style={styles.coachRow}>
                        <Ionicons name="person" size={12} color="#6B7280" />
                        <Text style={styles.courseCoach} numberOfLines={1}>
                          {course.createdBy?.fullName || "Huấn luyện viên"}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Section */}
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Tiến độ</Text>
                        <Text style={styles.progressPercent}>
                          {Math.round(progress)}%
                        </Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${progress}%` },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Course Details Grid - 3 columns */}
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailCard}>
                        <Text style={styles.detailCardLabel}>Trình độ</Text>
                        <Text style={styles.detailCardValue}>
                          {getLevelInVietnamese(course.level)}
                        </Text>
                      </View>
                      <View style={styles.detailCard}>
                        <Text style={styles.detailCardLabel}>Hình thức</Text>
                        <Text style={styles.detailCardValue}>
                          {getLearningFormatInVietnamese(course.learningFormat)}
                        </Text>
                      </View>
                      <View style={styles.detailCard}>
                        <Text style={styles.detailCardLabel}>Buổi học</Text>
                        <Text style={styles.detailCardValue}>
                          {course.totalSessions}
                        </Text>
                      </View>
                    </View>

                    {/* Subject & Participants Row */}
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <Ionicons name="bookmark" size={14} color="#059669" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.infoLabel}>Chủ đề</Text>
                          <Text style={styles.infoValue} numberOfLines={1}>
                            {course.subject?.name || "N/A"}
                          </Text>
                        </View>
                      </View>
                      {course.learningFormat === "GROUP" && (
                        <View style={styles.infoItem}>
                          <Ionicons name="people" size={14} color="#059669" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.infoLabel}>Người tham gia</Text>
                            <Text style={styles.infoValue}>
                              {course.currentParticipants}/
                              {course.maxParticipants}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Start & End Dates Row */}
                    <View style={styles.datesRow}>
                      <View style={styles.dateItem}>
                        <Ionicons
                          name="calendar-clear"
                          size={14}
                          color="#059669"
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dateLabel}>Bắt đầu</Text>
                          <Text style={styles.dateValue}>
                            {formatDate(course.startDate)}
                          </Text>
                        </View>
                      </View>
                      {course.endDate && (
                        <View style={styles.dateItem}>
                          <Ionicons
                            name="calendar-clear"
                            size={14}
                            color="#D97706"
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dateLabel}>Kết thúc</Text>
                            <Text style={styles.dateValue}>
                              {formatDate(course.endDate)}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Location Row */}
                    {course.court?.address && (
                      <View style={styles.locationSection}>
                        <Ionicons name="location" size={14} color="#059669" />
                        <Text style={styles.locationText} numberOfLines={2}>
                          {course.court.address}
                        </Text>
                      </View>
                    )}

                    {/* Feedback Section for Completed Courses */}
                    {course.status === "COMPLETED" && (
                      <View style={styles.feedbackSection}>
                        <Ionicons
                          name="chatbubble-ellipses"
                          size={16}
                          color="#059669"
                        />
                        <Text style={styles.feedbackText}>
                          Bạn đã hoàn thành khóa học này. Hãy viết feedback để
                          chia sẻ trải nghiệm của bạn!
                        </Text>
                      </View>
                    )}

                    {/* Button */}
                    <TouchableOpacity
                      style={styles.detailBtn}
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push(`/(learner)/my-courses/${course.id}`)
                      }
                    >
                      <Text style={styles.detailBtnText}>Xem chi tiết</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#059669"
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  headerSection: {
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  container: { padding: 16, gap: 12, paddingBottom: 20 },

  /* Empty State */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18,
  },
  exploreCourseBtn: {
    flexDirection: "row",
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  exploreCourseText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  /* Summary Card */
  summaryCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  summaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#E0F2FE",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#C6F6D5",
  },

  /* Card */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardImageWrapper: {
    position: "relative",
    overflow: "hidden",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cover: { width: "100%", height: 140, backgroundColor: "#E5E7EB" },
  statusBadgeOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  cardContent: {
    padding: 12,
    gap: 10,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 20,
  },
  coachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  courseCoach: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },

  /* Progress */
  progressSection: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  progressPercent: {
    color: "#059669",
    fontWeight: "700",
    fontSize: 14,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: 6, backgroundColor: "#059669", borderRadius: 3 },

  /* Details Grid */
  detailsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  detailCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    gap: 4,
    alignItems: "center",
  },
  detailCardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  detailCardValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },

  /* Info Row */
  infoRow: {
    flexDirection: "row",
    gap: 8,
  },
  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    marginTop: 2,
  },

  /* Dates Row */
  datesRow: {
    flexDirection: "row",
    gap: 8,
  },
  dateItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    marginTop: 2,
  },

  /* Location Section */
  locationSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#059669",
  },
  locationText: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "500",
    flex: 1,
    lineHeight: 16,
  },

  /* Feedback Section */
  feedbackSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  feedbackText: {
    fontSize: 12,
    color: "#1E40AF",
    fontWeight: "500",
    flex: 1,
    lineHeight: 18,
  },

  /* Details Row */
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  detailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  detailDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E5E7EB",
  },

  /* End Date Info */
  endDateInfo: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#F59E0B",
  },
  endDateLabel: {
    fontSize: 12,
    color: "#D97706",
    fontWeight: "500",
  },
  endDateValue: {
    fontWeight: "700",
  },

  /* Button */
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#059669",
    borderRadius: 10,
    paddingVertical: 10,
  },
  detailBtnText: {
    color: "#059669",
    fontWeight: "700",
    fontSize: 14,
  },
});
