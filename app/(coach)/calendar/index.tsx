import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomWeeklyCalendar from "../../../components/coach/calendar/CustomWeeklyCalendar";
import sessionService from "../../../services/sessionService";
import { CalendarSession } from "../../../types/session";
import { getCurrentWeekRange } from "../../../utils/dateUtils";

export default function CoachCalendarScreen() {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<any>(getCurrentWeekRange());

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

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 50 },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#059669" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch dạy</Text>
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
