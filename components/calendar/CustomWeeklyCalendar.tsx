import { Ionicons } from "@expo/vector-icons";
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
  subWeeks,
} from "date-fns";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CalendarSession, SessionStatus } from "../../types/session";
import { toVietnameseDay } from "../../utils/localization";
import SessionDetailModal from "./SessionDetailModal";

// Force refresh by adding a version number

interface CustomWeeklyCalendarProps {
  sessions: CalendarSession[];
  initialStartDate?: string;
  initialEndDate?: string;
  onSessionPress?: (session: CalendarSession) => void;
  onDatePress?: (date: string) => void;
  onWeekChange?: (startDate: string, endDate: string) => void;
}

const CustomWeeklyCalendar: React.FC<CustomWeeklyCalendarProps> = ({
  sessions,
  initialStartDate,
  initialEndDate,
  onSessionPress,
  onDatePress,
  onWeekChange,
}) => {
  const [currentDate, setCurrentDate] = useState(() => {
    // Use initialStartDate if provided, otherwise use current date
    if (initialStartDate) {
      return new Date(initialStartDate);
    }
    return new Date();
  });
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [selectedSession, setSelectedSession] =
    useState<CalendarSession | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (initialStartDate) {
      const newDate = new Date(initialStartDate);
      setCurrentDate(newDate);
    }
  }, [initialStartDate]);

  const weekData = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }); // Sunday
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const daySessions = sessions.filter(
        (session) => session.scheduleDate === dateStr
      );

      console.log(`🔍 Filtering for date ${dateStr}:`, {
        totalSessions: sessions.length,
        matchingSessions: daySessions.length,
        matchingSessionIds: daySessions.map((s) => s.id),
        allSessionDates: sessions.map((s) => s.scheduleDate),
      });

      return {
        date: day,
        dateStr,
        dayName: toVietnameseDay(format(day, "EEEE")),
        dayNumber: format(day, "d"),
        dayShort: toVietnameseDay(format(day, "EEE")),
        sessions: daySessions,
        hasSessions: daySessions.length > 0,
        isSelected: dateStr === selectedDate,
      };
    });
  }, [currentDate, sessions, selectedDate]);

  const getSessionStatusColor = (status: SessionStatus): string => {
    switch (status) {
      case SessionStatus.SCHEDULED:
        return "#059669";
      case SessionStatus.IN_PROGRESS:
        return "#F59E0B";
      case SessionStatus.COMPLETED:
        return "#3B82F6";
      case SessionStatus.CANCELLED:
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getSessionCountColor = (count: number): string => {
    if (count === 0) return "#9CA3AF";
    if (count >= 1 && count <= 2) return "#059669"; // Green for 1-2 sessions
    if (count >= 3 && count <= 4) return "#F59E0B"; // Yellow for 3-4 sessions
    if (count >= 5) return "#EF4444"; // Red for 5+ sessions
    return "#6B7280"; // Default gray
  };

  const getSessionStatusText = (status: SessionStatus): string => {
    switch (status) {
      case SessionStatus.SCHEDULED:
        return "Đã lên lịch";
      case SessionStatus.IN_PROGRESS:
        return "Đang diễn ra";
      case SessionStatus.COMPLETED:
        return "Đã hoàn thành";
      case SessionStatus.CANCELLED:
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  const handleSessionPress = useCallback(
    (session: CalendarSession) => {
      if (onSessionPress) {
        onSessionPress(session);
      } else {
        console.log("🔍 Session pressed:", session);
        setSelectedSession(session);
        setIsModalVisible(true);
      }
    },
    [onSessionPress]
  );

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setSelectedSession(null);
  }, []);

  const handleDayPress = useCallback(
    (day: any) => {
      setSelectedDate(day.dateStr);
      if (onDatePress) {
        onDatePress(day.dateStr);
      }
    },
    [onDatePress]
  );

  const navigateWeek = useCallback(
    (direction: "prev" | "next") => {
      console.log("navigateWeek called with direction:", direction);
      const newDate =
        direction === "prev"
          ? subWeeks(currentDate, 1)
          : addWeeks(currentDate, 1);
      console.log("newDate:", newDate);
      setCurrentDate(newDate);

      const weekStart = startOfWeek(newDate, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(newDate, { weekStartsOn: 1 }); // Sunday;

      const weekStartStr = format(weekStart, "yyyy-MM-dd");
      const weekEndStr = format(weekEnd, "yyyy-MM-dd");

      console.log("Calling onWeekChange with:", weekStartStr, weekEndStr);

      if (onWeekChange) {
        onWeekChange(weekStartStr, weekEndStr);
      }
    },
    [currentDate, onWeekChange]
  );

  const renderDayHeader = (day: any) => {
    const sessionCountColor = getSessionCountColor(day.sessions.length);

    return (
      <TouchableOpacity
        key={day.dateStr}
        style={[
          styles.dayHeader,
          day.isSelected && styles.dayHeaderSelected,
          day.hasSessions && styles.dayHeaderWithSessions,
        ]}
        onPress={() => handleDayPress(day)}
      >
        <Text
          style={[styles.dayText, day.isSelected && styles.dayTextSelected]}
        >
          {day.dayShort}
        </Text>
        <Text
          style={[styles.dayNumber, day.isSelected && styles.dayNumberSelected]}
        >
          {day.dayNumber}
        </Text>
        {day.hasSessions ? (
          <View
            style={[
              styles.sessionBadge,
              { backgroundColor: sessionCountColor },
            ]}
          >
            <Text style={styles.sessionBadgeText}>{day.sessions.length}</Text>
          </View>
        ) : (
          <View style={styles.emptyIndicator} />
        )}
      </TouchableOpacity>
    );
  };

  const renderSession = ({ item }: { item: CalendarSession }) => (
    <TouchableOpacity
      style={[
        styles.sessionCard,
        { borderLeftColor: getSessionStatusColor(item.status) },
      ]}
      onPress={() => handleSessionPress(item)}
    >
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionTime}>
          {item.startTime} - {item.endTime}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getSessionStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {getSessionStatusText(item.status)}
          </Text>
        </View>
      </View>
      <Text>{item.course.address}</Text>
      <Text style={styles.sessionName} numberOfLines={1}>
        {item.name}
      </Text>

      <Text style={styles.courseName}>{item.courseName}</Text>
    </TouchableOpacity>
  );

  const renderEmptyDay = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>Không có buổi học</Text>
      <Text style={styles.emptySubtitle}>Thưởng thức ngày nghỉ nhé!</Text>
    </View>
  );

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const selectedDayData = weekData.find((day) => day.isSelected);

  return (
    <View style={styles.container}>
      {/* Week Navigation */}
      <View style={styles.weekHeader}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateWeek("prev")}
        >
          <Ionicons name="chevron-back" size={20} color="#059669" />
        </TouchableOpacity>

        <Text style={styles.weekTitle}>
          {format(weekStart, "dd/MM")} - {format(weekEnd, "dd/MM/yyyy")}
        </Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateWeek("next")}
        >
          <Ionicons name="chevron-forward" size={20} color="#059669" />
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={styles.daysContainer}>{weekData.map(renderDayHeader)}</View>

      {/* Sessions for Selected Day */}
      <ScrollView
        style={styles.sessionsContainer}
        contentContainerStyle={styles.sessionsContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedDayData && selectedDayData.sessions.length > 0 ? (
          <>
            <View style={styles.selectedDayHeader}>
              <Text style={styles.selectedDayTitle}>
                {toVietnameseDay(format(selectedDayData.date, "EEEE"))},{" "}
                {format(selectedDayData.date, "dd/MM/yyyy")}
              </Text>
              <Text style={styles.sessionCount}>
                {selectedDayData.sessions.length} buổi học
              </Text>
            </View>

            {selectedDayData.sessions.map((session, index) => (
              <View key={session.id || index} style={styles.sessionItem}>
                {renderSession({ item: session })}
              </View>
            ))}
          </>
        ) : (
          <>
            <View style={styles.selectedDayHeader}>
              <Text style={styles.selectedDayTitle}>
                {selectedDayData
                  ? `${toVietnameseDay(
                      format(selectedDayData.date, "EEEE")
                    )}, ${format(selectedDayData.date, "dd/MM/yyyy")}`
                  : `${toVietnameseDay(format(new Date(), "EEEE"))}, ${format(
                      new Date(),
                      "dd/MM/yyyy"
                    )}`}
              </Text>
            </View>
            {renderEmptyDay()}
          </>
        )}
      </ScrollView>

      {/* Session Detail Modal */}
      <SessionDetailModal
        session={selectedSession}
        isVisible={isModalVisible}
        onClose={closeModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  daysContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  dayHeader: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  dayHeaderSelected: {
    backgroundColor: "#DBEAFE",
    borderWidth: 2,
    borderColor: "#059669",
  },
  dayHeaderWithSessions: {
    backgroundColor: "#F0FDF4",
  },
  dayText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  dayTextSelected: {
    color: "#059669",
    fontWeight: "600",
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginTop: 2,
  },
  dayNumberSelected: {
    color: "#059669",
  },
  sessionBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  sessionBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    marginTop: 4,
  },
  sessionsContainer: {
    flex: 1,
  },
  sessionsContent: {
    padding: 16,
  },
  selectedDayHeader: {
    marginBottom: 16,
  },
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  sessionCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  sessionItem: {
    marginBottom: 12,
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sessionTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  sessionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  courseName: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  sessionDescription: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});

export default CustomWeeklyCalendar;
