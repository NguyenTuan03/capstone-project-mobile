import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import sessionService from "../../../services/sessionService";
import { CalendarSession } from "../../../types/session";

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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

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
    <SafeAreaView
      style={[
        styles.safe,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 50 },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Welcome Card */}
        <View style={[styles.card, styles.welcomeCard]}>
          <View style={styles.welcomeRow}>
            <View>
              <Text style={styles.welcomeTitle}>Chào mừng trở lại!</Text>
              <Text style={styles.welcomeSubtitle}>
                Tiếp tục hành trình Pickleball của bạn
              </Text>
            </View>
            {/* <View style={styles.streakBox}>
              <Text style={styles.streakNumber}>7</Text>
              <Text style={styles.streakText}>ngày liên tục</Text>
            </View> */}
          </View>
        </View>

        {/* Quick Stats */}
        {/* <View style={styles.statsRow}>
          <View style={[styles.card, styles.statCard]}>
            <View style={styles.statIcon} />
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Khóa học</Text>
          </View>
          <View style={[styles.card, styles.statCard]}>
            <View style={[styles.statIcon, { backgroundColor: "#DCFCE7" }]} />
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Giờ tập</Text>
          </View>
        </View>

        {/* AI Analysis Quick */}
        {/* <View style={[styles.card, styles.aiCard]}>
          <View style={styles.aiRow}>
            <View style={styles.aiIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>Phân tích kỹ thuật AI</Text>
              <Text style={styles.aiSub}>
                2 video đã phân tích • Xem chi tiết
              </Text>
            </View>
          </View>
        </View>  */}

        {/* Today's Sessions */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Buổi học hôm nay</Text>
            <TouchableOpacity
              onPress={() => router.push("/(learner)/my-courses")}
            >
              <Text style={styles.viewAllText}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>

          {loadingSessions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#10B981" />
              <Text style={styles.loadingText}>Đang tải buổi học...</Text>
            </View>
          ) : sessions.length > 0 ? (
            sessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionItem}
                onPress={() =>
                  router.push(
                    `/(learner)/my-courses/${session.courseId}` as any
                  )
                }
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionTitle}>{session.courseName}</Text>
                  <Text style={styles.sessionCoach}>Buổi {session.name}</Text>
                  <View style={styles.sessionMetaRow}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.sessionMeta}>
                      {session.startTime} - {session.endTime}
                    </Text>
                    {session.course?.court?.name && (
                      <>
                        <Text style={styles.sessionMeta}>•</Text>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#6B7280"
                        />
                        <Text style={styles.sessionMeta}>
                          {session.course.court.name}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                Không có buổi học hôm nay
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Hãy nghỉ ngơi và chuẩn bị cho các buổi học sắp tới!
              </Text>
            </View>
          )}
        </View>
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
  welcomeCard: { backgroundColor: "#10B981", borderColor: "#10B981" },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  welcomeSubtitle: { color: "#ECFDF5", marginTop: 4 },
  streakBox: { alignItems: "center" },
  streakNumber: { color: "#fff", fontSize: 22, fontWeight: "800" },
  streakText: { color: "#fff", fontSize: 11 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, alignItems: "center" },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
    marginBottom: 8,
  },
  statNumber: { fontSize: 18, fontWeight: "700", color: "#111827" },
  statLabel: { color: "#6B7280", fontSize: 12 },
  aiCard: { backgroundColor: "#F3E8FF", borderColor: "#E9D5FF" },
  aiRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#9333EA",
  },
  aiTitle: { color: "#581C87", fontWeight: "700" },
  aiSub: { color: "#7C3AED", fontSize: 12, marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sessionTitle: { color: "#111827", fontWeight: "600" },
  sessionCoach: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  sessionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  sessionMeta: { color: "#6B7280", fontSize: 12 },
  chev: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#D1D5DB" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllText: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B7280",
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
  },
});
