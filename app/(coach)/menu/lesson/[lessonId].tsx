import { get } from "@/services/http/httpService";
import { QuizType } from "@/types/quiz";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";

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

  const videoSource =
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.play();
  });
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
              borderWidth: 1,
              borderColor: "#059669",
              backgroundColor: activeTab === tab ? "#CFF6EB" : "transparent",
            }}
          >
            <Text
              style={{
                fontWeight: "600",
                color: activeTab === tab ? "#059669" : "#6B7280",
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
            <View>
              <View
                style={{
                  alignItems: "flex-end",
                  marginTop: 12,
                  marginRight: 16,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    backgroundColor: "#059669",
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 20,
                  }}
                  onPress={() =>
                    router.push({
                      pathname: "/(coach)/menu/lesson/uploadVideo",
                      params: { lessonId },
                    })
                  }
                >
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "600",
                      fontSize: 14,
                      marginLeft: 6,
                    }}
                  >
                    Thêm video mới
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontWeight: "600",
                    color: "#6B7280",
                    marginBottom: 8,
                  }}
                >
                  Step 1
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 4,
                    elevation: 2,
                    padding: 4,
                  }}
                >
                  <VideoView
                    style={{ width: "100%", height: 200, borderRadius: 15 }}
                    player={player}
                    allowsFullscreen
                    allowsPictureInPicture
                  />
                </TouchableOpacity>
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
                    Tạo bài quiz đầu tiên
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 10,
                    paddingHorizontal: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: "#111827",
                    }}
                  >
                    Tất cả bài quiz
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#059669",
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 20,
                    }}
                    onPress={() =>
                      router.push({
                        pathname: "/(coach)/menu/quizzes/create",
                        params: { lessonId },
                      })
                    }
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={18}
                      color="#fff"
                    />
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "600",
                        fontSize: 14,
                        marginLeft: 6,
                      }}
                    >
                      Tạo quiz mới
                    </Text>
                  </TouchableOpacity>
                </View>

                {quizzes.map((quiz) => (
                  <View
                    key={quiz.id}
                    style={{
                      flexDirection: "row",
                      backgroundColor: "#EEF2FF",
                      borderRadius: 15,
                      padding: 16,
                      alignItems: "center",
                      marginVertical: 8,
                      shadowColor: "#000",
                      shadowOpacity: 0.08,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push({
                          pathname: "/(coach)/menu/quizzes/[quizId]",
                          params: {
                            quizId: quiz.id,
                            quizName: quiz.title,
                            lessonId,
                          },
                        })
                      }
                    >
                      <View
                        style={{
                          backgroundColor: "#6366F1",
                          width: 60,
                          height: 60,
                          borderRadius: 12,
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 14,
                        }}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={28}
                          color="#fff"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontWeight: "bold",
                            fontSize: 16,
                            color: "#111827",
                          }}
                        >
                          {quiz.title}
                        </Text>
                        <Text style={{ color: "#6B7280", marginTop: 4 }}>
                          {quiz.description || "Không có mô tả"}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert("Xác nhận", "Bạn có muốn xóa quiz này?", [
                          { text: "Hủy", style: "cancel" },
                          {
                            text: "Xóa",
                            style: "destructive",
                            onPress: () => console.log("Xóa quiz:", quiz.id),
                          },
                        ]);
                      }}
                      style={{
                        padding: 5,
                        borderRadius: 8,
                        backgroundColor: "#FECACA",
                        marginRight: 8,
                      }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#B91C1C"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      // onPress={() =>
                      //   router.push({
                      //     pathname: "/(coach)/menu/quizzes/edit",
                      //     params: { quizId: quiz.id },
                      //   })
                      // }
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor: "#E0E7FF",
                      }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={20}
                        color="#4F46E5"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
