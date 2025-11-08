import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CoachCalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(6);

  const daysOfWeek = [
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
    "CN",
  ];

  // Sample calendar data
  const calendarData = [
    { date: 1, classes: [{ time: "14:00", duration: "1HV" }] },
    { date: 2, classes: [] },
    { date: 3, classes: [{ time: "14:00", duration: "4HV" }] },
    { date: 4, classes: [] },
    {
      date: 5,
      classes: [
        { time: "14:00", duration: "1HV" },
        { time: "16:00", duration: "2HV" },
      ],
    },
    { date: 6, classes: [{ time: "14:00", duration: "4HV" }] },
    { date: 7, classes: [] },
    { date: 8, classes: [{ time: "14:00", duration: "2HV" }] },
    { date: 9, classes: [] },
    { date: 10, classes: [{ time: "14:00", duration: "2HV" }] },
    { date: 11, classes: [] },
    {
      date: 12,
      classes: [
        { time: "14:00", duration: "4HV" },
        { time: "16:00", duration: "2HV" },
      ],
    },
    { date: 13, classes: [] },
    { date: 14, classes: [] },
    { date: 15, classes: [{ time: "14:00", duration: "4HV" }] },
    { date: 16, classes: [] },
    { date: 17, classes: [{ time: "14:00", duration: "1HV" }] },
    { date: 18, classes: [] },
    {
      date: 19,
      classes: [
        { time: "14:00", duration: "1HV" },
        { time: "16:00", duration: "2HV" },
      ],
    },
    { date: 20, classes: [] },
    { date: 21, classes: [] },
    { date: 22, classes: [{ time: "14:00", duration: "2HV" }] },
    { date: 23, classes: [] },
    { date: 24, classes: [{ time: "14:00", duration: "4HV" }] },
    { date: 25, classes: [] },
    {
      date: 26,
      classes: [
        { time: "14:00", duration: "2HV" },
        { time: "16:00", duration: "2HV" },
      ],
    },
    { date: 27, classes: [] },
    { date: 28, classes: [] },
    { date: 29, classes: [] },
    { date: 30, classes: [] },
    { date: 31, classes: [] },
  ];

  const renderCalendarDay = (dayData: any, index: number) => {
    const dayOfWeek = daysOfWeek[index % 7];
    const isSelected = dayData.date === selectedDate;
    const hasClasses = dayData.classes.length > 0;

    return (
      <TouchableOpacity
        key={dayData.date}
        style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
        onPress={() => setSelectedDate(dayData.date)}
      >
        <Text style={styles.dayOfWeek}>{dayOfWeek}</Text>
        <Text
          style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}
        >
          {dayData.date}
        </Text>
        {hasClasses && (
          <View style={styles.classesContainer}>
            {dayData.classes.map((cls: any, idx: number) => (
              <View
                key={idx}
                style={[
                  styles.classChip,
                  cls.duration.includes("4") && styles.classChipGreen,
                  cls.duration.includes("2") && styles.classChipBlue,
                  cls.duration.includes("1") && styles.classChipGreen,
                ]}
              >
                <Text style={styles.classChipText}>
                  {cls.time} • {cls.duration}
                </Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch dạy tháng 10/2025</Text>
        <TouchableOpacity style={styles.todayButton}>
          <Text style={styles.todayButtonText}>Hôm nay</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          <View style={styles.weekHeader}>
            {daysOfWeek.map((day, index) => (
              <View key={index} style={styles.weekHeaderItem}>
                <Text style={styles.weekHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarData.map((dayData, index) =>
              renderCalendarDay(dayData, index)
            )}
          </View>
        </View>

        {/* Today's Classes Detail */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>Lịch dạy hôm nay - 6/10/2025</Text>

          <View style={styles.classDetailCard}>
            <View style={styles.classDetailHeader}>
              <View style={styles.classAvatar}>
                <Text style={styles.classAvatarText}>NVA</Text>
              </View>
              <View style={styles.classDetailInfo}>
                <Text style={styles.classDetailName}>
                  Pickleball cơ bản - Khóa 1
                </Text>
                <View style={styles.classBadge}>
                  <Text style={styles.classBadgeText}>Đang diễn ra</Text>
                </View>
              </View>
            </View>

            <View style={styles.classDetailBody}>
              <View style={styles.classDetailRow}>
                <Ionicons name="time-outline" size={18} color="#6B7280" />
                <Text style={styles.classDetailText}>14:00 - 15:30</Text>
              </View>
              <View style={styles.classDetailRow}>
                <Ionicons name="location-outline" size={18} color="#6B7280" />
                <Text style={styles.classDetailText}>
                  Sân Pickleball Bình Thạnh
                </Text>
              </View>
              <View style={styles.classDetailRow}>
                <Ionicons name="people-outline" size={18} color="#6B7280" />
                <Text style={styles.classDetailText}>4 học viên</Text>
              </View>
            </View>

            <View style={styles.classActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="videocam" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Vào lớp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButtonOutline}>
                <Ionicons name="calendar-outline" size={18} color="#059669" />
                <Text style={styles.actionButtonOutlineText}>Đổi lịch</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.classDetailCard}>
            <View style={styles.classDetailHeader}>
              <View
                style={[styles.classAvatar, { backgroundColor: "#3B82F6" }]}
              >
                <Text style={styles.classAvatarText}>TTB</Text>
              </View>
              <View style={styles.classDetailInfo}>
                <Text style={styles.classDetailName}>
                  Kỹ thuật nâng cao - Khóa 1
                </Text>
                <View
                  style={[styles.classBadge, { backgroundColor: "#FEF3C7" }]}
                >
                  <Text style={[styles.classBadgeText, { color: "#D97706" }]}>
                    Sắp diễn ra
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.classDetailBody}>
              <View style={styles.classDetailRow}>
                <Ionicons name="time-outline" size={18} color="#6B7280" />
                <Text style={styles.classDetailText}>16:00 - 17:30</Text>
              </View>
              <View style={styles.classDetailRow}>
                <Ionicons name="location-outline" size={18} color="#6B7280" />
                <Text style={styles.classDetailText}>Online qua Zoom</Text>
              </View>
              <View style={styles.classDetailRow}>
                <Ionicons name="people-outline" size={18} color="#6B7280" />
                <Text style={styles.classDetailText}>2 học viên</Text>
              </View>
            </View>

            <View style={styles.classActions}>
              <TouchableOpacity style={styles.actionButtonOutline}>
                <Ionicons name="eye-outline" size={18} color="#059669" />
                <Text style={styles.actionButtonOutlineText}>Xem chi tiết</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    flex: 1,
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
  calendarContainer: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  weekHeaderItem: {
    flex: 1,
    alignItems: "center",
  },
  weekHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 4,
    marginBottom: 8,
  },
  calendarDaySelected: {
    backgroundColor: "#DBEAFE",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#059669",
  },
  dayOfWeek: {
    fontSize: 10,
    color: "#9CA3AF",
    textAlign: "center",
  },
  dateNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginVertical: 2,
  },
  dateNumberSelected: {
    color: "#059669",
  },
  classesContainer: {
    marginTop: 2,
  },
  classChip: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
  },
  classChipGreen: {
    backgroundColor: "#D1FAE5",
  },
  classChipBlue: {
    backgroundColor: "#DBEAFE",
  },
  classChipText: {
    fontSize: 8,
    color: "#059669",
    fontWeight: "600",
    textAlign: "center",
  },
  todaySection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  classDetailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  classDetailHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },
  classAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  classAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  classDetailInfo: {
    flex: 1,
  },
  classDetailName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  classBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  classBadgeText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  classDetailBody: {
    marginBottom: 16,
  },
  classDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  classDetailText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
  },
  classActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonOutline: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonOutlineText: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "600",
  },
});
