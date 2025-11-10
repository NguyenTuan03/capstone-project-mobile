import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CustomWeeklyCalendar from "../../../components/calendar/CustomWeeklyCalendar";
import sessionService from "../../../services/sessionService";
import { CalendarSession } from "../../../types/session";
import { getCurrentWeekRange } from "../../../utils/dateUtils";

// Force refresh by adding timestamp to ensure component reload
const CALENDAR_KEY = `calendar_${Date.now()}`;

export default function CoachCalendarScreen() {
  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekRange());

  // Force component remount by adding a key to main container
  const [forceUpdate, setForceUpdate] = useState(0);

  // Load sessions for the current week
  const loadSessions = useCallback(
    async (startDate: string, endDate: string) => {
      setLoading(true);
      try {
        const data = await sessionService.getSessionsForWeeklyCalendar({
          startDate,
          endDate,
        });

        setSessions(data);
      } catch (error) {
        console.error("❌ Failed to load sessions:", error);
        Alert.alert("Lỗi", "Không thể tải lịch học. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    const initialDates = getCurrentWeekRange();
    loadSessions(initialDates.start, initialDates.end);
  }, [loadSessions]);

  const handleWeekChange = useCallback(
    (startDate: string, endDate: string) => {
      // Use the dates received from WeeklyCalendar component
      setCurrentWeek({ start: startDate, end: endDate });
      loadSessions(startDate, endDate);
    },
    [loadSessions]
  );

  const handleTodayPress = useCallback(() => {
    const todayDates = getCurrentWeekRange();
    setCurrentWeek(todayDates);
    loadSessions(todayDates.start, todayDates.end);
  }, [loadSessions]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />

      {/* Safe Area Top Padding for different devices */}
      <View style={styles.safeAreaTop} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch dạy</Text>
        <TouchableOpacity style={styles.todayButton} onPress={handleTodayPress}>
          <Text style={styles.todayButtonText}>Hôm nay</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.todayButton,
            { backgroundColor: "#F59E0B", marginLeft: 8 },
          ]}
          onPress={() => setForceUpdate((prev) => prev + 1)}
        >
          <Text style={styles.todayButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Đang tải lịch học...</Text>
        </View>
      ) : (
        <CustomWeeklyCalendar
          sessions={sessions}
          initialStartDate={currentWeek.start}
          initialEndDate={currentWeek.end}
          onWeekChange={handleWeekChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  safeAreaTop: {
    backgroundColor: "#059669",
    paddingTop: Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24,
  },
  header: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  todayButton: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  todayButtonText: {
    color: "#059669",
    fontWeight: "600",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
});
