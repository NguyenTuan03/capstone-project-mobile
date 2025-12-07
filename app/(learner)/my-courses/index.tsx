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
          <View style={{ gap: 8 }}>
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

            {/* Course Cards - Modern Horizontal Layout */}
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
                  {/* Horizontal Layout: Image Left, Content Right */}
                  <View style={styles.cardRow}>
                    {/* Left: Image & Status Badge */}
                    <View style={styles.imageSection}>
                      {course.publicUrl ? (
                        <Image
                          source={{ uri: course.publicUrl }}
                          style={styles.cardImage}
                        />
                      ) : (
                        <View style={styles.cardImagePlaceholder}>
                          <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                        </View>
                      )}
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
                    <View style={styles.contentSection}>
                      {/* Title & Level Badge */}
                      <View style={styles.titleRow}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {course.name}
                        </Text>
                        <View style={styles.levelBadge}>
                          <Text style={styles.levelText}>
                            {getLevelInVietnamese(course.level)}
                          </Text>
                        </View>
                      </View>

                      {/* Coach Info */}
                      <View style={styles.coachRow}>
                        <Ionicons name="person-outline" size={11} color="#6B7280" />
                        <Text style={styles.coachName} numberOfLines={1}>
                          {course.createdBy?.fullName || "N/A"}
                        </Text>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.progressWrapper}>
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              { width: `${progress}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {Math.round(progress)}%
                        </Text>
                      </View>

                      {/* Footer: Participants, Sessions, Format */}
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <Ionicons name="people" size={10} color="#059669" />
                          <Text style={styles.metaText}>
                            {course.currentParticipants}/{course.maxParticipants}
                          </Text>
                        </View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaItem}>
                          <Ionicons name="calendar" size={10} color="#6B7280" />
                          <Text style={styles.metaText}>
                            {course.totalSessions} buổi
                          </Text>
                        </View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaItem}>
                          <Ionicons
                            name={course.learningFormat === "GROUP" ? "people-outline" : "person-outline"}
                            size={10}
                            color="#6B7280"
                          />
                          <Text style={styles.metaText}>
                            {getLearningFormatInVietnamese(course.learningFormat)}
                          </Text>
                        </View>
                      </View>

                      {/* Dates */}
                      <View style={styles.dateRow}>
                        <View style={styles.dateItem}>
                          <Ionicons name="play-circle-outline" size={10} color="#059669" />
                          <Text style={styles.dateText}>
                            {formatDate(course.startDate)}
                          </Text>
                        </View>
                        {course.endDate && (
                          <>
                            <Text style={styles.dateArrow}>→</Text>
                            <View style={styles.dateItem}>
                              <Ionicons name="flag-outline" size={10} color="#EF4444" />
                              <Text style={styles.dateText}>
                                {formatDate(course.endDate)}
                              </Text>
                            </View>
                          </>
                        )}
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
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  headerSection: {
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  container: { padding: 12, gap: 10, paddingBottom: 20 },

  /* Empty State */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 19,
  },
  exploreCourseBtn: {
    flexDirection: "row",
    backgroundColor: "#059669",
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  exploreCourseText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.2,
  },

  /* Filter Container */
  filterContainer: {
    marginBottom: 6,
  },
  filterScroll: {
    paddingRight: 12,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterTabActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  /* Horizontal Card Layout */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardRow: {
    flexDirection: "row",
    gap: 10,
  },
  imageSection: {
    position: "relative",
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    right: 4,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    alignItems: "center",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  contentSection: {
    flex: 1,
    justifyContent: "space-between",
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 18,
  },
  levelBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  levelText: {
    fontSize: 9,
    color: "#059669",
    fontWeight: "700",
  },
  coachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  coachName: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  progressWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#059669",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "700",
    minWidth: 32,
    textAlign: "right",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    gap: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flex: 1,
  },
  metaText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#D1D5DB",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  dateText: {
    fontSize: 9,
    color: "#6B7280",
    fontWeight: "600",
  },
  dateArrow: {
    fontSize: 10,
    color: "#D1D5DB",
    marginHorizontal: 2,
  },
});
