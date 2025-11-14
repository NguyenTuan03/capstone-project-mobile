import { get, post } from "@/services/http/httpService";
import { Course } from "@/types/course";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
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
        return;
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
    <SafeAreaView
      style={[
        styles.safe,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 50 },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Search & Filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <View style={styles.searchIcon} />
            <TextInput
              placeholder="Tìm kiếm khóa học..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
          </View>
          <View style={styles.filterBtn} />
        </View>

        {/* Province & District Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Lọc theo địa điểm</Text>
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
          <View style={{ gap: 16 }}>
            {courses.map((c) => (
              <View
                key={c.id}
                style={[styles.card, { padding: 0, overflow: "hidden" }]}
              >
                <Image
                  source={{
                    uri: "https://via.placeholder.com/400x160?text=Course",
                  }}
                  style={styles.cover}
                />
                <View style={{ padding: 16, gap: 8 }}>
                  <Text style={styles.courseTitle}>{c.name}</Text>
                  <Text style={styles.courseCoach}>
                    {c.createdBy?.fullName || "Huấn luyện viên"}
                  </Text>

                  <View style={styles.rowGap8}>
                    <View style={styles.pin} />
                    <Text style={styles.meta}>
                      {c.court?.district?.name}, {c.court?.province?.name}
                    </Text>
                  </View>

                  <View style={styles.badgesRow}>
                    <View style={[styles.badge, styles.badgePrimary]}>
                      <Text style={styles.badgeText}>
                        {c.learningFormat === "INDIVIDUAL" ? "Cá nhân" : "Nhóm"}
                      </Text>
                    </View>
                    <View style={[styles.badge, styles.badgeNeutral]}>
                      <Text style={[styles.badgeText, { color: "#111827" }]}>
                        {c.level}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.price}>
                    {formatPrice(c.pricePerParticipant)}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      processingPayment === c.id && styles.primaryBtnDisabled,
                    ]}
                    activeOpacity={0.9}
                    onPress={() => handleRegister(c.id)}
                    disabled={processingPayment === c.id}
                  >
                    {processingPayment === c.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.primaryBtnText}>
                        {c.learningFormat === "INDIVIDUAL"
                          ? "Đăng ký cá nhân"
                          : "Đăng ký"}
                      </Text>
                    )}
                  </TouchableOpacity>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 16, gap: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#9CA3AF",
  },
  searchInput: { flex: 1, color: "#111827" },
  filterBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
  },
  filterSection: { gap: 8 },
  filterTitle: { color: "#111827", fontWeight: "600" },
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
    backgroundColor: "#fff",
    borderRadius: 8,
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
    backgroundColor: "#fff",
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
    color: "#10B981",
    fontWeight: "600",
  },
  cover: { width: "100%", height: 160, backgroundColor: "#E5E7EB" },
  courseTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  courseCoach: { color: "#6B7280", fontSize: 12 },
  rowGap8: { flexDirection: "row", alignItems: "center", gap: 6 },
  star: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#FBBF24" },
  pin: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#9CA3AF" },
  meta: { color: "#6B7280", fontSize: 12 },
  badgesRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgePrimary: { backgroundColor: "#10B981" },
  badgeNeutral: { backgroundColor: "#E5E7EB" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  price: { color: "#10B981", fontWeight: "700", marginTop: 6 },
  primaryBtn: {
    backgroundColor: "#10B981",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  loadMoreBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  loadMoreText: { color: "#10B981", fontWeight: "700" },
});
