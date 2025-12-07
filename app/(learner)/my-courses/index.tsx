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
                  {/* Top: Image & Status */}
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

                  {/* Bottom: Content */}
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
                          {getLearningFormatInVietnamese(course.learningFormat)}
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

                    {/* Participants & Sessions */}
                    <View style={styles.infoBar}>
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="people"
                          size={13}
                          color="#059669"
                          style={{ marginRight: 3 }}
                        />
                        <Text style={styles.infoText}>
                          {course.currentParticipants}/{course.maxParticipants}
                        </Text>
                      </View>
                      <View style={styles.infoDivider} />
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color="#6B7280"
                          style={{ marginRight: 3 }}
                        />
                        <Text style={styles.infoText} numberOfLines={1}>
                          {course.totalSessions} buổi
                        </Text>
                      </View>
                    </View>

                    {/* Footer: Start & End Date */}
                    <View style={styles.cardFooter}>
                      <View style={styles.footerItem}>
                        <Ionicons
                          name="play-circle-outline"
                          size={12}
                          color="#059669"
                        />
                        <Text style={styles.footerText}>
                          {formatDate(course.startDate)}
                        </Text>
                      </View>
                      {course.endDate && (
                        <>
                          <View style={styles.footerDivider} />
                          <View style={styles.footerItem}>
                            <Ionicons
                              name="stop-circle-outline"
                              size={12}
                              color="#EF4444"
                            />
                            <Text style={styles.footerText}>
                              {formatDate(course.endDate)}
                            </Text>
                          </View>
                        </>
                      )}
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    gap: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
  },
  container: { padding: 16, gap: 14, paddingBottom: 30 },

  /* Empty State */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 21,
  },
  exploreCourseBtn: {
    flexDirection: "row",
    backgroundColor: "#059669",
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  exploreCourseText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.2,
  },

  /* Filter Container */
  filterContainer: {
    marginBottom: 10,
  },
  filterScroll: {
    paddingRight: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 0.5,
  },
  filterTabActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
    shadowColor: "#059669",
    shadowOpacity: 0.2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  /* Premium Card */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
    flexDirection: "column",
  },
  cardImageContainer: {
    position: "relative",
    width: "100%",
    height: 160,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E7EB",
  },
  statusBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    backdropFilter: "blur(4px)",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cardContent: {
    padding: 12,
    gap: 6,
    width: "100%",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  tagContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 22,
    marginBottom: 6,
  },
  coachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 12,
  },
  coachName: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  progressSection: {
    gap: 8,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  progressValue: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "800",
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
    borderTopColor: "#F9FAFB",
    paddingTop: 10,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  footerText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  infoDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#D1FAE5",
    marginHorizontal: 8,
  },
  footerDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 6,
  },
});
