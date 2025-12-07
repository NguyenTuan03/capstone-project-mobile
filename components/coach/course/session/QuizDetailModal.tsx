import http from "@/services/http/interceptor";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

// Custom TextInput wrapper for consistent styling
const CustomTextInput = React.forwardRef<any, any>(
  (
    {
      style,
      ...props
    }: {
      style?: any;
      [key: string]: any;
    },
    ref
  ) => <RNTextInput ref={ref} style={[styles.textInput, style]} {...props} />
);
CustomTextInput.displayName = "CustomTextInput";

interface QuizDetailModalProps {
  visible: boolean;
  quiz: any | null;
  sessionId: string | string[] | undefined;
  onClose: () => void;
  onDelete?: (quizId: number, quizTitle: string) => Promise<void>;
  onQuizUpdated?: () => void;
}

const QuizDetailModal: React.FC<QuizDetailModalProps> = ({
  visible,
  quiz,
  sessionId,
  onClose,
  onDelete,
  onQuizUpdated,
}) => {
  const [editingQuiz, setEditingQuiz] = useState(false);
  const [editTitle, setEditTitle] = useState(quiz?.title || "");
  const [editDescription, setEditDescription] = useState(
    quiz?.description || ""
  );
  const [submitting, setSubmitting] = useState(false);

  // Question editing state
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [showEditQuestion, setShowEditQuestion] = useState(false);
  const [editQuestionTitle, setEditQuestionTitle] = useState("");
  const [editExplanation, setEditExplanation] = useState("");
  const [editOptions, setEditOptions] = useState<
    { id: number | string; content: string; isCorrect: boolean }[]
  >([]);

  React.useEffect(() => {
    setEditTitle(quiz?.title || "");
    setEditDescription(quiz?.description || "");
  }, [quiz]);

  // Question editing handlers
  const handleOpenEditQuestion = (question: any) => {
    setEditingQuestion(question);
    setEditQuestionTitle(question.title);
    setEditExplanation(question.explanation || "");
    setEditOptions(
      question.options.map((opt: any) => ({
        id: opt.id,
        content: opt.content,
        isCorrect: opt.isCorrect,
      }))
    );
    setShowEditQuestion(true);
  };

  const handleUpdateEditOption = (id: number | string, content: string) => {
    setEditOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, content } : opt))
    );
  };

  const handleToggleEditCorrect = (id: number | string) => {
    setEditOptions((prev) =>
      prev.map((opt) =>
        opt.id === id
          ? { ...opt, isCorrect: !opt.isCorrect }
          : { ...opt, isCorrect: false }
      )
    );
  };

  const handleAddEditOption = () => {
    const newOption = {
      id: Date.now(),
      content: "",
      isCorrect: false,
    };
    setEditOptions([...editOptions, newOption]);
  };

  const handleDeleteEditOption = (id: number | string) => {
    if (editOptions.length > 1) {
      setEditOptions(editOptions.filter((opt) => opt.id !== id));
    } else {
      Alert.alert("Lỗi", "Câu hỏi phải có ít nhất 1 đáp án.");
    }
  };

  const handleSaveQuestionEdit = async () => {
    try {
      if (!editQuestionTitle.trim()) {
        alert("Vui lòng nhập câu hỏi");
        return;
      }

      const validOptions = editOptions.filter((opt) => opt.content.trim());
      if (validOptions.length < 2) {
        alert("Vui lòng nhập ít nhất 2 đáp án");
        return;
      }

      const hasCorrectAnswer = validOptions.some((opt) => opt.isCorrect);
      if (!hasCorrectAnswer) {
        alert("Vui lòng chọn ít nhất 1 đáp án đúng");
        return;
      }

      setSubmitting(true);

      const payload = {
        title: editQuestionTitle.trim(),
        explanation: editExplanation.trim() || null,
        options: validOptions.map((opt) => ({
          id: opt.id,
          content: opt.content.trim(),
          isCorrect: opt.isCorrect,
        })),
      };

      await http.put(
        `/v1/quizzes/${quiz.id}/questions/${editingQuestion.id}`,
        payload
      );

      setShowEditQuestion(false);
      setEditingQuestion(null);
      alert("Cập nhật câu hỏi thành công");

      if (onQuizUpdated) {
        onQuizUpdated();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Không thể cập nhật câu hỏi";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = (questionId: number) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa câu hỏi này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setSubmitting(true);
              await http.delete(`/v1/quizzes/questions/${questionId}`);

              alert("Xóa câu hỏi thành công");

              if (onQuizUpdated) {
                onQuizUpdated();
              }
            } catch (error: any) {
              const errorMessage =
                error.response?.data?.message || "Không thể xóa câu hỏi";
              alert(errorMessage);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

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
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.sectionLabel}>Bài Quiz</Text>
                  <Text
                    style={styles.cardTitle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {quiz.title}
                  </Text>
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
                  <Text style={styles.descriptionText}>{quiz.description}</Text>
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
                    <TouchableOpacity
                      key={question.id || idx}
                      style={styles.questionItem}
                      onPress={() => handleOpenEditQuestion(question)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.questionNumber}>
                        <Text style={styles.questionNumberText}>{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={styles.questionText}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
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
                                    <Text
                                      style={styles.optionText}
                                      numberOfLines={1}
                                      ellipsizeMode="tail"
                                    >
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
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#9CA3AF"
                        style={{ marginLeft: 8 }}
                      />
                    </TouchableOpacity>
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
                            } catch (error) {}
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
            <Text style={styles.modalTitle} numberOfLines={1}>
              Sửa Quiz
            </Text>
            <View style={{ width: 36 }} />
          </View>{" "}
          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Quiz Title */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Tên Quiz</Text>
              <CustomTextInput
                placeholder="Nhập tên quiz..."
                placeholderTextColor="#9CA3AF"
                value={editTitle}
                onChangeText={setEditTitle}
              />
            </View>

            {/* Quiz Description */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Mô tả (tùy chọn)</Text>
              <CustomTextInput
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
                  (!editTitle.trim() || submitting) &&
                    styles.submitButtonDisabled,
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
                    Toast.show({
                      type: "error",
                      text1: "Lỗi",
                      text2:
                        error.response?.data?.message ||
                        "Không thể cập nhật quiz",
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
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.submitButtonText}>Cập nhật Quiz</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Question Modal */}
      <Modal
        visible={showEditQuestion && !!editingQuestion}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowEditQuestion(false);
          setEditingQuestion(null);
        }}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowEditQuestion(false);
                setEditingQuestion(null);
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              Sửa Câu Hỏi
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Question Title */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Nội dung câu hỏi</Text>
              <CustomTextInput
                placeholder="Nhập câu hỏi..."
                placeholderTextColor="#9CA3AF"
                value={editQuestionTitle}
                onChangeText={setEditQuestionTitle}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Explanation */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Giải thích (tùy chọn)</Text>
              <CustomTextInput
                placeholder="Nhập lời giải thích..."
                placeholderTextColor="#9CA3AF"
                value={editExplanation}
                onChangeText={setEditExplanation}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Options */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Đáp án</Text>
              {editOptions.map((option, index) => (
                <View key={option.id} style={styles.optionInputCard}>
                  <View style={styles.optionLabelBadge}>
                    <Text style={styles.optionLabelText}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>

                  <View style={styles.optionInputWrapper}>
                    <RNTextInput
                      style={styles.optionTextInputRaw}
                      placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
                      placeholderTextColor="#9CA3AF"
                      value={option.content}
                      onChangeText={(text: string) =>
                        handleUpdateEditOption(option.id, text)
                      }
                      multiline
                    />
                  </View>

                  <View
                    style={{
                      width: 48,
                      height: 34,
                      flexShrink: 0,
                      justifyContent: "center",
                      alignItems: "center",
                      marginHorizontal: 4,
                    }}
                  >
                    <Switch
                      value={option.isCorrect}
                      onValueChange={() => handleToggleEditCorrect(option.id)}
                      trackColor={{ false: "#E5E7EB", true: "#D1FAE5" }}
                      thumbColor={option.isCorrect ? "#059669" : "#9CA3AF"}
                    />
                  </View>

                  {editOptions.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleDeleteEditOption(option.id)}
                      style={{
                        width: 32,
                        height: 32,
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: 6,
                        backgroundColor: "#FEE2E2",
                        borderWidth: 1,
                        borderColor: "#FECACA",
                        flexShrink: 0,
                      }}
                    >
                      <Ionicons name="trash" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Add Option Button */}
              <TouchableOpacity
                onPress={handleAddEditOption}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: "#ECFDF5",
                  alignItems: "center",
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: "#D1FAE5",
                }}
              >
                <Text style={{ fontWeight: "600", color: "#059669" }}>
                  + Thêm đáp án
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit and Delete Buttons */}
            <View style={styles.formSection}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!editQuestionTitle.trim() || submitting) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleSaveQuestionEdit}
                disabled={!editQuestionTitle.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Đang lưu...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.submitButtonText}>
                      Cập nhật Câu Hỏi
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: "#DC2626", marginTop: 10 },
                ]}
                onPress={() => handleDeleteQuestion(editingQuestion.id)}
              >
                <Ionicons name="trash" size={18} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Xóa Câu Hỏi</Text>
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    maxWidth: 220,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    maxWidth: 200,
  },
  statusBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  descriptionBox: {
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#059669",
  },
  descriptionText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  questionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  questionCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
  questionsList: {
    gap: 8,
  },
  questionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  questionNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  questionNumberText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 11,
  },
  questionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 3,
  },
  optionCount: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 6,
  },
  optionsList: {
    gap: 5,
    marginTop: 6,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    flexShrink: 0,
  },
  optionText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  emptyCard: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  formSection: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    fontSize: 13,
    color: "#111827",
    minHeight: 40,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  submitButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  optionInputCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    paddingVertical: 5,
    paddingHorizontal: 5,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  optionLabelBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  optionLabelText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  optionInputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  optionTextInputRaw: {
    flex: 1,
    fontSize: 12,
    color: "#111827",
    padding: 0,
  },
});

export default QuizDetailModal;
