import { Ionicons } from "@expo/vector-icons";
import type { FC } from "react";
import { memo } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";

import styles from "./styles";

type SearchBarWithFilterProps = {
  value: string;
  onChange: (text: string) => void;
  onFilterPress?: () => void;
};

const SearchBarWithFilterComponent: FC<SearchBarWithFilterProps> = ({
  value,
  onChange,
  onFilterPress,
}) => (
  <View style={styles.searchSection}>
    <View style={styles.searchBar}>
      <Ionicons name="search" size={18} color="#6B7280" />
      <TextInput
        placeholder="Tìm khóa học theo tên..."
        placeholderTextColor="#9CA3AF"
        style={styles.searchInput}
        value={value}
        onChangeText={onChange}
      />
    </View>
    <TouchableOpacity
      style={styles.filterBtn}
      activeOpacity={0.7}
      onPress={onFilterPress}
    >
      <Ionicons name="funnel" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  </View>
);

const SearchBarWithFilter = memo(SearchBarWithFilterComponent);
SearchBarWithFilter.displayName = "SearchBarWithFilter";

export default SearchBarWithFilter;

