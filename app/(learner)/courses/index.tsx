import { useCallback, useEffect, useRef, useState } from "react";

import { CoachDetailModal } from "@/components/coach/CoachDetailModal";
import CourseSkeleton from "@/components/learner/courses/CourseSkeleton";
import CoursesHeader from "@/components/learner/courses/CoursesHeader";
import LocationSelectionModal from "@/components/learner/courses/LocationSelectionModal";
import type {
  CoursesResponse,
  District,
  PaymentLinkResponse,
  Province,
} from "@/components/learner/courses/types";
import coachService from "@/services/coach.service";
import { get, post } from "@/services/http/httpService";
import type { CoachDetail } from "@/types/coach";
import { Course } from "@/types/course";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// Helper function to get query params from URL
const getParams = (url: string) =>
  Object.fromEntries(new URL(url).searchParams.entries());

// Helper function to format price
const formatPrice = (price: string | number) => {
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(numericPrice);
};

// Helper function to get level in Vietnamese
const getLevelInVietnamese = (level: string) => {
  switch (level) {
    case "BEGINNER":
      return "Cơ bản";
    case "INTERMEDIATE":
      return "Trung bình";
    case "ADVANCED":
      return "Nâng cao";
    default:
      return level;
  }
};

// Helper function to convert day of week to Vietnamese
const convertDayOfWeekToVietnamese = (day: string) => {
  const dayMap: Record<string, string> = {
    Monday: "Thứ 2",
    Tuesday: "Thứ 3",
    Wednesday: "Thứ 4",
    Thursday: "Thứ 5",
    Friday: "Thứ 6",
    Saturday: "Thứ 7",
    Sunday: "Chủ nhật",
  };
  return dayMap[day] || day;
};

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);

  const [processingPayment, setProcessingPayment] = useState<number | null>(
    null
  );
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseDetailModal, setShowCourseDetailModal] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [coachDetail, setCoachDetail] = useState<CoachDetail | null>(null);
  const [coachFeedbacks, setCoachFeedbacks] = useState<any[]>([]);
  const [loadingCoachDetail, setLoadingCoachDetail] = useState(false);
  const [coachRatings, setCoachRatings] = useState<Record<number, number>>({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [showLevelModal, setShowLevelModal] = useState(false);

  const LEVEL_OPTIONS = [
    { label: "Cơ bản", value: "BEGINNER" },
    { label: "Trung bình", value: "INTERMEDIATE" },
    { label: "Nâng cao", value: "ADVANCED" },
  ];
  const fetchProvinces = useCallback(async () => {
    try {
      setLoadingProvinces(true);
      const res = await get<Province[]>("/v1/provinces");
      setProvinces(res.data || []);
      return res.data || [];
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách tỉnh/thành phố",
        position: "top",
        visibilityTime: 3000,
      });
      return [];
    } finally {
      setLoadingProvinces(false);
    }
  }, []);

  const fetchDistricts = useCallback(async (provinceId: number) => {
    try {
      setLoadingDistricts(true);
      const res = await get<District[]>(
        `/v1/provinces/${provinceId}/districts`
      );
      setDistricts(res.data || []);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách quận/huyện",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  const loadUserLocation = useCallback(
    async (currentProvinces?: Province[]) => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (userString) {
          const userData = JSON.parse(userString);

          // Get user ID
          let userId = null;
          if (userData?.metadata?.user?.id) {
            userId = userData.metadata.user.id;
          } else if (userData?.id) {
            userId = userData.id;
          }
          if (userId) {
            setCurrentUserId(userId);
          }

          if (userData?.province && userData?.district) {
            // Fetch provinces first if not already cached
            let provincesList = currentProvinces || provinces;
            if (provincesList.length === 0) {
              const res = await get<Province[]>("/v1/provinces");
              provincesList = res.data || [];
              setProvinces(provincesList);
            }

            const userProvince = provincesList.find(
              (p) => p.id === userData.province.id
            );
            if (userProvince) {
              setSelectedProvince(userProvince);
              // Fetch districts cho province này
              const districtsRes = await get<District[]>(
                `/v1/provinces/${userProvince.id}/districts`
              );
              const districtsList = districtsRes.data || [];
              setDistricts(districtsList);

              const userDistrict = districtsList.find(
                (d) => d.id === userData.district.id
              );
              if (userDistrict) {
                setSelectedDistrict(userDistrict);
              }
            }
          }
        }
      } catch (error) {}
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    const initializeData = async () => {
      setInitializing(true);
      const fetchedProvinces = await fetchProvinces();
      await loadUserLocation(fetchedProvinces);
      setInitializing(false);
    };
    initializeData();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initializing) return;
    if (selectedProvince) {
      fetchDistricts(selectedProvince.id);
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
    }
  }, [selectedProvince, initializing]);

  const fetchCoachRating = useCallback(
    async (coachId: number): Promise<number> => {
      try {
        const res = await get<{
          statusCode: number;
          message: string;
          metadata: any;
        }>(`/v1/coaches/${coachId}/rating/overall`);

        // Response shapes may vary: metadata can be a number or an object { overall, total }
        const responseData = res?.data;
        if (
          responseData &&
          typeof responseData === "object" &&
          "metadata" in responseData
        ) {
          const metadata = responseData.metadata;
          if (typeof metadata === "number") {
            return metadata;
          }
          if (metadata && typeof metadata === "object") {
            // Prefer `overall` field when present
            if (typeof metadata.overall === "number") {
              return metadata.overall;
            }
            // Fallback: try first numeric value in metadata
            const numericValues = Object.values(metadata).filter(
              (v) => typeof v === "number"
            ) as number[];
            if (numericValues.length > 0) return numericValues[0];
          }
        }
        return 0;
      } catch {
        return 0;
      }
    },
    []
  );

  const fetchCoachesRatings = useCallback(
    async (userIds: number[]) => {
      try {
        const uniqueUserIds = [...new Set(userIds)];

        // Fetch ratings directly using userId (each promise resolves to { userId, rating:number })
        const ratingPromises = uniqueUserIds.map((userId) =>
          fetchCoachRating(userId).then((rating) => ({ userId, rating }))
        );
        const ratingResults = await Promise.allSettled(ratingPromises);

        // Map userId -> rating (number)
        const ratingsMap: Record<number, number> = {};
        ratingResults.forEach((result) => {
          if (result.status === "fulfilled") {
            const value = result.value;
            if (value && typeof value.rating === "number") {
              ratingsMap[value.userId] = value.rating;
            }
          }
        });

        setCoachRatings((prev) => ({ ...prev, ...ratingsMap }));
      } catch (error) {}
    },
    [fetchCoachRating]
  );

  const fetchCourses = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        // Build URL with proper query parameters
        const params = new URLSearchParams();
        params.append("page", String(pageNum));
        params.append("size", String(pageSize));
        if (selectedProvince) {
          params.append("province", String(selectedProvince.id));
        }
        if (selectedDistrict) {
          params.append("district", String(selectedDistrict.id));
        }
        if (searchKeyword) {
          params.append("name", searchKeyword);
        }
        if (selectedLevel) {
          params.append("level", selectedLevel);
        }

        const url = `/v1/courses/available?${params.toString()}`;
        const res = await get<CoursesResponse>(url);

        const newCourses = res.data.items || [];

        if (append) {
          setCourses((prev) => [...prev, ...newCourses]);
        } else {
          setCourses(newCourses);
        }

        setTotal(res.data.total || 0);
        setPage(res.data.page || 1);

        // Fetch coach ratings for all courses
        // Get user IDs from createdBy (these are user IDs, not coach IDs)
        const userIds = newCourses
          .map((c) => c.createdBy?.id)
          .filter((id): id is number => id !== undefined);
        if (userIds.length > 0) {
          fetchCoachesRatings(userIds);
        }
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không thể tải danh sách khóa học",
          position: "top",
          visibilityTime: 4000,
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      fetchCoachesRatings,
      pageSize,
      selectedDistrict,
      selectedProvince,
      searchKeyword,
      selectedLevel,
    ]
  );

  // Fetch lần đầu khi mount hoặc khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      if (!initializing) {
        fetchCourses(1, false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      selectedProvince,
      selectedDistrict,
      currentUserId,
      initializing,
      selectedLevel,
      searchKeyword,
    ])
  );

  const loadMore = useCallback(() => {
    if (!loadingMore && courses.length < total) {
      fetchCourses(page + 1, true);
    }
  }, [courses.length, fetchCourses, loadingMore, page, total]);

  const loadCoachDetail = useCallback(async (coachUserId: number) => {
    try {
      setLoadingCoachDetail(true);
      const coach = await coachService.getCoachById(coachUserId);
      setCoachDetail(coach);
      setCoachFeedbacks([]); // TODO: fetch feedbacks if needed
    } catch (error) {
    } finally {
      setLoadingCoachDetail(false);
    }
  }, []);

  const handleOpenCoachModal = useCallback(
    (course: Course) => {
      if (course.createdBy?.id) {
        setShowCourseDetailModal(false);
        setTimeout(() => {
          loadCoachDetail(course.createdBy.id);
          setShowCoachModal(true);
        }, 300);
      }
    },
    [loadCoachDetail]
  );

  const handleRegister = useCallback(async (courseId: number) => {
    setProcessingPayment(courseId);
    try {
      const res = await post<PaymentLinkResponse>(
        `/v1/payments/courses/${courseId}/link`,
        {}
      );
      const checkoutUrl = res?.data?.metadata?.checkoutUrl;
      if (!checkoutUrl) throw new Error("Không có checkoutUrl");

      const returnUri = Linking.createURL("courses/payments/return");

      const waitDeepLink = new Promise<string>((resolve) => {
        const sub = Linking.addEventListener("url", ({ url }) => {
          sub.remove();
          resolve(url);
        });
      });

      const auth = WebBrowser.openAuthSessionAsync(checkoutUrl, returnUri);
      const winner = (await Promise.race([auth, waitDeepLink])) as
        | { type: "success" | "cancel"; url?: string }
        | string;

      const callbackUrl = typeof winner === "string" ? winner : winner.url;
      if (!callbackUrl) {
        return;
      }

      const { status = "", cancel = "", orderCode } = getParams(callbackUrl);
      const paid =
        status.toUpperCase() === "PAID" && cancel.toLowerCase() !== "true";

      if (paid) {
        // Toast.show({
        //   type: "success",
        //   text1: "Thành công",
        //   text2: `Mã đơn: ${orderCode || "N/A"}`,
        //   position: "top",
        //   visibilityTime: 4000,
        // });
      } else {
        Toast.show({
          type: "error",
          text1: "Đã hủy",
          text2: "Thanh toán không thành công.",
          position: "top",
          visibilityTime: 4000,
        });
      }
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: e?.Message ?? "Có lỗi khi thanh toán.",
        position: "top",
        visibilityTime: 4000,
      });
    } finally {
      setProcessingPayment(null);
    }
  }, []);

  const handleCourseRegister = useCallback(
    (courseId: number) => {
      handleRegister(courseId);
      setShowCourseDetailModal(false);
    },
    [handleRegister]
  );

  return (
    <View style={styles.safe}>
      <CoursesHeader />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Search & Filter */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
              placeholder="Tìm khóa học theo tên..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              value={searchKeyword}
              onChangeText={(text) => {
                setSearchKeyword(text);

                // Clear existing debounce timer
                if (debounceTimerRef.current) {
                  clearTimeout(debounceTimerRef.current);
                }

                // Set new debounce timer
                debounceTimerRef.current = setTimeout(() => {
                  setPage(1);
                  fetchCourses(1, false);
                }, 500);
              }}
            />
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowLevelModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Level Filter Tag */}
        {selectedLevel && (
          <View style={styles.activeFilterTag}>
            <Text style={styles.activeFilterText}>
              {LEVEL_OPTIONS.find((opt) => opt.value === selectedLevel)?.label}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedLevel(null);
                setPage(1);
                fetchCourses(1, false);
              }}
              style={styles.clearTag}
            >
              <Ionicons name="close" size={14} color="#059669" />
            </TouchableOpacity>
          </View>
        )}

        {/* Location Filter */}
        <View style={styles.filterSection}>
          <View style={styles.filterSectionHeader}>
            <Ionicons name="location" size={16} color="#059669" />
            <Text style={styles.filterTitle}>Lọc theo địa điểm</Text>
          </View>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.filterSelect}
              onPress={() => setShowProvinceModal(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterSelectText,
                  !selectedProvince && styles.filterSelectPlaceholder,
                ]}
              >
                {selectedProvince?.name || "Chọn tỉnh/thành phố"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterSelect,
                !selectedProvince && styles.filterSelectDisabled,
              ]}
              onPress={() => selectedProvince && setShowDistrictModal(true)}
              activeOpacity={0.7}
              disabled={!selectedProvince}
            >
              <Text
                style={[
                  styles.filterSelectText,
                  !selectedDistrict && styles.filterSelectPlaceholder,
                ]}
              >
                {selectedDistrict?.name || "Chọn quận/huyện"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>

            {(selectedProvince || selectedDistrict) && (
              <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => {
                  setSelectedProvince(null);
                  setSelectedDistrict(null);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Course Cards */}
        {loading ? (
          <View style={{ gap: 10, paddingHorizontal: 16 }}>
            <CourseSkeleton />
            <CourseSkeleton />
            <CourseSkeleton />
          </View>
        ) : courses.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: "#6B7280", fontSize: 14 }}>
              Không có khóa học nào
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {courses.map((c) => {
              const levelLabel =
                c.level === "BEGINNER"
                  ? "Cơ bản"
                  : c.level === "INTERMEDIATE"
                  ? "Trung bình"
                  : "Nâng cao";

              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => {
                    setSelectedCourse(c);
                    setShowCourseDetailModal(true);
                  }}
                >
                  {/* Image Section */}
                  <View style={styles.cardImageWrapper}>
                    <Image
                      source={{
                        uri:
                          c.publicUrl ||
                          "https://via.placeholder.com/400x200?text=Pickleball+Course",
                      }}
                      style={styles.cover}
                      resizeMode="cover"
                    />
                    <View style={styles.cardOverlay} />

                    {/* Badges Overlay */}
                    <View style={styles.cardBadgesOverlay}>
                      {/* Top Right Badges */}
                      <View style={styles.topRightBadges}>
                        <View
                          style={[
                            styles.formatBadge,
                            {
                              backgroundColor:
                                c.learningFormat === "INDIVIDUAL"
                                  ? "rgba(124, 58, 237, 0.9)"
                                  : "rgba(37, 99, 235, 0.9)",
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              c.learningFormat === "INDIVIDUAL"
                                ? "person"
                                : "people"
                            }
                            size={10}
                            color="#FFF"
                          />
                          <Text style={styles.formatBadgeText}>
                            {c.learningFormat === "INDIVIDUAL"
                              ? "Cá nhân"
                              : "Nhóm"}
                          </Text>
                        </View>

                        {(c.status === "FULL" || c.status === "READY_OPENED") && (
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  c.status === "FULL"
                                    ? "rgba(239, 68, 68, 0.9)"
                                    : "rgba(16, 185, 129, 0.9)",
                              },
                            ]}
                          >
                            <Text style={styles.statusBadgeText}>
                              {c.status === "FULL" ? "Đã đủ" : "Sắp mở"}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Bottom Left Badge - Level */}
                      <View style={styles.bottomLeftBadge}>
                        <View style={styles.levelBadgeOverlay}>
                          <Ionicons name="ribbon" size={10} color="#FFF" />
                          <Text style={styles.levelBadgeText}>{levelLabel}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Content Section */}
                  <View style={styles.cardContent}>
                    {/* Title */}
                    <Text style={styles.courseTitle} numberOfLines={2}>
                      {c.name}
                    </Text>

                    {/* Coach Info + Rating */}
                    <View style={styles.coachInfoRow}>
                      <View style={styles.coachAvatarPlaceholder}>
                        <Text style={styles.coachAvatarText}>
                          {c.createdBy?.fullName?.[0] || "C"}
                        </Text>
                      </View>
                      <Text style={styles.coachName} numberOfLines={1}>
                        {c.createdBy?.fullName || "Huấn luyện viên"}
                      </Text>
                      {c.createdBy?.id &&
                        coachRatings[c.createdBy.id] !== undefined && (
                          <>
                            <Text style={styles.dotSeparator}>•</Text>
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text style={styles.ratingInlineText}>
                              {coachRatings[c.createdBy.id].toFixed(1)}
                            </Text>
                          </>
                        )}
                    </View>

                    {/* Metadata Row 1 */}
                    <View style={styles.metadataRow}>
                      <Ionicons name="people" size={13} color="#6B7280" />
                      <Text style={styles.metadataText}>
                        {c.currentParticipants}/{c.maxParticipants} học viên
                      </Text>

                      <Text style={styles.dotSeparator}>•</Text>

                      <Ionicons name="calendar" size={13} color="#6B7280" />
                      <Text style={styles.metadataText}>
                        {c.totalSessions} buổi học
                      </Text>
                    </View>

                    {/* Address Row */}
                    <View style={styles.addressRow}>
                      <Ionicons name="location" size={13} color="#059669" />
                      <Text style={styles.addressText} numberOfLines={2}>
                        {c.court?.address || c.court?.name || "Chưa xác định địa điểm"}
                      </Text>
                    </View>

                    {/* Footer */}
                    <View style={styles.cardFooter}>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceText}>
                          {formatPrice(c.pricePerParticipant)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.registerBtn}
                        onPress={() => {
                          setSelectedCourse(c);
                          setShowCourseDetailModal(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.registerBtnText}>Đăng ký</Text>
                        <Ionicons name="arrow-forward" size={12} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            {loadingMore && (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#10B981" />
              </View>
            )}
            {!loadingMore && courses.length < total && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={loadMore}
                activeOpacity={0.8}
              >
                <Text style={styles.loadMoreText}>Tải thêm</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCourseDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCourseDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.courseModalContent, { paddingBottom: 0 }]}>
            {selectedCourse && (
              <>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 100 }}
                  bounces={false}
                >
                  {/* Full Width Image Header */}
                  <View style={styles.modalImageContainer}>
                    <Image
                      source={{
                        uri:
                          selectedCourse.publicUrl ||
                          "https://via.placeholder.com/400x250?text=Course",
                      }}
                      style={styles.modalCoverImage}
                      resizeMode="cover"
                    />
                    <View style={styles.modalImageOverlay} />

                    {/* Floating Close Button */}
                    <TouchableOpacity
                      onPress={() => setShowCourseDetailModal(false)}
                      activeOpacity={0.8}
                      style={styles.floatingCloseBtn}
                    >
                      <Ionicons name="close" size={20} color="#111827" />
                    </TouchableOpacity>

                    {/* Badges on Image */}
                    <View style={styles.modalBadgesContainer}>
                      <View
                        style={[
                          styles.modalBadge,
                          {
                            backgroundColor:
                              selectedCourse.learningFormat === "INDIVIDUAL"
                                ? "rgba(124, 58, 237, 0.9)"
                                : "rgba(37, 99, 235, 0.9)",
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            selectedCourse.learningFormat === "INDIVIDUAL"
                              ? "person"
                              : "people"
                          }
                          size={12}
                          color="#FFF"
                        />
                        <Text style={styles.modalBadgeText}>
                          {selectedCourse.learningFormat === "INDIVIDUAL"
                            ? "Cá nhân"
                            : "Nhóm"}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.modalBadge,
                          { backgroundColor: "rgba(255, 255, 255, 0.9)" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalBadgeText,
                            { color: "#111827", fontWeight: "700" },
                          ]}
                        >
                          {getLevelInVietnamese(selectedCourse.level)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Content Body */}
                  <View style={styles.modalBody}>
                    {/* Title & Coach */}
                    <View style={styles.modalHeaderSection}>
                      <Text style={styles.modalCourseTitle}>
                        {selectedCourse.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleOpenCoachModal(selectedCourse)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.modalCoachRow}>
                          <View style={styles.coachAvatarLarge}>
                            <Text style={styles.coachAvatarTextLarge}>
                              {selectedCourse.createdBy?.fullName?.[0] || "C"}
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.coachNameLarge}>
                              {selectedCourse.createdBy?.fullName ||
                                "Huấn luyện viên"}
                            </Text>
                            {selectedCourse.createdBy?.id &&
                              coachRatings[selectedCourse.createdBy.id] !==
                                undefined && (
                                <View style={styles.ratingRow}>
                                  <Ionicons
                                    name="star"
                                    size={12}
                                    color="#F59E0B"
                                  />
                                  <Text style={styles.ratingValue}>
                                    {coachRatings[
                                      selectedCourse.createdBy.id
                                    ].toFixed(1)}{" "}
                                    <Text style={styles.ratingLabel}>
                                      đánh giá
                                    </Text>
                                  </Text>
                                </View>
                              )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.sectionDivider} />

                    {/* Info Grid */}
                    <View style={styles.infoGrid}>
                      <View style={styles.infoGridItem}>
                        <View style={styles.infoIconBox}>
                          <Ionicons
                            name="calendar-outline"
                            size={20}
                            color="#059669"
                          />
                        </View>
                        <View>
                          <Text style={styles.infoLabel}>Ngày bắt đầu</Text>
                          <Text style={styles.infoValue}>
                            {new Date(
                              selectedCourse.startDate
                            ).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.infoGridItem}>
                        <View style={styles.infoIconBox}>
                          <Ionicons
                            name="time-outline"
                            size={20}
                            color="#059669"
                          />
                        </View>
                        <View>
                          <Text style={styles.infoLabel}>Thời lượng</Text>
                          <Text style={styles.infoValue}>
                            {selectedCourse.totalSessions} buổi
                          </Text>
                        </View>
                      </View>

                      <View style={styles.infoGridItem}>
                        <View style={styles.infoIconBox}>
                          <Ionicons
                            name="people-outline"
                            size={20}
                            color="#059669"
                          />
                        </View>
                        <View>
                          <Text style={styles.infoLabel}>Học viên</Text>
                          <Text style={styles.infoValue}>
                            {selectedCourse.currentParticipants}/
                            {selectedCourse.maxParticipants}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.infoGridItem}>
                        <View style={styles.infoIconBox}>
                          <Ionicons
                            name="ribbon-outline"
                            size={20}
                            color="#059669"
                          />
                        </View>
                        <View>
                          <Text style={styles.infoLabel}>Trình độ</Text>
                          <Text style={styles.infoValue}>
                            {getLevelInVietnamese(selectedCourse.level)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.sectionDivider} />

                    {/* Description */}
                    {selectedCourse.description && (
                      <View style={styles.contentSection}>
                        <Text style={styles.sectionHeader}>Giới thiệu</Text>
                        <Text style={styles.descriptionBody}>
                          {selectedCourse.description}
                        </Text>
                      </View>
                    )}

                    {/* Schedule */}
                    {selectedCourse.schedules &&
                      selectedCourse.schedules.length > 0 && (
                        <View style={styles.contentSection}>
                          <Text style={styles.sectionHeader}>Lịch học</Text>
                          <View style={styles.scheduleContainer}>
                            {selectedCourse.schedules.map((schedule, idx) => (
                              <View key={idx} style={styles.scheduleRow}>
                                <View style={styles.scheduleDayBox}>
                                  <Text style={styles.scheduleDayTitle}>
                                    {convertDayOfWeekToVietnamese(
                                      schedule.dayOfWeek
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.scheduleTimeBox}>
                                  <Text style={styles.scheduleTimeValue}>
                                    {schedule.startTime} - {schedule.endTime}
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                    {/* Sessions */}
                    {selectedCourse.sessions &&
                      selectedCourse.sessions.length > 0 && (
                        <View style={styles.contentSection}>
                          <Text style={styles.sectionHeader}>Các buổi học</Text>
                          <View style={styles.sessionContainer}>
                            {selectedCourse.sessions.map((session, idx) => (
                              <View key={session.id} style={styles.sessionCard}>
                                <View style={styles.sessionHeader}>
                                  <View style={styles.sessionNumber}>
                                    <Text style={styles.sessionNumberText}>
                                      Buổi {session.sessionNumber}
                                    </Text>
                                  </View>
                                </View>

                                {session.name && (
                                  <View style={styles.sessionTitleRow}>
                                    <Ionicons
                                      name="document-text-outline"
                                      size={14}
                                      color="#059669"
                                    />
                                    <Text style={styles.sessionTitle}>
                                      {session.name}
                                    </Text>
                                  </View>
                                )}

                                {session.description && (
                                  <Text style={styles.sessionDescription}>
                                    {session.description}
                                  </Text>
                                )}

                                <View style={styles.sessionInfoRow}>
                                  <View style={styles.sessionInfoItem}>
                                    <Ionicons
                                      name="calendar-outline"
                                      size={14}
                                      color="#6B7280"
                                    />
                                    <Text style={styles.sessionInfoText}>
                                      {new Date(
                                        session.scheduleDate
                                      ).toLocaleDateString("vi-VN", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      })}
                                    </Text>
                                  </View>
                                  <View style={styles.sessionInfoItem}>
                                    <Ionicons
                                      name="time-outline"
                                      size={14}
                                      color="#6B7280"
                                    />
                                    <Text style={styles.sessionInfoText}>
                                      {session.startTime} - {session.endTime}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                    {/* Location Detail */}
                    {selectedCourse.court && (
                      <View style={styles.contentSection}>
                        <Text style={styles.sectionHeader}>Địa điểm</Text>
                        <View style={styles.locationCard}>
                          <View style={styles.locationIcon}>
                            <Ionicons name="map" size={24} color="#059669" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.locationName}>
                              {selectedCourse.court.name}
                            </Text>
                            <Text style={styles.locationAddress}>
                              {selectedCourse.court.address}
                            </Text>
                            {selectedCourse.court.phoneNumber && (
                              <TouchableOpacity
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  marginTop: 8,
                                  gap: 6,
                                }}
                                onPress={() => {
                                  Linking.openURL(
                                    `tel:${selectedCourse.court.phoneNumber}`
                                  );
                                }}
                              >
                                <Ionicons
                                  name="call"
                                  size={16}
                                  color="#059669"
                                />
                                <Text
                                  style={{
                                    color: "#059669",
                                    fontWeight: "600",
                                    fontSize: 14,
                                  }}
                                >
                                  {selectedCourse.court.phoneNumber}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </ScrollView>

                {/* Sticky Footer */}
                <View
                  style={[
                    styles.stickyFooter,
                    { paddingBottom: insets.bottom + 16 },
                  ]}
                >
                  <View style={styles.footerPrice}>
                    <Text style={styles.footerPriceLabel}>Tổng cộng</Text>
                    <Text style={styles.footerPriceValue}>
                      {formatPrice(selectedCourse.pricePerParticipant)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.footerBtn,
                      (processingPayment === selectedCourse.id ||
                        selectedCourse.maxParticipants <=
                          selectedCourse.currentParticipants) &&
                        styles.footerBtnDisabled,
                    ]}
                    onPress={() => {
                      handleRegister(selectedCourse.id);
                      setShowCourseDetailModal(false);
                    }}
                    disabled={
                      processingPayment === selectedCourse.id ||
                      selectedCourse.maxParticipants <=
                        selectedCourse.currentParticipants
                    }
                  >
                    {processingPayment === selectedCourse.id ? (
                      <ActivityIndicator color="#FFF" />
                    ) : selectedCourse.maxParticipants <=
                      selectedCourse.currentParticipants ? (
                      <Text style={styles.footerBtnText}>Đã đủ học viên</Text>
                    ) : (
                      <Text style={styles.footerBtnText}>Đăng ký ngay</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Coach Detail Modal */}
      <CoachDetailModal
        visible={showCoachModal}
        coachDetail={coachDetail}
        feedbacks={coachFeedbacks}
        courseStatus={selectedCourse?.status}
        onClose={() => setShowCoachModal(false)}
        onCredentialPress={() => {}}
      />

      {/* Province Modal */}
      <LocationSelectionModal
        title="Chọn tỉnh/thành phố"
        items={provinces}
        visible={showProvinceModal}
        loading={loadingProvinces}
        selectedItem={selectedProvince}
        onSelect={(province) => {
          setSelectedProvince(province);
          setSelectedDistrict(null);
          setShowProvinceModal(false);
        }}
        onClose={() => setShowProvinceModal(false)}
        bottomInset={insets.bottom}
      />

      <LocationSelectionModal
        title="Chọn quận/huyện"
        items={districts}
        visible={showDistrictModal}
        loading={loadingDistricts}
        selectedItem={selectedDistrict}
        onSelect={(district) => {
          setSelectedDistrict(district);
          setShowDistrictModal(false);
        }}
        onClose={() => setShowDistrictModal(false)}
        bottomInset={insets.bottom}
      />

      {/* Level Selection Modal */}
      <Modal
        visible={showLevelModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLevelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn trình độ</Text>
              <TouchableOpacity
                onPress={() => setShowLevelModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {LEVEL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalItem,
                    selectedLevel === option.value && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setSelectedLevel(option.value);
                    setShowLevelModal(false);
                    setPage(1);
                    fetchCourses(1, false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedLevel === option.value &&
                        styles.modalItemTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedLevel === option.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#059669"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  headerSection: {
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  container: { padding: 12, gap: 10, paddingBottom: 16 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  cardImageWrapper: {
    height: 100,
    width: "100%",
    position: "relative",
  },
  cover: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E7EB",
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  cardBadgesOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    zIndex: 10,
  },
  topRightBadges: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    gap: 4,
    alignItems: "flex-start",
  },
  bottomLeftBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
  },
  levelBadgeOverlay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(5, 150, 105, 0.9)",
  },
  levelBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  formatBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  formatBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  cardContent: {
    padding: 12,
    gap: 7,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 20,
  },
  coachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  courseCoach: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FBBF24",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "500",
    flex: 1,
  },
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    color: "#111827",
    fontSize: 13,
    fontWeight: "500",
  },
  filterBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#059669",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#059669",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  activeFilterTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    marginBottom: 8,
  },
  activeFilterText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "600",
  },
  clearTag: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  filterSection: { gap: 10, marginBottom: 10 },
  filterSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  filterTitle: {
    color: "#059669",
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  filterSelect: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  filterSelectDisabled: {
    opacity: 0.5,
    backgroundColor: "#F9FAFB",
  },
  filterSelectText: {
    color: "#111827",
    fontSize: 12,
    flex: 1,
    fontWeight: "500",
  },
  filterSelectPlaceholder: {
    color: "#9CA3AF",
  },
  clearFilterBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingTop: 16,
  },
  courseModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "90%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  modalLoading: {
    padding: 32,
    alignItems: "center",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  modalItemActive: {
    backgroundColor: "#F0FDF4",
  },
  modalItemText: {
    fontSize: 14,
    color: "#111827",
  },
  modalItemTextActive: {
    color: "#059669",
    fontWeight: "600",
  },
  modalImageContainer: {
    height: 160,
    width: "100%",
    position: "relative",
  },
  modalCoverImage: {
    width: "100%",
    height: "100%",
  },
  modalImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  floatingCloseBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  modalBadgesContainer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    gap: 5,
  },
  modalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalBody: {
    padding: 14,
    gap: 16,
  },
  modalHeaderSection: {
    gap: 8,
  },
  modalCourseTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 24,
  },
  modalCoachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderRadius: 8,
  },
  coachAvatarLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  coachAvatarTextLarge: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0284C7",
  },
  coachNameLarge: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  ratingLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
  },
  infoGridItem: {
    width: "48%",
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  infoIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  contentSection: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  descriptionBody: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 19,
  },
  scheduleContainer: {
    gap: 6,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  scheduleDayBox: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  scheduleDayTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  scheduleTimeBox: {
    flex: 1,
  },
  scheduleTimeValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  locationName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 3,
  },
  locationAddress: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 17,
  },
  stickyFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  footerPrice: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  footerPriceLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 1,
  },
  footerPriceValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 0.3,
  },
  footerBtn: {
    backgroundColor: "#059669",
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
  },
  footerBtnDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.8,
  },
  footerBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  coachInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  coachAvatarPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  coachAvatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0284C7",
  },
  coachName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  dotSeparator: {
    fontSize: 12,
    color: "#D1D5DB",
    marginHorizontal: 2,
  },
  ratingInlineText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  metadataText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  addressText: {
    flex: 1,
    fontSize: 11,
    color: "#374151",
    fontWeight: "500",
    lineHeight: 15,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  priceContainer: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 0.3,
  },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  registerBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loadMoreBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#059669",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 6,
  },
  loadMoreText: { color: "#059669", fontWeight: "700", fontSize: 13 },
  sessionContainer: {
    gap: 6,
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 9,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionNumber: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  sessionNumberText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  sessionStatus: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: "#DBEAFE",
  },
  sessionStatusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#0284C7",
  },
  sessionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  sessionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  sessionDescription: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 15,
  },
  sessionInfoRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  sessionInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
  },
  sessionInfoText: {
    fontSize: 10,
    color: "#4B5563",
    fontWeight: "500",
  },
});
