import { DAYS_OF_WEEK_VI } from "@/components/common/AppEnum";
import configurationService from "@/services/configurationService";
import { get } from "@/services/http/httpService";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Course = {
  id: number;
  name: string;
  description: string;
  level: string;
  learningFormat: "GROUP" | "INDIVIDUAL";
  status: string;
  minParticipants: number;
  maxParticipants: number;
  pricePerParticipant: string;
  currentParticipants: number;
  totalSessions: number;
  totalEarnings: string;
  startDate: string;
  endDate: string | null;
  address: string;
  subject: {
    id: number;
    name: string;
  };
  schedules: {
    id: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
  province: {
    id: number;
    name: string;
  };
  district: {
    id: number;
    name: string;
  };
};

type CoursesResponse = {
  items: Course[];
  page: number;
  pageSize: number;
  total: number;
};

export default function CoachCourseScreen() {
  const insets = useSafeAreaInsets();
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

  const fetchCourses = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const url = `/v1/courses?page=${pageNum}&pageSize=${pageSize}`;
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
  };

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

  // Refresh khi màn hình được focus (quay lại từ create screen)
  useFocusEffect(
    useCallback(() => {
      fetchCourses(1, false);
      fetchPlatformFee();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
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
    // local require to avoid changing top-level imports

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

        {/*
          Tooltip is an Animated.View so it fades/slides into place.
          It's absolutely positioned relative to the parent container,
          same as the original implementation.
        */}
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
              fontSize: 14,
              fontWeight: "700",
              marginTop: 6,
            }}
          >
            {`- ${platformFee}%`}
          </Text>
          <TouchableOpacity
            onPress={() => setVisible(false)}
            style={{ marginTop: 8 }}
          >
            <Text
              style={{ color: "#9CA3AF", fontSize: 12, textAlign: "right" }}
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
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 50,
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#059669" />

      <ScrollView
        style={{ flex: 1 }}
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
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              marginBottom: 8,
              backgroundColor: activeTab === "all" ? "#EFF6FF" : "#F9FAFB",
            }}
            onPress={() => setActiveTab("all")}
          >
            <Ionicons
              name="book"
              size={20}
              color={activeTab === "all" ? "#059669" : "#6B7280"}
            />
            <Text
              style={{
                fontSize: 14,
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
                backgroundColor: "#E5E7EB",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "#374151",
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
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              marginBottom: 8,
              backgroundColor: activeTab === "ongoing" ? "#EFF6FF" : "#F9FAFB",
            }}
            onPress={() => setActiveTab("ongoing")}
          >
            <Ionicons
              name="time"
              size={20}
              color={activeTab === "ongoing" ? "#059669" : "#6B7280"}
            />
            <Text
              style={{
                fontSize: 14,
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
                backgroundColor: "#E5E7EB",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "#374151",
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
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              marginBottom: 8,
              backgroundColor:
                activeTab === "completed" ? "#EFF6FF" : "#F9FAFB",
            }}
            onPress={() => setActiveTab("completed")}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={activeTab === "completed" ? "#059669" : "#6B7280"}
            />
            <Text
              style={{
                fontSize: 14,
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
                backgroundColor: "#E5E7EB",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "#374151",
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
            marginHorizontal: 16,
            marginTop: 16,
            marginBottom: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 14,
              color: "#111827",
            }}
            placeholder="Tìm kiếm khóa học..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Courses List */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 100 }}>
          {loading ? (
            <View
              style={{
                padding: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator size="large" color="#059669" />
              <Text
                style={{
                  marginTop: 12,
                  fontSize: 14,
                  color: "#6B7280",
                }}
              >
                Đang tải danh sách khóa học...
              </Text>
            </View>
          ) : filteredCourses.length === 0 ? (
            <View
              style={{
                padding: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="book-outline" size={48} color="#9CA3AF" />
              <Text
                style={{
                  marginTop: 12,
                  fontSize: 14,
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
                  <View
                    key={course.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <View style={{ marginBottom: 12 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#111827",
                          marginBottom: 8,
                        }}
                      >
                        {course.name}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <View
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            backgroundColor: statusColors.bg,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "600",
                              color: statusColors.text,
                            }}
                          >
                            {getStatusLabel(course.status)}
                          </Text>
                        </View>
                        <View
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            backgroundColor: "#EFF6FF",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#3B82F6",
                              fontWeight: "600",
                            }}
                          >
                            {course.level}
                          </Text>
                        </View>
                        <View
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            backgroundColor: "#F3F4F6",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
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

                    <View style={{ marginBottom: 12 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Ionicons
                          name="book-outline"
                          size={16}
                          color="#6B7280"
                        />
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6B7280",
                            marginLeft: 8,
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
                          marginBottom: 8,
                        }}
                      >
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#6B7280"
                        />
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6B7280",
                            marginLeft: 8,
                            flex: 1,
                          }}
                        >
                          {formatSchedule(course.schedules)}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color="#6B7280"
                        />
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6B7280",
                            marginLeft: 8,
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
                          marginBottom: 8,
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
                            size={16}
                            color="#6B7280"
                          />
                          <Text
                            style={{
                              fontSize: 14,
                              color: "#6B7280",
                              marginLeft: 8,
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
                      <TouchableOpacity
                        style={{ flexDirection: "row", alignItems: "center" }}
                        onPress={() =>
                          router.push({
                            pathname: "/(coach)/course/[id]",
                            params: { id: String(course.id) },
                          } as any)
                        }
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#059669",
                            fontWeight: "600",
                          }}
                        >
                          Xem chi tiết
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color="#059669"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {/* Load More */}
              {hasMore && (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#059669" />
                  ) : (
                    <TouchableOpacity
                      onPress={loadMore}
                      style={{
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        backgroundColor: "#F3F4F6",
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#059669",
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
          bottom: insets.bottom + 80,
          right: 16,
          left: 16,
          backgroundColor: "#059669",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 16,
          borderRadius: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
        onPress={() => router.push("/(coach)/course/create" as any)}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: "bold",
            marginLeft: 8,
          }}
        >
          Tạo khóa học
        </Text>
      </TouchableOpacity>
    </View>
  );
}
