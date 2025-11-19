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
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      }}
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
            Chưa có ảnh khóa học
          </Text>
        </View>
      )}
      <View style={{ marginBottom: 10 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 6,
            lineHeight: 20,
          }}
        >
          {course.name}
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              backgroundColor: statusColors.bg,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: statusColors.text,
              }}
            >
              {getStatusLabel(course.status)}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              backgroundColor: levelColors.bg,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: levelColors.text,
                fontWeight: "600",
              }}
            >
              {levelLabel}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              backgroundColor: "#F3F4F6",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: "#6B7280",
                fontWeight: "600",
              }}
            >
              {course.learningFormat === "GROUP" ? "Nhóm" : "Cá nhân"}
            </Text>
          </View>
        </View>
      </View>

      <View>
        <DetailRow icon="book-outline" text={course.subject.name} />
        <DetailRow
          icon="time-outline"
          text={formatSchedule(course.schedules)}
          extraStyle={{ lineHeight: 18 }}
        />
        <DetailRow
          icon="map-outline"
          text={`Địa điểm: ${course?.court?.address}`}
        />
        <DetailRow
          icon="calendar-outline"
          text={`Bắt đầu: ${new Date(course.startDate).toLocaleDateString(
            "vi-VN"
          )}${
            course.endDate
              ? ` - Kết thúc: ${new Date(course.endDate).toLocaleDateString(
                  "vi-VN"
                )}`
              : ""
          }`}
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flex: 1,
            }}
          >
            <Ionicons name="people-outline" size={15} color="#6B7280" />
            <Text
              style={{
                fontSize: 13,
                color: "#6B7280",
                marginLeft: 7,
              }}
            >
              {course.currentParticipants}/{course.maxParticipants} học viên
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              position: "relative",
            }}
          >
            <RevenueTooltip course={course} platformFee={platformFee} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const DetailRow: FC<{
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  extraStyle?: Partial<TextStyle>;
}> = ({ icon, text, extraStyle }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    }}
  >
    <Ionicons name={icon} size={15} color="#6B7280" />
    <Text
      style={{
        fontSize: 13,
        color: "#6B7280",
        marginLeft: 7,
        flex: 1,
        ...(extraStyle || {}),
      }}
    >
      {text}
    </Text>
  </View>
);

const CourseCard = memo(CourseCardComponent);
CourseCard.displayName = "CourseCard";

export default CourseCard;

const styles = StyleSheet.create({
  courseImage: {
    width: "100%",
    height: 170,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#E5E7EB",
  },
  courseImagePlaceholder: {
    width: "100%",
    height: 170,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  courseImagePlaceholderText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
});
