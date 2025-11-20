import http from "@/services/http/interceptor";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

interface QuizDetailModalProps {
  visible: boolean;
  quiz: any | null;
  sessionId: string | string[] | undefined;
  onClose: () => void;
  onDelete?: (quizId: number, quizTitle: string) => Promise<void>;
  onQuizUpdated?: () => void;
}

export const QuizDetailModal: React.FC<QuizDetailModalProps> = ({
  visible,
  quiz,
  sessionId,
  onClose,
  onDelete,
  onQuizUpdated,
}) => {
  const [editingQuiz, setEditingQuiz] = useState(false);
  const [editTitle, setEditTitle] = useState(quiz?.title || "");
  const [editDescription, setEditDescription] = useState(quiz?.description || "");
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    setEditTitle(quiz?.title || "");
    setEditDescription(quiz?.description || "");
  }, [quiz]);

  return (
    <Modal
      visible={visible && !!quiz}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {quiz && (
        <View style={styles.container}>
          {/* Modal Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.title} numberOfLines={1}>
              {quiz.title}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Modal Content */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Quiz Title and Badge */}
            <View style={styles.section}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.sectionLabel}>Bài Quiz</Text>
                  <Text style={styles.cardTitle}>{quiz.title}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Sẵn sàng</Text>
                </View>
              </View>
            </View>

            {/* Quiz Description */}
            {quiz.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mô tả</Text>
                <View style={styles.descriptionBox}>
                  <Text style={styles.descriptionText}>
                    {quiz.description}
                  </Text>
                </View>
              </View>
            )}

            {/* Quiz Questions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Danh sách câu hỏi</Text>
              <View style={styles.questionInfo}>
                <Ionicons
                  name="help-circle-outline"
                  size={20}
                  color="#059669"
                />
                <Text style={styles.questionCount}>
                  {quiz.questions?.length || quiz.totalQuestions || 0} câu hỏi
                </Text>
              </View>

              {quiz.questions && quiz.questions.length > 0 ? (
                <View style={styles.questionsList}>
                  {quiz.questions.map((question: any, idx: number) => (
                    <View
                      key={question.id || idx}
                      style={styles.questionItem}
                    >
                      <View style={styles.questionNumber}>
                        <Text style={styles.questionNumberText}>
                          {idx + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.questionText}>
                          {question.title ||
                            question.questionText ||
                            question.content ||
                            "—"}
                        </Text>
                        {question.options && question.options.length > 0 && (
                          <>
                            <Text style={styles.optionCount}>
                              {question.options.length} lựa chọn
                            </Text>
                            <View style={styles.optionsList}>
                              {question.options.map(
                                (option: any, optIdx: number) => (
                                  <View
                                    key={option.id || optIdx}
                                    style={styles.optionItem}
                                  >
                                    <View
                                      style={[
                                        styles.optionIndicator,
                                        {
                                          backgroundColor: option.isCorrect
                                            ? "#10B981"
                                            : "#E5E7EB",
                                        },
                                      ]}
                                    />
                                    <Text style={styles.optionText}>
                                      {option.content || "—"}
                                    </Text>
                                    {option.isCorrect && (
                                      <Ionicons
                                        name="checkmark-circle"
                                        size={16}
                                        color="#10B981"
                                        style={{ marginLeft: "auto" }}
                                      />
                                    )}
                                  </View>
                                )
                              )}
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Chưa có câu hỏi nào</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            {onDelete && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditingQuiz(true)}
                >
                  <Ionicons name="pencil" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Sửa Quiz</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    Alert.alert(
                      "Xác nhận xóa",
                      `Bạn có chắc chắn muốn xóa quiz "${quiz.title}" không?`,
                      [
                        { text: "Hủy", style: "cancel" },
                        {
                          text: "Xóa",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              onClose();
                              await onDelete(quiz.id, quiz.title);
                            } catch (error) {
                              console.error("Error deleting quiz:", error);
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Edit Quiz Modal */}
      <Modal
        visible={editingQuiz && !!quiz}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingQuiz(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setEditingQuiz(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sửa Quiz</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Quiz Title */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Tên Quiz *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập tên quiz..."
                placeholderTextColor="#9CA3AF"
                value={editTitle}
                onChangeText={setEditTitle}
              />
            </View>

            {/* Quiz Description */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Mô tả (tùy chọn)</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 80 }]}
                placeholder="Nhập mô tả quiz..."
                placeholderTextColor="#9CA3AF"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Submit Button */}
            <View style={styles.formSection}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!editTitle.trim() || submitting) && styles.submitButtonDisabled,
                ]}
                onPress={async () => {
                  try {
                    if (!editTitle.trim()) {
                      Alert.alert("Lỗi", "Vui lòng nhập tên quiz");
                      return;
                    }

                    setSubmitting(true);

                    const payload = {
                      title: editTitle.trim(),
                      description: editDescription.trim() || null,
                    };

                    await http.put(`/v1/quizzes/${quiz.id}`, payload);

                    setEditingQuiz(false);

                    Toast.show({
                      type: "success",
                      text1: "Thành công",
                      text2: "Cập nhật quiz thành công",
                      position: "top",
                      visibilityTime: 3000,
                    });

                    if (onQuizUpdated) {
                      onQuizUpdated();
                    }
                  } catch (error: any) {
                    console.error("Error updating quiz:", error);
                    Toast.show({
                      type: "error",
                      text1: "Lỗi",
                      text2: error.response?.data?.message || "Không thể cập nhật quiz",
                      position: "top",
                      visibilityTime: 3000,
                    });
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={!editTitle.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Đang lưu...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Cập nhật Quiz</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  statusBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  descriptionBox: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#059669",
  },
  descriptionText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  questionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  questionCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  questionsList: {
    gap: 10,
  },
  questionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
  },
  questionNumberText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  questionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  optionCount: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 8,
  },
  optionsList: {
    gap: 6,
    marginTop: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  optionText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  emptyCard: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
    color: "#111827",
    minHeight: 44,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
