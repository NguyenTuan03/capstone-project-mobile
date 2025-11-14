import { get, post } from "@/services/http/httpService";
import { Course } from "@/types/course";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn thành",
    FULL: "Đã đủ người",
    READY_OPENED: "Sẵn sàng mở",
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

  const fetchProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const res = await get<Province[]>("/v1/provinces");
      setProvinces(res.data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách tỉnh/thành phố:", error);
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
      console.error("Lỗi khi tải danh sách quận/huyện:", error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadUserLocation = useCallback(async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        const userData = JSON.parse(userString);

        // Xử lý cả 2 trường hợp: có metadata wrapper hoặc chỉ user object
        let learner = null;
        if (userData?.metadata?.user?.learner?.[0]) {
          learner = userData.metadata.user.learner[0];
        } else if (userData?.learner?.[0]) {
          learner = userData.learner[0];
        }

        if (learner?.province && learner?.district) {
          // Đợi provinces được load xong
          const provincesList =
            provinces.length > 0
              ? provinces
              : (await get<Province[]>("/v1/provinces")).data || [];

          const userProvince = provincesList.find(
            (p) => p.id === learner.province.id
          );
          if (userProvince) {
            setSelectedProvince(userProvince);
            // Fetch districts cho province này
            const districtsRes = await get<District[]>(
              `/v1/provinces/${userProvince.id}/districts`
            );
            const districtsList = districtsRes.data || [];

            const userDistrict = districtsList.find(
              (d) => d.id === learner.district.id
            );
            if (userDistrict) {
              setSelectedDistrict(userDistrict);
            }
          }
        }
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin địa điểm từ user:", error);
    }
  }, [provinces]);

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

  const fetchCourses = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      // Build filter query
      const filters: string[] = ["status_eq_APPROVED"];
      if (selectedProvince) {
        filters.push(`province.id_eq_${selectedProvince.id}`);
      }
      if (selectedDistrict) {
        filters.push(`district.id_eq_${selectedDistrict.id}`);
      }

      const filterQuery = filters.join("&");
      const url = `/v1/courses?page=${pageNum}&pageSize=${pageSize}&filter=${filterQuery}`;
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
      Alert.alert("Lỗi", "Không thể tải danh sách khóa học");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCourses(1, false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProvince, selectedDistrict])
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
        // fallback đóng tab nếu cần
        try {
          await WebBrowser.dismissBrowser();
        } catch {}
        throw new Error("Không nhận được callback");
      }

      const { status = "", cancel = "", orderCode } = getParams(callbackUrl);
      const paid =
        status.toUpperCase() === "PAID" && cancel.toLowerCase() !== "true";

      if (paid) {
        Alert.alert("Thành công", `Mã đơn: ${orderCode || "N/A"}`);
      } else {
        Alert.alert("Đã hủy", "Thanh toán không thành công.");
      }
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message ?? "Có lỗi khi thanh toán.");
    } finally {
      setProcessingPayment(null);
    }
  };

  return (
    <View style={[styles.safe]}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Khóa học</Text>
          <Text style={styles.headerSubtitle}>
            Khám phá các khóa học pickleball
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Search & Filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Tìm kiếm khóa học..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
            <Ionicons name="funnel" size={20} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* Province & District Filter */}
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
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        ) : courses.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: "#6B7280", fontSize: 14 }}>
              Không có khóa học nào
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {courses.map((c) => (
              <View key={c.id} style={styles.card}>
                <View style={styles.cardImageWrapper}>
                  <Image
                    source={{
                      uri: "https://via.placeholder.com/400x160?text=Course",
                    }}
                    style={styles.cover}
                  />
                  <View style={styles.cardBadges}>
                    <View style={[styles.badge, styles.badgePrimary]}>
                      <Text style={styles.badgeText}>
                        {c.learningFormat === "INDIVIDUAL" ? "Cá nhân" : "Nhóm"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  {/* Title & Coach */}
                  <View>
                    <Text style={styles.courseTitle} numberOfLines={2}>
                      {c.name}
                    </Text>
                    <Text style={styles.courseCoach}>
                      {c.createdBy?.fullName || "Huấn luyện viên"}
                    </Text>
                  </View>

                  {/* Location */}
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color="#3B82F6" />
                    <Text style={styles.locationText}>{c.court?.address}</Text>
                  </View>

                  {/* Level Badge & Participants */}
                  <View style={styles.levelBadgeContainer}>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelBadgeText}>
                        {getLevelInVietnamese(c.level)}
                      </Text>
                    </View>
                    <View style={styles.participantBadge}>
                      <Text style={styles.participantBadgeText}>
                        {c.currentParticipants}/{c.maxParticipants} học viên
                      </Text>
                    </View>
                  </View>

                  {/* Footer - Price & Button */}
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.priceLabel}>Giá khóa học</Text>
                      <Text style={styles.price}>
                        {formatPrice(c.pricePerParticipant)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.detailBtn}
                      activeOpacity={0.9}
                      onPress={() => {
                        setSelectedCourse(c);
                        setShowCourseDetailModal(true);
                      }}
                    >
                      <Text style={styles.detailBtnText}>Xem chi tiết</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#059669"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
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
                        uri: "https://via.placeholder.com/400x200?text=Course",
                      }}
                      style={styles.courseDetailImage}
                    />
                    {/* Status Badge */}
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
                      <Text style={styles.courseDetailCoach} numberOfLines={1}>
                        {selectedCourse.createdBy?.fullName ||
                          "Huấn luyện viên"}
                      </Text>
                    </View>

                    {/* Quick Info Row - Location & Sessions */}
                    <View style={styles.quickInfoRow}>
                      <View style={styles.quickInfoItem}>
                        <Ionicons name="location" size={14} color="#059669" />
                        <Text style={styles.quickInfoText} numberOfLines={2}>
                          {selectedCourse.court?.address || "N/A"}
                        </Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.quickInfoItem}>
                        <Ionicons name="calendar" size={14} color="#059669" />
                        <Text style={styles.quickInfoText}>
                          {selectedCourse.totalSessions} buổi
                        </Text>
                      </View>
                    </View>

                    {/* Description with Visual Accent */}
                    {selectedCourse.description && (
                      <View style={styles.descriptionSection}>
                        <View style={styles.descriptionHeader}>
                          <Ionicons
                            name="document-text"
                            size={14}
                            color="#059669"
                          />
                          <Text style={styles.descriptionTitle}>Mô tả</Text>
                        </View>
                        <Text style={styles.descriptionText}>
                          {selectedCourse.description}
                        </Text>
                      </View>
                    )}

                    {/* Participants Info - Prominent (Only for GROUP courses) */}
                    {selectedCourse.learningFormat === "GROUP" && (
                      <View style={styles.participantsSection}>
                        <View style={styles.participantRow}>
                          <View style={styles.participantColumn}>
                            <Text style={styles.participantLabel}>
                              Hiện tại
                            </Text>
                            <Text style={styles.participantValue}>
                              {selectedCourse.currentParticipants}
                            </Text>
                          </View>
                          <View style={styles.participantDivider} />
                          <View style={styles.participantColumn}>
                            <Text style={styles.participantLabel}>
                              Tối thiểu
                            </Text>
                            <Text style={styles.participantValue}>
                              {selectedCourse.minParticipants}
                            </Text>
                          </View>
                          <View style={styles.participantDivider} />
                          <View style={styles.participantColumn}>
                            <Text style={styles.participantLabel}>Tối đa</Text>
                            <Text style={styles.participantValue}>
                              {selectedCourse.maxParticipants}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Individual Course Info */}
                    {selectedCourse.learningFormat === "INDIVIDUAL" && (
                      <View style={styles.individualCourseInfo}>
                        <Ionicons name="person" size={16} color="#059669" />
                        <Text style={styles.individualCourseText}>
                          Khóa học cá nhân
                        </Text>
                      </View>
                    )}

                    {/* Current Participants = 0 Warning */}
                    {selectedCourse.currentParticipants === 0 &&
                      selectedCourse.learningFormat === "GROUP" && (
                        <View style={styles.warningSection}>
                          <Ionicons
                            name="alert-circle"
                            size={16}
                            color="#F59E0B"
                          />
                          <Text style={styles.warningText}>
                            Chưa có học viên đăng ký
                          </Text>
                        </View>
                      )}

                    {/* Course Status Badge */}
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

                    {/* Course Details - High Density Grid */}
                    <View style={styles.detailsGrid}>
                      {/* Subject */}
                      <View style={styles.detailCard}>
                        <Text style={styles.detailCardLabel}>Chủ đề</Text>
                        <Text style={styles.detailCardValue} numberOfLines={2}>
                          {selectedCourse.subject?.name || "N/A"}
                        </Text>
                      </View>

                      {/* Duration */}
                      <View style={styles.detailCard}>
                        <Text style={styles.detailCardLabel}>Bắt đầu</Text>
                        <Text style={styles.detailCardValue}>
                          {new Date(
                            selectedCourse.startDate
                          ).toLocaleDateString("vi-VN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                      </View>

                      {/* Level */}
                      <View style={styles.detailCard}>
                        <Text style={styles.detailCardLabel}>Trình độ</Text>
                        <Text style={styles.detailCardValue}>
                          {getLevelInVietnamese(selectedCourse.level)}
                        </Text>
                      </View>

                      {/* Total Sessions */}
                      <View style={styles.detailCard}>
                        <Text style={styles.detailCardLabel}>Tổng buổi</Text>
                        <Text style={styles.detailCardValue}>
                          {selectedCourse.totalSessions}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Tiến độ</Text>
                        <Text style={styles.progressValue}>
                          {Math.round(selectedCourse.progressPct)}%
                        </Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${selectedCourse.progressPct}%` },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Schedule Section - Compact */}
                    {selectedCourse.schedules &&
                      selectedCourse.schedules.length > 0 && (
                        <View style={styles.scheduleSection}>
                          <Text style={styles.sectionTitle}>Lịch học</Text>
                          <View style={styles.scheduleList}>
                            {selectedCourse.schedules
                              .slice(0, 2)
                              .map((schedule, idx) => (
                                <View key={idx} style={styles.scheduleItem}>
                                  <Text style={styles.scheduleDay}>
                                    {schedule.dayOfWeek}
                                  </Text>
                                  <Text style={styles.scheduleTime}>
                                    {schedule.startTime} - {schedule.endTime}
                                  </Text>
                                </View>
                              ))}
                            {selectedCourse.schedules.length > 2 && (
                              <Text style={styles.moreSchedules}>
                                +{selectedCourse.schedules.length - 2} buổi khác
                              </Text>
                            )}
                          </View>
                        </View>
                      )}

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
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardImageWrapper: {
    position: "relative",
    overflow: "hidden",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardBadges: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    gap: 6,
  },
  cardContent: {
    padding: 14,
    gap: 10,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 4,
  },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
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
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: "#111827", fontSize: 14, fontWeight: "500" },
  filterBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  filterSection: { gap: 10 },
  filterSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterTitle: {
    color: "#059669",
    fontWeight: "700",
    fontSize: 14,
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
    paddingVertical: 12,
  },
  filterSelectDisabled: {
    opacity: 0.5,
    backgroundColor: "#F3F4F6",
  },
  filterSelectText: {
    color: "#111827",
    fontSize: 14,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    borderBottomColor: "#E5E7EB",
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalItemActive: {
    backgroundColor: "#F0FDF4",
  },
  modalItemText: {
    fontSize: 16,
    color: "#111827",
  },
  modalItemTextActive: {
    color: "#059669",
    fontWeight: "600",
  },
  cover: { width: "100%", height: 160, backgroundColor: "#E5E7EB" },
  courseTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 20,
  },
  courseCoach: { color: "#6B7280", fontSize: 12, fontWeight: "500" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { color: "#6B7280", fontSize: 12, fontWeight: "500", flex: 1 },
  levelBadgeContainer: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  levelBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  levelBadgeText: { color: "#059669", fontSize: 12, fontWeight: "600" },
  participantBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  participantBadgeText: { color: "#D97706", fontSize: 12, fontWeight: "600" },
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    borderBottomColor: "#E5E7EB",
  },
  courseModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
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
});
