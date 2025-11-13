import { get, remove } from "@/services/http/httpService";
import storageService from "@/services/storageService";
import { Subject } from "@/types/subject";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CoachSubjectScreen = () => {
  const insets = useSafeAreaInsets();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const handleOpenMenu = (subject: any) => {
    setSelectedSubject(subject);
    setModalVisible(true);
  };

  const handleEdit = (s: Subject | null) => {
    if (!s) return;
    setModalVisible(false);
    router.push({
      pathname: "/(coach)/menu/subject/edit" as any,
      params: {
        subjectId: s.id,
        subjectName: s.name,
        subjectDescription: s.description,
        subjectLevel: s.level,
        subjectStatus: s.status,
      },
    });
  };
  const handleDelete = (subject: Subject | null) => {
    if (!subject) return;

    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa tài liệu "${subject.name}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(`/v1/subjects/${subject.id}`);

              setSubjects((prev) =>
                prev.filter((item) => item.id !== subject.id)
              );
              setModalVisible(false);
            } catch (error) {
              console.error("Lỗi khi xóa tài liệu:", error);
              Alert.alert(
                "Lỗi",
                "Không thể xóa tài liệu. Vui lòng thử lại sau."
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const user = await storageService.getUser();
      if (!user) {
        console.warn("Không tìm thấy thông tin người dùng");
        return;
      }
      const userId = user.id;

      const res = await get<{ items: Subject[] }>(
        `/v1/subjects?filter=createdBy_eq_${userId}`
      );
      setSubjects(res.data.items || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách tài liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSubjects();
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(coach)/content" as any)}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Tài liệu của tôi</Text>
          <Text style={styles.subheader}>{subjects.length} tài liệu</Text>
        </View>

        <View style={{ width: 32 }} />
      </View>

      {/* Create New Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push("/(coach)/menu/subject/create" as any)}
        activeOpacity={0.7}
      >
        <Ionicons name="add-circle" size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Tạo tài liệu mới</Text>
      </TouchableOpacity>

      {/* Subjects List */}
      {subjects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="document-outline" size={56} color="#059669" />
          </View>
          <Text style={styles.emptyText}>Bạn chưa có tài liệu nào</Text>
          <Text style={styles.emptySubtext}>
            Hãy tạo tài liệu đầu tiên để bắt đầu dạy học
          </Text>
          <TouchableOpacity
            style={styles.emptyCreateButton}
            onPress={() => router.push("/(coach)/menu/subject/create" as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.emptyCreateButtonText}>Tạo tài liệu mới</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={styles.subjectCard}
              onPress={() =>
                router.push({
                  pathname: `/(coach)/menu/subject/${subject.id}/lesson` as any,
                  params: {
                    subjectId: subject.id,
                    subjectName: subject.name,
                    lessons: JSON.stringify(subject.lessons || []),
                  },
                })
              }
              activeOpacity={0.7}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subjectName} numberOfLines={2}>
                    {subject.name}
                  </Text>
                  <View style={styles.statusRow}>
                    <Text
                      style={[
                        styles.statusBadge,
                        {
                          color:
                            subject.status === "DRAFT"
                              ? "#D97706"
                              : subject.status === "PUBLISHED"
                              ? "#059669"
                              : "#6B7280",
                        },
                      ]}
                    >
                      {subject.status === "DRAFT"
                        ? "● Bản nháp"
                        : subject.status === "PUBLISHED"
                        ? "● Đã xuất bản"
                        : "● " + subject.status}
                    </Text>
                    <View style={styles.lessonBadge}>
                      <Ionicons name="book-outline" size={12} color="#6B7280" />
                      <Text style={styles.lessonCount}>
                        {subject.lessons?.length || 0} bài
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Menu Button */}
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => handleOpenMenu(subject)}
                  hitSlop={8}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Card Description */}
              <Text style={styles.description} numberOfLines={2}>
                {subject.description || "Không có mô tả cho tài liệu này"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Context Menu Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Quản lý tài liệu</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Selected Subject Info */}
          {selectedSubject && (
            <View style={styles.selectedSubjectInfo}>
              <View style={styles.subjectIconContainer}>
                <Ionicons name="document" size={32} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedSubjectName} numberOfLines={2}>
                  {selectedSubject.name}
                </Text>
                <Text style={styles.selectedSubjectStatus}>
                  {selectedSubject.status === "DRAFT"
                    ? "● Bản nháp"
                    : selectedSubject.status === "PUBLISHED"
                    ? "● Đã xuất bản"
                    : "● " + selectedSubject.status}
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              onPress={() => handleEdit(selectedSubject)}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <View style={styles.actionButtonIcon}>
                <Ionicons name="pencil" size={20} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionButtonTitle}>Chỉnh sửa tài liệu</Text>
                <Text style={styles.actionButtonDesc}>
                  Cập nhật tên, mô tả và cài đặt
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDelete(selectedSubject)}
              style={[styles.actionButton, styles.deleteButton]}
              activeOpacity={0.7}
            >
              <View style={[styles.actionButtonIcon, styles.deleteIconContainer]}>
                <Ionicons name="trash" size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionButtonTitle, { color: "#EF4444" }]}>
                  Xóa tài liệu
                </Text>
                <Text style={[styles.actionButtonDesc, { color: "#FCA5A5" }]}>
                  Hành động này không thể hoàn tác
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FECACA" />
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={styles.cancelButton}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  subheader: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#059669",
    borderRadius: 12,
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  subjectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "600",
  },
  lessonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
  },
  lessonCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  menuButton: {
    padding: 6,
    marginLeft: 8,
  },
  description: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 24,
    textAlign: "center",
  },
  emptyCreateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#059669",
    borderRadius: 12,
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCreateButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  selectedSubjectInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 12,
  },
  subjectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedSubjectName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  selectedSubjectStatus: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  actionButtonsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButton: {
    borderColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIconContainer: {
    backgroundColor: "#FEE2E2",
  },
  actionButtonTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  actionButtonDesc: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  cancelButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6B7280",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  contextMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 200,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
});

export default CoachSubjectScreen;
