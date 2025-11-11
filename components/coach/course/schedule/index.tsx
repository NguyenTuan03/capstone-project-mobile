import { DAYS_OF_WEEK_VI } from "@/components/common/AppEnum";
import { Course } from "@/types/course";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type Props = {
  course: Course;
};

const ScheduleTab: React.FC<Props> = ({ course }) => {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch học chi tiết</Text>

        {course.schedules && course.schedules.length > 0 ? (
          course.schedules.map((schedule, index) => {
            const dayIndex = [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].indexOf(schedule.dayOfWeek);
            const dayName =
              dayIndex >= 0 ? DAYS_OF_WEEK_VI[dayIndex] : schedule.dayOfWeek;
            const startTime = schedule.startTime.substring(0, 5);
            const endTime = schedule.endTime.substring(0, 5);

            return (
              <View key={`${schedule.id}-${index}`} style={styles.sessionCard}>
                <View style={styles.sessionNumber}>
                  <Text style={styles.sessionNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName}>
                    {dayName} ({schedule.totalSessions} buổi)
                  </Text>
                  <Text style={styles.sessionTime}>
                    {startTime} - {endTime}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Chưa có lịch học</Text>
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tabContent: { flex: 1 },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
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
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  sessionNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sessionNumberText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 2,
  },
});

export default ScheduleTab;


