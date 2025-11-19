import { get, post } from "@/services/http/httpService";
import { Course } from "@/types/course";
import { convertDayOfWeekToVietnamese } from "@/utils/scheduleFormat";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
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

type CoursesResponse = {
  items: Course[];
  page: number;
  pageSize: number;
  total: number;
};

type Province = {
  id: number;
  name: string;
};

type District = {
  id: number;
  name: string;
};

type PaymentLinkResponse = {
  statusCode: number;
  message: string;
  metadata: {
    amount: number;
    description: string;
    orderCode: number;
    paymentLinkId: string;
    checkoutUrl: string;
    qrCode: string;
    status: string;
    id: number;
    createdAt: string;
  };
};

// Map course level to Vietnamese
const getLevelInVietnamese = (level: string): string => {
  const levelMap: Record<string, string> = {
    BEGINNER: "Cơ bản",
    INTERMEDIATE: "Trung bình",
    ADVANCED: "Nâng cao",
    PROFESSIONAL: "Chuyên nghiệp",
  };
  return levelMap[level] || level;
};

// Map course status to Vietnamese
const getStatusInVietnamese = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING_APPROVAL: "Chờ duyệt",
    APPROVED: "Đang mở",
    REJECTED: "Từ chối",
    CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn thành",
    FULL: "Đã đủ người",
    READY_OPENED: "Đang mở",
    ON_GOING: "Đang diễn ra",
  };
  return statusMap[status] || status;
};

