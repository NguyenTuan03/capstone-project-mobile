import { Ionicons } from "@expo/vector-icons";
import type { FC } from "react";
import { memo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import type { CourseTabKey } from "./types";

type CourseTabsProps = {
  activeTab: CourseTabKey;
  counts: { all: number; ongoing: number; completed: number };
  onChange: (tab: CourseTabKey) => void;
};

const CourseTabsComponent: FC<CourseTabsProps> = ({
  activeTab,
  counts,
  onChange,
}) => {
  const tabs: {
    key: CourseTabKey;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    count: number;
  }[] = [
    { key: "all", label: "Tất cả khóa học", icon: "book", count: counts.all },
    {
      key: "ongoing",
      label: "Đang diễn ra",
      icon: "time",
      count: counts.ongoing,
    },
    {
      key: "completed",
      label: "Đã hoàn thành",
      icon: "checkmark-circle",
      count: counts.completed,
    },
  ];

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 6,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              marginBottom: 6,
              backgroundColor: isActive ? "#EFF6FF" : "#F9FAFB",
            }}
            onPress={() => onChange(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={isActive ? "#059669" : "#6B7280"}
            />
            <Text
              style={{
                fontSize: 13,
                color: isActive ? "#059669" : "#6B7280",
                marginLeft: 8,
                flex: 1,
                fontWeight: isActive ? "600" : "400",
              }}
            >
              {tab.label}
            </Text>
            <View
              style={{
                backgroundColor: isActive ? "#DBEAFE" : "#E5E7EB",
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: isActive ? "#059669" : "#374151",
                  fontWeight: "600",
                }}
              >
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const CourseTabs = memo(CourseTabsComponent);
CourseTabs.displayName = "CourseTabs";

export default CourseTabs;
