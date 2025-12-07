import { Ionicons } from "@expo/vector-icons";
import type { FC } from "react";
import { memo } from "react";
import type { TextStyle } from "react-native";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Course } from "@/types/course";
import {
  formatSchedule,
  getLevelColor,
  getLevelLabel,
  getStatusColor,
  getStatusLabel,
} from "@/utils/courseUtilFormat";

import RevenueTooltip from "./RevenueTooltip";

type CourseCardProps = {
  course: Course;
  platformFee: number;
  onPress: () => void;
};

const CourseCardComponent: FC<CourseCardProps> = ({
  course,
  platformFee,
  onPress,
}) => {
  const statusColors = getStatusColor(course.status);
  const levelColors = getLevelColor(course.level);
  const levelLabel = getLevelLabel(course.level);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.card}
      onPress={onPress}
    >
      {course.publicUrl ? (
        <Image
          source={{ uri: course.publicUrl }}
          style={styles.courseImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.courseImagePlaceholder}>
          <Ionicons name="image-outline" size={18} color="#9CA3AF" />
          <Text style={styles.courseImagePlaceholderText}>
            Chưa có ảnh
          </Text>
        </View>
      )}

      <View style={styles.contentSection}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {course.name}
        </Text>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.badgeText, { color: statusColors.text }]}>
              {getStatusLabel(course.status)}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: levelColors.bg }]}>
            <Text style={[styles.badgeText, { color: levelColors.text }]}>
              {levelLabel}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {course.learningFormat === "GROUP" ? "Nhóm" : "Cá nhân"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <DetailRow
          icon="time-outline"
          text={formatSchedule(course.schedules)}
        />
        <DetailRow
          icon="map-outline"
          text={course?.court?.address}
        />
        <DetailRow
          icon="calendar-outline"
          text={`${new Date(course.startDate).toLocaleDateString("vi-VN")}${
            course.endDate
              ? ` - ${new Date(course.endDate).toLocaleDateString("vi-VN")}`
              : ""
          }`}
        />

        <View style={styles.footerRow}>
          <View style={styles.participantsRow}>
            <Ionicons name="people-outline" size={14} color="#6B7280" />
            <Text style={styles.participantsText}>
              {course.currentParticipants}/{course.maxParticipants}
            </Text>
          </View>
          <RevenueTooltip course={course} platformFee={platformFee} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const DetailRow: FC<{
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  extraStyle?: Partial<TextStyle>;
}> = ({ icon, text }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={14} color="#6B7280" />
    <Text style={styles.detailText} numberOfLines={1}>
      {text}
    </Text>
  </View>
);

const CourseCard = memo(CourseCardComponent);
CourseCard.displayName = "CourseCard";

export default CourseCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  courseImage: {
    width: "100%",
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: "#E5E7EB",
  },
  courseImagePlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  courseImagePlaceholderText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  contentSection: {
    gap: 5,
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.2,
  },
  detailsSection: {
    gap: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  detailText: {
    fontSize: 11,
    color: "#6B7280",
    flex: 1,
    fontWeight: "500",
    lineHeight: 15,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 1,
  },
  participantsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  participantsText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },
});
