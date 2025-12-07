import { remove } from "@/services/http/httpService";
import { Lesson } from "@/types/subject";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
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

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const CoachLessonScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    subjectId,
    subjectName,
    lessons: lessonsParam,
  } = useLocalSearchParams<{
    subjectId: string;
    subjectName: string;
    lessons: string;
  }>();
  const [lessons, setLessons] = useState<Lesson[]>(
    JSON.parse(lessonsParam || "[]")
  );
  const loading = false;

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);

  const handleOpenMenu = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setMenuVisible(true);
  };

  const handleDeleteLesson = (lesson: Lesson) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa bài học "${lesson.name}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(`${API_URL}/v1/lessons/${lesson.id}`);
              setLessons((prev) =>
                prev.filter((item) => item.id !== lesson.id)
              );
              setMenuVisible(false);
            } catch (error) {}
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleEdit = (lesson: Lesson | null) => {
    if (!lesson) return;
    setMenuVisible(false);
    router.push({
      pathname: "/(coach)/menu/lesson/edit",
      params: {
        lessonId: selectedLesson!.id,
        lessonName: selectedLesson!.name,
        lessonDescription: selectedLesson!.description,
        lessonDuration: selectedLesson!.duration,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {subjectName}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Danh sách bài học</Text>
          <Text style={styles.lessonCount}>{lessons.length} bài</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() =>
            router.push({
              pathname: "/(coach)/menu/lesson/create",
              params: { subjectId, subjectName },
            })
          }
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Thêm bài học</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Đang tải bài học...</Text>
        </View>
      ) : lessons.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="book-outline" size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có bài học nào</Text>
          <Text style={styles.emptyDescription}>
            Bắt đầu tạo bài học đầu tiên để phong phú nội dung
          </Text>
          <TouchableOpacity
            style={styles.emptyCreateButton}
            onPress={() =>
              router.push({
                pathname: "/(coach)/menu/lesson/create",
                params: { subjectId, subjectName },
              })
            }
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.emptyCreateButtonText}>
              Tạo bài học đầu tiên
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {lessons.map((lesson, index) => (
            <View key={lesson.id} style={styles.lessonCardWrapper}>
              <TouchableOpacity
                style={styles.lessonCard}
                onPress={() =>
                  router.push({
                    pathname: "/(coach)/menu/lesson/[lessonId]",
                    params: {
                      lessonId: lesson.id,
                      lessonName: lesson.name,
                      lessonDuration: lesson.duration,
                      lessonDescription: lesson.description,
                    },
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.lessonBadge}>
                  <Text style={styles.lessonIndex}>{index + 1}</Text>
                </View>

                <View style={styles.lessonContent}>
                  <Text style={styles.lessonName} numberOfLines={2}>
                    {lesson.name}
                  </Text>
                  {lesson.duration && (
                    <View style={styles.durationTag}>
                      <Ionicons name="time-outline" size={12} color="#059669" />
                      <Text style={styles.durationText}>
                        {lesson.duration} phút
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => handleOpenMenu(lesson)}
                  hitSlop={8}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Expandable Description Section */}
              {lesson.description && (
                <View style={styles.descriptionContainer}>
                  <TouchableOpacity
                    style={styles.descriptionHeader}
                    onPress={() =>
                      setExpandedLesson(
                        expandedLesson === lesson.id ? null : lesson.id
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.descriptionHeaderLeft}>
                      <Ionicons
                        name="document-text"
                        size={14}
                        color="#059669"
                      />
                      <Text style={styles.descriptionHeaderText}>Mô tả</Text>
                    </View>
                    <Ionicons
                      name={
                        expandedLesson === lesson.id
                          ? "chevron-up"
                          : "chevron-down"
                      }
                      size={16}
                      color="#6B7280"
                    />
                  </TouchableOpacity>

                  {expandedLesson === lesson.id && (
                    <View style={styles.descriptionContent}>
                      <Text style={styles.descriptionText}>
                        {lesson.description}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Context Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMenuVisible(false)}
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
              onPress={() => setMenuVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Quản lý bài học</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Selected Lesson Info */}
          {selectedLesson && (
            <View style={styles.selectedLessonInfo}>
              <View style={styles.lessonIconContainer}>
                <Ionicons name="book" size={32} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedLessonName} numberOfLines={2}>
                  {selectedLesson.name}
                </Text>
                {selectedLesson.duration && (
                  <Text style={styles.selectedLessonDuration}>
                    ⏱ {selectedLesson.duration} phút
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              onPress={() => handleEdit(selectedLesson)}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <View style={styles.actionButtonIcon}>
                <Ionicons name="pencil" size={20} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionButtonTitle}>Chỉnh sửa bài học</Text>
                <Text style={styles.actionButtonDesc}>
                  Cập nhật tên, mô tả và thời lượng
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeleteLesson(selectedLesson!)}
              style={[styles.actionButton, styles.deleteButton]}
              activeOpacity={0.7}
            >
              <View
                style={[styles.actionButtonIcon, styles.deleteIconContainer]}
              >
                <Ionicons name="trash" size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionButtonTitle, { color: "#EF4444" }]}>
                  Xóa bài học
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
            onPress={() => setMenuVisible(false)}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginHorizontal: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  lessonCount: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyCreateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
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
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  lessonBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#10B981",
  },
  lessonIndex: {
    fontSize: 14,
    fontWeight: "800",
    color: "#059669",
  },
  lessonContent: {
    flex: 1,
  },
  lessonName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  durationTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    alignSelf: "flex-start",
  },
  durationText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  menuButton: {
    padding: 6,
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
  selectedLessonInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 12,
  },
  lessonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedLessonName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  selectedLessonDuration: {
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

  /* Lesson Card Wrapper */
  lessonCardWrapper: {
    gap: 0,
    marginBottom: 4,
  },

  /* Description Container */
  descriptionContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 10,
  },
  descriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  descriptionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  descriptionHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  descriptionContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  descriptionText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#374151",
    lineHeight: 18,
  },
});

export default CoachLessonScreen;
