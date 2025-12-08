import { Ionicons } from "@expo/vector-icons";
import type { FC } from "react";
import { memo, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

import type { CourseTabKey } from "./types";

type CourseTabsProps = {
  activeTab: CourseTabKey;
  counts: {
    all: number;
    ongoing: number;
    completed: number;
    approved: number;
    rejected: number;
    pending: number;
    full: number;
    cancelled: number;
  };
  onChange: (tab: CourseTabKey) => void;
};

const CourseTabsComponent: FC<CourseTabsProps> = ({
  activeTab,
  counts,
  onChange,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const tabs: {
    key: CourseTabKey;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    count: number;
  }[] = [
    { key: "all", label: "Tất cả khóa học", icon: "book", count: counts.all },
    {
      key: "pending",
      label: "Chờ duyệt",
      icon: "time-outline",
      count: counts.pending,
    },
    {
      key: "approved",
      label: "Đã duyệt",
      icon: "checkmark",
      count: counts.approved,
    },
    {
      key: "rejected",
      label: "Bị từ chối",
      icon: "close-circle",
      count: counts.rejected,
    },

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
    { key: "full", label: "Đủ học viên", icon: "people", count: counts.full },
    { key: "cancelled", label: "Đã hủy", icon: "ban", count: counts.cancelled },
  ];

  const activeTabData = tabs.find((t) => t.key === activeTab) || tabs[0];

  return (
    <>
      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: "#F9FAFB",
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
          onPress={() => setShowDropdown(true)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Ionicons name={activeTabData.icon} size={18} color="#059669" />
            <Text
              style={{
                fontSize: 13,
                color: "#111827",
                marginLeft: 8,
                fontWeight: "600",
                flex: 1,
              }}
            >
              {activeTabData.label}
            </Text>
            <View
              style={{
                backgroundColor: "#ECFDF5",
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 6,
                marginRight: 8,
                borderWidth: 1,
                borderColor: "#A7F3D0",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: "#059669",
                  fontWeight: "700",
                }}
              >
                {activeTabData.count}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-down" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              width: "85%",
              maxWidth: 400,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Chọn danh mục
              </Text>
              <TouchableOpacity
                onPress={() => setShowDropdown(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <ScrollView>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      backgroundColor: isActive ? "#F0FDF4" : "#FFFFFF",
                      borderBottomWidth: 1,
                      borderBottomColor: "#F9FAFB",
                    }}
                    onPress={() => {
                      onChange(tab.key);
                      setShowDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={tab.icon}
                      size={20}
                      color={isActive ? "#059669" : "#6B7280"}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        color: isActive ? "#059669" : "#374151",
                        marginLeft: 10,
                        flex: 1,
                        fontWeight: isActive ? "600" : "500",
                      }}
                    >
                      {tab.label}
                    </Text>
                    <View
                      style={{
                        backgroundColor: isActive ? "#ECFDF5" : "#F3F4F6",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        marginRight: 6,
                        borderWidth: isActive ? 1 : 0,
                        borderColor: "#A7F3D0",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: isActive ? "#059669" : "#6B7280",
                          fontWeight: "700",
                        }}
                      >
                        {tab.count}
                      </Text>
                    </View>
                    {isActive && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#059669"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const CourseTabs = memo(CourseTabsComponent);
CourseTabs.displayName = "CourseTabs";

export default CourseTabs;
