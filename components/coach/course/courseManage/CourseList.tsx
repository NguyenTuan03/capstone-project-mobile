import { Ionicons } from "@expo/vector-icons";
import type { FC } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import type { Course } from "@/types/course";

import CourseCard from "./CourseCard";

type CourseListProps = {
  courses: Course[];
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  platformFee: number;
  onPressCourse: (course: Course) => void;
};

const CourseList: FC<CourseListProps> = ({
  courses,
  loading,
  hasMore,
  loadingMore,
  onLoadMore,
  platformFee,
  onPressCourse,
}) => {
  if (loading) {
    return (
      <View
        style={{
          paddingHorizontal: 12,
          paddingBottom: 20,
        }}
      >
        <View
          style={{
            padding: 30,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color="#059669" />
          <Text
            style={{
              marginTop: 10,
              fontSize: 13,
              color: "#6B7280",
            }}
          >
            Đang tải danh sách khóa học...
          </Text>
        </View>
      </View>
    );
  }

  if (courses.length === 0) {
    return (
      <View
        style={{
          paddingHorizontal: 12,
          paddingBottom: 20,
        }}
      >
        <View
          style={{
            padding: 30,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="book-outline" size={44} color="#9CA3AF" />
          <Text
            style={{
              marginTop: 10,
              fontSize: 13,
              color: "#6B7280",
            }}
          >
            Chưa có khóa học nào
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 12, paddingBottom: 20 }}>
      {courses?.length > 0 && courses?.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          platformFee={platformFee}
          onPress={() => onPressCourse(course)}
        />
      ))}

      {hasMore && (
        <View style={{ paddingVertical: 16, alignItems: "center" }}>
          {loadingMore ? (
            <ActivityIndicator size="small" color="#059669" />
          ) : (
            <TouchableOpacity
              onPress={onLoadMore}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 9,
                backgroundColor: "#FFFFFF",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#D1D5DB",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: "#374151",
                  fontWeight: "600",
                }}
              >
                Tải thêm
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default CourseList;

