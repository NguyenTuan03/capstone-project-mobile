import { Subject } from "@/types/subject";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type SubjectSelectionModalProps = {
  visible: boolean;
  onClose: () => void;
  subjects: Subject[];
  loading: boolean;
  selectedSubjectId: number | null;
  onSelectSubject: (subjectId: number) => void;
};

export default function SubjectSelectionModal({
  visible,
  onClose,
  subjects,
  loading,
  selectedSubjectId,
  onSelectSubject,
}: SubjectSelectionModalProps) {
  const [previewSubject, setPreviewSubject] = useState<Subject | null>(null);

  const handleClose = () => {
    setPreviewSubject(null);
    onClose();
  };

  const handleBack = () => {
    setPreviewSubject(null);
  };

  const handleConfirmSelection = () => {
    if (previewSubject) {
      onSelectSubject(previewSubject.id);
      setPreviewSubject(null);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={previewSubject ? handleBack : handleClose}
              style={styles.modalCloseButton}
            >
              <Ionicons
                name={previewSubject ? "arrow-back" : "close"}
                size={24}
                color="#111827"
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {previewSubject ? previewSubject.name : "Chọn tài liệu"}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#059669" />
          ) : previewSubject ? (
            <ScrollView>
              <View style={styles.lessonPreviewContainer}>
                <Text style={styles.lessonPreviewTitle}>
                  Danh sách bài học ({previewSubject.lessons?.length || 0} bài)
                </Text>
                {previewSubject.lessons && previewSubject.lessons.length > 0 ? (
                  previewSubject.lessons.map((lesson: any, index: number) => (
                    <View
                      key={lesson.id || index}
                      style={styles.lessonPreviewItem}
                    >
                      <View style={styles.lessonNumberBadge}>
                        <Text style={styles.lessonNumberText}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.lessonInfo}>
                        <Text style={styles.lessonName}>{lesson.name}</Text>
                        {lesson.description && (
                          <Text
                            style={styles.lessonDescription}
                            numberOfLines={2}
                          >
                            {lesson.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.hint}>Tài liệu này chưa có bài học</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmSelection}
              >
                <Text style={styles.confirmButtonText}>Chọn tài liệu này</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : subjects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>Chưa có tài liệu nào</Text>
              <Text style={styles.emptyDescription}>
                Hãy tạo tài liệu mới để bắt đầu tạo khóa học
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => {
                  handleClose();
                  router.dismissAll();
                  router.push("/(coach)/menu/subject/create" as any);
                }}
              >
                <Text style={styles.createButtonText}>Tạo tài liệu</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView>
              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.modalItem,
                    selectedSubjectId === subject.id &&
                      styles.modalItemSelected,
                  ]}
                  onPress={() => setPreviewSubject(subject)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemText}>{subject.name}</Text>
                    <Text style={styles.hint}>
                      {subject.lessons?.length || 0} bài học
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    minHeight: "70%",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    textAlign: "center",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalItemSelected: {
    backgroundColor: "#ECFDF5",
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  hint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  lessonPreviewContainer: {
    padding: 16,
  },
  lessonPreviewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  lessonPreviewItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  lessonNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#10B981",
  },
  lessonNumberText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#059669",
  },
  lessonInfo: {
    flex: 1,
  },
  lessonName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 20,
    marginBottom: 4,
  },
  lessonDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: "#059669",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    margin: 16,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
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
  createButton: {
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
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
    letterSpacing: 0.3,
  },
});
