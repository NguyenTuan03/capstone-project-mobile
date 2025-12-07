import { get, post } from "@/services/http/httpService";
import http from "@/services/http/interceptor";
import { QuizType } from "@/types/quiz";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function QuizDetailScreen() {
  const { quizId, lessonId } = useLocalSearchParams<{
    quizId: string;
    lessonId: string;
  }>();

  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [questionTitle, setQuestionTitle] = useState("");
  const [explanation, setExplanation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [options, setOptions] = useState<
    { id: number | string; content: string; isCorrect: boolean }[]
  >([
    { id: 1, content: "", isCorrect: false },
    { id: 2, content: "", isCorrect: false },
  ]);

  // Quiz editing state
  const [showEditQuiz, setShowEditQuiz] = useState(false);
  const [editQuizTitle, setEditQuizTitle] = useState("");
  const [editQuizDescription, setEditQuizDescription] = useState("");

  // Question editing state
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [showEditQuestion, setShowEditQuestion] = useState(false);
  const [editQuestionTitle, setEditQuestionTitle] = useState("");
  const [editExplanation, setEditExplanation] = useState("");
  const [editOptions, setEditOptions] = useState<
    { id: number | string; content: string; isCorrect: boolean }[]
  >([]);

  const fetchDataQuiz = async (lessonId: string, quizId: string) => {
    try {
      setLoading(true);
      const response = await get<QuizType>(
        `${API_URL}/v1/quizzes/lessons/${lessonId}`
      );
      const quiz = response.data;
      setQuiz(quiz);
    } catch (error) {
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setQuestionTitle("");
    setExplanation("");
    setOptions([
      { id: 1, content: "", isCorrect: false },
      { id: 2, content: "", isCorrect: false },
    ]);
  };

  const handleAddQuestion = async () => {
    try {
      // Validation: Question title is required
      if (!questionTitle.trim()) {
        alert("Vui lòng nhập câu hỏi");
        return;
      }

      // Validation: Need at least 2 valid options
      const validOptions = options.filter((opt) => opt.content.trim());
      if (validOptions.length < 2) {
        alert("Vui lòng nhập ít nhất 2 đáp án");
        return;
      }

      // Validation: Must have at least one correct answer
      const hasCorrectAnswer = validOptions.some((opt) => opt.isCorrect);
      if (!hasCorrectAnswer) {
        alert("Vui lòng chọn ít nhất 1 đáp án đúng");
        return;
      }

      // Format payload for API
      const payload = {
        title: questionTitle.trim(),
        explanation: explanation.trim() || null,
        options: validOptions.map((opt) => ({
          content: opt.content.trim(),
          isCorrect: opt.isCorrect,
        })),
      };

      setSubmitting(true);

      // Call API to add question to quiz
      await post(`${API_URL}/v1/quizzes/${quizId}/questions`, payload);

      // Success: Close modal and refresh quiz data
      handleResetForm();
      setShowCreateQuestion(false);
      alert("Thêm câu hỏi thành công");

      // Refresh quiz data to show new question
      if (lessonId && quizId) {
        await fetchDataQuiz(lessonId, quizId);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Không thể thêm câu hỏi";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOption = (id: number | string, content: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, content } : opt))
    );
  };

  const handleToggleCorrect = (id: number | string) => {
    setOptions((prev) =>
      prev.map((opt) =>
        opt.id === id
          ? { ...opt, isCorrect: !opt.isCorrect }
          : { ...opt, isCorrect: false }
      )
    );
  };

  const handleAddOption = () => {
    const newOption = {
      id: Date.now(),
      content: "",
      isCorrect: false,
    };
    setOptions([...options, newOption]);
  };

  const handleDeleteOption = (id: number | string) => {
    if (options.length > 1) {
      setOptions(options.filter((opt) => opt.id !== id));
    } else {
      Alert.alert("Lỗi", "Câu hỏi phải có ít nhất 1 đáp án.");
    }
  };

  // Quiz editing handlers
  const handleOpenEditQuiz = () => {
    if (quiz) {
      setEditQuizTitle(quiz.title);
      setEditQuizDescription(quiz.description || "");
      setShowEditQuiz(true);
    }
  };

  const handleSaveQuizEdit = async () => {
    try {
      if (!editQuizTitle.trim()) {
        alert("Vui lòng nhập tên quiz");
        return;
      }

      setSubmitting(true);

      const payload = {
        title: editQuizTitle.trim(),
        description: editQuizDescription.trim() || null,
      };

      await http.put(`/v1/quizzes/${quizId}`, payload);

      // Update local state
      if (quiz) {
        setQuiz({
          ...quiz,
          title: editQuizTitle.trim(),
          description: editQuizDescription.trim(),
        });
      }

      setShowEditQuiz(false);
      alert("Cập nhật quiz thành công");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Không thể cập nhật quiz";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

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
        `/v1/quizzes/${quizId}/questions/${editingQuestion.id}`,
        payload
      );

      setShowEditQuestion(false);
      setEditingQuestion(null);
      alert("Cập nhật câu hỏi thành công");

      // Refresh quiz data
      if (lessonId && quizId) {
        await fetchDataQuiz(lessonId, quizId);
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

              // Refresh quiz data
              if (lessonId && quizId) {
                await fetchDataQuiz(lessonId, quizId);
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

  useEffect(() => {
    if (lessonId && quizId) {
      fetchDataQuiz(lessonId, quizId);
    }
  }, [lessonId, quizId]);

  if (loading || !quiz) {
    return (
      <View style={[styles.container]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View
            style={{
              flex: 1,
              height: 24,
              backgroundColor: "#E5E7EB",
              borderRadius: 4,
              marginHorizontal: 12,
            }}
          />
          <View style={{ width: 32 }} />
        </View>

        {/* Quiz Info Skeleton */}
        <View style={styles.quizInfoSection}>
          <View style={styles.infoCard}>
            <View
              style={{
                width: 24,
                height: 24,
                backgroundColor: "#E5E7EB",
                borderRadius: 12,
                marginRight: 12,
              }}
            />
            <View style={{ flex: 1 }}>
              <View
                style={{
                  height: 12,
                  backgroundColor: "#E5E7EB",
                  borderRadius: 4,
                  marginBottom: 6,
                }}
              />
              <View
                style={{
                  height: 16,
                  backgroundColor: "#E5E7EB",
                  borderRadius: 4,
                  width: "60%",
                }}
              />
            </View>
          </View>
        </View>

        {/* Skeleton Questions */}
        <ScrollView
          style={styles.contentContainer}
          contentContainerStyle={styles.contentPadding}
          scrollEnabled={false}
        >
          {[1, 2, 3].map((index) => (
            <View key={index} style={styles.questionCard}>
              {/* Question Header Skeleton */}
              <View style={styles.questionHeader}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: "#E5E7EB",
                    borderRadius: 18,
                    marginRight: 12,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      height: 16,
                      backgroundColor: "#E5E7EB",
                      borderRadius: 4,
                      marginBottom: 8,
                    }}
                  />
                  <View
                    style={{
                      height: 14,
                      backgroundColor: "#E5E7EB",
                      borderRadius: 4,
                      width: "80%",
                    }}
                  />
                </View>
              </View>

              {/* Options Skeleton */}
              <View style={styles.optionsContainer}>
                {[1, 2].map((optIndex) => (
                  <View key={optIndex} style={styles.optionButton}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: "#E5E7EB",
                        borderRadius: 16,
                        marginRight: 12,
                      }}
                    />
                    <View
                      style={{
                        flex: 1,
                        height: 14,
                        backgroundColor: "#E5E7EB",
                        borderRadius: 4,
                      }}
                    />
                  </View>
                ))}
              </View>

              {/* Buttons Skeleton */}
              <View style={styles.questionActions}>
                <View
                  style={{
                    flex: 1,
                    height: 36,
                    backgroundColor: "#E5E7EB",
                    borderRadius: 8,
                  }}
                />
                <View
                  style={{
                    flex: 1,
                    height: 36,
                    backgroundColor: "#E5E7EB",
                    borderRadius: 8,
                    marginLeft: 10,
                  }}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {quiz.title}
        </Text>
        <TouchableOpacity
          onPress={handleOpenEditQuiz}
          style={styles.editButton}
        >
          <Ionicons name="pencil" size={20} color="#059669" />
        </TouchableOpacity>
      </View>

      {/* Quiz Info */}
      <View style={styles.quizInfoSection}>
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="help-circle" size={24} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Tổng câu hỏi</Text>
            <Text style={styles.infoValue}>{quiz.questions.length} câu</Text>
          </View>
        </View>
      </View>

      {/* Questions List */}
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.contentPadding}
        showsVerticalScrollIndicator={false}
      >
        {quiz.questions
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA - dateB;
          })
          .map((question, qIndex) => (
            <View key={question.id} style={styles.questionCard}>
              {/* Question Number and Title */}
              <View style={styles.questionHeader}>
                <View style={styles.questionNumberBadge}>
                  <Text style={styles.questionNumber}>{qIndex + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.questionTitle} numberOfLines={3}>
                    {question.title}
                  </Text>
                  {question.explanation && (
                    <Text style={styles.questionExplanation} numberOfLines={2}>
                      {question.explanation}
                    </Text>
                  )}
                </View>
              </View>

              {/* Options */}
              <View style={styles.optionsContainer}>
                {question.options.length === 0 ? (
                  <View style={styles.emptyOptions}>
                    <Ionicons name="alert-circle" size={20} color="#9CA3AF" />
                    <Text style={styles.emptyOptionsText}>Không có đáp án</Text>
                  </View>
                ) : (
                  question.options
                    .sort((a, b) => {
                      const dateA = a.createdAt
                        ? new Date(a.createdAt).getTime()
                        : 0;
                      const dateB = b.createdAt
                        ? new Date(b.createdAt).getTime()
                        : 0;
                      return dateA - dateB;
                    })
                    .map((option, oIndex) => (
                      <View
                        key={option.id}
                        style={[
                          styles.optionButton,
                          option.isCorrect && styles.optionCorrect,
                        ]}
                      >
                        <View
                          style={[
                            styles.optionLetter,
                            option.isCorrect && styles.optionLetterCorrect,
                          ]}
                        >
                          <Text style={styles.optionLetterText}>
                            {String.fromCharCode(97 + oIndex).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.optionText}>{option.content}</Text>
                        {option.isCorrect && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#059669"
                            style={{ marginLeft: "auto" }}
                          />
                        )}
                      </View>
                    ))
                )}
              </View>

              {/* Edit/Delete Buttons */}
              <View style={styles.questionActions}>
                <TouchableOpacity
                  style={styles.questionActionButton}
                  onPress={() => handleOpenEditQuestion(question)}
                >
                  <Ionicons name="pencil" size={16} color="#FFFFFF" />
                  <Text style={styles.questionActionButtonText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.questionActionButton,
                    styles.questionActionButtonDelete,
                  ]}
                  onPress={() => handleDeleteQuestion(question.id)}
                >
                  <Ionicons name="trash" size={16} color="#FFFFFF" />
                  <Text style={styles.questionActionButtonText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
      </ScrollView>

      {/* Create Question Button - Circular FAB */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 24,
          right: 16,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#059669",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#059669",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
          zIndex: 10,
        }}
        onPress={() => setShowCreateQuestion(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Edit Quiz Modal */}
      <Modal
        visible={showEditQuiz}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditQuiz(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowEditQuiz(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sửa Quiz</Text>
            <View style={{ width: 32 }} />
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
                value={editQuizTitle}
                onChangeText={setEditQuizTitle}
              />
            </View>

            {/* Quiz Description */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Mô tả (tùy chọn)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập mô tả quiz..."
                placeholderTextColor="#9CA3AF"
                value={editQuizDescription}
                onChangeText={setEditQuizDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Submit Button */}
            <View style={styles.formSection}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!editQuizTitle.trim() || submitting) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleSaveQuizEdit}
                disabled={!editQuizTitle.trim() || submitting}
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
        visible={showEditQuestion}
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
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sửa Câu Hỏi</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Question Title */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Nội dung câu hỏi *</Text>
              <TextInput
                style={styles.textInput}
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
              <TextInput
                style={styles.textInput}
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
                      width: 52,
                      height: 36,
                      flexShrink: 0,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Switch
                      value={option.isCorrect}
                      onValueChange={(val) =>
                        handleToggleEditCorrect(option.id)
                      }
                    />
                  </View>

                  {editOptions.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleDeleteEditOption(option.id)}
                      style={{
                        width: 36,
                        height: 36,
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: 6,
                        backgroundColor: "#FEE2E2",
                        flexShrink: 0,
                      }}
                    >
                      <Ionicons name="trash" size={20} color="#EF4444" />
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
                  backgroundColor: "#E0E7FF",
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Text style={{ fontWeight: "600", color: "#4F46E5" }}>
                  + Thêm đáp án
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
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
            </View>
          </ScrollView>
        </View>
      </Modal>
      <Modal
        visible={showCreateQuestion}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCreateQuestion(false);
          handleResetForm();
        }}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowCreateQuestion(false);
                handleResetForm();
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Tạo câu hỏi</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Question Title */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Nội dung câu hỏi *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập câu hỏi..."
                placeholderTextColor="#9CA3AF"
                value={questionTitle}
                onChangeText={setQuestionTitle}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Explanation */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Giải thích (tùy chọn)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập lời giải thích..."
                placeholderTextColor="#9CA3AF"
                value={explanation}
                onChangeText={setExplanation}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Options */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Đáp án</Text>
              {options.map((option, index) => (
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
                        handleUpdateOption(option.id, text)
                      }
                      multiline
                    />
                  </View>

                  <View
                    style={{
                      width: 52,
                      height: 36,
                      flexShrink: 0,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Switch
                      value={option.isCorrect}
                      onValueChange={(val) => handleToggleCorrect(option.id)}
                    />
                  </View>

                  {options.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleDeleteOption(option.id)}
                      style={{
                        width: 36,
                        height: 36,
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: 6,
                        backgroundColor: "#FEE2E2",
                        flexShrink: 0,
                      }}
                    >
                      <Ionicons name="trash" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Add Option Button */}
              <TouchableOpacity
                onPress={handleAddOption}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: "#E0E7FF",
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Text style={{ fontWeight: "600", color: "#4F46E5" }}>
                  + Thêm đáp án
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <View style={styles.formSection}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!questionTitle.trim() || submitting) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleAddQuestion}
                disabled={!questionTitle.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Đang lưu...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Thêm câu hỏi</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const TextInput = ({ ...props }: any) => (
  <View
    style={{
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: "#FFFFFF",
    }}
  >
    <RNTextInput
      {...props}
      style={{ fontSize: 14, color: "#111827", ...props.style }}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  editButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  quizInfoSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  infoIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  questionNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#10B981",
    flexShrink: 0,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#059669",
  },
  questionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    lineHeight: 20,
  },
  questionExplanation: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  optionCorrect: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  optionLetterCorrect: {
    backgroundColor: "#10B981",
  },
  optionLetterText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  optionText: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "500",
    flex: 1,
  },
  emptyOptions: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  emptyOptionsText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  questionActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  questionActionButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#059669",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  questionActionButtonDelete: {
    backgroundColor: "#DC2626",
  },
  questionActionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    textAlign: "center",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
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
  optionInputCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    gap: 10,
    minHeight: 48,
  },
  optionLabelBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#10B981",
    flexShrink: 0,
  },
  optionLabelText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#059669",
  },
  optionTextInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    minHeight: 36,
    textAlignVertical: "center",
  },
  optionInputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  optionTextInputRaw: {
    fontSize: 14,
    color: "#111827",
    minHeight: 20,
    padding: 0,
  },
  correctButton: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  correctButtonActive: {
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
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
  // Video Styles
  videosSection: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  videoCard: {
    width: 150,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  videoThumbnail: {
    width: "100%",
    height: 84,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  videoInfo: {
    padding: 10,
    gap: 6,
  },
  videoTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 16,
  },
  videoDuration: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  videoStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
  },
  videoStatusText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
