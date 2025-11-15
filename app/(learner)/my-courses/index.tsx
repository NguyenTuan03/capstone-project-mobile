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
    APPROVED: "Chờ đủ người",
    REJECTED: "Đã hủy",
    CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn thành",
    FULL: "Sắp học",
    READY_OPENED: "Sắp học",
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
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

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

  // Filter courses by status
  const filteredCourses = filterStatus
    ? courses.filter((c) => c.status === filterStatus)
    : courses;

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
            {/* Filter Tabs - Compact */}
            <View style={styles.filterContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                <TouchableOpacity
                  onPress={() => setFilterStatus(null)}
                  style={[
                    styles.filterTab,
                    !filterStatus && styles.filterTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      !filterStatus && styles.filterTabTextActive,
                    ]}
                  >
                    Tất cả
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFilterStatus("ON_GOING")}
                  style={[
                    styles.filterTab,
                    filterStatus === "ON_GOING" && styles.filterTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      filterStatus === "ON_GOING" && styles.filterTabTextActive,
                    ]}
                  >
                    Đang học
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFilterStatus("COMPLETED")}
                  style={[
                    styles.filterTab,
                    filterStatus === "COMPLETED" && styles.filterTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      filterStatus === "COMPLETED" && styles.filterTabTextActive,
                    ]}
                  >
                    Hoàn thành
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFilterStatus("READY_OPENED")}
                  style={[
                    styles.filterTab,
                    filterStatus === "READY_OPENED" && styles.filterTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      filterStatus === "READY_OPENED" &&
                        styles.filterTabTextActive,
                    ]}
                  >
                    Sắp học
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Course Cards - Compact */}
            {filteredCourses.map((course) => {
              const progress = course.progressPct || 0;

              return (
                <TouchableOpacity
                  key={course.id}
                  style={styles.compactCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(`/(learner)/my-courses/${course.id}`)
                  }
                >
                  {/* Thumbnail */}
                  <View style={styles.compactThumbnail}>
                    <Image
                      source={{
                        uri: "https://via.placeholder.com/120x90?text=Course",
                      }}
                      style={styles.compactImage}
                    />
                    <View
                      style={[
                        styles.compactStatusBadge,
                        {
                          backgroundColor: getStatusColor(course.status),
                        },
                      ]}
                    >
                      <Text style={styles.compactStatusText}>
                        {getStatusInVietnamese(course.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Content */}
                  <View style={styles.compactContent}>
                    {/* Title & Coach */}
                    <Text style={styles.compactTitle} numberOfLines={1}>
                      {course.name}
                    </Text>
                    <Text style={styles.compactCoach} numberOfLines={1}>
                      {course.createdBy?.fullName || "Huấn luyện viên"}
                    </Text>

                    {/* Progress Bar */}
                    <View style={styles.compactProgressTrack}>
                      <View
                        style={[
                          styles.compactProgressFill,
                          { width: `${progress}%` },
                        ]}
                      />
                    </View>

                    {/* Info Row - Compact */}
                    <View style={styles.compactInfoRow}>
                      <Text style={styles.compactInfo}>
                        {getLevelInVietnamese(course.level)}
                      </Text>
                      <Text style={styles.compactInfo}>
                        {course.totalSessions} buổi
                      </Text>
                      <Text style={styles.compactInfo}>
                        {Math.round(progress)}%
                      </Text>
                    </View>

                    {/* Dates Row - Compact */}
                    <View style={styles.compactDatesRow}>
                      <Text style={styles.compactDate} numberOfLines={1}>
                        <Text style={styles.compactDateLabel}>Từ: </Text>
                        {formatDate(course.startDate)}
                        {course.endDate && (
                          <>
                            <Text style={styles.compactDateLabel}> - Đến: </Text>
                            {formatDate(course.endDate)}
                          </>
                        )}
                      </Text>
                    </View>
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
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  headerSection: {
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  container: { padding: 12, gap: 10, paddingBottom: 20 },

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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  exploreCourseText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },

  /* Summary Card - Compact */
  summaryCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  summaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: "#DCFCE7",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  summaryLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#C6F6D5",
  },

  /* Filter Container */
  filterContainer: {
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 0,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterTabActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },

  /* Compact Card */
  compactCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
    gap: 10,
    padding: 10,
  },
  compactThumbnail: {
    position: "relative",
    width: 100,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    flexShrink: 0,
  },
  compactImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E7EB",
  },
  compactStatusBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  compactStatusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  compactContent: {
    flex: 1,
    justifyContent: "space-between",
    gap: 4,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  compactCoach: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  compactProgressTrack: {
    height: 5,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
    marginVertical: 4,
  },
  compactProgressFill: {
    height: 5,
    backgroundColor: "#059669",
    borderRadius: 2,
  },
  compactInfoRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  compactInfo: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "600",
  },

  /* Compact Dates Row */
  compactDatesRow: {
    marginTop: 2,
  },
  compactDate: {
    fontSize: 9,
    color: "#6B7280",
    fontWeight: "500",
  },
  compactDateLabel: {
    fontWeight: "600",
    color: "#374151",
  },
});
