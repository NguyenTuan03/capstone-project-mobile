import { Course } from "@/types/course";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { QuestionType } from "../../../types/question";
import { QuestionOptionType } from "../../../types/question-option";
import { QuizType } from "../../../types/quiz";
import { CalendarSession } from "../../../types/session";

interface Props {
  session: CalendarSession | null;
  course: Course;
  styles: any;
}

const SessionDetailQuiz: React.FC<Props> = ({ session, course, styles }) => {
  const quiz: QuizType | null = session?.quiz || null;
  const [selectedQuiz, setSelectedQuiz] = useState<QuizType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleQuizPress = (quiz: QuizType) => {
    setSelectedQuiz(quiz);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setTimeout(() => {
      setSelectedQuiz(null);
    }, 300);
  };

  

  if (!quiz) return null;

  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={localStyles.headerIcon}>
            <Ionicons name="help-circle-outline" size={22} color="#059669" />
          </View>
          <Text style={styles.sectionTitle}>Bài kiểm tra</Text>
          <View style={localStyles.badgeContainer}>
            <Text style={localStyles.badgeText}>{quiz.questions.length}</Text>
          </View>
        </View>
        <View style={styles.sectionContent}>
          <TouchableOpacity
            style={localStyles.quizCard}
            activeOpacity={0.7}
            onPress={() => handleQuizPress(quiz)}
          >
            <View style={localStyles.quizHeader}>
              <View style={localStyles.quizNumberBadge}></View>
              <View style={localStyles.quizTitleContainer}>
                <Text style={localStyles.quizTitle} numberOfLines={2}>
                  {quiz.title}
                </Text>
                <View style={localStyles.quizMeta}>
                  <Ionicons name="list-outline" size={14} color="#6B7280" />
                  <Text style={localStyles.quizMetaText}>
                    {quiz.totalQuestions} câu hỏi
                  </Text>
                </View>
              </View>
              <View style={localStyles.chevronContainer}>
                <Ionicons name="chevron-forward" size={20} color="#059669" />
              </View>
            </View>

            {quiz.description && (
              <Text style={localStyles.quizDescription} numberOfLines={2}>
                {quiz.description}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleModalClose}
      >
        <View style={localStyles.modalContainer}>
          {/* Absolute Close Button */}
          <TouchableOpacity
            onPress={handleModalClose}
            style={localStyles.absoluteCloseButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>

          <ScrollView
            style={localStyles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedQuiz && (
              <>
                <View style={localStyles.sheetHeader}>
                  <View style={localStyles.sheetTitleRow}>
                    <View style={localStyles.sheetIcon}>
                      <Ionicons name="help-circle" size={24} color="#059669" />
                    </View>
                    <Text style={localStyles.sheetTitle} numberOfLines={2}>
                      {selectedQuiz.title}
                    </Text>
                  </View>

                  <View style={localStyles.sheetMetaRow}>
                    <View style={localStyles.sheetMetaItem}>
                      <Ionicons name="list-outline" size={16} color="#6B7280" />
                      <Text style={localStyles.sheetMetaText}>
                        {selectedQuiz.totalQuestions} câu hỏi
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedQuiz.description && (
                  <View style={localStyles.descriptionCard}>
                    <Text style={localStyles.descriptionText}>
                      {selectedQuiz.description}
                    </Text>
                  </View>
                )}

                <View style={localStyles.questionsContainer}>
                  {(selectedQuiz.questions || []).map(
                    (q: QuestionType | any, qi: number) => {
                      const opts: (QuestionOptionType | string)[] =
                        (q as any).options || (q as any).optionList || [];
                      return (
                        <View key={q.id || qi} style={localStyles.questionCard}>
                          <View style={localStyles.questionHeader}>
                            <View style={localStyles.questionNumberBadge}>
                              <Text style={localStyles.questionNumberText}>
                                {qi + 1}
                              </Text>
                            </View>
                            <Text style={localStyles.questionText}>
                              {q.title || q.content || "Câu hỏi"}
                            </Text>
                          </View>

                          {opts.length === 0 && q.correctIndex != null && (
                            <View style={localStyles.noOptionsContainer}>
                              <Ionicons
                                name="alert-circle-outline"
                                size={16}
                                color="#F59E0B"
                              />
                              <Text style={localStyles.noOptionsText}>
                                Không có danh sách đáp án — đáp án đúng:{" "}
                                {q.correctIndex}
                              </Text>
                            </View>
                          )}

                          <View style={localStyles.optionsContainer}>
                            {opts.map((opt: any, oi: number) => {
                              const label = String.fromCharCode(65 + oi); // A, B, C...
                              const text =
                                typeof opt === "string"
                                  ? opt
                                  : opt.content || opt.text;
                              const isCorrect =
                                (typeof opt === "object" && opt.isCorrect) ||
                                (q.correctIndex != null &&
                                  q.correctIndex === oi);
                              return (
                                <View
                                  key={opt.id || oi}
                                  style={[
                                    localStyles.optionItem,
                                    isCorrect && localStyles.optionItemCorrect,
                                  ]}
                                >
                                  <View
                                    style={[
                                      localStyles.optionLabel,
                                      isCorrect &&
                                        localStyles.optionLabelCorrect,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        localStyles.optionLabelText,
                                        isCorrect &&
                                          localStyles.optionLabelTextCorrect,
                                      ]}
                                    >
                                      {label}
                                    </Text>
                                  </View>
                                  <Text
                                    style={[
                                      localStyles.optionText,
                                      isCorrect &&
                                        localStyles.optionTextCorrect,
                                    ]}
                                  >
                                    {text}
                                  </Text>
                                  {isCorrect && (
                                    <View
                                      style={localStyles.correctIconContainer}
                                    >
                                      <Ionicons
                                        name="checkmark-circle"
                                        size={20}
                                        color="#059669"
                                      />
                                    </View>
                                  )}
                                </View>
                              );
                            })}
                          </View>

                          {q.explanation && (
                            <View style={localStyles.explanationContainer}>
                              <View style={localStyles.explanationHeader}>
                                <Ionicons
                                  name="bulb-outline"
                                  size={16}
                                  color="#3B82F6"
                                />
                                <Text style={localStyles.explanationTitle}>
                                  Giải thích
                                </Text>
                              </View>
                              <Text style={localStyles.explanationText}>
                                {q.explanation}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    }
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const localStyles = StyleSheet.create({
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeContainer: {
    backgroundColor: "#059669",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  quizCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quizHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },
  quizNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#10B981",
  },
  quizNumberText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#059669",
  },
  quizTitleContainer: {
    flex: 1,
    gap: 4,
  },
  quizTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 20,
  },
  quizMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  quizMetaText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  chevronContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  quizDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontWeight: "500",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  absoluteCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sheetHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginBottom: 16,
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    paddingRight: 40,
  },
  sheetIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  sheetTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 24,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  sheetMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sheetMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  sheetMetaText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  descriptionCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#059669",
  },
  descriptionText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
    fontWeight: "500",
  },
  questionsContainer: {
    gap: 10,
    paddingBottom: 20,
  },
  questionCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  questionNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  questionNumberText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 19,
  },
  noOptionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  noOptionsText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
  },
  optionsContainer: {
    gap: 6,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionItemCorrect: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
  },
  optionLabel: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  optionLabelCorrect: {
    backgroundColor: "#059669",
    borderColor: "#047857",
  },
  optionLabelText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
  },
  optionLabelTextCorrect: {
    color: "#FFFFFF",
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
    fontWeight: "500",
  },
  optionTextCorrect: {
    color: "#047857",
    fontWeight: "700",
  },
  correctIconContainer: {
    marginLeft: "auto",
  },
  // Explanation Styles
  explanationContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  explanationTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E40AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  explanationText: {
    fontSize: 13,
    color: "#1E3A8A",
    lineHeight: 18,
    fontWeight: "500",
  },
});

export default SessionDetailQuiz;
