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
import learnerService from "../../../services/learnerService";
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalAiFeedbacks, setTotalAiFeedbacks] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [progresses, setProgresses] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);

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

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [courses, feedbacks] = await Promise.all([
        learnerService.getTotalCourses(),
        learnerService.getTotalAiFeedbacks(),
      ]);
      setTotalCourses(courses);
      setTotalAiFeedbacks(feedbacks);
    } catch (error) {
      console.error("❌ Failed to load stats:", error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadProgress = useCallback(async () => {
    setLoadingProgress(true);
    try {
      const data = await learnerService.getLearnerProgresses();
      setProgresses(data);
    } catch (error) {
      console.error("❌ Failed to load progress:", error);
    } finally {
      setLoadingProgress(false);
    }
  }, []);

  useEffect(() => {
    loadTodaySessions();
    loadStats();
    loadProgress();
  }, [loadTodaySessions, loadStats, loadProgress]);

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
        <View style={styles.statsRow}>
          <View style={[styles.card, styles.statCard]}>
            <View style={styles.statIcon} />
            {loadingStats ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <>
                <Text style={styles.statNumber}>{totalCourses}</Text>
                <Text style={styles.statLabel}>Khóa học</Text>
              </>
            )}
          </View>
          <View style={[styles.card, styles.statCard]}>
            <View style={[styles.statIcon, { backgroundColor: "#DCFCE7" }]} />
            {loadingStats ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <>
                <Text style={styles.statNumber}>{totalAiFeedbacks}</Text>
                <Text style={styles.statLabel}>Phân tích AI</Text>
              </>
            )}
          </View>
        </View>

        {/* Learning Progress Section */}
        {!loadingProgress && progresses.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tiến độ học tập</Text>
            {progresses.map((progress, index) => {
              const progressPercent = Math.round(
                (progress.sessionsCompleted / progress.totalSessions) * 100
              );
              return (
                <View key={index} style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.progressTitle}>
                        {progress.course.name}
                      </Text>
                      <Text style={styles.progressSessionCount}>
                        {progress.sessionsCompleted}/{progress.totalSessions} buổi hoàn thành
                      </Text>
                    </View>
                    <View style={styles.progressPercentBadge}>
                      <Text style={styles.progressPercent}>{progressPercent}%</Text>
                    </View>
                  </View>

                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${progressPercent}%` },
                      ]}
                    />
                  </View>

                  <View style={styles.scoreContainer}>
                    <View style={styles.scoreItem}>
                      <View style={styles.scoreIconBox}>
                        <Ionicons name="star" size={18} color="#059669" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.scoreLabel}>Phân tích AI</Text>
                        <Text style={styles.scoreValue}>
                          {progress.avgAiAnalysisScore}/100
                        </Text>
                      </View>
                    </View>

                    <View style={styles.scoreItem}>
                      <View style={styles.scoreIconBox}>
                        <Ionicons name="checkmark-done" size={18} color="#059669" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.scoreLabel}>Điểm Quiz</Text>
                        <Text style={styles.scoreValue}>
                          {progress.avgQuizScore}/100
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

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
  welcomeCard: {
    backgroundColor: "#059669",
    borderColor: "#059669",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  welcomeSubtitle: {
    color: "#DCFCE7",
    marginTop: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  streakBox: { alignItems: "center" },
  streakNumber: { color: "#fff", fontSize: 22, fontWeight: "800" },
  streakText: { color: "#fff", fontSize: 11 },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 6,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#DBEAFE",
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.3,
  },
  statLabel: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
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
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  sessionTitle: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 14,
  },
  sessionCoach: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 3,
    fontWeight: "500",
  },
  sessionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  sessionMeta: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "400",
  },
  chev: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#D1D5DB" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  viewAllText: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  loadingContainer: {
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginTop: 14,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
    fontWeight: "400",
  },
  progressItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.2,
  },
  progressSessionCount: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "400",
  },
  progressPercentBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 0.3,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#059669",
    borderRadius: 5,
  },
  scoreContainer: {
    flexDirection: "row",
    gap: 10,
  },
  scoreItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  scoreIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 3,
    fontWeight: "500",
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 0.2,
  },
  progressStats: {
    gap: 6,
  },
  progressStatText: {
    fontSize: 12,
    color: "#6B7280",
  },
  scoreRow: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  scoreText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "500",
  },
});
