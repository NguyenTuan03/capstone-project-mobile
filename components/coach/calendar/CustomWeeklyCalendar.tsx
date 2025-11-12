import { Ionicons } from "@expo/vector-icons";
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
  subWeeks,
} from "date-fns";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";
import {
  Modal,
  PanResponder,
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

  // Edit session state
  const [editingSession, setEditingSession] = useState<CalendarSession | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editScheduleDate, setEditScheduleDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

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
        isToday: dateStr === format(new Date(), "yyyy-MM-dd"),
      };
    });
  }, [currentDate, sessions, selectedDate]);

  // Week summary statistics
  const weekStats = useMemo(() => {
    const allWeekSessions = weekData.flatMap((day) => day.sessions);
    const totalSessions = allWeekSessions.length;
    const completedSessions = allWeekSessions.filter(
      (s) => s.status === SessionStatus.COMPLETED
    ).length;
    const scheduledSessions = allWeekSessions.filter(
      (s) => s.status === SessionStatus.SCHEDULED
    ).length;

    // Calculate total teaching hours
    const totalMinutes = allWeekSessions.reduce((acc, session) => {
      const start = session.startTime.split(":");
      const end = session.endTime.split(":");
      const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
      const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
      return acc + (endMinutes - startMinutes);
    }, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return {
      totalSessions,
      completedSessions,
      scheduledSessions,
      totalHours,
      remainingMinutes,
      timeText:
        remainingMinutes > 0
          ? `${totalHours}h ${remainingMinutes}m`
          : `${totalHours}h`,
    };
  }, [weekData]);

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

  const handleEditSession = useCallback((session: CalendarSession) => {
    setEditingSession(session);
    setEditScheduleDate(session.scheduleDate);
    setEditStartTime(session.startTime);
    setEditEndTime(session.endTime);
    setIsEditModalVisible(true);
  }, []);

  const handleSaveSessionChanges = useCallback(() => {
    if (!editingSession) return;
    
    // This is where you would call your API to update the session
    console.log('Updating session:', {
      sessionId: editingSession.id,
      scheduleDate: editScheduleDate,
      startTime: editStartTime,
      endTime: editEndTime,
    });
    
    // TODO: Call API here
    // await sessionService.updateSession(editingSession.id, {
    //   scheduleDate: editScheduleDate,
    //   startTime: editStartTime,
    //   endTime: editEndTime,
    // });
    
    setIsEditModalVisible(false);
    setEditingSession(null);
  }, [editingSession, editScheduleDate, editStartTime, editEndTime]);

  const handleCancelEdit = useCallback(() => {
    setIsEditModalVisible(false);
    setEditingSession(null);
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

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(format(today, "yyyy-MM-dd"));

    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    if (onWeekChange) {
      onWeekChange(
        format(weekStart, "yyyy-MM-dd"),
        format(weekEnd, "yyyy-MM-dd")
      );
    }
  }, [onWeekChange]);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (
        _evt: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (
        _evt: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        if (gestureState.dx > 50) {
          // Swipe right - previous week
          navigateWeek("prev");
        } else if (gestureState.dx < -50) {
          // Swipe left - next week
          navigateWeek("next");
        }
      },
    })
  ).current;
  const renderDayHeader = (day: any) => {
    const sessionCountColor = getSessionCountColor(day.sessions.length);

    return (
      <TouchableOpacity
        key={day.dateStr}
        style={[
          styles.dayHeader,
          day.isSelected && styles.dayHeaderSelected,
          day.hasSessions && styles.dayHeaderWithSessions,
          day.isToday && styles.dayHeaderToday,
        ]}
        onPress={() => handleDayPress(day)}
      >
        <Text
          style={[
            styles.dayText,
            day.isSelected && styles.dayTextSelected,
            day.isToday && styles.dayTextToday,
          ]}
        >
          {day.dayShort}
        </Text>
        <Text
          style={[
            styles.dayNumber,
            day.isSelected && styles.dayNumberSelected,
            day.isToday && styles.dayNumberToday,
          ]}
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
        {day.isToday && !day.isSelected && <View style={styles.todayDot} />}
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
        <View style={styles.headerActions}>
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
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditSession(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="create-outline" size={18} color="#059669" />
          </TouchableOpacity>
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

  // Check if current week is today's week
  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    return (
      format(weekStart, "yyyy-MM-dd") === format(todayWeekStart, "yyyy-MM-dd")
    );
  }, [weekStart]);

  return (
    <View style={styles.container}>
      <View {...panResponder.panHandlers} style={styles.gestureContainer}>
        {/* Week Navigation - Simplified */}
        <View style={styles.weekHeader}>
          <View style={styles.weekTitleContainer}>
            <Text style={styles.monthYear}>
              Tháng {format(currentDate, "M/yyyy")}
            </Text>
            <Text style={styles.weekRange}>
              {format(weekStart, "dd")} - {format(weekEnd, "dd")}{" "}
            </Text>
          </View>

          {!isCurrentWeek && (
            <TouchableOpacity
              style={styles.todayButtonPrimary}
              onPress={goToToday}
              activeOpacity={0.8}
            >
              <Ionicons name="today" size={16} color="#FFFFFF" />
              <Text style={styles.todayButtonPrimaryText}>Hôm nay</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Swipe Hint */}
        <View style={styles.swipeHint}>
          <Ionicons name="chevron-back" size={12} color="#9CA3AF" />
          <Text style={styles.swipeHintText}>Vuốt để chuyển tuần</Text>
          <Ionicons name="chevron-forward" size={12} color="#9CA3AF" />
        </View>

        {/* Week Summary Stats */}
        <View style={styles.weekSummary}>
          <View style={styles.statItem}>
            <Ionicons name="calendar" size={16} color="#059669" />
            <Text style={styles.statValue}>{weekStats.totalSessions}</Text>
            <Text style={styles.statLabel}>buổi học</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="time" size={16} color="#3B82F6" />
            <Text style={styles.statValue}>{weekStats.timeText}</Text>
            <Text style={styles.statLabel}>giảng dạy</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.statValue}>{weekStats.completedSessions}</Text>
            <Text style={styles.statLabel}>hoàn thành</Text>
          </View>
        </View>

        {/* Day Headers */}
        <View style={styles.daysContainer}>
          {weekData.map(renderDayHeader)}
        </View>

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

        {/* Edit Session Modal */}
        <Modal
          visible={isEditModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCancelEdit}
        >
          <View style={styles.editModalContainer}>
            <View style={styles.editModalHeader}>
              <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>Chỉnh sửa lịch học</Text>
              <TouchableOpacity onPress={handleSaveSessionChanges} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Lưu</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalContent}>
              {editingSession && (
                <>
                  {/* Session Info */}
                  <View style={styles.editSection}>
                    <Text style={styles.editSectionTitle}>Thông tin buổi học</Text>
                    <Text style={styles.sessionTitle}>{editingSession.name}</Text>
                    <Text style={styles.courseTitle}>{editingSession.courseName}</Text>
                  </View>

                  {/* Schedule Date */}
                  <View style={styles.editSection}>
                    <Text style={styles.editLabel}>Ngày học</Text>
                    <TouchableOpacity
                      style={styles.editInput}
                      onPress={() => {/* TODO: Open date picker */}}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                      <Text style={styles.editInputText}>
                        {format(new Date(editScheduleDate), 'dd/MM/yyyy')}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  {/* Start Time */}
                  <View style={styles.editSection}>
                    <Text style={styles.editLabel}>Giờ bắt đầu</Text>
                    <TouchableOpacity
                      style={styles.editInput}
                      onPress={() => {/* TODO: Open time picker */}}
                    >
                      <Ionicons name="time-outline" size={20} color="#6B7280" />
                      <Text style={styles.editInputText}>{editStartTime}</Text>
                      <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  {/* End Time */}
                  <View style={styles.editSection}>
                    <Text style={styles.editLabel}>Giờ kết thúc</Text>
                    <TouchableOpacity
                      style={styles.editInput}
                      onPress={() => {/* TODO: Open time picker */}}
                    >
                      <Ionicons name="time-outline" size={20} color="#6B7280" />
                      <Text style={styles.editInputText}>{editEndTime}</Text>
                      <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  {/* Info Message */}
                  <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text style={styles.infoText}>
                      Thay đổi lịch học sẽ thông báo đến tất cả học viên
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  gestureContainer: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  weekTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  monthYear: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  weekRange: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  todayButtonPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#059669",
    borderRadius: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  todayButtonPrimaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  swipeHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    gap: 6,
  },
  swipeHintText: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  daysContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 6,
    paddingVertical: 8,
    paddingBottom: 10,
    gap: 3,
  },
  dayHeader: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 3,
    borderRadius: 12,
    marginHorizontal: 1,
    minHeight: 75,
    justifyContent: "space-between",
  },
  dayHeaderSelected: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1.5,
    borderColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayHeaderWithSessions: {
    backgroundColor: "#FEF9C3",
  },
  dayText: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  dayTextSelected: {
    color: "#059669",
    fontWeight: "700",
  },
  dayNumber: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1F2937",
    marginTop: 4,
  },
  dayNumberSelected: {
    color: "#059669",
    fontSize: 20,
  },
  sessionBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
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
    fontWeight: "800",
    color: "#FFFFFF",
  },
  emptyIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    marginTop: 6,
  },
  sessionsContainer: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  sessionsContent: {
    padding: 12,
    paddingBottom: 24,
  },
  selectedDayHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#E5E7EB",
  },
  selectedDayTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 3,
  },
  sessionCount: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  sessionItem: {
    marginBottom: 10,
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    overflow: "hidden",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  sessionTime: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sessionContent: {
    gap: 8,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 20,
  },
  sessionMeta: {
    gap: 8,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  courseName: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
    flex: 1,
  },
  locationText: {
    fontSize: 12,
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
    paddingVertical: 40,
    minHeight: 280,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 6,
    marginTop: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#374151",
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },
  // Week Title Container
  weekTitleContainer: {
    alignItems: "center",
    gap: 3,
  },
  // Today Button
  todayButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#059669",
  },
  todayButtonText: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "700",
  },
  // Today Indicator
  dayHeaderToday: {
    borderWidth: 1.5,
    borderColor: "#FCD34D",
  },
  dayTextToday: {
    color: "#D97706",
  },
  dayNumberToday: {
    color: "#D97706",
  },
  todayDot: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#F59E0B",
  },
  // Week Summary Stats
  weekSummary: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "space-around",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  statItem: {
    alignItems: "center",
    gap: 3,
    flex: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  statLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E5E7EB",
  },
  // Edit Button
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  // Edit Modal
  editModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  editModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#059669',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  editModalContent: {
    flex: 1,
    padding: 16,
  },
  editSection: {
    marginBottom: 20,
  },
  editSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  editInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  editInputText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
});

export default CustomWeeklyCalendar;
