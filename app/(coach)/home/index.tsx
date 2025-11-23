import coachService from "@/services/coach.service";
import storageService from "@/services/storageService";
import { User } from "@/types/user";
import { formatPrice } from "@/utils/priceFormat";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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

const { width } = Dimensions.get("window");

export default function CoachHomeScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [revenue, setRevenue] = useState<number>(0);
  const [revenueGrowth, setRevenueGrowth] = useState<number | null>(null);

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

  const loadData = useCallback(async () => {
    const user = await storageService.getUser();
    setUser(user);
    setLoadingSessions(true);
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const dateStr = getTodayDate();

      const [sessionsData, revenueData] = await Promise.all([
        sessionService.getSessionsForWeeklyCalendar({
          startDate: dateStr,
          endDate: dateStr,
        }),
        user?.id
          ? coachService.getMonthlyRevenue(user.id, month, year)
          : Promise.resolve(null),
      ]);

      setSessions(sessionsData);

      if (revenueData && revenueData.data.length > 0) {
        setRevenue(revenueData.data[0].data);
        setRevenueGrowth(revenueData.data[0].increaseFromLastMonth ?? null);
      }
    } catch (error) {
      console.error("❌ Failed to load data:", error);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

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

      {/* Header Background */}
      <LinearGradient
        colors={["#059669", "#10B981"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeLabel}>Chào mừng trở lại,</Text>
            <Text style={styles.welcomeName}>{user?.fullName} 👋</Text>
          </View>
          <View style={styles.profileImageContainer}>
            {/* Placeholder for profile image or avatar */}
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>{user?.fullName}</Text>
            </View>
            <View style={styles.onlineBadge} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80,
          paddingTop: 20,
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
        {/* Main Stats Grid */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Tổng quan</Text>
          <View style={styles.statsGrid}>
            {/* Row 1 */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View
                  style={[styles.iconContainer, { backgroundColor: "#DBEAFE" }]}
                >
                  <Ionicons name="cash-outline" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.statCardLabel}>Thu nhập</Text>
                <Text style={styles.statCardValue}>{formatPrice(revenue)}</Text>
                {revenueGrowth !== null && (
                  <View style={styles.trendBadge}>
                    <Ionicons
                      name={
                        revenueGrowth >= 0 ? "trending-up" : "trending-down"
                      }
                      size={12}
                      color={revenueGrowth >= 0 ? "#059669" : "#EF4444"}
                    />
                    <Text
                      style={[
                        styles.trendText,
                        { color: revenueGrowth >= 0 ? "#059669" : "#EF4444" },
                      ]}
                    >
                      {revenueGrowth > 0 ? "+" : ""}
                      {revenueGrowth}%
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.statCard}>
                <View
                  style={[styles.iconContainer, { backgroundColor: "#FEF3C7" }]}
                >
                  <Ionicons name="star-outline" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.statCardLabel}>Đánh giá</Text>
                <Text style={styles.statCardValue}>4.8</Text>
                <View style={styles.trendBadge}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={[styles.trendText, { color: "#F59E0B" }]}>
                    Top 10%
                  </Text>
                </View>
              </View>
            </View>

            {/* Row 2 */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View
                  style={[styles.iconContainer, { backgroundColor: "#D1FAE5" }]}
                >
                  <Ionicons name="book-outline" size={24} color="#10B981" />
                </View>
                <Text style={styles.statCardLabel}>Khóa học</Text>
                <Text style={styles.statCardValue}>8</Text>
                <View style={styles.trendBadge}>
                  <Ionicons name="add" size={12} color="#059669" />
                  <Text style={styles.trendText}>+2 mới</Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View
                  style={[styles.iconContainer, { backgroundColor: "#E0E7FF" }]}
                >
                  <Ionicons name="people-outline" size={24} color="#6366F1" />
                </View>
                <Text style={styles.statCardLabel}>Học viên</Text>
                <Text style={styles.statCardValue}>45</Text>
                <View style={styles.trendBadge}>
                  <Ionicons name="trending-up" size={12} color="#059669" />
                  <Text style={styles.trendText}>+5 mới</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
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
                style={styles.sessionCard}
                onPress={() => router.push(`/(coach)/calendar` as any)}
                activeOpacity={0.7}
              >
                <View style={styles.sessionTimeContainer}>
                  <Text style={styles.sessionStartTime}>
                    {session.startTime}
                  </Text>
                  <View style={styles.sessionTimeLine} />
                  <Text style={styles.sessionEndTime}>{session.endTime}</Text>
                </View>

                <View style={styles.sessionInfoContainer}>
                  <View style={styles.sessionHeaderRow}>
                    <Text style={styles.sessionCourseName} numberOfLines={1}>
                      {session.courseName}
                    </Text>
                    <View
                      style={[
                        styles.sessionStatusBadge,
                        { backgroundColor: "#ECFDF5" }, // Dynamic color based on status if available
                      ]}
                    >
                      <Text
                        style={[styles.sessionStatusText, { color: "#059669" }]}
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
                        size={14}
                        color="#6B7280"
                      />
                      <Text style={styles.sessionDetailText} numberOfLines={1}>
                        Sân 1 - Khu A
                      </Text>
                    </View>
                    {session.course?.currentParticipants != null && (
                      <View style={styles.sessionDetailItem}>
                        <Ionicons
                          name="people-outline"
                          size={14}
                          color="#6B7280"
                        />
                        <Text style={styles.sessionDetailText}>
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
                }} // Placeholder or local asset
                style={styles.emptyStateImage}
                resizeMode="contain"
              />
              <Text style={styles.emptyStateText}>
                Không có lịch dạy hôm nay
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Tận hưởng ngày nghỉ của bạn nhé!
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <TouchableOpacity style={styles.createCourseButton}>
            <LinearGradient
              colors={["#059669", "#047857"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createCourseGradient}
            >
              <View style={styles.createCourseContent}>
                <View style={styles.createCourseIcon}>
                  <Ionicons name="add" size={24} color="#059669" />
                </View>
                <View>
                  <Text style={styles.createCourseTitle}>Tạo khóa học mới</Text>
                  <Text style={styles.createCourseSubtitle}>
                    Thiết lập lớp học và lịch trình
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
