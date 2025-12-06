// components/QuizAttemptCard.tsx
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAttemptQuiz } from "../../../hooks/use-attemp-quiz";
import quizService from "../../../services/quiz.service";

type Option = { id: number; content: string; isCorrect?: boolean };
type Question = {
  id: number;
  title: string;
  explanation?: string | null;
  options: Option[];
};
type Quiz = {
  id: number;
  title: string;
  description?: string | null;
  totalQuestions?: number;
  questions: Question[];
};

type QuizAttempt = {
  id?: number;
  attemptNumber?: number;
  score?: number;
  createdAt?: string;
  learnerAnswers?: {
    isCorrect: boolean;
    question: Question;
    questionOption: Option;
  }[];
};

type Props = {
  quiz: Quiz;
  onRefresh?: () => void;
};

const QuizAttemptCard: React.FC<Props> = ({ quiz, onRefresh }) => {
  const questions = useMemo(() => quiz.questions ?? [], [quiz.questions]);
  const [answers, setAnswers] = useState<Record<number, number | undefined>>(
    {}
  );
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    score?: number;
  } | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<QuizAttempt[]>([]);
  const [showAttempts, setShowAttempts] = useState(false);
  const [expandedAttemptId, setExpandedAttemptId] = useState<number | null>(
    null
  );
  const [showResultModal, setShowResultModal] = useState(false);

  const { submitAttempt, submitting, error } = useAttemptQuiz();

  // Load previous attempts on mount
  useEffect(() => {
    const loadAttempts = async () => {
      if (!quiz.id) return;
      try {
        const data = await quizService.getQuizAttempts(quiz.id);
        const attemptsList = Array.isArray(data) ? data : data?.data || [];
        setPreviousAttempts(attemptsList);
      } catch (err) {
 "Failed to load quiz attempts:", err);
      }
    };

    loadAttempts();
  }, [quiz.id]);

  const onSelect = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const allAnswered = questions.every((q) => answers[q.id] != null);

  const handleSubmit = async () => {
    if (!allAnswered || submitting) return;
    const payload = {
      learnerAnswers: questions.map((q) => ({
        question: q.id,
        questionOption: Number(answers[q.id]),
      })),
    };
    
    const res = await submitAttempt(quiz.id, payload);
    if (res) {
      setSubmitted(true);
      setResult({ score: res.score });
      setShowResultModal(true);

      // Refresh attempts list locally
      const data = await quizService.getQuizAttempts(quiz.id);
      const attemptsList = Array.isArray(data) ? data : data?.data || [];
      setPreviousAttempts(attemptsList);

      // Trigger parent refresh if provided
      // if (onRefresh) {
      //   onRefresh();
      // }
    }
  };

  const calculatePercentage = (attempt: QuizAttempt) => {
    if (!attempt.score || !quiz.totalQuestions) return 0;
    return Math.round((attempt.score / quiz.totalQuestions) * 100);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "#047857"; // Green
    if (percentage >= 60) return "#EA580C"; // Orange
    return "#DC2626"; // Red
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCloseModal = () => {
    setShowResultModal(false);
    // Reset form for new attempt
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <View style={s.card}>
      <Text style={s.title}>{quiz.title}</Text>
      {!!quiz.description && <Text style={s.desc}>{quiz.description}</Text>}
      <Text style={s.meta}>
        Tổng câu hỏi: {quiz.totalQuestions ?? questions.length}
      </Text>

      {/* Previous Attempts Section */}
      {previousAttempts.length > 0 && (
        <View style={s.attemptsSection}>
          <TouchableOpacity
            style={s.attemptsHeader}
            onPress={() => setShowAttempts(!showAttempts)}
            activeOpacity={0.7}
          >
            <View style={s.attemptsHeaderLeft}>
              <View style={s.attemptsHeaderContent}>
                <MaterialIcons name="history" size={18} color="#047857" />
                <Text style={s.attemptsTitle}>
                  Lần làm trước ({previousAttempts.length})
                </Text>
              </View>
            </View>
            <MaterialIcons
              name={showAttempts ? "expand-less" : "expand-more"}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>

          {showAttempts && (
            <View style={s.attemptsList}>
              {previousAttempts.map((attempt, index) => {
                const percentage = calculatePercentage(attempt);
                const scoreColor = getScoreColor(percentage);
                const isExpanded = expandedAttemptId === attempt.id;

                return (
                  <View key={attempt.id || index} style={s.attemptItem}>
                    <TouchableOpacity
                      onPress={() =>
                        setExpandedAttemptId(
                          isExpanded ? null : attempt.id || null
                        )
                      }
                      activeOpacity={0.7}
                      style={s.attemptItemHeader}
                    >
                      <View style={s.attemptInfo}>
                        <View
                          style={[
                            s.scoreCircle,
                            {
                              backgroundColor: scoreColor + "20",
                              borderColor: scoreColor,
                            },
                          ]}
                        >
                          <Text style={[s.scoreText, { color: scoreColor }]}>
                            {attempt.score}
                          </Text>
                        </View>
                        <View style={s.attemptDetails}>
                          <Text style={s.attemptLabel}>
                            Lần {attempt.attemptNumber || index + 1}
                          </Text>
                          <Text style={s.attemptMeta}>
                            {formatDate(attempt.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <MaterialIcons
                        name={isExpanded ? "expand-less" : "expand-more"}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>

                    {isExpanded && attempt.learnerAnswers && (
                      <View style={s.attemptAnswers}>
                        {attempt.learnerAnswers.map((answer, answerIdx) => (
                          <View key={answerIdx} style={s.answerItem}>
                            <View
                              style={[
                                s.answerIndicator,
                                answer.isCorrect
                                  ? s.answerCorrect
                                  : s.answerIncorrect,
                              ]}
                            >
                              <MaterialIcons
                                name={answer.isCorrect ? "check" : "close"}
                                size={16}
                                color="#FFFFFF"
                              />
                            </View>
                            <View style={s.answerContent}>
                              <Text style={s.answerQuestion}>
                                Câu {answerIdx + 1}: {answer.question.title}
                              </Text>
                              <Text style={s.answerSelected}>
                                Trả lời: {answer.questionOption.content}
                              </Text>
                              {answer.question.explanation && (
                                <View style={s.explanationBox}>
                                  <MaterialIcons
                                    name="info"
                                    size={12}
                                    color="#047857"
                                    style={{ marginRight: 4 }}
                                  />
                                  <Text style={s.answerExplanation}>
                                    {answer.question.explanation}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      <View style={s.divider} />

      <View style={s.newAttemptHeader}>
        <MaterialIcons name="edit-note" size={18} color="#059669" />
        <Text style={s.sectionTitle}>Làm bài mới</Text>
      </View>

      {questions.map((q, idx) => (
        <View key={q.id} style={s.qBox}>
          <Text style={s.qIndex}>Câu {idx + 1}.</Text>
          <Text style={s.qTitle}>{q.title}</Text>

          <View style={s.optList}>
            {q.options.map((op) => {
              const selected = answers[q.id] === op.id;
              return (
                <TouchableOpacity
                  key={op.id}
                  onPress={() => onSelect(q.id, op.id)}
                  activeOpacity={0.8}
                  style={[s.optItem, selected && s.optItemSelected]}
                >
                  <View style={[s.radio, selected && s.radioActive]} />
                  <Text style={[s.optText, selected && s.optTextActive]}>
                    {op.content}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {submitted && !!q.explanation && (
            <Text style={s.explain}>💡 {q.explanation}</Text>
          )}
        </View>
      ))}

      {error ? <Text style={s.error}>Lỗi gửi bài: {error}</Text> : null}

      <View style={s.actions}>
        <TouchableOpacity
          style={[s.btn, !allAnswered || submitting ? s.btnDisabled : null]}
          onPress={handleSubmit}
          disabled={!allAnswered || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={s.btnLabel}>Nộp bài</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Result Modal */}
      <Modal
        visible={showResultModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Kết quả bài làm</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {result && (
              <View style={s.modalBody}>
                <View style={s.resultCircle}>
                  <Text style={s.resultScoreLarge}>{result.score} </Text>
                  <Text style={s.resultLabelLarge}>Câu đúng</Text>
                </View>

                <TouchableOpacity
                  style={s.modalButton}
                  onPress={handleCloseModal}
                >
                  <Text style={s.modalButtonText}>Đóng & Làm lại</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.04,
    shadowRadius: 1.5,
    elevation: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.3,
  },
  desc: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
  meta: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },

  // Attempts Section
  attemptsSection: {
    backgroundColor: "#F0FDF4",
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#BBEF63",
    overflow: "hidden",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  attemptsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 11,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1.5,
    borderBottomColor: "#E5E7EB",
  },
  attemptsHeaderLeft: {
    flex: 1,
  },
  attemptsHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  attemptsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#047857",
    letterSpacing: 0.2,
  },
  attemptsList: {
    paddingVertical: 9,
    paddingHorizontal: 10,
    gap: 9,
    backgroundColor: "#F9FAFB",
  },
  attemptItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.04,
    shadowRadius: 1.5,
    elevation: 1,
  },
  attemptItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 11,
  },
  attemptInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    flex: 1,
  },
  scoreCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "700",
  },
  attemptDetails: {
    gap: 3,
    flex: 1,
  },
  attemptLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  attemptMeta: {
    fontSize: 10,
    color: "#6B7280",
  },
  attemptAnswers: {
    paddingTop: 9,
    paddingHorizontal: 11,
    paddingBottom: 11,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FAFBFC",
    gap: 9,
  },
  answerItem: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0.25 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 0.5,
  },
  answerIndicator: {
    width: 32,
    height: 32,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 32,
  },
  answerCorrect: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1.5,
    borderColor: "#34D399",
  },
  answerIncorrect: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1.5,
    borderColor: "#F87171",
  },
  answerContent: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
  },
  answerQuestion: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  answerSelected: {
    fontSize: 11,
    color: "#4B5563",
    fontStyle: "italic",
  },
  explanationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginTop: 3,
    paddingTop: 6,
    paddingLeft: 6,
    borderLeftWidth: 2,
    borderLeftColor: "#34D399",
  },
  answerExplanation: {
    fontSize: 10,
    color: "#047857",
    flex: 1,
    fontStyle: "italic",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 10,
  },
  newAttemptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.2,
  },
  qBox: {
    paddingVertical: 9,
    gap: 8,
  },
  qIndex: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  qTitle: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    lineHeight: 18,
  },
  optList: {
    gap: 8,
    marginTop: 6,
  },
  optItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 11,
    borderRadius: 9,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0.25 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 0.5,
  },
  optItemSelected: {
    backgroundColor: "#ECFDF5",
    borderColor: "#34D399",
    borderWidth: 1.5,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    backgroundColor: "transparent",
  },
  radioActive: {
    borderColor: "#059669",
    backgroundColor: "#059669",
  },
  optText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  optTextActive: {
    color: "#047857",
    fontWeight: "600",
  },
  explain: {
    marginTop: 8,
    fontSize: 12,
    color: "#047857",
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#34D399",
    paddingVertical: 6,
  },
  actions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  btn: {
    flex: 1,
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3.5,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  btnLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  error: {
    color: "#DC2626",
    marginTop: 8,
    fontSize: 12,
    paddingHorizontal: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalBody: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  resultCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ECFDF5",
    borderWidth: 4,
    borderColor: "#34D399",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  resultScoreLarge: {
    fontSize: 32,
    fontWeight: "800",
    color: "#059669",
  },
  resultLabelLarge: {
    fontSize: 14,
    color: "#047857",
    fontWeight: "600",
  },
  resultMessage: {
    fontSize: 15,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
  },
  modalButton: {
    width: "100%",
    backgroundColor: "#059669",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default QuizAttemptCard;
