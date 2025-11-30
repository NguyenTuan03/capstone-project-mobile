import { Ionicons } from "@expo/vector-icons";
import type { FC } from "react";
import { memo, useMemo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

import type { Course } from "@/types/course";

import { formatCoursePrice } from "./helpers";
import styles from "./styles";

type CourseCardProps = {
  course: Course;
  coachRating?: number;
  onPress: () => void;
};

const CourseCardComponent: FC<CourseCardProps> = ({
  course,
  coachRating,
  onPress,
}) => {
  const levelMeta = useMemo(() => {
    const label =
      course.level === "BEGINNER"
        ? "Cơ bản"
        : course.level === "INTERMEDIATE"
        ? "Trung bình"
        : "Nâng cao";

    const color =
      course.level === "BEGINNER"
        ? { bg: "#DBEAFE", text: "#0284C7" }
        : course.level === "INTERMEDIATE"
        ? { bg: "#FCD34D", text: "#92400E" }
        : { bg: "#DDD6FE", text: "#4F46E5" };

    return { label, color };
  }, [course.level]);

  const participantPercentage = useMemo(() => {
    return Math.min(
      (course.currentParticipants / course.maxParticipants) * 100,
      100
    );
  }, [course.currentParticipants, course.maxParticipants]);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.cardImageWrapper}>
        <Image
          source={{
            uri: "https://via.placeholder.com/400x160?text=Course",
          }}
          style={styles.cover}
        />

        <View style={styles.formatBadgeContainer}>
          <View
            style={[
              styles.formatBadge,
              {
                backgroundColor:
                  course.learningFormat === "INDIVIDUAL"
                    ? "#E0E7FF"
                    : "#DBEAFE",
              },
            ]}
          >
            <Text
              style={[
                styles.formatBadgeText,
                {
                  color:
                    course.learningFormat === "INDIVIDUAL"
                      ? "#4C1D95"
                      : "#0284C7",
                },
              ]}
            >
              {course.learningFormat === "INDIVIDUAL" ? "Cá nhân" : "Nhóm"}
            </Text>
          </View>
        </View>

        {(course.status === "FULL" || course.status === "READY_OPENED") && (
          <View style={styles.statusBadgeContainer}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    course.status === "FULL" ? "#DBEAFE" : "#DCFCE7",
                },
              ]}
            >
              <Ionicons
                name={
                  course.status === "FULL"
                    ? "alert-circle-outline"
                    : "checkmark-circle-outline"
                }
                size={11}
                color={course.status === "FULL" ? "#0284C7" : "#16A34A"}
                style={{ marginRight: 3 }}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color: course.status === "FULL" ? "#0284C7" : "#16A34A",
                  },
                ]}
                numberOfLines={1}
              >
                {course.status === "FULL" ? "Đã đủ" : "Sắp khai giảng"}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {course.name}
        </Text>

        <View style={styles.coachRow}>
          <Ionicons
            name="person-circle"
            size={16}
            color="#059669"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.courseCoach} numberOfLines={1}>
            {course.createdBy?.fullName || "Huấn luyện viên"}
          </Text>
          {coachRating !== undefined && (
            <>
              <Ionicons
                name="star"
                size={13}
                color="#FBBF24"
                style={{ marginLeft: 6 }}
              />
              <Text
                style={[styles.courseCoach, { marginLeft: 3, fontWeight: "600" }]}
              >
                {coachRating.toFixed(1)}
              </Text>
            </>
          )}
        </View>

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={13}
            color="#6B7280"
            style={{ marginRight: 5 }}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {course.court?.address || "Chưa xác định"}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View
            style={[styles.levelBadge, { backgroundColor: levelMeta.color.bg }]}
          >
            <Text
              style={[styles.levelBadgeText, { color: levelMeta.color.text }]}
            >
              {levelMeta.label}
            </Text>
          </View>

          <Text style={styles.price}>
            {formatCoursePrice(course.pricePerParticipant)}
          </Text>
        </View>

        <View style={styles.participantInfoSection}>
          <View style={styles.participantProgressContainer}>
            <View style={styles.participantProgressBar}>
              <View
                style={[
                  styles.participantProgressFill,
                  { width: `${participantPercentage}%` },
                ]}
              />
            </View>
            <View style={styles.participantStatsRow}>
              <View style={styles.participantStat}>
                <Ionicons
                  name="people"
                  size={14}
                  color="#059669"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.participantStatText}>
                  {course.currentParticipants}/{course.maxParticipants}
                </Text>
              </View>
              <View style={styles.participantDividerSmall} />
              <View style={styles.participantStat}>
                <Ionicons
                  name="alert-circle-outline"
                  size={14}
                  color="#6B7280"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.participantStatTextSmall}>
                  Tối thiểu: {course.minParticipants}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CourseCard = memo(CourseCardComponent);
CourseCard.displayName = "CourseCard";

export default CourseCard;

