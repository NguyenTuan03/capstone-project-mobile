import { useCallback, useEffect, useState } from "react";

import CoursesHeader from "@/components/learner/courses/CoursesHeader";
import LocationSelectionModal from "@/components/learner/courses/LocationSelectionModal";
import type {
  CoursesResponse,
  District,
  PaymentLinkResponse,
  Province,
} from "@/components/learner/courses/types";
import { get, post } from "@/services/http/httpService";
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
      return "Trung cấp";
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
  const [coachRatings, setCoachRatings] = useState<Record<number, number>>({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [initializing, setInitializing] = useState(true);
  const fetchProvinces = useCallback(async () => {
    try {
      setLoadingProvinces(true);
      const res = await get<Province[]>("/v1/provinces");
      setProvinces(res.data || []);
      return res.data || [];
    } catch (error) {
      console.error("Failed to fetch provinces:", error);
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
      console.error("Failed to fetch districts:", error);
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
      } catch (error) {
        console.error("Failed to load user location:", error);
      }
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
      } catch (error) {
        console.error("Failed to fetch coach ratings:", error);
      }
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
        console.error("Failed to fetch courses:", error);
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
    [fetchCoachesRatings, pageSize, selectedDistrict, selectedProvince]
  );

  // Fetch lần đầu khi mount hoặc khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      if (!initializing) {
        fetchCourses(1, false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProvince, selectedDistrict, currentUserId, initializing])
  );

  const loadMore = useCallback(() => {
    if (!loadingMore && courses.length < total) {
      fetchCourses(page + 1, true);
    }
  }, [courses.length, fetchCourses, loadingMore, page, total]);

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
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: `Mã đơn: ${orderCode || "N/A"}`,
          position: "top",
          visibilityTime: 4000,
        });
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
            />
          </View>
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
            <Ionicons name="funnel" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

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
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#059669" />
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
                  ? "Trung cấp"
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

                    {/* Top Badges */}
                    <View style={styles.cardHeaderBadges}>
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
                  </View>

                  {/* Content Section */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.courseTitle} numberOfLines={2}>
                        {c.name}
                      </Text>
                      {c.createdBy?.id &&
                        coachRatings[c.createdBy.id] !== undefined && (
                          <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text style={styles.ratingText}>
                              {coachRatings[c.createdBy.id].toFixed(1)}
                            </Text>
                          </View>
                        )}
                    </View>

                    <View style={styles.coachInfoRow}>
                      <View style={styles.coachAvatarPlaceholder}>
                        <Text style={styles.coachAvatarText}>
                          {c.createdBy?.fullName?.[0] || "C"}
                        </Text>
                      </View>
                      <Text style={styles.coachName} numberOfLines={1}>
                        {c.createdBy?.fullName || "Huấn luyện viên"}
                      </Text>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.cardMetaGrid}>
                      {/* Level */}
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="ribbon-outline"
                          size={14}
                          color="#6B7280"
                        />
                        <Text style={styles.metaText}>{levelLabel}</Text>
                      </View>

                      {/* Participants */}
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="people-outline"
                          size={14}
                          color="#6B7280"
                        />
                        <Text style={styles.metaText}>
                          {c.currentParticipants}/{c.maxParticipants} học viên
                        </Text>
                      </View>

                      {/* Location */}
                      <View style={[styles.metaItem, { width: "100%" }]}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#6B7280"
                        />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {c.court?.name || c.court?.address || "Chưa xác định"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.priceText}>
                        {formatPrice(c.pricePerParticipant)}
                      </Text>
                      <View style={styles.viewDetailBtn}>
                        <Text style={styles.viewDetailText}>Xem chi tiết</Text>
                        <Ionicons
                          name="arrow-forward"
                          size={14}
                          color="#059669"
                        />
                      </View>
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
  container: { padding: 16, gap: 12, paddingBottom: 20 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  cardImageWrapper: {
    height: 180,
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
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  cardHeaderBadges: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 10,
  },
  formatBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  formatBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  courseTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 24,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  locationText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  participantBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  participantBadgeText: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
  },
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    color: "#111827",
    fontSize: 14,
    fontWeight: "500",
  },
  filterBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#059669",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#059669",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  filterSection: { gap: 12, marginBottom: 12 },
  filterSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  filterTitle: {
    color: "#059669",
    fontWeight: "700",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  filterSelect: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 11,
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
    fontSize: 13,
    flex: 1,
    fontWeight: "500",
  },
  filterSelectPlaceholder: {
    color: "#9CA3AF",
  },
  clearFilterBtn: {
    width: 40,
    height: 40,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingTop: 20,
  },
  courseModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalLoading: {
    padding: 40,
    alignItems: "center",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  modalItemActive: {
    backgroundColor: "#F0FDF4",
  },
  modalItemText: {
    fontSize: 15,
    color: "#111827",
  },
  modalItemTextActive: {
    color: "#059669",
    fontWeight: "600",
  },
  modalImageContainer: {
    height: 220,
    width: "100%",
    position: "relative",
  },
  modalCoverImage: {
    width: "100%",
    height: "100%",
  },
  modalImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  floatingCloseBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalBadgesContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    gap: 8,
  },
  modalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalBody: {
    padding: 20,
    gap: 24,
  },
  modalHeaderSection: {
    gap: 12,
  },
  modalCourseTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 30,
  },
  modalCoachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  coachAvatarLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  coachAvatarTextLarge: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0284C7",
  },
  coachNameLarge: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  ratingLabel: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  infoGridItem: {
    width: "47%",
    flexDirection: "row",
    gap: 10,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  contentSection: {
    gap: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  descriptionBody: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
  },
  scheduleContainer: {
    gap: 10,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
  },
  scheduleDayBox: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  scheduleDayTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  scheduleTimeBox: {
    flex: 1,
  },
  scheduleTimeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  locationName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 12,
    color: "#6B7280",
  },
  stickyFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
  footerPrice: {
    gap: 2,
  },
  footerPriceLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  footerPriceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
  },
  footerBtn: {
    backgroundColor: "#059669",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  footerBtnDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.8,
  },
  footerBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  coachInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  coachAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    fontSize: 13,
    fontWeight: "500",
    color: "#4B5563",
    flex: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  cardMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
  },
  viewDetailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetailText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
  loadMoreBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#059669",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  loadMoreText: { color: "#059669", fontWeight: "700" },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
  },
});
