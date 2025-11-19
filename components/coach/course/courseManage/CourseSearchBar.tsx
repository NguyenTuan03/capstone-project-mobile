import { Ionicons } from "@expo/vector-icons";
import type { FC } from "react";
import { memo } from "react";
import { TextInput, View } from "react-native";

type CourseSearchBarProps = {
  value: string;
  onChange: (text: string) => void;
};

const CourseSearchBarComponent: FC<CourseSearchBarProps> = ({
  value,
  onChange,
}) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      marginHorizontal: 12,
      marginTop: 12,
      marginBottom: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#E5E7EB",
    }}
  >
    <Ionicons name="search" size={18} color="#9CA3AF" />
    <TextInput
      style={{
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        color: "#111827",
      }}
      placeholder="Tìm kiếm khóa học..."
      value={value}
      onChangeText={onChange}
    />
  </View>
);

const CourseSearchBar = memo(CourseSearchBarComponent);
CourseSearchBar.displayName = "CourseSearchBar";

export default CourseSearchBar;
