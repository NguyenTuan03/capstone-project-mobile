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
                      filterStatus === "COMPLETED" &&
                        styles.filterTabTextActive,
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
            {/* Course Cards - Premium */}
            {filteredCourses.map((course) => {
              const progress = course.progressPct || 0;

              return (
                <TouchableOpacity
                  key={course.id}
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push(`/(learner)/my-courses/${course.id}`)
                  }
                >
                  <View style={styles.cardInner}>
                    {/* Left: Image & Status */}
                    <View style={styles.cardImageContainer}>
                      <Image
                        source={{
                          uri: course.publicUrl,
                        }}
                        style={styles.cardImage}
                      />
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(course.status) },
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {getStatusInVietnamese(course.status)}
                        </Text>
                      </View>
                    </View>

                    {/* Right: Content */}
                    <View style={styles.cardContent}>
                      {/* Header: Level & Type */}
                      <View style={styles.cardHeader}>
                        <View style={styles.tagContainer}>
                          <Ionicons
                            name="school-outline"
                            size={12}
                            color="#6B7280"
                          />
                          <Text style={styles.tagText}>
                            {getLevelInVietnamese(course.level)}
                          </Text>
                        </View>
                        <View style={styles.tagContainer}>
                          <Ionicons
                            name="people-outline"
                            size={12}
                            color="#6B7280"
                          />
                          <Text style={styles.tagText}>
                            {getLearningFormatInVietnamese(
                              course.learningFormat
                            )}
                          </Text>
                        </View>
                      </View>

                      {/* Title */}
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {course.name}
                      </Text>

                      {/* Coach */}
                      <View style={styles.coachRow}>
                        <Ionicons
                          name="person-circle-outline"
                          size={14}
                          color="#9CA3AF"
                        />
                        <Text style={styles.coachName} numberOfLines={1}>
                          HLV {course.createdBy?.fullName || "N/A"}
                        </Text>
                      </View>

                      {/* Progress */}
                      <View style={styles.progressSection}>
                        <View style={styles.progressRow}>
                          <Text style={styles.progressLabel}>Tiến độ</Text>
                          <Text style={styles.progressValue}>
                            {Math.round(progress)}%
                          </Text>
                        </View>
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              { width: `${progress}%` },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Footer: Date & Sessions */}
                      <View style={styles.cardFooter}>
                        <View style={styles.footerItem}>
                          <Ionicons
                            name="calendar-outline"
                            size={12}
                            color="#6B7280"
                          />
                          <Text style={styles.footerText}>
                            {formatDate(course.startDate)}
                          </Text>
                        </View>
                        <View style={styles.footerItem}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color="#6B7280"
                          />
                          <Text style={styles.footerText}>
                            {course.totalSessions} buổi
                          </Text>
                        </View>
                      </View>
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
  safe: { flex: 1, backgroundColor: "#F3F4F6" },
  headerSection: {
    backgroundColor: "#059669",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 4,
  },
  headerContent: {
    gap: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  container: { padding: 16, gap: 16, paddingBottom: 30 },

  /* Empty State */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 20,
  },
  exploreCourseBtn: {
    flexDirection: "row",
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  exploreCourseText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  /* Filter Container */
  filterContainer: {
    marginBottom: 4,
  },
  filterScroll: {
    paddingRight: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTabActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },

  /* Premium Card */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.5)",
    overflow: "hidden",
  },
  cardInner: {
    flexDirection: "row",
    padding: 12,
    gap: 14,
  },
  cardImageContainer: {
    position: "relative",
    width: 110,
    height: 130,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(4px)",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  tagContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: "#4B5563",
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 22,
    marginBottom: 4,
  },
  coachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  coachName: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  progressSection: {
    gap: 6,
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  progressValue: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "700",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#059669",
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 8,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
});
