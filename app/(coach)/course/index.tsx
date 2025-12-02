import CourseList from "@/components/coach/course/courseManage/CourseList";
import CourseSearchBar from "@/components/coach/course/courseManage/CourseSearchBar";
import CourseTabs from "@/components/coach/course/courseManage/CourseTabs";
import type { CourseTabKey } from "@/components/coach/course/courseManage/types";
import configurationService from "@/services/configurationService";
import { get } from "@/services/http/httpService";
import storageService from "@/services/storageService";
import { Course } from "@/types/course";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StatusBar, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CoursesResponse = {
  items: Course[];
  page: number;
  pageSize: number;
  total: number;
};

export default function CoachCourseScreen() {
  const [activeTab, setActiveTab] = useState<CourseTabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [platformFee, setPlatformFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const coursesData = {
    all: total,
    ongoing: courses.filter((c) => c.status === "APPROVED").length,
    completed: courses.filter((c) => c.status === "COMPLETED").length,
  };

  const fetchCourses = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const user = await storageService.getUser();
        if (!user?.id) {
          return;
        }

        const url = `/v1/courses/coach?page=${pageNum}&pageSize=${pageSize}`;
        const res = await get<CoursesResponse>(url);

        if (append) {
          setCourses((prev) => [...prev, ...(res.data.items || [])]);
        } else {
          setCourses(res.data.items || []);
        }

        setTotal(res.data.total || 0);
        setPage(res.data.page || 1);
      } catch (error) {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      } finally {
        if (!append) {
          setLoading(false);
        }
        setLoadingMore(false);
      }
    },
    [pageSize]
  );

  const fetchPlatformFee = async () => {
    try {
      const res = await configurationService.getConfiguration(
        "platform_fee_per_percentage"
      );
      setPlatformFee(parseFloat(res?.value || "0"));
    } catch (error) {}
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && !loading && courses.length < total && page > 0) {
      fetchCourses(page + 1, true);
    }
  }, [loadingMore, loading, courses.length, total, page, fetchCourses]);

  useFocusEffect(
    useCallback(() => {
      fetchCourses(1, false);
      fetchPlatformFee();
    }, [fetchCourses])
  );

  const filteredCourses = useMemo(() => {
    if (activeTab === "ongoing") {
      return courses.filter((c) => c.status === "APPROVED");
    }
    if (activeTab === "completed") {
      return courses.filter((c) => c.status === "COMPLETED");
    }
    return courses;
  }, [activeTab, courses]);

  const hasMore = courses.length < total;

  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F3F4F6",
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#059669" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        scrollIndicatorInsets={{ right: 1 }}
        onScroll={(e) => {
          const { layoutMeasurement, contentOffset, contentSize } =
            e.nativeEvent;
          const paddingToBottom = insets.bottom;
          if (
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom
          ) {
            if (hasMore && !loadingMore && !loading) {
              loadMore();
            }
          }
        }}
        scrollEventThrottle={400}
      >
        <CourseTabs
          activeTab={activeTab}
          counts={coursesData}
          onChange={setActiveTab}
        />

        <CourseSearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Courses List */}
        <CourseList
          courses={filteredCourses}
          loading={loading}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          platformFee={platformFee}
          onPressCourse={(course) =>
            router.push({
              pathname: "/(coach)/course/[id]",
              params: { id: String(course.id) },
            } as any)
          }
        />
      </ScrollView>

      {/* Create Course Button - Circular FAB */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 44,
          right: 16,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#059669",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#059669",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
          zIndex: 10,
        }}
        onPress={() => router.push("/(coach)/course/create" as any)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}
