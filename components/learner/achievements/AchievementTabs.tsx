import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AchievementStats, TabType } from "./types";

interface AchievementTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  stats: AchievementStats | null;
}

export default function AchievementTabs({
  activeTab,
  onTabChange,
  stats,
}: AchievementTabsProps) {
  return (
    <View style={styles.tabsContainer}>
      <Pressable
        style={({ pressed }) => [
          styles.tab,
          activeTab === "all" && styles.tabActive,
          pressed && styles.tabPressed,
        ]}
        onPress={() => onTabChange("all")}
      >
        <Ionicons
          name={activeTab === "all" ? "apps" : "apps-outline"}
          size={18}
          color={activeTab === "all" ? "#FFFFFF" : "#6B7280"}
        />
        <Text
          style={activeTab === "all" ? styles.tabTextActive : styles.tabText}
        >
          Tất cả
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.tab,
          activeTab === "earned" && styles.tabActive,
          pressed && styles.tabPressed,
        ]}
        onPress={() => onTabChange("earned")}
      >
        <Ionicons
          name={activeTab === "earned" ? "trophy" : "trophy-outline"}
          size={18}
          color={activeTab === "earned" ? "#FFFFFF" : "#6B7280"}
        />
        <Text
          style={
            activeTab === "earned" ? styles.tabTextActive : styles.tabText
          }
        >
          Đã đạt {stats?.totalEarned ? `(${stats.totalEarned})` : ""}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#059669",
  },
  tabPressed: {
    opacity: 0.8,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },
  tabTextActive: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

