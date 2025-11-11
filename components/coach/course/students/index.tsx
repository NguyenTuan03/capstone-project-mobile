import { Course } from "@/types/course";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type Props = {
  course: Course;
};

const StudentsTab: React.FC<Props> = ({ course }) => {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danh sách học viên</Text>
        {course.currentParticipants === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Chưa có học viên nào</Text>
          </View>
        ) : (
          <View>
            <View style={{ marginBottom: 12 }}>
              {course.enrollments && course.enrollments.length > 0 ? (
                course.enrollments.map((e) => {
                  const name = e.user.fullName || "Người dùng";
                  const initials = name
                    .split(" ")
                    .filter(Boolean)
                    .slice(-2)
                    .map((s) => s[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <View
                      key={e.id}
                      style={styles.studentItem}
                    >
                      <View style={styles.avatar}>
                        <Text style={{ fontWeight: "700", color: "#374151" }}>
                          {initials}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName}>
                          {name}
                        </Text>
                        {e.user.email ? (
                          <Text style={styles.studentEmail}>
                            {e.user.email}
                          </Text>
                        ) : null}
                      </View>

                      <View style={{ marginLeft: 8, alignItems: "flex-end" }}>
                        <Text style={styles.paidLabel}>
                          Đã thanh toán
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyText}>Chưa có học viên</Text>
                </View>
              )}
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.infoLabel}>Tổng số học viên</Text>
              <Text style={styles.totalValue}>
                {course.currentParticipants}
              </Text>
            </View>
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
    borderRadius: 12,
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
  studentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  studentEmail: { fontSize: 13, color: "#6B7280" },
  paidLabel: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0,
  },
  infoLabel: { fontSize: 14, color: "#6B7280", flex: 1 },
  totalValue: { color: "#059669", fontWeight: "700", fontSize: 14 },
});

export default StudentsTab;


