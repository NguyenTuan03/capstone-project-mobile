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
import { CalendarSession, SessionStatus } from "../../../types/session";
import { toVietnameseDay } from "../../../utils/localization";
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
      const newDate =
        direction === "prev"
          ? subWeeks(currentDate, 1)
          : addWeeks(currentDate, 1);
      setCurrentDate(newDate);

      const weekStart = startOfWeek(newDate, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(newDate, { weekStartsOn: 1 }); // Sunday;

      const weekStartStr = format(weekStart, "yyyy-MM-dd");
      const weekEndStr = format(weekEnd, "yyyy-MM-dd");

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
        {
          borderLeftColor: getSessionStatusColor(item.status),
          shadowColor: getSessionStatusColor(item.status),
          shadowOpacity: 0.2,
        },
      ]}
      onPress={() => handleSessionPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.sessionTime}>
            {item.startTime} - {item.endTime}
          </Text>
        </View>
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

      <View style={styles.sessionContent}>
        <Text style={styles.sessionName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.sessionMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="book-outline" size={12} color="#6B7280" />
            <Text style={styles.courseName}>{item.courseName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.course.address}
            </Text>
          </View>
        </View>
      </View>
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
    backgroundColor: "#F8FAFC",
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  daysContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dayHeader: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  dayHeaderSelected: {
    backgroundColor: "#F0FDF4",
    borderWidth: 2,
    borderColor: "#059669",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayHeaderWithSessions: {
    backgroundColor: "#FEF3C7",
  },
  dayText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dayTextSelected: {
    color: "#059669",
    fontWeight: "600",
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 4,
  },
  dayNumberSelected: {
    color: "#059669",
  },
  sessionBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    marginTop: 8,
  },
  sessionsContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  sessionsContent: {
    padding: 20,
  },
  selectedDayHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  selectedDayTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  sessionCount: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  sessionItem: {
    marginBottom: 12,
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    marginHorizontal: 4,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  sessionTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  sessionContent: {
    marginBottom: 16,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
    lineHeight: 24,
  },
  sessionMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  courseName: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  locationText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  sessionDescription: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#374151",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default CustomWeeklyCalendar;
