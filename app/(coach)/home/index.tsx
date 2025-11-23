import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import sessionService from "../../../services/sessionService";
import { CalendarSession } from "../../../types/session";

export default function CoachHomeScreen() {
  const insets = useSafeAreaInsets();

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

  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const loadTodaySessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const today = getTodayDate();
      const data = await sessionService.getSessionsForWeeklyCalendar({
        startDate: today,
        endDate: today,
      });
      setSessions(data);
    } catch (error) {
      console.error("❌ Failed to load today's sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  }, []);
  useEffect(() => {
    loadTodaySessions();
  }, [loadTodaySessions]);
  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 50 },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      <ScrollView style={styles.scrollView}>
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <View>
              <Text style={styles.welcomeText}>Chào mừng trở lại,</Text>
              <Text style={styles.welcomeName}>Lại Đức Hùng! 👋</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={16} color="#FCD34D" />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>
          <Text style={styles.welcomeSubtext}>
            Hôm nay bạn có{" "}
            <Text style={styles.highlightText}>{sessions.length} buổi học</Text>
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Đang hoạt động</Text>
            </View>
            <Text style={styles.dateText}>{formatDisplayDate()}</Text>
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View
              style={[styles.statIconContainer, { backgroundColor: "#DBEAFE" }]}
            >
              <Ionicons name="person" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statLabel}>Tổng học viên</Text>
            <Text style={styles.statValue}>45</Text>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>+8%</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View
              style={[styles.statIconContainer, { backgroundColor: "#D1FAE5" }]}
            >
              <Ionicons name="book" size={24} color="#10B981" />
            </View>
            <Text style={styles.statLabel}>Khóa học đang có</Text>
            <Text style={styles.statValue}>8</Text>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>+2</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View
              style={[styles.statIconContainer, { backgroundColor: "#FEF3C7" }]}
            >
              <Ionicons name="cash" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statLabel}>Thu nhập tháng này</Text>
            <Text style={styles.statValue}>15.5M</Text>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>+12%</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View
              style={[styles.statIconContainer, { backgroundColor: "#D1FAE5" }]}
            >
              <Ionicons name="star" size={24} color="#10B981" />
            </View>
            <Text style={styles.statLabel}>Đánh giá TB</Text>
            <Text style={styles.statValue}>4.8/5</Text>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>+0.2</Text>
            </View>
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="calendar" size={20} color="#059669" />
              <Text style={styles.sectionTitle}>Lịch dạy hôm nay</Text>
              <Text style={styles.sectionCount}>
                {sessions.length} buổi học
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(coach)/calendar")}>
              <Text style={styles.viewAllText}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>

          {loadingSessions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={styles.loadingText}>Đang tải lịch học...</Text>
            </View>
          ) : sessions.length > 0 ? (
            sessions.map((session) => (
              <View key={session.id} style={styles.classCard}>
                <View style={styles.classHeader}>
                  <View style={styles.classAvatar}>
                    <Text style={styles.classAvatarText}>
                      {session.courseName?.substring(0, 3).toUpperCase() ||
                        "---"}
                    </Text>
                  </View>
                  <View style={styles.classInfo}>
                    <Text style={styles.className}>{session.courseName}</Text>
                    <View style={styles.classDetails}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.classTime}>
                        {session.startTime} - {session.endTime}
                      </Text>
                      {session.course?.currentParticipants != null && (
                        <>
                          <Ionicons
                            name="people-outline"
                            size={14}
                            color="#6B7280"
                            style={{ marginLeft: 8 }}
                          />
                          <Text style={styles.classTime}>
                            {session.course.currentParticipants} người
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.classActions}>
                  <TouchableOpacity
                    style={styles.detailButton}
                    onPress={() => router.push(`/(coach)/calendar` as any)}
                  >
                    <Text style={styles.detailButtonText}>Chi tiết</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                Không có buổi học hôm nay
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Hãy nghỉ ngơi và chuẩn bị cho ngày mai!
              </Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="flash" size={20} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Thống kê nhanh</Text>
          </View>

          <View style={styles.quickStatsCard}>
            <View style={styles.quickStatRow}>
              <Text style={styles.quickStatLabel}>Tuần này</Text>
              <Text style={styles.quickStatValue}>12 buổi học</Text>
            </View>
            <View style={styles.quickStatRow}>
              <Text style={styles.quickStatLabel}>Doanh thu</Text>
              <Text style={styles.quickStatValue}>8.5M VND</Text>
            </View>
            <View style={styles.quickStatRow}>
              <Text style={styles.quickStatLabel}>Học viên mới</Text>
              <Text style={styles.quickStatValue}>+5</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.createButton}>
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Tạo khóa học mới</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    flex: 1,
  },
  welcomeCard: {
    margin: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#059669",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: "#E0F2FE",
    marginBottom: 2,
  },
  welcomeName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  welcomeSubtext: {
    fontSize: 14,
    color: "#E0F2FE",
    marginBottom: 12,
  },
  settingsButton: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingsButtonText: {
    color: "#059669",
    fontWeight: "600",
    flex: 1,
  },

  welcomeContent: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
    marginRight: 8,
  },
  statusDate: {
    fontSize: 12,
    color: "#E0F2FE",
  },
  ratingCard: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 100,
  },
  ratingScore: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  ratingLabel: {
    fontSize: 12,
    color: "#E0F2FE",
    marginTop: 4,
    marginBottom: 8,
  },
  stars: {
    flexDirection: "row",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  statBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statBadgeText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  sectionContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 8,
  },
  sectionCount: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },
  classCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  classHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  classAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  classAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  classDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  classTime: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  classActions: {
    flexDirection: "row",
    gap: 8,
  },
  joinButton: {
    flex: 1,
    backgroundColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  detailButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  detailButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  quickStatsCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  quickStatLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  highlightText: {
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  dateText: {
    fontSize: 11,
    color: "#E0F2FE",
  },
  createButton: {
    margin: 16,
    backgroundColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
});
