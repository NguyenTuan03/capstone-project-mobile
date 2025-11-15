import { Course } from "@/types/course";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  course: Course;
  statusLabel: string;
  statusColors: { bg: string; text: string };
  levelLabel?: string;
  levelColors?: { bg: string; text: string };
  onBack: () => void;
};

const CourseHeader: React.FC<Props> = ({
  course,
  statusLabel,
  statusColors,
  levelLabel,
  levelColors,
  onBack,
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="close" size={24} color="#111827" />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {course.name}
        </Text>
        <View style={styles.headerBadges}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
              {statusLabel}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: levelColors?.bg || "#EFF6FF" }]}>
            <Text style={[styles.statusBadgeText, { color: levelColors?.text || "#3B82F6" }]}>
              {levelLabel || course.level}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: "#F3F4F6" }]}>
            <Text style={[styles.statusBadgeText, { color: "#6B7280" }]}>
              {course.learningFormat === "GROUP" ? "Nhóm" : "Cá nhân"}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },
  headerBadges: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  placeholder: {
    width: 32,
  },
});

export default CourseHeader;


