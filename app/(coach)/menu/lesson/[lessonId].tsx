import { get } from "@/services/http/httpService";
import { QuizType } from "@/types/quiz";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function LessonDetailScreen() {
  const { lessonId, lessonName, lessonDescription } = useLocalSearchParams<{
    lessonId: string;
    lessonName: string;
    lessonDescription: string;
  }>();
  const [activeTab, setActiveTab] = useState<"VIDEO LESSON" | "QUIZZ">(
    "VIDEO LESSON"
  );
  const [quizzes, setQuizzes] = useState<QuizType[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchQuizByLesson = async () => {
    try {
      setLoading(true);
      const response = await get<QuizType[]>(
        `${API_URL}/v1/quizzes/lessons/${lessonId}`
      );
      setQuizzes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách quizzes:", error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (activeTab === "QUIZZ" && lessonId) {
      fetchQuizByLesson();
    }
  }, [activeTab, lessonId]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === "QUIZZ" && lessonId) {
        fetchQuizByLesson();
      }
    }, [activeTab, lessonId])
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 20 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            router.back();
          }}
        >
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
          {lessonName}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          textAlign: "center",
          marginBottom: 4,
          color: "#111827",
        }}
      >
        {lessonDescription}
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          marginBottom: 24,
        }}
      >
        {["VIDEO LESSON", "QUIZZ"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab as "VIDEO LESSON" | "QUIZZ")}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 20,
              backgroundColor: activeTab === tab ? "#059669" : "transparent",
            }}
          >
            <Text
              style={{
                fontWeight: "600",
                color: activeTab === tab ? "#ffff" : "#6B7280",
              }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === "VIDEO LESSON" ? (
          <>
            <View style={{ marginBottom: 16 }}>
              <TouchableOpacity style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: "600", color: "#6B7280" }}>
                  Thêm video mới{" "}
                </Text>
              </TouchableOpacity>
              <Text style={{ fontWeight: "600", color: "#6B7280" }}>
                Video bài học 1
              </Text>
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 16,
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    marginBottom: 4,
                    color: "#111827",
                  }}
                >
                  Make an observation
                </Text>
                <Text style={{ color: "#6B7280", fontSize: 14 }}>Video 1</Text>
              </View>
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "600", color: "#6B7280" }}>
                Step 2
              </Text>
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 16,
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    marginBottom: 4,
                    color: "#111827",
                  }}
                >
                  Ask a question
                </Text>
                <Text style={{ color: "#6B7280", fontSize: 14 }}>Video 2</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {loading ? (
              <ActivityIndicator size="large" color="#059669" />
            ) : quizzes.length === 0 ? (
              <View
                style={{
                  backgroundColor: "#F9FAFB",
                  borderRadius: 12,
                  padding: 20,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    backgroundColor: "#E0E7FF",
                    borderRadius: 50,
                    padding: 20,
                    marginBottom: 16,
                  }}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={32}
                    color="#4F46E5"
                  />
                </View>
                <Text
                  style={{ fontWeight: "700", fontSize: 18, marginBottom: 8 }}
                >
                  Chưa có quiz cho bài học này
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: "#059669",
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 12,
                  }}
                  onPress={() =>
                    router.push({
                      pathname: "/(coach)/menu/quizzes/create",
                      params: {
                        lessonId: lessonId,
                      },
                    })
                  }
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Tạo bài quiz mới
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              quizzes.map((quiz) => (
                <TouchableOpacity
                  key={quiz.id}
                  style={{
                    flexDirection: "row",
                    backgroundColor: "#EEEEF7",
                    borderRadius: 15,
                    padding: 15,
                    alignItems: "center",
                    marginVertical: 8,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                  activeOpacity={0.7}
                  // onPress={() =>
                  //   router.push(`/(quiz)/detail?quizId=${quiz.id}`)
                  // }
                >
                  <View
                    style={{
                      backgroundColor: "#7B78E5",
                      width: 70,
                      height: 70,
                      borderRadius: 15,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 15,
                    }}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={32}
                      color="#fff"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 16,
                        color: "#333",
                      }}
                    >
                      {quiz.title || "Quiz không tên"}
                    </Text>
                    <Text style={{ color: "#777", marginTop: 4 }}>
                      {quiz.description || "Không có mô tả"}
                    </Text>
                  </View>
                  <MaterialIcons name="navigate-next" size={24} color="black" />
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
