import locationService from "@/services/location.service";
import storageService from "@/services/storageService";
import { District, Province } from "@/types/court";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function EditLearnerAccountScreen() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provinceId, setProvinceId] = useState<string | null>(null);
  const [provinceName, setProvinceName] = useState("");
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [districtName, setDistrictName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [provinceModalVisible, setProvinceModalVisible] = useState(false);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");

  const fetchProvinces = useCallback(async () => {
    setLoadingProvinces(true);
    try {
      const data = await locationService.getProvinces();
      setProvinces(data);
    } catch (fetchError) {
      console.error("Failed to fetch provinces", fetchError);
    } finally {
      setLoadingProvinces(false);
    }
  }, []);

  const fetchDistrictList = useCallback(async (provinceIdValue: string) => {
    if (!provinceIdValue) {
      setDistricts([]);
      return;
    }

    setLoadingDistricts(true);
    try {
      const data = await locationService.getDistrictsByProvince(
        Number(provinceIdValue)
      );
      setDistricts(data);
    } catch (fetchError) {
      console.error("Failed to fetch districts", fetchError);
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  useEffect(() => {
    fetchProvinces();
  }, [fetchProvinces]);

  const loadUserData = useCallback(async () => {
    const storedUser = await storageService.getUser();
    if (!storedUser) return;

    setUser(storedUser);
    setFullName(storedUser.fullName || "");
    setEmail(storedUser.email || "");
    setPhoneNumber(storedUser.phoneNumber || "");

    const storedProvinceId = storedUser.province?.id
      ? String(storedUser.province.id)
      : null;
    const storedDistrictId = storedUser.district?.id
      ? String(storedUser.district.id)
      : null;

    setProvinceId(storedProvinceId);
    setProvinceName(storedUser.province?.name || "");
    setDistrictId(storedDistrictId);
    setDistrictName(storedUser.district?.name || "");

    if (storedProvinceId) {
      await fetchDistrictList(storedProvinceId);
    } else {
      setDistricts([]);
    }
  }, [fetchDistrictList]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const filteredProvinces = useMemo(() => {
    return provinces.filter((province) =>
      province.name.toLowerCase().includes(provinceSearch.toLowerCase())
    );
  }, [provinces, provinceSearch]);

  const filteredDistricts = useMemo(() => {
    return districts.filter((district) =>
      district.name.toLowerCase().includes(districtSearch.toLowerCase())
    );
  }, [districts, districtSearch]);

  const handleSelectProvince = (province: Province) => {
    const idString = province.id ? String(province.id) : null;
    setProvinceId(idString);
    setProvinceName(province.name);
    setDistrictId(null);
    setDistrictName("");
    setProvinceModalVisible(false);
    setProvinceSearch("");

    if (idString) {
      fetchDistrictList(idString);
    } else {
      setDistricts([]);
    }
  };

  const handleSelectDistrict = (district: District) => {
    const idString = district.id ? String(district.id) : null;
    setDistrictId(idString);
    setDistrictName(district.name);
    setDistrictModalVisible(false);
    setDistrictSearch("");
  };

  const handleOpenProvinceModal = () => {
    setProvinceSearch("");
    setProvinceModalVisible(true);
  };

  const handleOpenDistrictModal = () => {
    if (!provinceId) {
      return;
    }
    setDistrictSearch("");
    setDistrictModalVisible(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = "Họ và tên không được để trống";
    }

    setFieldErrors(errors);

    return { isValid: Object.keys(errors).length === 0 };
  };

  const handleSave = async () => {
    const { isValid } = validateForm();
    if (!isValid) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = await storageService.getToken();
      const requestPayload: Record<string, any> = {
        fullName: fullName.trim(),
      };

      if (provinceId) {
        requestPayload.provinceId = Number(provinceId);
      }

      if (districtId) {
        requestPayload.districtId = Number(districtId);
      }

      await axios.put(`${API_URL}/v1/users/profile`, requestPayload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const updatedUser = {
        ...user,
        fullName: requestPayload.fullName,
        province: provinceId
          ? {
              id: Number(provinceId),
              name: provinceName,
            }
          : null,
        district: districtId
          ? {
              id: Number(districtId),
              name: districtName,
            }
          : null,
      };
      await storageService.setUser(updatedUser);
      setUser(updatedUser);
      setSuccess(true);

      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Không thể cập nhật. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#059669" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Chỉnh sửa thông tin</Text>
            <Text style={styles.subtitle}>Cập nhật hồ sơ học viên</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {success && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>Cập nhật thành công</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={[
                styles.input,
                fieldErrors.fullName ? styles.inputError : undefined,
              ]}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#94A3B8"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (fieldErrors.fullName) clearFieldError("fullName");
              }}
              editable={!loading}
            />
            {fieldErrors.fullName ? (
              <Text style={styles.fieldError}>{fieldErrors.fullName}</Text>
            ) : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>{email}</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>{phoneNumber}</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tỉnh/Thành phố</Text>
            {loadingProvinces ? (
              <View style={[styles.selector, styles.selectorDisabled]}>
                <ActivityIndicator color="#059669" />
                <Text style={styles.loadingText}>Đang tải danh sách...</Text>
              </View>
            ) : (
              <Pressable
                style={styles.selector}
                onPress={handleOpenProvinceModal}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.selectorText,
                    !provinceName && styles.selectorPlaceholder,
                  ]}
                >
                  {provinceName || "Chọn tỉnh/thành phố"}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Quận/Huyện</Text>
            {!provinceId ? (
              <View style={[styles.selector, styles.selectorDisabled]}>
                <Text style={[styles.selectorText, styles.selectorPlaceholder]}>
                  Vui lòng chọn tỉnh/thành phố trước
                </Text>
              </View>
            ) : loadingDistricts ? (
              <View style={[styles.selector, styles.selectorDisabled]}>
                <ActivityIndicator color="#059669" />
                <Text style={styles.loadingText}>Đang tải danh sách...</Text>
              </View>
            ) : (
              <Pressable
                style={styles.selector}
                onPress={handleOpenDistrictModal}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.selectorText,
                    !districtName && styles.selectorPlaceholder,
                  ]}
                >
                  {districtName || "Chọn quận/huyện"}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Lưu thay đổi</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Hủy</Text>
          </Pressable>
        </View>
      </ScrollView>
      <Modal
        visible={provinceModalVisible}
        animationType="slide"
        onRequestClose={() => setProvinceModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn Tỉnh/Thành phố</Text>
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setProvinceModalVisible(false)}
            >
              <Ionicons name="close" size={22} color="#111827" />
            </Pressable>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm..."
              placeholderTextColor="#94A3B8"
              value={provinceSearch}
              onChangeText={setProvinceSearch}
            />
            {provinceSearch ? (
              <Pressable onPress={() => setProvinceSearch("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#CBD5F5" />
              </Pressable>
            ) : null}
          </View>

          <ScrollView style={styles.modalList}>
            {filteredProvinces.map((province) => {
              const provinceKey = province.id ? String(province.id) : province.name;
              const isActive =
                !!province.id && provinceId === String(province.id);

              return (
                <Pressable
                  key={provinceKey}
                  style={[
                    styles.modalItem,
                    isActive && styles.modalItemActive,
                  ]}
                  onPress={() => handleSelectProvince(province)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isActive && styles.modalItemTextActive,
                    ]}
                  >
                    {province.name}
                  </Text>
                  {isActive && (
                    <Ionicons name="checkmark" size={18} color="#059669" />
                  )}
                </Pressable>
              );
            })}
            {filteredProvinces.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={28} color="#CBD5F5" />
                <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={districtModalVisible}
        animationType="slide"
        onRequestClose={() => setDistrictModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn Quận/Huyện</Text>
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setDistrictModalVisible(false)}
            >
              <Ionicons name="close" size={22} color="#111827" />
            </Pressable>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm..."
              placeholderTextColor="#94A3B8"
              value={districtSearch}
              onChangeText={setDistrictSearch}
            />
            {districtSearch ? (
              <Pressable onPress={() => setDistrictSearch("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#CBD5F5" />
              </Pressable>
            ) : null}
          </View>

          <ScrollView style={styles.modalList}>
            {filteredDistricts.map((district) => {
              const districtKey = district.id
                ? String(district.id)
                : district.name;
              const isActive =
                !!district.id && districtId === String(district.id);

              return (
                <Pressable
                  key={districtKey}
                  style={[
                    styles.modalItem,
                    isActive && styles.modalItemActive,
                  ]}
                  onPress={() => handleSelectDistrict(district)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isActive && styles.modalItemTextActive,
                    ]}
                  >
                    {district.name}
                  </Text>
                  {isActive && (
                    <Ionicons name="checkmark" size={18} color="#059669" />
                  )}
                </Pressable>
              );
            })}
            {filteredDistricts.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={28} color="#CBD5F5" />
                <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: "#B91C1C",
    fontWeight: "600",
    fontSize: 13,
  },
  successBanner: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  successText: {
    color: "#047857",
    fontWeight: "600",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  readOnlyInput: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  readOnlyText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  inputError: {
    borderColor: "#F87171",
  },
  fieldError: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "500",
  },
  selector: {
    borderWidth: 1,
    borderColor: "#CBD5F5",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  selectorPlaceholder: {
    color: "#94A3B8",
    fontWeight: "500",
  },
  selectorDisabled: {
    opacity: 0.6,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
    marginLeft: 8,
  },
  primaryButton: {
    backgroundColor: "#059669",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    backgroundColor: "#94A3B8",
    shadowOpacity: 0,
    elevation: 0,
  },
  secondaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },
  modalList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalItemActive: {
    backgroundColor: "#ECFDF5",
  },
  modalItemText: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
  },
  modalItemTextActive: {
    color: "#047857",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },
});

