import AssignmentTab from "@/components/coach/course/assignment";
import EditTab from "@/components/coach/course/edit";
import CourseHeader from "@/components/coach/course/header";
import CreateEditCourseModal from "@/components/coach/course/modal/CreateEditCourseModal";
import { OverviewTab } from "@/components/coach/course/overview";
import ScheduleTab from "@/components/coach/course/schedule";
import StudentsTab from "@/components/coach/course/students";
import CourseTabs from "@/components/coach/course/tabs";
import { get, put } from "@/services/http/httpService";
import { Course } from "@/types/course";
import { formatPrice } from "@/utils/priceFormat";
import { formatSchedule } from "@/utils/scheduleFormat";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
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
      const { subjectId, ...payload } = data;

      await put(`/v1/courses/${courseId}`, payload);
      Alert.alert("Thành công", "Cập nhật khóa học thành công!", [
        {
          text: "OK",
          onPress: () => {
            setShowEditModal(false);
            fetchCourseDetail();
          },
        },
      ]);
    } catch (error: any) {
      console.error("Lỗi khi cập nhật khóa học:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

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

  const renderHeader = () => {
    const statusColors = getStatusColor(course.status);
    const statusLabel = getStatusLabel(course.status);
    return (
      <CourseHeader
        course={course}
        statusColors={statusColors}
        statusLabel={statusLabel}
        onBack={() => router.back()}
      />
    );
  };

  const renderTabs = () => (
    <CourseTabs
      course={course}
      activeTab={activeTab as any}
      onChangeTab={(t) => setActiveTab(t)}
    />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            course={course}
            progress={course.progressPct}
            formatPrice={formatPrice}
            formatSchedule={formatSchedule}
          />
        );
      case "assignment":
        return <AssignmentTab courseId={course.id} />;
      case "students":
        return <StudentsTab course={course} />;
      case "schedule":
        return <ScheduleTab course={course} />;
      case "edit":
        return <EditTab />;
      default:
        return (
          <OverviewTab
            course={course}
            progress={course.progressPct}
            formatPrice={formatPrice}
            formatSchedule={formatSchedule}
          />
        );
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
          subjectId: course.subject.id,
          learningFormat: course.learningFormat,
          minParticipants: String(course.minParticipants),
          maxParticipants: String(course.maxParticipants),
          pricePerParticipant: course.pricePerParticipant,
          startDate: course.startDate,
          address: course.address,
          province: course.court.province,
          district: course.court.district,
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
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
