import { get, remove } from "@/services/http/httpService";
import storageService from "@/services/storageService";
import { Subject } from "@/types/subject";
import { Feather, Ionicons } from "@expo/vector-icons";
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

const CoachSubjectScreen = () => {
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
          <Ionicons name="arrow-back" size={24} color="#059669" />
        </TouchableOpacity>

        <Text style={styles.title}>Tài liệu của tôi</Text>

        <View style={{ width: 40 }} />
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
          <Ionicons name="document-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>Bạn chưa có tài liệu nào</Text>
          <Text style={styles.emptySubtext}>
            Hãy tạo tài liệu đầu tiên để bắt đầu
          </Text>
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
                  params: { subjectName: subject.name },
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
                </View>

                {/* Menu Button */}
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => handleOpenMenu(subject)}
                  hitSlop={8}
                >
                  <Feather name="more-vertical" size={20} color="#6B7280" />
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
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <View style={styles.contextMenu}>
            <TouchableOpacity
              onPress={() => handleEdit(selectedSubject)}
              style={styles.menuItem}
            >
              <Ionicons name="pencil" size={20} color="#059669" />
              <Text style={styles.menuItemText}>Chỉnh sửa</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              onPress={() => handleDelete(selectedSubject)}
              style={styles.menuItem}
            >
              <Ionicons name="trash" size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, { color: "#EF4444" }]}>
                Xóa
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
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
    marginBottom: 6,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "600",
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
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 6,
    textAlign: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
