import { DAYS_OF_WEEK_VI } from "@/components/common/AppEnum";
import configurationService from "@/services/configurationService";
import { get } from "@/services/http/httpService";
import storageService from "@/services/storageService";
import { Course } from "@/types/course";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
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
  const [activeTab, setActiveTab] = useState("all");
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

        const url = `/v1/courses?page=${pageNum}&size=${pageSize}&filter=createdBy.id_eq_${user?.id}`;
        const res = await get<CoursesResponse>(url);

        if (append) {
          setCourses((prev) => [...prev, ...(res.data.items || [])]);
        } else {
          setCourses(res.data.items || []);
        }

        setTotal(res.data.total || 0);
        setPage(res.data.page || 1);
      } catch (error) {
        console.error("Lỗi khi tải danh sách khóa học:", error);
      } finally {
        setLoading(false);
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

  const loadMore = () => {
    if (!loadingMore && courses.length < total) {
      fetchCourses(page + 1, true);
    }
  };

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

  const filteredCourses =
    activeTab === "all"
      ? courses
      : activeTab === "ongoing"
      ? courses.filter((c) => c.status === "APPROVED")
      : courses.filter((c) => c.status === "COMPLETED");

  const hasMore = courses.length < total;

  const RevenueTooltip = ({ course }: { course: Course }) => {
    const [visible, setVisible] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const tooltipAnim = useRef(new Animated.Value(0)).current;
    const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

    const startPulse = () => {
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoopRef.current.start();
    };

    const stopPulse = () => {
      if (pulseLoopRef.current) {
        pulseLoopRef.current.stop();
        pulseLoopRef.current = null;
      }
      // ensure scale returns to 1
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    };

    useEffect(() => {
      // start pulse initially
      startPulse();
      return () => {
        stopPulse();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (visible) {
        // stop pulse and show tooltip with fade+slide
        stopPulse();
        Animated.timing(tooltipAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      } else {
        // hide tooltip and resume pulse
        Animated.timing(tooltipAnim, {
          toValue: 0,
          duration: 120,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) startPulse();
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const AnimatedTouchable =
      Animated.createAnimatedComponent(TouchableOpacity);

    const tooltipTranslateY = tooltipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [8, 0],
    });

    return (
      <>
        <AnimatedTouchable
          activeOpacity={0.8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            transform: [{ scale: pulseAnim }],
          }}
          onPress={() => setVisible((v: boolean) => !v)}
        >
          <Ionicons name="trending-up" size={18} color="#059669" />
          <Text style={{ fontSize: 12, color: "#6B7280", marginLeft: 6 }}>
            Doanh thu
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color: "#059669",
              marginLeft: 8,
            }}
          >
            {formatPrice(course.totalEarnings)}
          </Text>
        </AnimatedTouchable>

        <Animated.View
          pointerEvents={visible ? "auto" : "none"}
          style={{
            position: "absolute",
            bottom: 44,
            right: 0,
            backgroundColor: "#111827",
            padding: 10,
            borderRadius: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 6,
            maxWidth: 220,
            opacity: tooltipAnim,
            transform: [{ translateY: tooltipTranslateY }],
          }}
        >
          <Text style={{ color: "#F9FAFB", fontSize: 12 }}>
            Đã trừ phí nền tảng
          </Text>
          <Text
            style={{
              color: "#cf2d2dff",
              fontSize: 13,
              fontWeight: "700",
              marginTop: 4,
            }}
          >
            {`- ${platformFee}%`}
          </Text>
          <TouchableOpacity
            onPress={() => setVisible(false)}
            style={{ marginTop: 6 }}
          >
            <Text
              style={{ color: "#9CA3AF", fontSize: 11, textAlign: "right" }}
            >
              Đóng
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </>
    );
  };

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
            if (hasMore && !loadingMore) {
              loadMore();
            }
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Tabs */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            paddingHorizontal: 12,
            paddingTop: 12,
            paddingBottom: 6,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              marginBottom: 6,
              backgroundColor: activeTab === "all" ? "#EFF6FF" : "#F9FAFB",
            }}
            onPress={() => setActiveTab("all")}
          >
            <Ionicons
              name="book"
              size={18}
              color={activeTab === "all" ? "#059669" : "#6B7280"}
            />
            <Text
              style={{
                fontSize: 13,
                color: activeTab === "all" ? "#059669" : "#6B7280",
                marginLeft: 8,
                flex: 1,
                fontWeight: activeTab === "all" ? "600" : "400",
              }}
            >
              Tất cả khóa học
            </Text>
            <View
              style={{
                backgroundColor: activeTab === "all" ? "#DBEAFE" : "#E5E7EB",
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: activeTab === "all" ? "#059669" : "#374151",
                  fontWeight: "600",
                }}
              >
                {coursesData.all}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              marginBottom: 6,
              backgroundColor: activeTab === "ongoing" ? "#EFF6FF" : "#F9FAFB",
            }}
            onPress={() => setActiveTab("ongoing")}
          >
            <Ionicons
              name="time"
              size={18}
              color={activeTab === "ongoing" ? "#059669" : "#6B7280"}
            />
            <Text
              style={{
                fontSize: 13,
                color: activeTab === "ongoing" ? "#059669" : "#6B7280",
                marginLeft: 8,
                flex: 1,
                fontWeight: activeTab === "ongoing" ? "600" : "400",
              }}
            >
              Đang diễn ra
            </Text>
            <View
              style={{
                backgroundColor:
                  activeTab === "ongoing" ? "#DBEAFE" : "#E5E7EB",
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: activeTab === "ongoing" ? "#059669" : "#374151",
                  fontWeight: "600",
                }}
              >
                {coursesData.ongoing}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              marginBottom: 6,
              backgroundColor:
                activeTab === "completed" ? "#EFF6FF" : "#F9FAFB",
            }}
            onPress={() => setActiveTab("completed")}
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={activeTab === "completed" ? "#059669" : "#6B7280"}
            />
            <Text
              style={{
                fontSize: 13,
                color: activeTab === "completed" ? "#059669" : "#6B7280",
                marginLeft: 8,
                flex: 1,
                fontWeight: activeTab === "completed" ? "600" : "400",
              }}
            >
              Đã hoàn thành
            </Text>
            <View
              style={{
                backgroundColor:
                  activeTab === "completed" ? "#DBEAFE" : "#E5E7EB",
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: activeTab === "completed" ? "#059669" : "#374151",
                  fontWeight: "600",
                }}
              >
                {coursesData.completed}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            marginHorizontal: 12,
            marginTop: 12,
            marginBottom: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 13,
              color: "#111827",
            }}
            placeholder="Tìm kiếm khóa học..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

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
                            backgroundColor: "#EFF6FF",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              color: "#3B82F6",
                              fontWeight: "600",
                            }}
                          >
                            {course.level}
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
                          {course.subject.name}
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
                          Địa điểm: {course.address} - {course.court?.district?.name} - {course.court?.province?.name}
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
                          <RevenueTooltip course={course} />
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

      {/* Create Course Button */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          left: 16,
          backgroundColor: "#059669",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 14,
          borderRadius: 8,
          shadowColor: "#059669",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 3,
          zIndex: 10,
        }}
        onPress={() => router.push("/(coach)/course/create" as any)}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: "700",
            marginLeft: 8,
            letterSpacing: 0.3,
          }}
        >
          Tạo khóa học
        </Text>
      </TouchableOpacity>
    </View>
  );
}
