import { Course } from "@/types/course";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TabKey = "overview" | "assignment" | "students" | "schedule" | "edit";

type Props = {
  course: Course;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

const CourseTabs: React.FC<Props> = ({ course, activeTab, onChangeTab }) => {
  const scrollRef = useRef<ScrollView | null>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  return (
    <View style={styles.tabsContainer}>
      <View style={{ position: "relative" }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          ref={scrollRef as any}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            setScrollWidth(w);
            setShowRightArrow(contentWidth > w);
          }}
          onContentSizeChange={(w) => {
            setContentWidth(w);
            setShowRightArrow(w > scrollWidth);
          }}
          onScroll={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            setScrollX(x);
            setShowLeftArrow(x > 5);
            setShowRightArrow(x + scrollWidth < contentWidth - 5);
          }}
          scrollEventThrottle={16}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === "overview" && styles.tabActive]}
            onPress={() => onChangeTab("overview")}
          >
            <Ionicons
              name="bar-chart"
              size={18}
              color={activeTab === "overview" ? "#059669" : "#6B7280"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "overview" && styles.tabTextActive,
              ]}
            >
              Tổng quan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "assignment" && styles.tabActive]}
            onPress={() => onChangeTab("assignment")}
          >
            <Ionicons name="clipboard" size={18} color="#6B7280" />
            <Text
              style={[
                styles.tabText,
                activeTab === "assignment" && styles.tabTextActive,
              ]}
            >
              Bài tập
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "students" && styles.tabActive]}
            onPress={() => onChangeTab("students")}
          >
            <Ionicons
              name="people"
              size={18}
              color={activeTab === "students" ? "#059669" : "#6B7280"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "students" && styles.tabTextActive,
              ]}
            >
              Học viên ({course.currentParticipants})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "schedule" && styles.tabActive]}
            onPress={() => onChangeTab("schedule")}
          >
            <Ionicons
              name="calendar"
              size={18}
              color={activeTab === "schedule" ? "#059669" : "#6B7280"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "schedule" && styles.tabTextActive,
              ]}
            >
              Lịch học
            </Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={[styles.tab, activeTab === "edit" && styles.tabActive]}
            onPress={() => onChangeTab("edit")}
          >
            <Ionicons
              name="create"
              size={18}
              color={activeTab === "edit" ? "#059669" : "#6B7280"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "edit" && styles.tabTextActive,
              ]}
            >
              Chỉnh sửa
            </Text>
          </TouchableOpacity> */}
        </ScrollView>

        {showLeftArrow ? (
          <TouchableOpacity
            onPress={() => {
              const next = Math.max(0, scrollX - Math.round(scrollWidth * 0.6));
              (scrollRef as any).current?.scrollTo({ x: next, animated: true });
            }}
            style={styles.leftArrow}
          >
            <View style={styles.arrowInner}>
              <Ionicons name="chevron-back" size={20} color="#6B7280" />
            </View>
          </TouchableOpacity>
        ) : null}

        {showRightArrow ? (
          <TouchableOpacity
            onPress={() => {
              const maxX = Math.max(0, contentWidth - scrollWidth);
              const next = Math.min(
                maxX,
                scrollX + Math.round(scrollWidth * 0.6)
              );
              (scrollRef as any).current?.scrollTo({ x: next, animated: true });
            }}
            style={styles.rightArrow}
          >
            <View style={styles.arrowInner}>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: "#F0FDF4",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginLeft: 6,
  },
  tabTextActive: {
    color: "#059669",
    fontWeight: "600",
  },
  leftArrow: {
    position: "absolute",
    left: 6,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 10,
    width: 32,
  },
  rightArrow: {
    position: "absolute",
    right: 6,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 10,
    width: 32,
  },
  arrowInner: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default CourseTabs;
