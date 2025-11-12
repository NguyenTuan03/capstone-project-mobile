import { Subject } from "@/types/subject";
import { Ionicons } from "@expo/vector-icons";
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
});
