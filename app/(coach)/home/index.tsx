import CreateEditCourseModal from "@/components/coach/course/modal/CreateEditCourseModal";
import coachService from "@/services/coach.service";
import { post } from "@/services/http/httpService";
import storageService from "@/services/storageService";
import { User } from "@/types/user";
import { formatPrice } from "@/utils/priceFormat";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import sessionService from "../../../services/sessionService";
import { CalendarSession, SessionStatus } from "../../../types/session";

export default function CoachHomeScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [revenue, setRevenue] = useState<number>(0);
  const [revenueGrowth, setRevenueGrowth] = useState<number | null>(null);
  const [courseCount, setCourseCount] = useState<number>(0);
  const [courseGrowth, setCourseGrowth] = useState<number | null>(null);
  const [learnerCount, setLearnerCount] = useState<number>(0);
  const [learnerGrowth, setLearnerGrowth] = useState<number | null>(null);
  const [rating, setRating] = useState<{
    overall: number;
    total: number;
  } | null>(null);

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  // Helper function to format date for display
  const formatDisplayDate = () => {
    const days = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    const months = [
      "tháng 1",
      "tháng 2",
      "tháng 3",
      "tháng 4",
      "tháng 5",
      "tháng 6",
      "tháng 7",
      "tháng 8",
      "tháng 9",
      "tháng 10",
      "tháng 11",
      "tháng 12",
    ];
    const today = new Date();
    return `${days[today.getDay()]}, ${today.getDate()} ${
      months[today.getMonth()]
    }, ${today.getFullYear()}`;
  };

  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);

  const loadData = useCallback(async () => {
    const user = await storageService.getUser();
    setUser(user);
    setLoadingSessions(true);
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const dateStr = getTodayDate();

      const [sessionsData, revenueData, courseData, learnerData, ratingData] =
        await Promise.all([
          sessionService.getSessionsForWeeklyCalendar({
            startDate: dateStr,
            endDate: dateStr,
          }),
          user?.id
            ? coachService.getMonthlyRevenue(user.id, month, year)
            : Promise.resolve(null),
          user?.id
            ? coachService.getMonthlyCourseCount(user.id, month, year)
            : Promise.resolve(null),
          user?.id
            ? coachService.getMonthlyLearnerCount(user.id, month, year)
            : Promise.resolve(null),
          user?.id ? coachService.loadRating(user.id) : Promise.resolve(null),
        ]);

      setSessions(sessionsData);

      if (revenueData && revenueData.data.length > 0) {
        setRevenue(revenueData.data[0].data);
        setRevenueGrowth(revenueData.data[0].increaseFromLastMonth ?? null);
      }
      if (courseData && courseData.data.length > 0) {
        setCourseCount(courseData.data[0].data);
        setCourseGrowth(courseData.data[0].increaseFromLastMonth ?? null);
      }
      if (learnerData && learnerData.data.length > 0) {
        setLearnerCount(learnerData.data[0].data);
        setLearnerGrowth(learnerData.data[0].increaseFromLastMonth ?? null);
      }
      if (ratingData) {
        setRating(ratingData);
      }
    } catch {
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleCreateCourse = async (data: {
    subjectId: number;
    learningFormat: string;
    minParticipants: number;
    maxParticipants: number;
    pricePerParticipant: number;
    startDate: string;
    court?: number | undefined;
    schedules?: any[];
    courseImage?: {
      uri: string;
      fileName?: string;
      mimeType?: string;
    };
  }) => {
    try {
      const { subjectId, courseImage, ...payload } = data;

      if (courseImage) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (Array.isArray(value) || typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        });

        formData.append("course_image", {
          uri: courseImage.uri,
          name:
            courseImage.fileName ||
            courseImage.uri.split("/").pop() ||
            `course_${Date.now()}.jpg`,
          type: courseImage.mimeType || "image/jpeg",
        } as any);

        await post(`/v1/courses/subjects/${subjectId}`, formData);
      } else {
        await post(`/v1/courses/subjects/${subjectId}`, payload);
      }

      Alert.alert("Thành công", "Tạo khóa học thành công!", [
        {
          text: "OK",
          onPress: () => {
            setShowCreateCourseModal(false);
            router.push("/(coach)/course");
          },
        },
      ]);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Không thể tạo khóa học. Vui lòng thử lại.";
      Alert.alert("Lỗi", errorMessage);
      throw error;
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header - compact, modern, mobile-first */}
      <LinearGradient
        colors={["#059669", "#10B981"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.headerGradient,
          { paddingTop: insets.top + 16, paddingBottom: 18 },
        ]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeLabel}>Chào mừng trở lại,</Text>
            <Text style={styles.welcomeName} numberOfLines={1}>
              {user?.fullName}
            </Text>
          </View>
          <View style={styles.profileImageContainer}>
            {user?.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.profileAvatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.profileAvatar}>
                <Text style={styles.profileInitials}>
                  {user?.fullName
                    ? user.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "?"}
                </Text>
              </View>
            )}
            <View style={styles.onlineBadge} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 60,
          paddingTop: 12,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#059669"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats - compact grid, modern cards */}
        <View style={[styles.sectionContainer, { marginBottom: 14 }]}>
          <Text style={styles.sectionTitle}>Tổng quan</Text>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View
                style={[
                  styles.statCard,
                  { minWidth: 140, padding: 12, borderRadius: 12 },
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: "#DBEAFE",
                      marginBottom: 8,
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                    },
                  ]}
                >
                  <Ionicons name="cash-outline" size={18} color="#3B82F6" />
                </View>
                <Text
                  style={[
                    styles.statCardLabel,
                    { fontSize: 11, marginBottom: 2 },
                  ]}
                >
                  Thu nhập
                </Text>
                <Text
                  style={[
                    styles.statCardValue,
                    { fontSize: 15, marginBottom: 4 },
                  ]}
                >
                  {formatPrice(revenue)}
                </Text>
                {revenueGrowth !== null && (
                  <View
                    style={[
                      styles.trendBadge,
                      {
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        revenueGrowth >= 0 ? "trending-up" : "trending-down"
                      }
                      size={10}
                      color={revenueGrowth >= 0 ? "#059669" : "#EF4444"}
                    />
                    <Text
                      style={[
                        styles.trendText,
                        {
                          color: revenueGrowth >= 0 ? "#059669" : "#EF4444",
                          fontSize: 10,
                        },
                      ]}
                    >
                      {revenueGrowth > 0 ? "+" : ""}
                      {revenueGrowth}%
                    </Text>
                  </View>
                )}
              </View>
              <View
                style={[
                  styles.statCard,
                  { minWidth: 140, padding: 12, borderRadius: 12 },
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: "#FEF3C7",
                      marginBottom: 8,
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                    },
                  ]}
                >
                  <Ionicons name="star-outline" size={18} color="#F59E0B" />
                </View>
                <Text
                  style={[
                    styles.statCardLabel,
                    { fontSize: 11, marginBottom: 2 },
                  ]}
                >
                  Đánh giá
                </Text>
                <Text
                  style={[
                    styles.statCardValue,
                    { fontSize: 15, marginBottom: 4 },
                  ]}
                >
                  {rating?.overall}
                </Text>
                <View
                  style={[
                    styles.trendBadge,
                    {
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    },
                  ]}
                >
                  <Ionicons name="star" size={10} color="#F59E0B" />
                  <Text
                    style={[
                      styles.trendText,
                      { color: "#F59E0B", fontSize: 10 },
                    ]}
                  >
                    {rating?.total}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View
                style={[
                  styles.statCard,
                  { minWidth: 140, padding: 12, borderRadius: 12 },
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: "#D1FAE5",
                      marginBottom: 8,
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                    },
                  ]}
                >
                  <Ionicons name="book-outline" size={18} color="#10B981" />
                </View>
                <Text
                  style={[
                    styles.statCardLabel,
                    { fontSize: 11, marginBottom: 2 },
                  ]}
                >
                  Khóa học
                </Text>
                <Text
                  style={[
                    styles.statCardValue,
                    { fontSize: 15, marginBottom: 4 },
                  ]}
                >
                  {courseCount}
                </Text>
                {courseGrowth && (
                  <View
                    style={[
                      styles.trendBadge,
                      {
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                      },
                    ]}
                  >
                    <Ionicons name="add" size={10} color="#059669" />
                    <Text style={[styles.trendText, { fontSize: 10 }]}>
                      {courseGrowth}
                    </Text>
                  </View>
                )}
              </View>
              <View
                style={[
                  styles.statCard,
                  { minWidth: 140, padding: 12, borderRadius: 12 },
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: "#E0E7FF",
                      marginBottom: 8,
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                    },
                  ]}
                >
                  <Ionicons name="people-outline" size={18} color="#6366F1" />
                </View>
                <Text
                  style={[
                    styles.statCardLabel,
                    { fontSize: 11, marginBottom: 2 },
                  ]}
                >
                  Học viên
                </Text>
                <Text
                  style={[
                    styles.statCardValue,
                    { fontSize: 15, marginBottom: 4 },
                  ]}
                >
                  {learnerCount}
                </Text>
                {learnerGrowth && (
                  <View
                    style={[
                      styles.trendBadge,
                      {
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                      },
                    ]}
                  >
                    <Ionicons name="trending-up" size={10} color="#059669" />
                    <Text style={[styles.trendText, { fontSize: 10 }]}>
                      {learnerGrowth}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Today's Schedule - compact, modern */}
        <View style={[styles.sectionContainer, { marginBottom: 14 }]}>
          <View style={[styles.sectionHeader, { marginBottom: 10 }]}>
            <View>
              <Text style={styles.sectionTitle}>Lịch dạy hôm nay</Text>
              <View style={styles.subtitleRow}>
                <Text style={styles.sectionSubtitle}>
                  {formatDisplayDate()}
                </Text>
                <View style={styles.dotSeparator} />
                <Text style={styles.sessionCountText}>
                  {sessions.length} buổi
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push("/(coach)/calendar")}>
              <Text style={styles.viewAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {loadingSessions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={styles.loadingText}>Đang tải lịch học...</Text>
            </View>
          ) : sessions.length > 0 ? (
            sessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={[
                  styles.sessionCard,
                  { padding: 12, borderRadius: 12, marginBottom: 8 },
                ]}
                onPress={() => router.push(`/(coach)/calendar` as any)}
                activeOpacity={0.7}
              >
                <View style={styles.sessionTimeContainer}>
                  <Text style={[styles.sessionStartTime, { fontSize: 13 }]}>
                    {session.startTime}
                  </Text>
                  <View style={styles.sessionTimeLine} />
                  <Text style={[styles.sessionEndTime, { fontSize: 11 }]}>
                    {session.endTime}
                  </Text>
                </View>
                <View style={styles.sessionInfoContainer}>
                  <View style={styles.sessionHeaderRow}>
                    <Text
                      style={[styles.sessionCourseName, { fontSize: 14 }]}
                      numberOfLines={1}
                    >
                      {session.courseName}
                    </Text>
                    <View
                      style={[
                        styles.sessionStatusBadge,
                        {
                          borderRadius: 6,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          backgroundColor: "#ECFDF5",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sessionStatusText,
                          { color: "#059669", fontSize: 10 },
                        ]}
                      >
                        {session.status === SessionStatus.IN_PROGRESS
                          ? "Đang diễn ra"
                          : session.status === SessionStatus.COMPLETED
                          ? "Đã kết thúc"
                          : "Đang chờ"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.sessionDetailsRow}>
                    <View style={styles.sessionDetailItem}>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color="#6B7280"
                      />
                      <Text
                        style={[styles.sessionDetailText, { fontSize: 11 }]}
                        numberOfLines={1}
                      >
                        Sân 1 - Khu A
                      </Text>
                    </View>
                    {session.course?.currentParticipants != null && (
                      <View style={styles.sessionDetailItem}>
                        <Ionicons
                          name="people-outline"
                          size={12}
                          color="#6B7280"
                        />
                        <Text
                          style={[styles.sessionDetailText, { fontSize: 11 }]}
                        >
                          {session.course.currentParticipants} học viên
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Image
                source={{
                  uri: "https://img.freepik.com/free-vector/no-data-concept-illustration_114360-536.jpg",
                }}
                style={[
                  styles.emptyStateImage,
                  { width: 90, height: 90, marginBottom: 10 },
                ]}
                resizeMode="contain"
              />
              <Text
                style={[
                  styles.emptyStateText,
                  { fontSize: 13, marginBottom: 2 },
                ]}
              >
                Không có lịch dạy hôm nay
              </Text>
              <Text style={[styles.emptyStateSubtext, { fontSize: 11 }]}>
                Tận hưởng ngày nghỉ của bạn nhé!
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions - compact button */}
        <View style={[styles.sectionContainer, { marginBottom: 10 }]}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <TouchableOpacity
            style={[
              styles.createCourseButton,
              { borderRadius: 12, elevation: 3 },
            ]}
            onPress={() => setShowCreateCourseModal(true)}
          >
            <LinearGradient
              colors={["#059669", "#047857"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.createCourseGradient,
                { padding: 14, borderRadius: 12 },
              ]}
            >
              <View style={[styles.createCourseContent, { gap: 10 }]}>
                <View
                  style={[
                    styles.createCourseIcon,
                    { width: 36, height: 36, borderRadius: 8 },
                  ]}
                >
                  <Ionicons name="add" size={18} color="#059669" />
                </View>
                <View>
                  <Text
                    style={[
                      styles.createCourseTitle,
                      { fontSize: 14, marginBottom: 1 },
                    ]}
                  >
                    Tạo khóa học mới
                  </Text>
                  <Text style={[styles.createCourseSubtitle, { fontSize: 11 }]}>
                    Thiết lập lớp học và lịch trình
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Create Course Modal */}
      <CreateEditCourseModal
        visible={showCreateCourseModal}
        onClose={() => setShowCreateCourseModal(false)}
        onSubmit={handleCreateCourse}
        mode="create"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  welcomeLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  profileImageContainer: {
    position: "relative",
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  profileInitials: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#059669",
  },
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#9CA3AF",
    marginHorizontal: 8,
  },
  sessionCountText: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "600",
  },
  statsGrid: {
    gap: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statCardLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  sessionCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionTimeContainer: {
    alignItems: "center",
    marginRight: 16,
    minWidth: 50,
  },
  sessionStartTime: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
  },
  sessionTimeLine: {
    width: 2,
    height: 20,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
  },
  sessionEndTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  sessionInfoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  sessionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionCourseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  sessionStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sessionStatusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  sessionDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sessionDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sessionDetailText: {
    fontSize: 12,
    color: "#6B7280",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
  },
  emptyStateImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  createCourseButton: {
    borderRadius: 16,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  createCourseGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 16,
  },
  createCourseContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  createCourseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  createCourseTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  createCourseSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
  },
});
