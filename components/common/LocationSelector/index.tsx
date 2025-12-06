import locationService from "@/services/location.service";
import { District, Province } from "@/types/court";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type LocationSelectorProps = {
  provinceId: string;
  districtId: string;
  onProvinceChange: (id: string) => void;
  onDistrictChange: (id: string) => void;
  provinceError?: string;
  districtError?: string;
  onClearError?: (field: "province" | "district") => void;
};

export const LocationSelector = ({
  provinceId,
  districtId,
  onProvinceChange,
  onDistrictChange,
  provinceError,
  districtError,
  onClearError,
}: LocationSelectorProps) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");

  useEffect(() => {
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (provinceId) {
      fetchDistricts(Number(provinceId));
    } else {
      setDistricts([]);
    }
  }, [provinceId]);

  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const data = await locationService.getProvinces();
      setProvinces(data);
    } catch (error) {
 "Error fetching provinces:", error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchDistricts = async (provinceIdNum: number) => {
    setLoadingDistricts(true);
    try {
      const data = await locationService.getDistrictsByProvince(provinceIdNum);
      setDistricts(data);
    } catch (error) {
 "Error fetching districts:", error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const getProvinceName = () => {
    const prov = provinces.find((p) => String(p.id) === provinceId);
    return prov?.name || "";
  };

  const getDistrictName = () => {
    const dist = districts.find((d) => String(d.id) === districtId);
    return dist?.name || "";
  };

  const filteredProvinces = provinces.filter((prov) =>
    prov.name.toLowerCase().includes(provinceSearch.toLowerCase())
  );

  const filteredDistricts = districts.filter((dist) =>
    dist.name.toLowerCase().includes(districtSearch.toLowerCase())
  );

  return (
    <>
      {/* Province Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Tỉnh/Thành phố</Text>
        {loadingProvinces ? (
          <View style={styles.inputWrapper}>
            <ActivityIndicator size="small" color="#059669" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.inputWrapper,
              provinceError && styles.inputError,
            ]}
            onPress={() => setShowProvinceModal(true)}
          >
            <Ionicons name="location-outline" size={18} color="#6B7280" />
            <Text
              style={[
                styles.input,
                !provinceId && styles.placeholderText,
              ]}
            >
              {provinceId ? getProvinceName() : "Chọn tỉnh/thành phố"}
            </Text>
            <Ionicons name="chevron-down-outline" size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
        {provinceError ? (
          <Text style={styles.errorFieldText}>{provinceError}</Text>
        ) : null}
      </View>

      {/* District Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Quận/Huyện</Text>
        {!provinceId ? (
          <View style={styles.inputWrapper}>
            <Ionicons name="map-outline" size={18} color="#D1D5DB" />
            <Text style={[styles.input, styles.placeholderText]}>
              Vui lòng chọn tỉnh/thành phố trước
            </Text>
          </View>
        ) : loadingDistricts ? (
          <View style={styles.inputWrapper}>
            <ActivityIndicator size="small" color="#059669" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.inputWrapper,
              districtError && styles.inputError,
            ]}
            onPress={() => setShowDistrictModal(true)}
          >
            <Ionicons name="map-outline" size={18} color="#6B7280" />
            <Text
              style={[
                styles.input,
                !districtId && styles.placeholderText,
              ]}
            >
              {districtId ? getDistrictName() : "Chọn quận/huyện"}
            </Text>
            <Ionicons name="chevron-down-outline" size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
        {districtError ? (
          <Text style={styles.errorFieldText}>{districtError}</Text>
        ) : null}
      </View>

      {/* Province Modal */}
      <Modal
        visible={showProvinceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProvinceModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn Tỉnh/Thành phố</Text>
            <TouchableOpacity
              onPress={() => setShowProvinceModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm tỉnh/thành phố..."
              value={provinceSearch}
              onChangeText={setProvinceSearch}
              placeholderTextColor="#9CA3AF"
            />
            {provinceSearch ? (
              <TouchableOpacity onPress={() => setProvinceSearch("")}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView style={styles.modalList}>
            {filteredProvinces.map((prov) => (
              <TouchableOpacity
                key={prov.id}
                style={[
                  styles.modalItem,
                  provinceId === String(prov.id) && styles.modalItemActive,
                ]}
                onPress={() => {
                  onProvinceChange(String(prov.id));
                  onDistrictChange(""); // Reset district
                  setProvinceSearch("");
                  setShowProvinceModal(false);
                  onClearError?.("province");
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    provinceId === String(prov.id) && styles.modalItemTextActive,
                  ]}
                >
                  {prov.name}
                </Text>
                {provinceId === String(prov.id) && (
                  <Ionicons name="checkmark" size={20} color="#059669" />
                )}
              </TouchableOpacity>
            ))}
            {filteredProvinces.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>
                  Không tìm thấy tỉnh/thành phố
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* District Modal */}
      <Modal
        visible={showDistrictModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn Quận/Huyện</Text>
            <TouchableOpacity
              onPress={() => setShowDistrictModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm quận/huyện..."
              value={districtSearch}
              onChangeText={setDistrictSearch}
              placeholderTextColor="#9CA3AF"
            />
            {districtSearch ? (
              <TouchableOpacity onPress={() => setDistrictSearch("")}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView style={styles.modalList}>
            {filteredDistricts.map((dist) => (
              <TouchableOpacity
                key={dist.id}
                style={[
                  styles.modalItem,
                  districtId === String(dist.id) && styles.modalItemActive,
                ]}
                onPress={() => {
                  onDistrictChange(String(dist.id));
                  setDistrictSearch("");
                  setShowDistrictModal(false);
                  onClearError?.("district");
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    districtId === String(dist.id) && styles.modalItemTextActive,
                  ]}
                >
                  {dist.name}
                </Text>
                {districtId === String(dist.id) && (
                  <Ionicons name="checkmark" size={20} color="#059669" />
                )}
              </TouchableOpacity>
            ))}
            {filteredDistricts.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>
                  Không tìm thấy quận/huyện
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    gap: 4,
  },
  label: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 13,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#FAFAFA",
    gap: 8,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  loadingText: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 8,
  },
  errorFieldText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    padding: 0,
  },
  modalList: {
    flex: 1,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalItemActive: {
    backgroundColor: "#F0FDF4",
  },
  modalItemText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  modalItemTextActive: {
    color: "#059669",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});
