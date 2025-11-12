import { get } from "@/services/http/httpService";
import { QuizType } from "@/types/quiz";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
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
      <ActivityIndicator size="large" color="#059669" style={{ flex: 1 }} />
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 20 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 16,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#059669" />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 18,
            fontWeight: "600",
            color: "#111827",
          }}
        >
          {quiz.title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ padding: 16 }}>
        {quiz.questions.map((question, qIndex) => (
          <View key={question.id} style={{ marginBottom: 24 }}>
            <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 8 }}>
              Câu hỏi {qIndex + 1}:
            </Text>
            <View
              style={{
                backgroundColor: "#F6ECFF",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <Text
                style={{ color: "#1A1A1A", fontSize: 17, fontWeight: "bold" }}
              >
                {question.title}
              </Text>
              {question.explanation && (
                <Text style={{ color: "#6B7280", marginTop: 4 }}>
                  {question.explanation}
                </Text>
              )}
            </View>
            {question.options.length === 0 ? (
              <View
                style={{
                  padding: 12,
                  backgroundColor: "#F6F6F6",
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: "#A5A5A5" }}>Không có đáp án</Text>
              </View>
            ) : (
              question.options.map((option, oIndex) => (
                <TouchableOpacity
                  key={option.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                    backgroundColor: option.isCorrect ? "#D1FAE5" : "#F3F4F6",
                    borderWidth: option.isCorrect ? 2 : 0,
                    borderColor: option.isCorrect ? "#10B981" : "transparent",
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: option.isCorrect ? "#10B981" : "#E5E7EB",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      {String.fromCharCode(97 + oIndex).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 16, color: "#1A1A1A" }}>
                    {option.content}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
