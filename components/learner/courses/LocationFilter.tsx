import { Ionicons } from "@expo/vector-icons";
import type { FC } from "react";
import { memo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import styles from "./styles";
import type { District, Province } from "./types";

type LocationFilterProps = {
  selectedProvince: Province | null;
  selectedDistrict: District | null;
  onSelectProvince: () => void;
  onSelectDistrict: () => void;
  onClear: () => void;
};

const LocationFilterComponent: FC<LocationFilterProps> = ({
  selectedProvince,
  selectedDistrict,
  onSelectProvince,
  onSelectDistrict,
  onClear,
}) => (
  <View style={styles.filterSection}>
    <View style={styles.filterSectionHeader}>
      <Ionicons name="location" size={16} color="#059669" />
      <Text style={styles.filterTitle}>Lọc theo địa điểm</Text>
    </View>
    <View style={styles.filterRow}>
      <TouchableOpacity
        style={styles.filterSelect}
        onPress={onSelectProvince}
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
        onPress={onSelectDistrict}
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
          onPress={onClear}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={20} color="#EF4444" />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const LocationFilter = memo(LocationFilterComponent);
LocationFilter.displayName = "LocationFilter";

export default LocationFilter;

