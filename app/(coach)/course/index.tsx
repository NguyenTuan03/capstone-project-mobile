import CourseSearchBar from "@/components/coach/course/courseManage/CourseSearchBar";
import CourseTabs from "@/components/coach/course/courseManage/CourseTabs";
import RevenueTooltip from "@/components/coach/course/courseManage/RevenueTooltip";
import type { CourseTabKey } from "@/components/coach/course/courseManage/types";
import { DAYS_OF_WEEK_VI } from "@/components/common/AppEnum";
import configurationService from "@/services/configurationService";
import { get } from "@/services/http/httpService";
import storageService from "@/services/storageService";
import { Course } from "@/types/course";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
          console.error("User ID không tồn tại");
          return;
        }

        const url = `/v1/courses/coach?page=${pageNum}&pageSize=${pageSize}`;
        const res = await get<CoursesResponse>(url);
        console.log("a====", res.data.items);
        if (append) {
          setCourses((prev) => [...prev, ...(res.data.items || [])]);
        } else {
          setCourses(res.data.items || []);
        }

        setTotal(res.data.total || 0);
        setPage(res.data.page || 1);
      } catch (error) {
        console.error("Lỗi khi tải danh sách khóa học:", error);
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
    } catch (error) {
      console.error("Lỗi khi tải phí nền tảng:", error);
    }
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

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    return new Intl.NumberFormat("vi-VN").format(numPrice) + "đ";
  };

  const formatSchedule = (schedules: Course["schedules"]) => {
    if (!schedules || schedules.length === 0) return "Chưa có lịch";

    return schedules
      .map((schedule) => {
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
        return `${dayName}: ${startTime}-${endTime}`;
      })
      .join(", ");
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      APPROVED: "Đã duyệt",
      PENDING_APPROVAL: "Chờ duyệt",
      REJECTED: "Đã từ chối",
      COMPLETED: "Đã hoàn thành",
      ON_GOING: "Đang diễn ra",
      CANCELLED: "Đã hủy",
      FULL: "Đủ học viên",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      APPROVED: { bg: "#D1FAE5", text: "#059669" },
      PENDING_APPROVAL: { bg: "#FEF3C7", text: "#D97706" },
      REJECTED: { bg: "#FEE2E2", text: "#DC2626" },
      COMPLETED: { bg: "#E0F2FE", text: "#0284C7" },
    };
    return colorMap[status] || { bg: "#F3F4F6", text: "#6B7280" };
  };

  const getLevelLabel = (level?: string) => {
    const levelMap: Record<string, string> = {
      BEGINNER: "Cơ bản",
      INTERMEDIATE: "Trung cấp",
      ADVANCED: "Nâng cao",
    };
    return levelMap[level ?? ""] ?? level ?? "";
  };

  const getLevelColor = (level?: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      BEGINNER: { bg: "#DBEAFE", text: "#0284C7" },
      INTERMEDIATE: { bg: "#FCD34D", text: "#92400E" },
      ADVANCED: { bg: "#DDD6FE", text: "#4F46E5" },
    };
    return colorMap[level ?? ""] || { bg: "#F3F4F6", text: "#6B7280" };
  };

  const filteredCourses =
    activeTab === "all"
      ? courses
      : activeTab === "ongoing"
      ? courses.filter((c) => c.status === "APPROVED")
      : courses.filter((c) => c.status === "COMPLETED");

  const hasMore = courses.length < total;

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
        contentContainerStyle={{ paddingBottom: 20 }}
        scrollIndicatorInsets={{ right: 1 }}
        onScroll={(e) => {
          const { layoutMeasurement, contentOffset, contentSize } =
            e.nativeEvent;
          const paddingToBottom = 20;
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
        <View style={{ paddingHorizontal: 12, paddingBottom: 20 }}>
          {loading ? (
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
          ) : filteredCourses.length === 0 ? (
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
          ) : (
            <>
              {filteredCourses.map((course) => {
                const statusColors = getStatusColor(course.status);
                const levelColors = getLevelColor(course.level);
                const levelLabel = getLevelLabel(course.level);
                return (
                  <TouchableOpacity
                    key={course.id}
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
                    onPress={() =>
                      router.push({
                        pathname: "/(coach)/course/[id]",
                        params: { id: String(course.id) },
                      } as any)
                    }
                  >
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
                            {course.learningFormat === "GROUP"
                              ? "Nhóm"
                              : "Cá nhân"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <Ionicons
                          name="book-outline"
                          size={15}
                          color="#6B7280"
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#6B7280",
                            marginLeft: 7,
                            flex: 1,
                          }}
                        >
                          {course.name}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <Ionicons
                          name="time-outline"
                          size={15}
                          color="#6B7280"
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#6B7280",
                            marginLeft: 7,
                            flex: 1,
                            lineHeight: 18,
                          }}
                        >
                          {formatSchedule(course.schedules)}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <Ionicons
                          name="map-outline"
                          size={15}
                          color="#6B7280"
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#6B7280",
                            marginLeft: 7,
                          }}
                        >
                          Địa điểm: {course?.court?.address}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={15}
                          color="#6B7280"
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#6B7280",
                            marginLeft: 7,
                          }}
                        >
                          Bắt đầu:{" "}
                          {new Date(course.startDate).toLocaleDateString(
                            "vi-VN"
                          )}
                          {course.endDate &&
                            ` - Kết thúc: ${new Date(
                              course.endDate
                            ).toLocaleDateString("vi-VN")}`}
                        </Text>
                      </View>
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
                          <Ionicons
                            name="people-outline"
                            size={15}
                            color="#6B7280"
                          />
                          <Text
                            style={{
                              fontSize: 13,
                              color: "#6B7280",
                              marginLeft: 7,
                            }}
                          >
                            {course.currentParticipants}/
                            {course.maxParticipants} học viên
                          </Text>
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            position: "relative",
                          }}
                        >
                          <RevenueTooltip
                            course={course}
                            platformFee={platformFee}
                          />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Load More */}
              {hasMore && (
                <View style={{ paddingVertical: 16, alignItems: "center" }}>
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#059669" />
                  ) : (
                    <TouchableOpacity
                      onPress={loadMore}
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
            </>
          )}
        </View>
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
