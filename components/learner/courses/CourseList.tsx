import type { FC } from "react";
import { memo } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import type { Course } from "@/types/course";

import CourseCard from "./CourseCard";
import styles from "./styles";

type CourseListProps = {
  courses: Course[];
  loading: boolean;
  loadingMore: boolean;
  total: number;
  coachRatings: Record<number, number>;
  onLoadMore: () => void;
  onSelectCourse: (course: Course) => void;
};

const CourseListComponent: FC<CourseListProps> = ({
  courses,
  loading,
  loadingMore,
  total,
  coachRatings,
  onLoadMore,
  onSelectCourse,
}) => {
  if (loading) {
    return (
      <View style={{ padding: 40, alignItems: "center" }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (courses.length === 0) {
    return (
      <View style={{ padding: 40, alignItems: "center" }}>
        <Text style={{ color: "#6B7280", fontSize: 14 }}>
          Không có khóa học nào
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          coachRating={
            course.createdBy?.id
              ? coachRatings[course.createdBy.id]
              : undefined
          }
          onPress={() => onSelectCourse(course)}
        />
      ))}

      {loadingMore && (
        <View style={{ padding: 20, alignItems: "center" }}>
          <ActivityIndicator size="small" color="#10B981" />
        </View>
      )}

      {!loadingMore && courses.length < total && (
        <TouchableOpacity
          style={styles.loadMoreBtn}
          onPress={onLoadMore}
          activeOpacity={0.8}
        >
          <Text style={styles.loadMoreText}>Tải thêm</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const CourseList = memo(CourseListComponent);
CourseList.displayName = "CourseList";

export default CourseList;

