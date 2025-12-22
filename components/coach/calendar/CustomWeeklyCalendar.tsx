import scheduleService from "@/services/schedule.service";
import { SessionNewScheduleDto } from "@/types/schedule";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  ActivityIndicator,
  Alert,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
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
  onRefresh?: () => void;
}

const CustomWeeklyCalendar: React.FC<CustomWeeklyCalendarProps> = ({
  sessions,
  initialStartDate,
  initialEndDate,
  onSessionPress,
  onDatePress,
  onWeekChange,
  onRefresh,
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
  const [editingSession, setEditingSession] = useState<CalendarSession | null>(
    null
  );
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editScheduleDate, setEditScheduleDate] = useState(new Date());
  const [editStartTime, setEditStartTime] = useState(new Date());
  const [editEndTime, setEditEndTime] = useState(new Date());
  const [replaceScheduleId, setReplaceScheduleId] = useState<number | null>(
    null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialStartDate) {
      const newDate = new Date(initialStartDate);
      setCurrentDate(newDate);
    }
  }, [initialStartDate]);

  const weekData = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }); // Sunday;
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

  const handleEditSession = useCallback(async (session: CalendarSession) => {
    try {
      setEditingSession(session);

      // Set initial values for pickers
      setEditScheduleDate(new Date(session.scheduleDate));

      const [startHour, startMinute] = session.startTime.split(":").map(Number);
      const startDate = new Date();
      startDate.setHours(startHour, startMinute, 0, 0);
      setEditStartTime(startDate);

      const [endHour, endMinute] = session.endTime.split(":").map(Number);
      const endDate = new Date();
      endDate.setHours(endHour, endMinute, 0, 0);
      setEditEndTime(endDate);

      setIsEditModalVisible(true);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể chuẩn bị chỉnh sửa lịch học.");
    }
  }, []);

  const handleSaveSessionChanges = useCallback(async () => {
    if (!editingSession) return;

    try {
      setIsSaving(true);
      const formatTime = (date: Date) => format(date, "HH:mm:ss");

      const payload: SessionNewScheduleDto = {
        scheduledDate: editScheduleDate,
        startTime: formatTime(editStartTime),
        endTime: formatTime(editEndTime),
      };

      await scheduleService.changeSessionSchedule(editingSession.id, payload);

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã cập nhật lịch học thành công",
      });

      setIsEditModalVisible(false);
      setEditingSession(null);

      // Refresh the calendar
      if (onWeekChange && initialStartDate && initialEndDate) {
        onWeekChange(initialStartDate, initialEndDate);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Thất bại",
        text2: "Có lỗi xảy ra khi cập nhật lịch học",
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    editingSession,
    editScheduleDate,
    editStartTime,
    editEndTime,
    onWeekChange,
    initialStartDate,
    initialEndDate,
  ]);

  const handleCancelEdit = useCallback(() => {
    setIsEditModalVisible(false);
    setEditingSession(null);
    setReplaceScheduleId(null);
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
    return (
      <TouchableOpacity
        key={day.dateStr}
        style={[
          styles.dayHeader,
          day.isSelected && styles.dayHeaderSelected,
          day.isToday && styles.dayHeaderToday,
        ]}
        onPress={() => handleDayPress(day)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.dayText,
            day.isSelected && styles.dayTextSelected,
            day.isToday && !day.isSelected && styles.dayTextToday,
          ]}
        >
          {day.dayShort}
        </Text>
        <Text
          style={[
            styles.dayNumber,
            day.isSelected && styles.dayNumberSelected,
            day.isToday && !day.isSelected && styles.dayNumberToday,
          ]}
        >
          {day.dayNumber}
        </Text>
        {day.isSelected && day.isToday ? (
          <View style={styles.todayDotStrip} />
        ) : day.hasSessions ? (
          <View style={styles.sessionDot} />
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderSession = ({ item }: { item: CalendarSession }) => (
    <TouchableOpacity
      style={[
        styles.sessionCard,
        {
          borderLeftColor: getSessionStatusColor(item.status),
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
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="create-outline" size={16} color="#059669" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sessionContent}>
        <Text style={styles.sessionName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.sessionMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="book-outline" size={14} color="#9CA3AF" />
            <Text style={styles.courseName}>{item.courseName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color="#9CA3AF" />
            <Text style={styles.locationText} numberOfLines={2}>
              {item.course?.court.address || "Chưa có địa điểm"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyDay = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconBoxLarge}>
        <Ionicons name="calendar-clear-outline" size={40} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>Nghỉ dưỡng sức nào!</Text>
      <Text style={styles.emptySubtitle}>
        Không có lịch dạy cho ngày được chọn
      </Text>
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

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEditScheduleDate(selectedDate);
    }
  };

  const onStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartTimePicker(false);
    if (selectedDate) {
      setEditStartTime(selectedDate);
    }
  };

  const onEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndTimePicker(false);
    if (selectedDate) {
      setEditEndTime(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <View {...panResponder.panHandlers} style={styles.gestureContainer}>
        {/* Week Navigation & Selector Row */}
        <View style={styles.topSelectorRow}>
          <View style={styles.weekTitleGroup}>
            <Text style={styles.monthYearText}>
              Tháng {format(currentDate, "M/yyyy")}
            </Text>
            <Text style={styles.weekRangeText}>
              Tuần: {format(weekStart, "dd/MM")} - {format(weekEnd, "dd/MM")}
            </Text>
          </View>

          <View style={styles.headerControls}>
            <TouchableOpacity
              style={styles.navIconBtn}
              onPress={() => navigateWeek("prev")}
              activeOpacity={0.6}
            >
              <Ionicons name="chevron-back" size={20} color="#374151" />
            </TouchableOpacity>

            {!isCurrentWeek && (
              <TouchableOpacity
                style={styles.todayBtnRefined}
                onPress={goToToday}
                activeOpacity={0.8}
              >
                <Text style={styles.todayBtnText}>Hôm nay</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.navIconBtn}
              onPress={() => navigateWeek("next")}
              activeOpacity={0.6}
            >
              <Ionicons name="chevron-forward" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Day Headers Row */}
        <View style={styles.daysStripContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysStripContent}
          >
            {weekData.map(renderDayHeader)}
          </ScrollView>
        </View>

        {/* Week Summary Stats Row */}
        <View style={styles.summaryStatsRefined}>
          <View style={styles.summaryItem}>
            <View
              style={[styles.summaryIconBox, { backgroundColor: "#F0FDF4" }]}
            >
              <Ionicons name="calendar" size={16} color="#16A34A" />
            </View>
            <View>
              <Text style={styles.summaryValue}>{weekStats.totalSessions}</Text>
              <Text style={styles.summaryLabel}>Buổi dạy</Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View
              style={[styles.summaryIconBox, { backgroundColor: "#EFF6FF" }]}
            >
              <Ionicons name="time" size={16} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.summaryValue}>{weekStats.timeText}</Text>
              <Text style={styles.summaryLabel}>Thời gian</Text>
            </View>
          </View>
          <View style={styles.summaryItem}>
            <View
              style={[styles.summaryIconBox, { backgroundColor: "#FEF2F2" }]}
            >
              <Ionicons name="checkmark-circle" size={16} color="#DC2626" />
            </View>
            <View>
              <Text style={styles.summaryValue}>
                {weekStats.completedSessions}
              </Text>
              <Text style={styles.summaryLabel}>Đã xong</Text>
            </View>
          </View>
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
          onAttendanceSaved={onRefresh}
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
              <TouchableOpacity
                onPress={handleCancelEdit}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>Chỉnh sửa lịch học</Text>
              <TouchableOpacity
                onPress={handleSaveSessionChanges}
                style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <Text style={styles.saveButtonText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalContent}>
              {editingSession && (
                <>
                  {/* Session Info */}
                  <View style={styles.editSection}>
                    <Text style={styles.editSectionTitle}>
                      Thông tin buổi học
                    </Text>
                    <Text style={styles.sessionTitle}>
                      {editingSession.name}
                    </Text>
                    <Text style={styles.courseTitle}>
                      {editingSession.courseName}
                    </Text>
                  </View>

                  {/* Schedule Date */}
                  <View style={styles.editSection}>
                    <Text style={styles.editLabel}>Ngày học</Text>
                    <TouchableOpacity
                      style={styles.editInput}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#6B7280"
                      />
                      <Text style={styles.editInputText}>
                        {format(editScheduleDate, "dd/MM/yyyy")}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={editScheduleDate}
                        mode="date"
                        display={Platform.OS === "ios" ? "inline" : "default"}
                        onChange={onDateChange}
                        minimumDate={new Date()}
                        themeVariant="light"
                        accentColor="#059669"
                      />
                    )}
                  </View>

                  {/* Start Time */}
                  <View style={styles.editSection}>
                    <Text style={styles.editLabel}>Giờ bắt đầu</Text>
                    <TouchableOpacity
                      style={styles.editInput}
                      onPress={() => setShowStartTimePicker(true)}
                    >
                      <Ionicons name="time-outline" size={20} color="#6B7280" />
                      <Text style={styles.editInputText}>
                        {format(editStartTime, "HH:mm")}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    {showStartTimePicker && (
                      <DateTimePicker
                        value={editStartTime}
                        mode="time"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={onStartTimeChange}
                        themeVariant="light"
                        textColor="#000000"
                      />
                    )}
                  </View>

                  {/* End Time */}
                  <View style={styles.editSection}>
                    <Text style={styles.editLabel}>Giờ kết thúc</Text>
                    <TouchableOpacity
                      style={styles.editInput}
                      onPress={() => setShowEndTimePicker(true)}
                    >
                      <Ionicons name="time-outline" size={20} color="#6B7280" />
                      <Text style={styles.editInputText}>
                        {format(editEndTime, "HH:mm")}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    {showEndTimePicker && (
                      <DateTimePicker
                        value={editEndTime}
                        mode="time"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={onEndTimeChange}
                        themeVariant="light"
                        textColor="#000000"
                      />
                    )}
                  </View>

                  {/* Info Message */}
                  <View style={styles.infoBox}>
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color="#3B82F6"
                    />
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
    backgroundColor: "#F9FAFB",
  },
  gestureContainer: {
    flex: 1,
  },
  /* Top Selector Row */
  topSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  weekTitleGroup: {
    flex: 1,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  weekRangeText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 2,
  },
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  todayBtnRefined: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(5, 150, 105, 0.1)",
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },

  /* Days Strip */
  daysStripContainer: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 16,
    paddingLeft: 12,
  },
  daysStripContent: {
    paddingRight: 20,
    gap: 10,
  },
  dayHeader: {
    width: 58,
    height: 82,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  dayHeaderSelected: {
    backgroundColor: "#059669",
    borderColor: "#059669",
    shadowColor: "#059669",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dayHeaderToday: {
    borderColor: "#059669",
    borderWidth: 1.5,
  },
  dayText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dayTextSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  dayTextToday: {
    color: "#059669",
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginTop: 4,
  },
  dayNumberSelected: {
    color: "#FFFFFF",
  },
  dayNumberToday: {
    color: "#059669",
  },
  todayDotStrip: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
    marginTop: 6,
  },
  sessionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#16A34A",
    marginTop: 6,
  },

  /* Summary Stats Refined */
  summaryStatsRefined: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 20,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  summaryIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  summaryLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 8,
  },

  /* Sessions List Container */
  sessionsContainer: {
    flex: 1,
  },
  sessionsContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  selectedDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
  },
  sessionCount: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "700",
    backgroundColor: "rgba(5, 150, 105, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionItem: {
    marginBottom: 16,
  },

  /* Session Card Premium */
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderLeftWidth: 6,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  sessionTime: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(5, 150, 105, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  sessionContent: {
    gap: 6,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  sessionMeta: {
    marginTop: 8,
    gap: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  courseName: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    color: "#9CA3AF",
    flex: 1,
    lineHeight: 18,
  },

  /* Empty State */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginVertical: 20,
  },
  emptyIconBoxLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#9CA3AF",
    fontWeight: "500",
  },

  /* Edit Modal */
  editModalContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  editModalContent: {
    flex: 1,
    padding: 20,
  },
  editSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  editSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  courseTitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  editLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  editInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  editInputText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1E40AF",
    fontWeight: "500",
    lineHeight: 20,
  },
});

export default CustomWeeklyCalendar;