// Get status badge color
const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    PENDING_APPROVAL: "#F59E0B",
    APPROVED: "#10B981",
    REJECTED: "#EF4444",
    CANCELLED: "#6B7280",
    COMPLETED: "#3B82F6",
    FULL: "#8B5CF6",
    READY_OPENED: "#10B981",
    ON_GOING: "#10B981",
  };
  return colorMap[status] || "#6B7280";
};

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Province & District states
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
  const fetchProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const res = await get<Province[]>("/v1/provinces");
      setProvinces(res.data || []);
    } catch (error) {
      console.error("Failed to fetch provinces:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách tỉnh/thành phố",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchDistricts = async (provinceId: number) => {
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
  };

  const loadUserLocation = useCallback(async () => {
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
          let provincesList = provinces;
          if (provincesList.length === 0) {
            const res = await get<Province[]>("/v1/provinces");
            provincesList = res.data || [];
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      await fetchProvinces();
      await loadUserLocation();
    };
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      fetchDistricts(selectedProvince.id);
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
    }
  }, [selectedProvince]);

  const fetchCoachRating = async (coachId: number): Promise<number> => {
    try {
      // API: GET /v1/coaches/:coachId/rating/overall
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
  };

  const fetchCoachesRatings = async (userIds: number[]) => {
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
  };

  const fetchCourses = async (pageNum: number = 1, append: boolean = false) => {
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
  };

  useFocusEffect(
    useCallback(() => {
      fetchCourses(1, false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProvince, selectedDistrict, currentUserId])
  );

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    return new Intl.NumberFormat("vi-VN").format(numPrice) + " VNĐ";
  };

  const loadMore = () => {
    if (!loadingMore && courses.length < total) {
      fetchCourses(page + 1, true);
    }
  };

  const getParams = (url: string) =>
    Object.fromEntries(new URL(url).searchParams.entries());

  const handleRegister = async (courseId: number) => {
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

      let callbackUrl = typeof winner === "string" ? winner : winner.url;
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
      console.log("e", e);
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
  };

  return (
    <View style={[styles.safe]}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Khám Phá Khóa Học</Text>
          <Text style={styles.headerSubtitle}>
            Tìm khóa học pickleball tốt nhất cho bạn
          </Text>
        </View>
      </View>

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
              const levelColor =
                c.level === "BEGINNER"
                  ? { bg: "#DBEAFE", text: "#0284C7" }
                  : c.level === "INTERMEDIATE"
                  ? { bg: "#FCD34D", text: "#92400E" }
                  : { bg: "#DDD6FE", text: "#4F46E5" };

              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedCourse(c);
                    setShowCourseDetailModal(true);
                  }}
                >
                  {/* Image Container with Badges */}
                  <View style={styles.cardImageWrapper}>
                    <Image
                      source={{
                        uri: "https://via.placeholder.com/400x160?text=Course",
                      }}
                      style={styles.cover}
                    />

                    {/* Format Badge - Top Left */}
                    <View style={styles.formatBadgeContainer}>
                      <View
                        style={[
                          styles.formatBadge,
                          {
                            backgroundColor:
                              c.learningFormat === "INDIVIDUAL"
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
                                c.learningFormat === "INDIVIDUAL"
                                  ? "#4C1D95"
                                  : "#0284C7",
                            },
                          ]}
                        >
                          {c.learningFormat === "INDIVIDUAL"
                            ? "Cá nhân"
                            : "Nhóm"}
                        </Text>
                      </View>
                    </View>

                    {/* Status Badge - Top Right */}
                    {(c.status === "FULL" || c.status === "READY_OPENED") && (
                      <View style={styles.statusBadgeContainer}>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                c.status === "FULL" ? "#DBEAFE" : "#DCFCE7",
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              c.status === "FULL"
                                ? "alert-circle-outline"
                                : "checkmark-circle-outline"
                            }
                            size={11}
                            color={c.status === "FULL" ? "#0284C7" : "#16A34A"}
                            style={{ marginRight: 3 }}
                          />
                          <Text
                            style={[
                              styles.statusBadgeText,
                              {
                                color:
                                  c.status === "FULL" ? "#0284C7" : "#16A34A",
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {c.status === "FULL" ? "Đã đủ" : "Sắp khai giảng"}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Content Section */}
                  <View style={styles.cardContent}>
                    {/* Title */}
                    <Text style={styles.courseTitle} numberOfLines={2}>
                      {c.name}
                    </Text>

                    {/* Coach Info */}
                    <View style={styles.coachRow}>
                      <Ionicons
                        name="person-circle"
                        size={16}
                        color="#059669"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.courseCoach} numberOfLines={1}>
                        {c.createdBy?.fullName || "Huấn luyện viên"}
                      </Text>
                      {coachRatings[c.createdBy?.id] !== undefined && (
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={12} color="#FFFFFF" />
                          <Text style={styles.ratingBadgeText}>
                            {coachRatings[c.createdBy?.id].toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Location */}
                    <View style={styles.locationRow}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color="#6B7280"
                        style={{ marginRight: 5 }}
                      />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {c.court?.address || "Chưa xác định"}
                      </Text>
                    </View>

                    {/* Meta Row - Level, Participants, Price */}
                    <View style={styles.metaRow}>
                      <View
                        style={[
                          styles.levelBadge,
                          { backgroundColor: levelColor.bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.levelBadgeText,
                            { color: levelColor.text },
                          ]}
                        >
                          {levelLabel}
                        </Text>
                      </View>

                      <View style={styles.participantBadge}>
                        <Ionicons
                          name="people-outline"
                          size={12}
                          color="#6B7280"
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.participantBadgeText}>
                          {c.currentParticipants}/{c.maxParticipants}
                        </Text>
                      </View>

                      <Text style={styles.price}>
                        {formatPrice(c.pricePerParticipant)}
                      </Text>
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

      {/* Course Detail Modal */}
      <Modal
        visible={showCourseDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCourseDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.courseModalContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header with Close Button */}
              <View style={styles.courseModalHeader}>
                <Text style={styles.courseModalTitle}>Chi tiết khóa học</Text>
                <TouchableOpacity
                  onPress={() => setShowCourseDetailModal(false)}
                  activeOpacity={0.7}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {selectedCourse && (
                <View style={styles.courseDetailContent}>
                  {/* Course Image with Overlay Badge */}
                  <View style={styles.imageContainer}>
                    <Image
                      source={{
                        uri:
                          selectedCourse.publicUrl ||
                          "https://via.placeholder.com/400x200?text=Course",
                      }}
                      style={styles.courseDetailImage}
                    />
                    {/* Status Badges */}
                    <View style={styles.statusBadgeOverlay}>
                      <View style={[styles.badge, styles.badgePrimary]}>
                        <Text style={styles.badgeText}>
                          {selectedCourse.learningFormat === "INDIVIDUAL"
                            ? "Cá nhân"
                            : "Nhóm"}
                        </Text>
                      </View>
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelBadgeText}>
                          {getLevelInVietnamese(selectedCourse.level)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Course Info */}
                  <View style={styles.courseInfoSection}>
                    {/* Title Section */}
                    <View>
                      <Text style={styles.courseDetailTitle} numberOfLines={3}>
                        {selectedCourse.name}
                      </Text>
                      <View style={styles.coachRow}>
                        <Ionicons
                          name="person-circle"
                          size={16}
                          color="#059669"
                        />
                        <Text
                          style={styles.courseDetailCoach}
                          numberOfLines={1}
                        >
                          {selectedCourse.createdBy?.fullName ||
                            "Huấn luyện viên"}
                        </Text>
                        {selectedCourse.createdBy?.id &&
                          coachRatings[selectedCourse.createdBy.id] !==
                            undefined && (
                            <>
                              <Ionicons
                                name="star"
                                size={14}
                                color="#FBBF24"
                                style={{ marginLeft: 6 }}
                              />
                              <Text
                                style={[
                                  styles.courseDetailCoach,
                                  { marginLeft: 3, fontWeight: "600" },
                                ]}
                              >
                                {coachRatings[
                                  selectedCourse.createdBy.id
                                ]?.toFixed(1)}
                              </Text>
                            </>
                          )}
                      </View>
                    </View>

                    {/* Court/Venue Info - Card Style */}
                    {selectedCourse.court && (
                      <View style={styles.venueCard}>
                        <View style={styles.venueIconContainer}>
                          <Ionicons name="location" size={18} color="#059669" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.venueLabel}>
                            Địa điểm tập luyện
                          </Text>
                          <Text style={styles.venueName} numberOfLines={2}>
                            {selectedCourse.court.name || "Sân pickleball"}
                          </Text>
                          <Text style={styles.venueAddress} numberOfLines={2}>
                            {selectedCourse.court.address || "N/A"}
                          </Text>
                          {selectedCourse.court.phoneNumber && (
                            <Text style={styles.venuePhone}>
                              ☎ {selectedCourse.court.phoneNumber}
                            </Text>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Quick Stats Row - Location, Sessions, Date Range */}
                    <View style={styles.quickStatsRow}>
                      <View style={styles.statItem}>
                        <Ionicons name="calendar" size={16} color="#059669" />
                        <Text style={styles.statLabel}>Buổi học</Text>
                        <Text style={styles.statValue}>
                          {selectedCourse.totalSessions}
                        </Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Ionicons name="time" size={16} color="#059669" />
                        <Text style={styles.statLabel}>Kéo dài</Text>
                        <Text style={styles.statValue}>
                          {selectedCourse.startDate &&
                            selectedCourse.endDate &&
                            Math.ceil(
                              (new Date(selectedCourse.endDate).getTime() -
                                new Date(selectedCourse.startDate).getTime()) /
                                (1000 * 60 * 60 * 24 * 7)
                            )}{" "}
                          tuần
                        </Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Ionicons name="people" size={16} color="#059669" />
                        <Text style={styles.statLabel}>Học viên</Text>
                        <Text style={styles.statValue}>
                          {selectedCourse.currentParticipants}/
                          {selectedCourse.maxParticipants}
                        </Text>
                      </View>
                    </View>

                    {/* Description with Visual Accent */}
                    {selectedCourse.description && (
                      <View style={styles.descriptionSection}>
                        <View style={styles.descriptionHeader}>
                          <Ionicons
                            name="document-text"
                            size={16}
                            color="#059669"
                          />
                          <Text style={styles.descriptionTitle}>
                            Mô tả khóa học
                          </Text>
                        </View>
                        <Text style={styles.descriptionText}>
                          {selectedCourse.description}
                        </Text>
                      </View>
                    )}

                    {/* Course Status */}
                    <View
                      style={[
                        styles.statusBadgeSection,
                        {
                          backgroundColor:
                            getStatusColor(selectedCourse.status) + "20",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: getStatusColor(
                              selectedCourse.status
                            ),
                          },
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.statusLabel}>
                          Trạng thái khóa học
                        </Text>
                        <Text
                          style={[
                            styles.statusValue,
                            { color: getStatusColor(selectedCourse.status) },
                          ]}
                        >
                          {getStatusInVietnamese(selectedCourse.status)}
                        </Text>
                      </View>
                    </View>

                    {/* Course Details Grid - Expanded */}
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailCard}>
                        <Text style={styles.detailCardLabel}>Bắt đầu</Text>
                        <Text style={styles.detailCardValue}>
                          {new Date(
                            selectedCourse.startDate
                          ).toLocaleDateString("vi-VN", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "2-digit",
                          })}
                        </Text>
                      </View>

                      <View style={styles.detailCard}>
                        <Text style={styles.detailCardLabel}>Kết thúc</Text>
                        <Text style={styles.detailCardValue}>
                          {selectedCourse.endDate &&
                            new Date(selectedCourse.endDate).toLocaleDateString(
                              "vi-VN",
                              {
                                month: "2-digit",
                                day: "2-digit",
                                year: "2-digit",
                              }
                            )}
                        </Text>
                      </View>

                      <View style={styles.detailCard}>
                        <Text style={styles.detailCardLabel}>Trình độ</Text>
                        <Text style={styles.detailCardValue}>
                          {getLevelInVietnamese(selectedCourse.level)}
                        </Text>
                      </View>

                      <View style={styles.detailCard}>
                        <Text style={styles.detailCardLabel}>Hình thức</Text>
                        <Text style={styles.detailCardValue}>
                          {selectedCourse.learningFormat === "INDIVIDUAL"
                            ? "Cá nhân"
                            : "Nhóm"}
                        </Text>
                      </View>
                    </View>

                    {/* Schedule Section - Compact */}
                    {selectedCourse.schedules &&
                      selectedCourse.schedules.length > 0 && (
                        <View style={styles.scheduleSection}>
                          <View style={styles.sectionHeaderRow}>
                            <Ionicons
                              name="calendar-outline"
                              size={18}
                              color="#059669"
                            />
                            <Text style={styles.sectionTitle}>Lịch học</Text>
                          </View>
                          <View style={styles.scheduleList}>
                            {selectedCourse.schedules
                              .slice(0, 3)
                              .map((schedule, idx) => (
                                <View key={idx} style={styles.scheduleItem}>
                                  <View style={styles.scheduleDay}>
                                    <Text style={styles.scheduleDayText}>
                                      {convertDayOfWeekToVietnamese(
                                        schedule.dayOfWeek
                                      )}
                                    </Text>
                                  </View>
                                  <View style={styles.scheduleTime}>
                                    <Ionicons
                                      name="time-outline"
                                      size={14}
                                      color="#6B7280"
                                    />
                                    <Text style={styles.scheduleTimeText}>
                                      {schedule.startTime} - {schedule.endTime}
                                    </Text>
                                  </View>
                                </View>
                              ))}
                            {selectedCourse.schedules.length > 3 && (
                              <Text style={styles.moreSchedules}>
                                +{selectedCourse.schedules.length - 3} buổi khác
                              </Text>
                            )}
                          </View>
                        </View>
                      )}

                    {/* Key Information Cards */}
                    <View style={styles.keyInfoSection}>
                      {/* Participants Info */}
                      {selectedCourse.learningFormat === "GROUP" && (
                        <View style={styles.infoCard}>
                          <View style={styles.infoCardHeader}>
                            <Ionicons name="people" size={18} color="#059669" />
                            <Text style={styles.infoCardTitle}>Học viên</Text>
                          </View>
                          <View style={styles.participantsGrid}>
                            <View style={styles.participantCell}>
                              <Text style={styles.participantCellLabel}>
                                Hiện tại
                              </Text>
                              <Text style={styles.participantCellValue}>
                                {selectedCourse.currentParticipants}
                              </Text>
                            </View>
                            <View style={styles.participantCell}>
                              <Text style={styles.participantCellLabel}>
                                Tối thiểu
                              </Text>
                              <Text style={styles.participantCellValue}>
                                {selectedCourse.minParticipants}
                              </Text>
                            </View>
                            <View style={styles.participantCell}>
                              <Text style={styles.participantCellLabel}>
                                Tối đa
                              </Text>
                              <Text style={styles.participantCellValue}>
                                {selectedCourse.maxParticipants}
                              </Text>
                            </View>
                          </View>
                          {selectedCourse.currentParticipants === 0 && (
                            <View style={styles.warningBanner}>
                              <Ionicons
                                name="alert-circle-outline"
                                size={14}
                                color="#F59E0B"
                              />
                              <Text style={styles.warningBannerText}>
                                Chưa có học viên đăng ký
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Price Section - Prominent */}
                    <View style={styles.priceSectionLarge}>
                      <View>
                        <Text style={styles.priceSectionLabel}>
                          Giá khóa học
                        </Text>
                        <Text style={styles.priceSectionValue}>
                          {formatPrice(selectedCourse.pricePerParticipant)}
                        </Text>
                      </View>
                      <View style={styles.priceInfo}>
                        <Text style={styles.priceInfoText}>
                          {selectedCourse.maxParticipants -
                            selectedCourse.currentParticipants >
                          0
                            ? `${
                                selectedCourse.maxParticipants -
                                selectedCourse.currentParticipants
                              } chỗ còn`
                            : "Đã đủ học viên"}
                        </Text>
                      </View>
                    </View>

                    {/* Register Button - Full Width, Touch Friendly */}
                    <TouchableOpacity
                      style={[
                        styles.primaryBtn,
                        styles.registerBtn,
                        processingPayment === selectedCourse.id &&
                          styles.primaryBtnDisabled,
                        selectedCourse.maxParticipants -
                          selectedCourse.currentParticipants <=
                          0 && styles.disabledBtn,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        handleRegister(selectedCourse.id);
                        setShowCourseDetailModal(false);
                      }}
                      disabled={
                        processingPayment === selectedCourse.id ||
                        selectedCourse.maxParticipants -
                          selectedCourse.currentParticipants <=
                          0
                      }
                    >
                      {processingPayment === selectedCourse.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : selectedCourse.maxParticipants -
                          selectedCourse.currentParticipants <=
                        0 ? (
                        <Text style={styles.primaryBtnText}>
                          Khóa học đã đủ học viên
                        </Text>
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color="#FFFFFF"
                          />
                          <Text style={styles.primaryBtnText}>
                            Đăng ký ngay
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Province Modal */}
      <Modal
        visible={showProvinceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProvinceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn tỉnh/thành phố</Text>
              <TouchableOpacity
                onPress={() => setShowProvinceModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            {loadingProvinces ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#10B981" />
              </View>
            ) : (
              <ScrollView>
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    !selectedProvince && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setSelectedProvince(null);
                    setShowProvinceModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      !selectedProvince && styles.modalItemTextActive,
                    ]}
                  >
                    Tất cả
                  </Text>
                </TouchableOpacity>
                {provinces.map((province) => (
                  <TouchableOpacity
                    key={province.id}
                    style={[
                      styles.modalItem,
                      selectedProvince?.id === province.id &&
                        styles.modalItemActive,
                    ]}
                    onPress={() => {
                      setSelectedProvince(province);
                      setShowProvinceModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedProvince?.id === province.id &&
                          styles.modalItemTextActive,
                      ]}
                    >
                      {province.name}
                    </Text>
                    {selectedProvince?.id === province.id && (
                      <Ionicons name="checkmark" size={20} color="#10B981" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* District Modal */}
      <Modal
        visible={showDistrictModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn quận/huyện</Text>
              <TouchableOpacity
                onPress={() => setShowDistrictModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            {loadingDistricts ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#10B981" />
              </View>
            ) : (
              <ScrollView>
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    !selectedDistrict && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setSelectedDistrict(null);
                    setShowDistrictModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      !selectedDistrict && styles.modalItemTextActive,
                    ]}
                  >
                    Tất cả
                  </Text>
                </TouchableOpacity>
                {districts.map((district) => (
                  <TouchableOpacity
                    key={district.id}
                    style={[
                      styles.modalItem,
                      selectedDistrict?.id === district.id &&
                        styles.modalItemActive,
                    ]}
                    onPress={() => {
                      setSelectedDistrict(district);
                      setShowDistrictModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedDistrict?.id === district.id &&
                          styles.modalItemTextActive,
                      ]}
                    >
                      {district.name}
                    </Text>
                    {selectedDistrict?.id === district.id && (
                      <Ionicons name="checkmark" size={20} color="#10B981" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
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
  container: { padding: 16, gap: 12, paddingBottom: 20 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 2,
  },
  cardImageWrapper: {
    position: "relative",
    overflow: "hidden",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    height: 160,
  },
  cover: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E7EB",
  },
  formatBadgeContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
  },
  formatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: "hidden",
  },
  formatBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadgeContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardContent: {
    padding: 12,
    gap: 8,
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
  levelBadgeContainer: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  badgePrimary: { backgroundColor: "#059669" },
  badgeNeutral: { backgroundColor: "#E5E7EB" },
  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  priceLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  price: { color: "#059669", fontWeight: "700", fontSize: 16 },
  primaryBtn: {
    backgroundColor: "#059669",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 90,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
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
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#059669",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  detailBtnText: {
    color: "#059669",
    fontWeight: "700",
    fontSize: 14,
  },
  courseModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingTop: 0,
  },
  courseModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  courseModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  courseDetailContent: {
    padding: 0,
  },
  imageContainer: {
    position: "relative",
    overflow: "hidden",
  },
  courseDetailImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#E5E7EB",
  },
  statusBadgeOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
    zIndex: 10,
  },
  courseInfoSection: {
    padding: 16,
    gap: 12,
  },
  courseDetailTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 24,
  },
  courseDetailCoach: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 4,
  },
  quickInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  quickInfoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quickInfoText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "#E5E7EB",
  },
  descriptionSection: {
    backgroundColor: "#F9FAFB",
    borderLeftWidth: 3,
    borderLeftColor: "#059669",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  descriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  descriptionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 13,
    color: "#111827",
    lineHeight: 18,
    fontWeight: "500",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  ratingDetailCard: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  detailCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  detailCardValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 18,
  },
  participantsSection: {
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 8,
    gap: 0,
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  participantColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  participantLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  participantValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  participantDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#C6F6D5",
  },
  individualCourseInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#059669",
  },
  individualCourseText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  warningSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  warningText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D97706",
  },
  statusBadgeSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#059669",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  progressSection: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#059669",
    borderRadius: 3,
  },
  scheduleSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  scheduleList: {
    gap: 6,
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scheduleDay: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    minWidth: 50,
  },
  scheduleTime: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  moreSchedules: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 6,
  },
  priceSectionLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDF4",
    padding: 14,
    borderRadius: 10,
    gap: 10,
  },
  priceSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  priceSectionValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#059669",
    marginTop: 2,
  },
  priceInfo: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceInfoText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  registerBtn: {
    flexDirection: "row",
    width: "100%",
    minWidth: "auto",
    marginTop: 4,
    paddingVertical: 12,
    gap: 8,
  },
  disabledBtn: {
    backgroundColor: "#D1D5DB",
  },
  detailCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  detailRowText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  badgesDetailRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  // New modal styles
  venueCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#059669",
  },
  venueIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center",
  },
  venueLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  venueName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 18,
  },
  venueAddress: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    lineHeight: 16,
    marginTop: 2,
  },
  venuePhone: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
    marginTop: 4,
  },
  quickStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#C6F6D5",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  scheduleDayText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  scheduleTimeText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  keyInfoSection: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#059669",
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  participantsGrid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  participantCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  participantCellLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  participantCellValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  warningBannerText: {
    fontSize: 12,
    color: "#D97706",
    fontWeight: "600",
    flex: 1,
  },
  courtInfoContent: {
    gap: 4,
  },
  courtPriceLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  courtPriceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
});
