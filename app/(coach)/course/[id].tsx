import CreateEditCourseModal from "@/components/coach/CreateEditCourseModal";
import { DAYS_OF_WEEK_VI } from "@/components/common/AppEnum";
import { get, put } from "@/services/http/httpService";
import { Course } from "@/types/course";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CourseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const courseId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      const res = await get<Course>(`/v1/courses/${courseId}`);
      setCourse(res.data);
    } catch (error) {
      console.error("Lỗi khi tải chi tiết khóa học:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin khóa học");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (courseId) {
        fetchCourseDetail();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId])
  );

  useEffect(() => {
    if (activeTab === "edit") {
      setShowEditModal(true);
    }
  }, [activeTab]);

  const handleUpdateCourse = async (data: {
    subjectId: number;
    learningFormat: string;
    minParticipants: number;
    maxParticipants: number;
    pricePerParticipant: number;
    startDate: string;
    address: string;
    province: number;
    district: number;
    schedules?: any[];
  }) => {
    try {
      // Tách subjectId ra khỏi payload vì nó không cần trong body khi update
      const { subjectId, ...payload } = data;

      console.log("Payload gửi lên API:", payload);
      console.log("Course ID:", courseId);

      await put(`/v1/courses/${courseId}`, payload);
      Alert.alert("Thành công", "Cập nhật khóa học thành công!", [
        {
          text: "OK",
          onPress: () => {
            setShowEditModal(false);
            fetchCourseDetail(); // Refresh data
          },
        },
      ]);
    } catch (error: any) {
      console.error("Lỗi khi cập nhật khóa học:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Lấy thông báo lỗi chi tiết từ API
      let errorMessage = "Không thể cập nhật khóa học. Vui lòng thử lại.";

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (Array.isArray(errorData)) {
          errorMessage = errorData.map((e: any) => e.message || e).join(", ");
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }
      }

      Alert.alert("Lỗi", errorMessage);
      throw error;
    }
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    return new Intl.NumberFormat("vi-VN").format(numPrice) + "đ";
  };

  const formatSchedule = (schedules: Course["schedules"]) => {
    if (!schedules || schedules.length === 0) return "Chưa có lịch";

    return schedules
      .map((schedule) => {
        const dayIndex = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ].indexOf(schedule.dayOfWeek);
        const dayName =
          dayIndex >= 0 ? DAYS_OF_WEEK_VI[dayIndex] : schedule.dayOfWeek;
        const startTime = schedule.startTime.substring(0, 5);
        const endTime = schedule.endTime.substring(0, 5);
        return `${dayName}: ${startTime}-${endTime}`;
      })
      .join(", ");
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      APPROVED: "Đã duyệt",
      PENDING_APPROVAL: "Chờ duyệt",
      REJECTED: "Đã từ chối",
      COMPLETED: "Đã hoàn thành",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      APPROVED: { bg: "#D1FAE5", text: "#059669" },
      PENDING_APPROVAL: { bg: "#FEF3C7", text: "#D97706" },
      REJECTED: { bg: "#FEE2E2", text: "#DC2626" },
      COMPLETED: { bg: "#E0F2FE", text: "#0284C7" },
    };
    return colorMap[status] || { bg: "#F3F4F6", text: "#6B7280" };
  };

  const calculateProgress = () => {
    if (!course || !course.endDate || !course.startDate) return 0;
    const start = new Date(course.startDate);
    const end = new Date(course.endDate);
    const now = new Date();
    if (now < start) return 0;
    if (now > end) return 100;
    const total = end.getTime() - start.getTime();
    const current = now.getTime() - start.getTime();
    return Math.round((current / total) * 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Đang tải thông tin khóa học...</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Không tìm thấy khóa học</Text>
      </View>
    );
  }

  const statusColors = getStatusColor(course.status);
  const progress = calculateProgress();

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="close" size={24} color="#111827" />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {course.name}
        </Text>
        <View style={styles.headerBadges}>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}
          >
            <Text
              style={[styles.statusBadgeText, { color: statusColors.text }]}
            >
              {getStatusLabel(course.status)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: "#EFF6FF" }]}>
            <Text style={[styles.statusBadgeText, { color: "#3B82F6" }]}>
              {course.level}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: "#F3F4F6" }]}>
            <Text style={[styles.statusBadgeText, { color: "#6B7280" }]}>
              {course.learningFormat === "GROUP" ? "Nhóm" : "Cá nhân"}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.placeholder} />
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === "overview" && styles.tabActive]}
          onPress={() => setActiveTab("overview")}
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
          style={[styles.tab]}
          onPress={() =>
            router.push({
              pathname: "/(coach)/course/assignment/[id]" as any,
              params: { id: String(course.id) },
            })
          }
        >
          <Ionicons name="clipboard" size={18} color="#6B7280" />
          <Text style={styles.tabText}>Bài tập</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "students" && styles.tabActive]}
          onPress={() => setActiveTab("students")}
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
          onPress={() => setActiveTab("schedule")}
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

        <TouchableOpacity
          style={[styles.tab, activeTab === "edit" && styles.tabActive]}
          onPress={() => setActiveTab("edit")}
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
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={32} color="#3B82F6" />
          <Text style={styles.statLabel}>Học viên</Text>
          <Text style={styles.statValue}>
            {course.currentParticipants}/{course.maxParticipants}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="book" size={32} color="#10B981" />
          <Text style={styles.statLabel}>Buổi học</Text>
          <Text style={styles.statValue}>{course.totalSessions}</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="time" size={32} color="#F59E0B" />
          <Text style={styles.statLabel}>Tiến độ</Text>
          <Text style={styles.statValue}>{progress}%</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="cash" size={32} color="#059669" />
          <Text style={styles.statLabel}>Doanh thu</Text>
          <Text style={styles.statValue}>
            {formatPrice(course.totalEarnings)}
          </Text>
        </View>
      </View>

      {/* Course Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin khóa học</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Môn học</Text>
          <Text style={styles.infoValue}>{course.subject.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Lịch học</Text>
          <Text style={styles.infoValue}>
            {formatSchedule(course.schedules)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày bắt đầu</Text>
          <Text style={styles.infoValue}>
            {new Date(course.startDate).toLocaleDateString("vi-VN")}
          </Text>
        </View>

        {course.endDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày kết thúc</Text>
            <Text style={styles.infoValue}>
              {new Date(course.endDate).toLocaleDateString("vi-VN")}
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Địa điểm</Text>
          <Text style={styles.infoValue}>
            {course.address}, {course.district.name}, {course.province.name}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Huấn luyện viên</Text>
          <Text style={styles.infoValue}>{course.createdBy.fullName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Học phí</Text>
          <Text
            style={[styles.infoValue, { color: "#059669", fontWeight: "600" }]}
          >
            {formatPrice(course.pricePerParticipant)}/người
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số lượng học viên</Text>
          <Text style={styles.infoValue}>
            Tối thiểu: {course.minParticipants} - Tối đa:{" "}
            {course.maxParticipants}
          </Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mô tả</Text>
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>{course.description}</Text>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderStudentsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danh sách học viên</Text>
        {course.currentParticipants === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Chưa có học viên nào</Text>
          </View>
        ) : (
          <Text style={styles.infoValue}>
            Hiện có {course.currentParticipants} học viên đã đăng ký
          </Text>
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderScheduleTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch học chi tiết</Text>

        {course.schedules && course.schedules.length > 0 ? (
          course.schedules.map((schedule, index) => {
            const dayIndex = [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].indexOf(schedule.dayOfWeek);
            const dayName =
              dayIndex >= 0 ? DAYS_OF_WEEK_VI[dayIndex] : schedule.dayOfWeek;
            const startTime = schedule.startTime.substring(0, 5);
            const endTime = schedule.endTime.substring(0, 5);

            return (
              <View key={schedule.id} style={styles.sessionCard}>
                <View style={styles.sessionNumber}>
                  <Text style={styles.sessionNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName}>{dayName}</Text>
                  <Text style={styles.sessionTime}>
                    {startTime} - {endTime}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Chưa có lịch học</Text>
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderEditTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chỉnh sửa thông tin khóa học</Text>
          <Text style={{ color: "#6B7280", fontSize: 14, marginTop: 8 }}>
            Form chỉnh sửa đang được hiển thị trong modal
          </Text>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "students":
        return renderStudentsTab();
      case "schedule":
        return renderScheduleTab();
      case "edit":
        return renderEditTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabs()}
      {renderTabContent()}

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButton}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>Đóng</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Course Modal */}
      <CreateEditCourseModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setActiveTab("overview");
        }}
        onSubmit={handleUpdateCourse}
        mode="edit"
        initialData={{
          subjectId: course.subject.id, // Set subjectId từ course data
          learningFormat: course.learningFormat,
          minParticipants: String(course.minParticipants),
          maxParticipants: String(course.maxParticipants),
          pricePerParticipant: course.pricePerParticipant,
          startDate: course.startDate,
          address: course.address,
          province: course.province,
          district: course.district,
          schedules: course.schedules,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },
  headerBadges: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  placeholder: {
    width: 32,
  },
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
  tabContent: {
    flex: 1,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  descriptionBox: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  descriptionText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  sessionCard: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  sessionNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sessionNumberText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 2,
  },
  bottomButton: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -2 },
      },
      android: { elevation: 8 },
    }),
  },
  closeButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
});
