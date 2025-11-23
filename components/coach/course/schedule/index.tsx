import { DAYS_OF_WEEK_VI } from "@/components/common/AppEnum";
import configurationService from "@/services/configurationService";
import { Course, Schedule } from "@/types/course";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  course: Course;
};

const ScheduleTab: React.FC<Props> = ({ course }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [changeScheduleBeforeHours, setChangeScheduleBeforeHours] = useState(0);

  const getNextOccurrence = (dayOfWeek: string, timeStr: string): Date => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const targetDayIndex = days.indexOf(dayOfWeek);
    const [hours, minutes] = timeStr.split(":").map(Number);

    const now = new Date();
    const currentDayIndex = now.getDay();

    let daysUntilTarget = targetDayIndex - currentDayIndex;

    // If it's the same day, check if the time has already passed
    if (daysUntilTarget === 0) {
      const nowHours = now.getHours();
      const nowMinutes = now.getMinutes();
      if (nowHours > hours || (nowHours === hours && nowMinutes >= minutes)) {
        daysUntilTarget = 7;
      }
    } else if (daysUntilTarget < 0) {
      daysUntilTarget += 7;
    }

    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntilTarget);
    nextDate.setHours(hours, minutes, 0, 0);

    return nextDate;
  };

  useEffect(() => {
    const fetchChangeScheduleBeforeHours = async () => {
      const res = await configurationService.getConfiguration(
        "change_schedule_before_hours"
      );
      if (res) {
        setChangeScheduleBeforeHours(Number(res.value));
      }
    };

    fetchChangeScheduleBeforeHours();
  }, []);

  const handleEditPress = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setSelectedDay(schedule.dayOfWeek);

    const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0, 0);
    setStartTime(startDate);

    const [endHour, endMinute] = schedule.endTime.split(":").map(Number);
    const endDate = new Date();
    endDate.setHours(endHour, endMinute, 0, 0);
    setEndTime(endDate);

    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingSchedule(null);
  };

  const handleSave = async () => {
    if (!editingSchedule) return;

    const nextSessionDate = getNextOccurrence(
      editingSchedule.dayOfWeek,
      editingSchedule.startTime
    );
    const now = new Date();
    const diffInHours =
      (nextSessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours < changeScheduleBeforeHours) {
      Alert.alert(
        "Không thể thay đổi lịch",
        `Bạn chỉ có thể thay đổi lịch học trước ${changeScheduleBeforeHours} giờ trước khi buổi học bắt đầu.`
      );
      return;
    }

    // Placeholder for API call
    console.log("Saving schedule:", {
      id: editingSchedule?.id,
      day: selectedDay,
      start: format(startTime, "HH:mm:ss"),
      end: format(endTime, "HH:mm:ss"),
    });
    handleCloseModal();
  };

  const onStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartTimePicker(false);
    if (selectedDate) {
      setStartTime(selectedDate);
    }
  };

  const onEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndTimePicker(false);
    if (selectedDate) {
      setEndTime(selectedDate);
    }
  };

  const renderItem = ({ item, index }: { item: Schedule; index: number }) => {
    const dayIndex = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ].indexOf(item.dayOfWeek);
    const dayName = dayIndex >= 0 ? DAYS_OF_WEEK_VI[dayIndex] : item.dayOfWeek;
    const startTimeStr = item.startTime.substring(0, 5);
    const endTimeStr = item.endTime.substring(0, 5);

    return (
      <View style={styles.sessionCard}>
        <View style={styles.cardLeft}>
          <View style={styles.sessionNumber}>
            <Text style={styles.sessionNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionName}>{dayName}</Text>
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.sessionTime}>
                {startTimeStr} - {endTimeStr}
              </Text>
            </View>
            <Text style={styles.totalSessions}>
              {item.totalSessions
                ? `${item.totalSessions} buổi`
                : "Đang cập nhật"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditPress(item)}
        >
          <Ionicons name="create-outline" size={20} color="#059669" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Lịch học chi tiết</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {course.schedules?.length || 0} lịch
          </Text>
        </View>
      </View>

      {course.schedules && course.schedules.length > 0 ? (
        <FlatList
          data={course.schedules}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>Chưa có lịch học</Text>
        </View>
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa lịch học</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.infoContainer}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#3B82F6"
                />
                <Text style={styles.infoText}>
                  Thông tin: Lịch học sẽ được cập nhật cho các buổi tiếp theo.
                </Text>
              </View>

              <View style={styles.warningContainer}>
                <Ionicons name="warning-outline" size={20} color="#F59E0B" />
                <Text style={styles.warningText}>
                  Chỉ có thể thay đổi lịch học trước {changeScheduleBeforeHours}{" "}
                  giờ trước khi buổi học bắt đầu.
                </Text>
              </View>
              {/* Day of Week - Simplified as Text for now since changing day might be complex logic */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Thứ</Text>
                <View style={styles.disabledInput}>
                  <Text style={styles.inputText}>
                    {editingSchedule &&
                      DAYS_OF_WEEK_VI[
                        [
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                          "Sunday",
                        ].indexOf(editingSchedule.dayOfWeek)
                      ]}
                  </Text>
                </View>
              </View>

              {/* Start Time */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Giờ bắt đầu</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={styles.inputText}>
                    {format(startTime, "HH:mm")}
                  </Text>
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
                {showStartTimePicker && (
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onStartTimeChange}
                    themeVariant="light"
                    textColor="#000000"
                  />
                )}
              </View>

              {/* End Time */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Giờ kết thúc</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text style={styles.inputText}>
                    {format(endTime, "HH:mm")}
                  </Text>
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
                {showEndTimePicker && (
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onEndTimeChange}
                    themeVariant="light"
                    textColor="#000000"
                  />
                )}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  badge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  sessionCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sessionNumber: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sessionNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  totalSessions: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  editButton: {
    padding: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
  },
  disabledInput: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
  },
  inputText: {
    fontSize: 16,
    color: "#1F2937",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#059669",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1D4ED8",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#B45309",
  },
});

export default ScheduleTab;
