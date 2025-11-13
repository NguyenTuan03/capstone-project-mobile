import { get } from "@/services/http/httpService";
import { QuizType } from "@/types/quiz";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
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

  console.log("quiID", quizId);

  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDataQuiz = async (lessonId: string, quizId: string) => {
    try {
      setLoading(true);
      const response = await get<QuizType[]>(
        `${API_URL}/v1/quizzes/lessons/${lessonId}`
      );
      const quizzes = response.data;
      const selectedQuiz = quizzes.find((q) => q.id === Number(quizId));
      if (selectedQuiz) setQuiz(selectedQuiz);
      else setQuiz(null);
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lessonId && quizId) {
      fetchDataQuiz(lessonId, quizId);
    }
  }, [lessonId, quizId]);

  if (loading || !quiz) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
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
        <View style={{ width: 32 }} />
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
        {quiz.questions.map((question, qIndex) => (
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
                question.options.map((option, oIndex) => (
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
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

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
});
