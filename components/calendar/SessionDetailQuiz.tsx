import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { QuestionType } from "../../types/question";
import { QuestionOptionType } from "../../types/question-option";
import { QuizType } from "../../types/quiz";
import { CalendarSession } from "../../types/session";

interface Props {
  session: CalendarSession | null;
  course: any;
  styles: any;
}

const SessionDetailQuiz: React.FC<Props> = ({ session, course, styles }) => {
  const quizzes: QuizType[] = (session?.quizzes as QuizType[]) || (course?.quizzes as QuizType[]) || [];
  const [openQuizIds, setOpenQuizIds] = useState<number[]>([]);

  if (!quizzes || quizzes.length === 0) return null;

  const toggleQuiz = (id: number) => {
    setOpenQuizIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="help-circle-outline" size={20} color="#059669" />
        <Text style={styles.sectionTitle}>Bài kiểm tra</Text>
        <Text style={styles.enrollmentCount}>({quizzes.length} bài kiểm tra)</Text>
      </View>
      <View style={styles.sectionContent}>
        {quizzes.map((quiz: any, index: number) => {
          const isOpen = quiz.id && openQuizIds.includes(quiz.id);
          return (
            <View key={quiz.id || index} style={styles.quizItem}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => quiz.id && toggleQuiz(quiz.id)}
                style={styles.quizHeader}
              >
                <Text style={styles.quizTitle}>{quiz.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.quizMeta}>
                    <Ionicons name="list-outline" size={14} color="#6B7280" />
                    <Text style={styles.quizMetaText}>{quiz.totalQuestions} câu hỏi</Text>
                  </View>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#6B7280"
                    style={{ marginLeft: 8 }}
                  />
                </View>
              </TouchableOpacity>

              {quiz.description && !isOpen && (
                <Text style={styles.quizDescription} numberOfLines={2}>
                  {quiz.description}
                </Text>
              )}

              {isOpen && (
                <View style={{ marginTop: 8 }}>
                  {/* Full quiz details: description, questions and options when available */}
                  {quiz.description && (
                    <Text style={styles.quizDescription}>{quiz.description}</Text>
                  )}

                  {(quiz.questions || []).map((q: QuestionType | any, qi: number) => {
                    const opts: (QuestionOptionType | string)[] = (q as any).options || (q as any).optionList || [];
                    return (
                      <View key={q.id || qi} style={{ marginTop: 12 }}>
                        <Text style={[styles.quizMetaText, { fontWeight: '600', marginBottom: 6 }]}>
                          {qi + 1}. {q.title || q.content || 'Câu hỏi'}
                        </Text>

                        {opts.length === 0 && q.correctIndex != null && (
                          <Text style={{ marginLeft: 12, color: '#374151' }}>No option list available — correct index: {q.correctIndex}</Text>
                        )}

                        {opts.map((opt: any, oi: number) => {
                          const label = String.fromCharCode(65 + oi); // A, B, C...
                          const text = typeof opt === 'string' ? opt : opt.content || opt.text;
                          const isCorrect = (typeof opt === 'object' && opt.isCorrect) || (q.correctIndex != null && q.correctIndex === oi);
                          return (
                            <View key={opt.id || oi} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, marginBottom: 4 }}>
                              <Text style={{ width: 28, color: '#6B7280' }}>{label}.</Text>
                              <Text style={{ color: '#374151', flex: 1 }}>{text}</Text>
                              {isCorrect && (
                                <Ionicons name="checkmark-circle" size={16} color="#059669" style={{ marginLeft: 8 }} />
                              )}
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default SessionDetailQuiz;
