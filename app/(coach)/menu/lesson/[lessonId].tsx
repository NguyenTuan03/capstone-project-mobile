import { get } from "@/services/http/httpService";
import { QuizType } from "@/types/quiz";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function LessonDetailScreen() {
  const insets = useSafeAreaInsets();
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

  const fetchQuizByLesson = useCallback(async () => {
    try {
      setLoading(true);
      const response = await get<QuizType[]>(
        `${API_URL}/v1/quizzes/lessons/${lessonId}`
      );
      console.log("Response quizzes:", response.data);
      setQuizzes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách quizzes:", error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    if (activeTab === "QUIZZ" && lessonId) {
      fetchQuizByLesson();
    }
  }, [activeTab, lessonId, fetchQuizByLesson]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === "QUIZZ" && lessonId) {
        fetchQuizByLesson();
      }
    }, [activeTab, lessonId, fetchQuizByLesson])
  );

  const videoSource =
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.play();
  });

  if (loading && quizzes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {lessonName}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Description */}
      <View style={styles.descriptionSection}>
        <Text style={styles.descriptionText}>{lessonDescription}</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {["VIDEO LESSON", "QUIZZ"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab as "VIDEO LESSON" | "QUIZZ")}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive,
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab && styles.tabButtonTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.contentContainerPadding}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "VIDEO LESSON" ? (
          <View>
            {/* Add Video Button */}
            <TouchableOpacity
              style={styles.addVideoButton}
              onPress={() =>
                router.push({
                  pathname: "/(coach)/menu/lesson/uploadVideo",
                  params: { lessonId },
                })
              }
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.addVideoButtonText}>Thêm video mới</Text>
            </TouchableOpacity>

            {/* Video Player */}
            <View style={styles.videoSection}>
              <Text style={styles.stepLabel}>Step 1</Text>
              <View style={styles.videoContainer}>
                <VideoView
                  style={styles.videoPlayer}
                  player={player}
                  allowsFullscreen
                  allowsPictureInPicture
                />
              </View>
            </View>
          </View>
        ) : (
          <>
            {quizzes.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="help-circle" size={56} color="#059669" />
                </View>
                <Text style={styles.emptyTitle}>
                  Chưa có quiz cho bài học này
                </Text>
                <Text style={styles.emptyDescription}>
                  Bắt đầu tạo bài quiz đầu tiên để kiểm tra kiến thức học viên
                </Text>
                <TouchableOpacity
                  style={styles.emptyCreateButton}
                  onPress={() =>
                    router.push({
                      pathname: "/(coach)/menu/quizzes/create",
                      params: { lessonId },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.emptyCreateButtonText}>
                    Tạo bài quiz đầu tiên
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Quiz Header */}
                <View style={styles.quizHeader}>
                  <View>
                    <Text style={styles.quizHeaderTitle}>Danh sách bài quiz</Text>
                    <Text style={styles.quizCount}>{quizzes.length} quiz</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addQuizButton}
                    onPress={() =>
                      router.push({
                        pathname: "/(coach)/menu/quizzes/create",
                        params: { lessonId },
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                    <Text style={styles.addQuizButtonText}>Thêm quiz</Text>
                  </TouchableOpacity>
                </View>

                {/* Quiz List */}
                {quizzes.map((quiz) => (
                  <TouchableOpacity
                    key={quiz.id}
                    style={styles.quizCard}
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
                    activeOpacity={0.7}
                  >
                    <View style={styles.quizIconContainer}>
                      <Ionicons
                        name="document-text"
                        size={28}
                        color="#059669"
                      />
                    </View>

                    <View style={styles.quizContent}>
                      <Text style={styles.quizTitle}>{quiz.title}</Text>
                      <Text style={styles.quizDesc} numberOfLines={1}>
                        {quiz.description || "Không có mô tả"}
                      </Text>
                    </View>

                    <View style={styles.quizActions}>
                      <TouchableOpacity
                        style={styles.quizActionButton}
                        onPress={() => {
                          Alert.alert(
                            "Xác nhận xóa",
                            `Bạn có chắc chắn muốn xóa quiz "${quiz.title}" không?`,
                            [
                              { text: "Hủy", style: "cancel" },
                              {
                                text: "Xóa",
                                style: "destructive",
                                onPress: () => console.log("Xóa quiz:", quiz.id),
                              },
                            ]
                          );
                        }}
                        hitSlop={8}
                      >
                        <Ionicons name="trash" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}
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
  descriptionSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  descriptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  tabButtonActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textAlign: "center",
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
  },
  contentContainerPadding: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addVideoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addVideoButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  videoSection: {
    marginBottom: 16,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 8,
  },
  videoContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  videoPlayer: {
    width: "100%",
    height: 200,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 18,
  },
  emptyCreateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCreateButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  quizHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quizHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  quizCount: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  addQuizButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addQuizButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  quizCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  quizIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  quizContent: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  quizDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  quizActions: {
    flexDirection: "row",
    gap: 8,
  },
  quizActionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
});
