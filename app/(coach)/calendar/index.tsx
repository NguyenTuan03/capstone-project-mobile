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
      } catch {
        // Handle error silently
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
        { paddingTop: insets.top, paddingBottom: insets.bottom + 36 },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

      {/* Header - compact, modern */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch dạy</Text>
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#059669" />
            <Text style={styles.loadingText}>Đang tải lịch học...</Text>
          </View>
        ) : (
          <CustomWeeklyCalendar
            sessions={sessions}
            initialStartDate={currentWeek.start}
            initialEndDate={currentWeek.end}
            onWeekChange={handleWeekChange}
            onRefresh={() => loadSessions(currentWeek.start, currentWeek.end)}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  contentWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
});
