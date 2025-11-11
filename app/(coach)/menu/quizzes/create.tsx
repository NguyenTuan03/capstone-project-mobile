import React, { useState } from "react";
import { post } from "@/services/http/httpService";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { QuizFormDTO, QuizOptionType, QuizQuestionType } from "@/types/quiz";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function CreateQuizScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  console.log("du lieu payload", lessonId);

  const [quiz, setQuiz] = useState<QuizFormDTO>({
    title: "",
    description: "",
    totalQuestions: 1,
    questions: [
      {
        title: "",
        options: [
          { id: 1, content: "", isCorrect: false },
          { id: 2, content: "", isCorrect: false },
        ],
      },
    ],
    lessonId: Number(lessonId),
  });

  const updateQuizField = (field: keyof QuizFormDTO, value: string) => {
    setQuiz({ ...quiz, [field]: value });
  };

  const updateQuestionContent = (qIndex: number, value: string) => {
    const questions = [...quiz.questions];
    questions[qIndex].title = value;
    setQuiz({ ...quiz, questions });
  };

  const updateOption = (
    qIndex: number,
    oIndex: number,
    value?: string,
    isCorrect?: boolean
  ) => {
    const questions = [...quiz.questions];
    if (value !== undefined && questions[qIndex].options)
      questions[qIndex].options[oIndex].content = value;
    if (isCorrect !== undefined) {
      if (isCorrect && questions[qIndex].options) {
        questions[qIndex].options = questions[qIndex].options.map(
          (opt, idx) => ({
            ...opt,
            isCorrect: idx === oIndex,
          })
        );
      } else if (questions[qIndex].options) {
        questions[qIndex].options[oIndex].isCorrect = false;
      }
    }
    setQuiz({ ...quiz, questions });
  };

  const addQuestion = () => {
    const newQuestion: Partial<QuizQuestionType> = {
      title: "",
      options: [
        { id: 1, content: "", isCorrect: false },
        { id: 2, content: "", isCorrect: false },
      ],
    };
    setQuiz({
      ...quiz,
      questions: [...quiz.questions, newQuestion],
      totalQuestions: quiz.totalQuestions + 1,
    });
  };

  const deleteQuestion = (qIndex: number) => {
    const questions = [...quiz.questions];
    questions.splice(qIndex, 1);
    setQuiz({
      ...quiz,
      questions,
      totalQuestions: questions.length,
    });
  };

  const addOption = (qIndex: number) => {
    const questions = [...quiz.questions];
    const newOption: QuizOptionType = {
      id: Date.now(),
      content: "",
      isCorrect: false,
    };
    if (!questions[qIndex].options) {
      questions[qIndex].options = [];
    }
    questions[qIndex].options.push(newOption);
    setQuiz({ ...quiz, questions });
  };

  const saveQuiz = async () => {
    try {
      if (!quiz.title.trim()) {
        Alert.alert("Vui lòng nhập tên bài quiz.");
        return;
      }

      if (quiz.questions.length === 0) {
        Alert.alert("Vui lòng thêm ít nhất 1 câu hỏi.");
        return;
      }

      const formattedQuestions: QuizFormDTO["questions"] = [];

      for (let qIndex = 0; qIndex < quiz.questions.length; qIndex++) {
        const q = quiz.questions[qIndex];

        if (!q.title || q.title.trim() === "") {
          Alert.alert(`Câu hỏi ${qIndex + 1} chưa có nội dung.`);
          return;
        }

        const validOptions = q
          .options!.map((o) => ({
            content: o.content.trim(),
            isCorrect: o.isCorrect,
          }))
          .filter((o) => o.content !== "");

        if (validOptions.length < 2) {
          Alert.alert(`Câu hỏi ${qIndex + 1} cần ít nhất 2 đáp án hợp lệ.`);
          return;
        }

        if (!validOptions.some((o) => o.isCorrect)) {
          Alert.alert(`Câu hỏi ${qIndex + 1} chưa chọn đáp án đúng.`);
          return;
        }

        formattedQuestions.push({
          title: q.title.trim(),
          options: validOptions.map((opt, idx) => ({
            id: idx + 1,
            content: opt.content,
            isCorrect: opt.isCorrect,
          })),
        });
      }

      const payload: QuizFormDTO = {
        title: quiz.title.trim(),
        description: quiz.description?.trim() || null,
        totalQuestions: formattedQuestions.length,
        questions: formattedQuestions,
        lessonId: quiz.lessonId,
        sessionId: quiz.sessionId || null,
      };

      await post(`${API_URL}/v1/quizzes/lessons/${quiz.lessonId}`, payload);
      Alert.alert("Tạo bài quiz thành công");
      router.back();
    } catch (error: any) {
      console.error(
        "Lỗi, không thể tạo bài quiz",
        error.response?.data || error
      );
      Alert.alert("Lỗi không thể tạo bài quiz");
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#059669" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            flex: 1,
            textAlign: "center",
          }}
        >
          Tạo Quiz
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        <Text style={{ fontWeight: "700", marginBottom: 4 }}>
          Tên bài quizz
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            borderRadius: 8,
            marginBottom: 12,
          }}
          placeholder="Nhập tên bài quizz"
          value={quiz.title}
          onChangeText={(text) => updateQuizField("title", text)}
        />

        <Text style={{ fontWeight: "700", marginBottom: 4 }}>Mô tả</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            borderRadius: 8,
            height: 80,
            marginBottom: 12,
          }}
          placeholder="(không bắt buộc)"
          value={quiz.description || ""}
          onChangeText={(text) => updateQuizField("description", text)}
          multiline
        />

        {quiz.questions.map((q, qIndex) => (
          <View
            key={qIndex}
            style={{
              marginBottom: 8,
              borderBottomWidth: 2,
              borderBottomColor: "#059669",
              paddingVertical: 15,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "700", marginBottom: 4 }}>
                Câu hỏi {qIndex + 1}
              </Text>
              <TouchableOpacity
                onPress={() => deleteQuestion(qIndex)}
                style={{
                  backgroundColor: "#F87171",
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  borderRadius: 6,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Xóa</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 10,
                borderRadius: 8,
                marginBottom: 12,
              }}
              placeholder="Nhập câu hỏi"
              value={q.title}
              onChangeText={(text) => updateQuestionContent(qIndex, text)}
            />

            {q.options!.map((o, oIndex) => (
              <View
                key={oIndex}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#ccc",
                    padding: 10,
                    borderRadius: 8,
                    marginRight: 10,
                  }}
                  placeholder={`Đáp án ${oIndex + 1}`}
                  value={o.content}
                  onChangeText={(text) => updateOption(qIndex, oIndex, text)}
                />
                <Switch
                  value={o.isCorrect}
                  onValueChange={(val) =>
                    updateOption(qIndex, oIndex, undefined, val)
                  }
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={() => addOption(qIndex)}
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
        ))}

        <TouchableOpacity
          onPress={addQuestion}
          style={{
            padding: 10,
            borderRadius: 8,
            backgroundColor: "#E0E7FF",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <Text style={{ fontWeight: "600", color: "#4F46E5" }}>
            + Thêm câu hỏi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={saveQuiz}
          style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor: "#059669",
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Tạo Quiz</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
