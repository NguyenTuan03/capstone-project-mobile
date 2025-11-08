import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CourseDetailScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data - thay bằng data từ route.params hoặc API
  const courseData = {
    id: 1,
    name: "Pickleball cơ bản - Khóa 1",
    status: "ongoing",
    level: "Beginner",
    students: 4,
    maxStudents: 4,
    totalSessions: 8,
    progress: 100,
    revenue: "500.000đ/người",
    schedule: "Thứ 2, 4, 6 - 14:00-15:30",
    location: "Sân Pickleball Quận 7",
    coach: "Huấn luyện viên Nguyễn Văn A",
    price: "500.000đ/người",
    description:
      "Khóa học offline dành cho người mới bắt đầu, tập trung vào các kỹ thuật cơ bản và luật chơi",
  };

  const studentsList = [
    {
      id: 1,
      name: "Học viên 1",
      email: "student1@email.com",
      phone: "0945308509",
      status: "Đang học",
    },
    {
      id: 2,
      name: "Học viên 2",
      email: "student2@email.com",
      phone: "0940860217",
      status: "Đang học",
    },
    {
      id: 3,
      name: "Học viên 3",
      email: "student3@email.com",
      phone: "0992428433",
      status: "Đang học",
    },
    {
      id: 4,
      name: "Học viên 4",
      email: "student4@email.com",
      phone: "094660481",
      status: "Đang học",
    },
  ];

  const sessionsList = [
    {
      id: 1,
      name: "Buổi 1",
      date: "23/10/2025",
      time: "Thứ 2 - 14:00-15:30",
      status: "completed",
    },
    {
      id: 2,
      name: "Buổi 2",
      date: "25/10/2025",
      time: "Thứ 4 - 14:00-15:30",
      status: "completed",
    },
    {
      id: 3,
      name: "Buổi 3",
      date: "27/10/2025",
      time: "Thứ 6 - 14:00-15:30",
      status: "completed",
    },
    {
      id: 4,
      name: "Buổi 4",
      date: "29/10/2025",
      time: "Thứ 2 - 14:00-15:30",
      status: "completed",
    },
    {
      id: 5,
      name: "Buổi 5",
      date: "01/11/2025",
      time: "Thứ 4 - 14:00-15:30",
      status: "upcoming",
    },
    {
      id: 6,
      name: "Buổi 6",
      date: "03/11/2025",
      time: "Thứ 6 - 14:00-15:30",
      status: "upcoming",
    },
    {
      id: 7,
      name: "Buổi 7",
      date: "05/11/2025",
      time: "Thứ 2 - 14:00-15:30",
      status: "upcoming",
    },
    {
      id: 8,
      name: "Buổi 8",
      date: "07/11/2025",
      time: "Thứ 4 - 14:00-15:30",
      status: "upcoming",
    },
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="close" size={24} color="#111827" />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {courseData.name}
        </Text>
        <View style={styles.headerBadges}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Đang diễn ra</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: "#EFF6FF" }]}>
            <Text style={[styles.statusBadgeText, { color: "#3B82F6" }]}>
              {courseData.level}
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
              params: { id: String(courseData.id) },
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
            Học viên ({courseData.students})
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
            {courseData.students}/{courseData.maxStudents}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="book" size={32} color="#10B981" />
          <Text style={styles.statLabel}>Buổi học</Text>
          <Text style={styles.statValue}>{courseData.totalSessions}</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="time" size={32} color="#F59E0B" />
          <Text style={styles.statLabel}>Tiến độ</Text>
          <Text style={styles.statValue}>{courseData.progress}%</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="cash" size={32} color="#059669" />
          <Text style={styles.statLabel}>Doanh thu</Text>
          <Text style={styles.statValue}>{courseData.revenue}</Text>
        </View>
      </View>

      {/* Course Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin khóa học</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Lịch học</Text>
          <Text style={styles.infoValue}>{courseData.schedule}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Địa điểm</Text>
          <Text style={styles.infoValue}>{courseData.location}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Huấn luyện viên</Text>
          <Text style={styles.infoValue}>{courseData.coach}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Học phí</Text>
          <Text
            style={[styles.infoValue, { color: "#059669", fontWeight: "600" }]}
          >
            {courseData.price}
          </Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mô tả</Text>
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>{courseData.description}</Text>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderStudentsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danh sách học viên</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: 40 }]}>STT</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Họ tên</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Trạng thái</Text>
        </View>

        {/* Table Rows */}
        {studentsList.map((student, index) => (
          <View key={student.id} style={styles.tableRow}>
            <Text style={[styles.tableCellText, { width: 40 }]}>
              {index + 1}
            </Text>
            <View style={[styles.tableCell, { flex: 1 }]}>
              <View style={styles.studentInfo}>
                <View style={styles.studentAvatar}>
                  <Ionicons name="person" size={16} color="#6B7280" />
                </View>
                <View>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentEmail}>{student.email}</Text>
                  <Text style={styles.studentPhone}>{student.phone}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.tableCell, { flex: 1 }]}>
              <View style={styles.statusTag}>
                <Text style={styles.statusTagText}>{student.status}</Text>
              </View>
              <TouchableOpacity style={styles.detailLink}>
                <Text style={styles.detailLinkText}>Chi tiết</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderScheduleTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch học chi tiết</Text>

        {sessionsList.map((session, index) => (
          <View
            key={session.id}
            style={[
              styles.sessionCard,
              session.status === "completed" && styles.sessionCardCompleted,
            ]}
          >
            <View style={styles.sessionNumber}>
              <Text style={styles.sessionNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionName}>{session.name}</Text>
              <Text style={styles.sessionTime}>{session.time}</Text>
              <Text style={styles.sessionDate}>{session.date}</Text>
            </View>
            <View style={styles.sessionStatus}>
              {session.status === "completed" ? (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.sessionStatusText}>Đã hoàn thành</Text>
                </>
              ) : (
                <TouchableOpacity style={styles.sessionDetailButton}>
                  <Text style={styles.sessionDetailButtonText}>Chi tiết</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderEditTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chỉnh sửa thông tin khóa học</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên khóa học</Text>
          <TextInput
            style={styles.input}
            value={courseData.name}
            placeholder="Tên khóa học"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            value={courseData.description}
            placeholder="Mô tả khóa học"
            textAlignVertical="top"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Địa điểm</Text>
            <TextInput
              style={styles.input}
              value={courseData.location}
              placeholder="Địa điểm"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Học phí</Text>
            <TextInput
              style={styles.input}
              value={courseData.price}
              placeholder="Học phí"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số học viên tối đa</Text>
          <TextInput
            style={styles.input}
            value={String(courseData.maxStudents)}
            placeholder="Số học viên"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Trình độ</Text>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerText}>{courseData.level}</Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </View>
        </View>

        <View style={styles.editActions}>
          <TouchableOpacity style={styles.saveButton}>
            <Ionicons name="save" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton}>
            <Ionicons name="trash" size={20} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Xóa khóa học</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
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
  },
  statusBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
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
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tableCell: {
    justifyContent: "center",
  },
  tableCellText: {
    fontSize: 13,
    color: "#111827",
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  studentName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 1,
  },
  studentPhone: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusTag: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  detailLink: {
    alignSelf: "flex-start",
  },
  detailLinkText: {
    fontSize: 13,
    color: "#3B82F6",
    fontWeight: "600",
  },
  sessionCard: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  sessionCardCompleted: {
    backgroundColor: "#F0FDF4",
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
  sessionDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  sessionStatus: {
    alignItems: "flex-end",
  },
  sessionStatusText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
    marginTop: 4,
  },
  sessionDetailButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sessionDetailButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  textArea: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 100,
  },
  row: {
    flexDirection: "row",
  },
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 14,
    color: "#111827",
  },
  editActions: {
    marginTop: 8,
    gap: 12,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
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
