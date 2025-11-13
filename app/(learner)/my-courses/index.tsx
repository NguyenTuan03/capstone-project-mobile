import { get } from "@/services/http/httpService";
import type { Course, CoursesResponse } from "@/types/course";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
    <SafeAreaView
      style={[
        styles.safe,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 50 },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>Khóa học của tôi</Text>

        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        ) : courses.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: "#6B7280", fontSize: 14 }}>
              Bạn chưa có khóa học nào
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <Text style={{ color: "#6B7280", fontSize: 12 }}>
              Tổng khóa học: {pagination.total}
            </Text>
            {courses.map((course) => {
              const progress = 0; // TODO: Calculate from completed sessions
              const progressPercent = Math.round(progress * 100);

              return (
                <TouchableOpacity
                  key={course.id}
                  style={[styles.card, { padding: 0, overflow: "hidden" }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    // TODO: Navigate to course detail
                    // router.push(`/(learner)/courses/${course.id}`);
                  }}
                >
                  <Image
                    source={{
                      uri: "https://via.placeholder.com/400x160?text=Course",
                    }}
                    style={styles.cover}
                  />
                  <View style={{ padding: 16, gap: 8 }}>
                    <Text style={styles.courseTitle}>{course.name}</Text>
                    <Text style={styles.courseCoach}>
                      {course.createdBy?.fullName || "Huấn luyện viên"}
                    </Text>

                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Tiến độ</Text>
                      <Text style={styles.progressPercent}>
                        {progressPercent}%
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progressPercent}%` },
                        ]}
                      />
                    </View>

                    <Text style={styles.sessionCount}>
                      {course.totalSessions || 0} buổi học
                    </Text>

                    <View style={{ marginTop: 8 }}>
                      <Text style={{ color: "#6B7280", fontSize: 12 }}>
                        Ngày bắt đầu: {formatDate(course.startDate)}
                      </Text>
                      <Text style={{ color: "#6B7280", fontSize: 12 }}>
                        Ngày kết thúc: {formatDate(course.endDate)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.primaryBtn}
                      activeOpacity={0.9}
                      onPress={() =>
                        router.push(`/(learner)/my-courses/${course.id}`)
                      }
                    >
                      <Text style={styles.primaryBtnText}>Xem chi tiết</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 16, gap: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  pageTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  cover: { width: "100%", height: 128, backgroundColor: "#E5E7EB" },
  courseTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  courseCoach: { color: "#6B7280", fontSize: 12 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { color: "#6B7280", fontSize: 12 },
  progressPercent: { color: "#10B981", fontWeight: "700" },
  progressTrack: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: 8, backgroundColor: "#10B981", borderRadius: 999 },
  sessionCount: { color: "#6B7280", fontSize: 12 },
  primaryBtn: {
    backgroundColor: "#10B981",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
});
