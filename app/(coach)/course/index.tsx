import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Course = {
  id: number;
  name: string;
  status: string;
  level: string;
  type: string;
  weeks: number;
  schedule: string;
  students: number;
  maxStudents: number;
  revenue: string;
  location: string;
  coach: string;
};

export default function CoachCourseScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  // navigate to create screen instead of modal

  const coursesData = {
    all: 7,
    ongoing: 4,
    completed: 3,
  };

  const courses = [
    {
      id: 1,
      name: "Pickleball cơ bản - Khóa 1",
      status: "ongoing",
      level: "Beginner",
      type: "Nhóm",
      weeks: 4,
      schedule: "Thứ 2, 4, 6 - 14:00-15:30",
      students: 4,
      maxStudents: 6,
      revenue: "4.800.000đ",
      location: "Offline",
      coach: "Huấn luyện viên",
    },
    {
      id: 2,
      name: "Kỹ thuật nâng cao - Khóa 1",
      status: "ongoing",
      level: "Intermediate",
      type: "Nhóm",
      weeks: 5,
      schedule: "Thứ 3, 5, 7 - 16:00-17:30",
      students: 5,
      maxStudents: 6,
      revenue: "7.500.000đ",
      location: "Online",
      coach: "Huấn luyện viên Trần",
    },
    {
      id: 3,
      name: "Pickleball cá nhân - Khóa 2",
      status: "completed",
      level: "Beginner",
      type: "Cá nhân",
      weeks: 3,
      schedule: "Thứ 2, 4 - 10:00-11:30",
      students: 1,
      maxStudents: 1,
      revenue: "3.000.000đ",
      location: "Offline",
      coach: "Huấn luyện viên",
    },
  ];

  const renderCourseCard = (course: Course) => (
    <View key={course.id} style={styles.courseCard}>
      <View style={styles.courseHeader}>
        <View>
          <Text style={styles.courseName}>{course.name}</Text>
          <View style={styles.courseTags}>
            <View
              style={[
                styles.statusBadge,
                course.status === "ongoing"
                  ? styles.statusOngoing
                  : styles.statusCompleted,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  course.status === "ongoing"
                    ? styles.statusOngoingText
                    : styles.statusCompletedText,
                ]}
              >
                {course.status === "ongoing" ? "Đang diễn ra" : "Đã hoàn thành"}
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{course.level}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.courseBody}>
        <View style={styles.courseRow}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.courseText}>{course.schedule}</Text>
        </View>
        <View style={styles.courseRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.courseText}>{course.weeks} tuần</Text>
        </View>
        <View style={styles.courseRow}>
          <Ionicons name="people-outline" size={16} color="#6B7280" />
          <Text style={styles.courseText}>
            {course.students}/{course.maxStudents} học viên
          </Text>
        </View>
        <View style={styles.courseRow}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.courseText}>{course.location}</Text>
        </View>
        <View style={styles.courseRow}>
          <Ionicons name="person-outline" size={16} color="#6B7280" />
          <Text style={styles.courseText}>{course.coach}</Text>
        </View>
      </View>

      <View style={styles.courseFooter}>
        <View style={styles.revenueContainer}>
          <Ionicons name="trending-up" size={18} color="#059669" />
          <Text style={styles.revenueLabel}>Doanh thu</Text>
          <Text style={styles.revenueValue}>{course.revenue}</Text>
        </View>
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() =>
            router.push({
              pathname: "/(coach)/course/[id]",
              params: { id: String(course.id) },
            } as any)
          }
        >
          <Text style={styles.viewDetailsText}>Xem chi tiết</Text>
          <Ionicons name="chevron-forward" size={18} color="#059669" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 50 },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#059669" />

      <ScrollView style={styles.scrollView}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "all" && styles.tabActive]}
            onPress={() => setActiveTab("all")}
          >
            <Ionicons
              name="book"
              size={20}
              color={activeTab === "all" ? "#059669" : "#6B7280"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "all" && styles.tabTextActive,
              ]}
            >
              Tất cả khóa học
            </Text>
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{coursesData.all}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "ongoing" && styles.tabActive]}
            onPress={() => setActiveTab("ongoing")}
          >
            <Ionicons
              name="time"
              size={20}
              color={activeTab === "ongoing" ? "#059669" : "#6B7280"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "ongoing" && styles.tabTextActive,
              ]}
            >
              Đang diễn ra
            </Text>
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{coursesData.ongoing}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "completed" && styles.tabActive]}
            onPress={() => setActiveTab("completed")}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={activeTab === "completed" ? "#059669" : "#6B7280"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "completed" && styles.tabTextActive,
              ]}
            >
              Đã hoàn thành
            </Text>
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{coursesData.completed}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm khóa học..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Courses List */}
        <View style={styles.coursesContainer}>
          {courses.map((course) => renderCourseCard(course))}
        </View>
      </ScrollView>

      {/* Create Course Button */}
      <TouchableOpacity
        style={[styles.createButton, { bottom: insets.bottom + 80 }]}
        onPress={() => router.push("/(coach)/course/create" as any)}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Tạo khóa học</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  tabsContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
  },
  tabActive: {
    backgroundColor: "#EFF6FF",
  },
  tabText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
    flex: 1,
  },
  tabTextActive: {
    color: "#059669",
    fontWeight: "600",
  },
  tabBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111827",
  },
  coursesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  courseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  courseHeader: {
    marginBottom: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  courseTags: {
    flexDirection: "row",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOngoing: {
    backgroundColor: "#D1FAE5",
  },
  statusCompleted: {
    backgroundColor: "#E0F2FE",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusOngoingText: {
    color: "#059669",
  },
  statusCompletedText: {
    color: "#0284C7",
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
  },
  levelText: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "600",
  },
  courseBody: {
    marginBottom: 12,
  },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  courseText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
  },
  courseFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  revenueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  revenueLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
  },
  revenueValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#059669",
    marginLeft: 8,
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },
  createButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    left: 16,
    backgroundColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
