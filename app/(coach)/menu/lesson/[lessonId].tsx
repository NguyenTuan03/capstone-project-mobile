import { get, post } from "@/services/http/httpService";
import http from "@/services/http/interceptor";
import { QuizType } from "@/types/quiz";
import { VideoType } from "@/types/video";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

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
  const [quiz, setQuiz] = useState<QuizType>();
  const [video, setVideo] = useState<VideoType>();
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [expandedDrill, setExpandedDrill] = useState<number | null>(null);

  // Quiz question creation/editing states
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

  // Create player instance for selected video
  const player = useVideoPlayer(selectedVideo?.publicUrl || null);
  // Extract the numeric player ID for VideoView component
  const playerId =
    (player &&
      ((player as any).__expo_shared_object_id__ ??
        (typeof player === "number" ? player : null))) ||
    null;

  const fetchQuizByLesson = useCallback(async () => {
    try {
      setLoading(true);
      const response = await get<QuizType>(
        `${API_URL}/v1/quizzes/lessons/${lessonId}`
      );
      console.log("Response quiz:", response.data);
      setQuiz(response.data);
    } catch (error) {
      console.error("Lỗi khi tải  quiz:", error);
      setQuiz(undefined);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  const fetchVideosByLesson = useCallback(async () => {
    try {
      setLoading(true);
      const response = await get<VideoType>(
        `${API_URL}/v1/videos/lessons/${lessonId}`
      );
      const video = response.data;
      setVideo(video);
    } catch (error) {
      console.error("Lỗi khi tải danh sách videos:", error);
      setVideo(undefined);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  const deleteVideo = useCallback(
    async (videoId: number, videoTitle: string) => {
      try {
        await http.delete(`/v1/videos/${videoId}`);

        // Remove video from list
        setVideo(undefined);

        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: `Xóa video "${videoTitle}" thành công`,
          position: "top",
          visibilityTime: 3000,
        });
      } catch (error) {
        console.error("Lỗi khi xóa video:", error);
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không thể xóa video. Vui lòng thử lại.",
          position: "top",
          visibilityTime: 3000,
        });
      }
    },
    []
  );

  const updateVideo = useCallback(
    (videoId: number) => {
      // Find video from current state instead of API call

      if (!video) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không tìm thấy video",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }

      router.push({
        pathname: "/(coach)/menu/lesson/uploadVideo",
        params: {
          lessonId,
          videoId: String(videoId),
          videoTitle: video.title,
          videoDescription: video.description || "",
          drillName: video.drillName || "",
          drillDescription: video.drillDescription || "",
          drillPracticeSets: video.drillPracticeSets
            ? String(video.drillPracticeSets)
            : "",
        },
      });
    },
    [video, lessonId]
  );

  const updateQuiz = useCallback(
    (quizId: number) => {
      // Find quiz from current state

      if (!quiz) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không tìm thấy quiz",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }

      router.push({
        pathname: "/(coach)/menu/quizzes/[quizId]",
        params: {
          quizId: String(quizId),
          quizName: quiz.title,
          lessonId,
          isEditing: "true",
        },
      });
    },
    [quiz, lessonId]
  );

  const deleteQuiz = useCallback(async (quizId: number, quizTitle: string) => {
    try {
      await http.delete(`/v1/quizzes/${quizId}`);

      // Remove quiz from list
      setQuiz(undefined);

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: `Xóa quiz "${quizTitle}" thành công`,
        position: "top",
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error("Lỗi khi xóa quiz:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể xóa quiz. Vui lòng thử lại.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  }, []);

  // Question creation/editing handlers
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
      if (!questionTitle.trim()) {
        alert("Vui lòng nhập câu hỏi");
        return;
      }

      const validOptions = options.filter((opt) => opt.content.trim());
      if (validOptions.length < 2) {
        alert("Vui lòng nhập ít nhất 2 đáp án");
        return;
      }

      const hasCorrectAnswer = validOptions.some((opt) => opt.isCorrect);
      if (!hasCorrectAnswer) {
        alert("Vui lòng chọn ít nhất 1 đáp án đúng");
        return;
      }

      const payload = {
        title: questionTitle.trim(),
        explanation: explanation.trim() || null,
        options: validOptions.map((opt) => ({
          content: opt.content.trim(),
          isCorrect: opt.isCorrect,
        })),
      };

      setSubmitting(true);

      await post(`${API_URL}/v1/quizzes/${quiz?.id}/questions`, payload);

      handleResetForm();
      setShowCreateQuestion(false);
      alert("Thêm câu hỏi thành công");

      // Refresh quiz data
      if (lessonId) {
        await fetchQuizByLesson();
      }
    } catch (error: any) {
      console.error("Error adding question:", error);
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

      await http.put(`/v1/quizzes/${quiz?.id}`, payload);

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
      console.error("Error updating quiz:", error);
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
        `/v1/quizzes/${quiz?.id}/questions/${editingQuestion.id}`,
        payload
      );

      setShowEditQuestion(false);
      setEditingQuestion(null);
      alert("Cập nhật câu hỏi thành công");

      // Refresh quiz data
      if (lessonId) {
        await fetchQuizByLesson();
      }
    } catch (error: any) {
      console.error("Error updating question:", error);
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
              if (lessonId) {
                await fetchQuizByLesson();
              }
            } catch (error: any) {
              console.error("Error deleting question:", error);
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
    if (activeTab === "QUIZZ" && lessonId) {
      fetchQuizByLesson();
    }
    if (activeTab === "VIDEO LESSON" && lessonId) {
      fetchVideosByLesson();
    }
  }, [activeTab, lessonId, fetchQuizByLesson, fetchVideosByLesson]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === "QUIZZ" && lessonId) {
        fetchQuizByLesson();
      }
      if (activeTab === "VIDEO LESSON" && lessonId) {
        fetchVideosByLesson();
      }
    }, [activeTab, lessonId, fetchQuizByLesson, fetchVideosByLesson])
  );

  if (loading && quiz === undefined && video === undefined) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      {/* Header with gradient background */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {lessonName}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {lessonDescription}
          </Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Tab Navigation - Modern Segmented Control */}
      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          {["VIDEO LESSON", "QUIZZ"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab as "VIDEO LESSON" | "QUIZZ")}
              style={[
                styles.tabButton,
                activeTab === tab && styles.tabButtonActive,
              ]}
              activeOpacity={0.7}
            >
              {activeTab === tab && <View style={styles.tabActiveIndicator} />}
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab && styles.tabButtonTextActive,
                ]}
              >
                {tab === "VIDEO LESSON" ? (
                  <>
                    <Ionicons
                      name="film"
                      size={14}
                      color={activeTab === tab ? "#FFFFFF" : "#6B7280"}
                    />{" "}
                    Video
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="document-text"
                      size={14}
                      color={activeTab === tab ? "#FFFFFF" : "#6B7280"}
                    />{" "}
                    Quiz
                  </>
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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

            {/* Videos List */}
            {loading ? (
              // Skeleton Loaders
              <View style={{ gap: 10 }}>
                {[1, 2, 3].map((index) => (
                  <View key={index} style={styles.videoCardSkeleton}>
                    {/* Thumbnail Skeleton */}
                    <View style={styles.videoThumbnailSkeleton} />

                    {/* Header Skeleton */}
                    <View style={{ gap: 8, marginBottom: 10 }}>
                      <View style={styles.skeletonBar} />
                      <View style={[styles.skeletonBar, { width: "70%" }]} />
                    </View>

                    {/* Buttons Skeleton */}
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <View
                        style={[
                          styles.skeletonBar,
                          { flex: 1, height: 32, borderRadius: 5 },
                        ]}
                      />
                      <View
                        style={[
                          styles.skeletonBar,
                          { flex: 1, height: 32, borderRadius: 5 },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : video === undefined ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="film-outline" size={56} color="#059669" />
                </View>
                <Text style={styles.emptyTitle}>
                  Chưa có video cho bài học này
                </Text>
                <Text style={styles.emptyDescription}>
                  Tải lên video bài giảng để giúp học viên học tập hiệu quả
                </Text>
              </View>
            ) : (
              <View>
                <View style={styles.videosHeader}>
                  <Text style={styles.videosHeaderTitle}>Video bài giảng</Text>
                </View>
                {video && (
                  <TouchableOpacity
                    key={video.id}
                    style={styles.videoCard}
                    activeOpacity={0.7}
                    onPress={() => setSelectedVideo(video)}
                  >
                    {/* Video Thumbnail */}
                    <View style={styles.videoThumbnail}>
                      {video.thumbnailUrl ? (
                        <Image
                          source={{
                            uri: video.thumbnailUrl,
                          }}
                          style={{ width: "100%", height: "100%" }}
                        />
                      ) : (
                        <View style={styles.videoThumbnailPlaceholder}>
                          <Ionicons name="film" size={40} color="#FFFFFF" />
                        </View>
                      )}
                      <View style={styles.videoPlayButtonOverlay}>
                        <Ionicons
                          name="play-circle"
                          size={48}
                          color="#FFFFFF"
                        />
                      </View>
                    </View>

                    <View style={styles.videoCardHeader}>
                      <View style={styles.videoCardTitle}>
                        <Text style={styles.videoStepLabel}>Video</Text>
                        <Text style={styles.videoTitle} numberOfLines={2}>
                          {video.title}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.videoStatusBadge,
                          {
                            backgroundColor:
                              video.status === "READY"
                                ? "#D1FAE5"
                                : video.status === "ANALYZING"
                                ? "#FEF3C7"
                                : "#FEE2E2",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.videoStatusText,
                            {
                              color:
                                video.status === "READY"
                                  ? "#059669"
                                  : video.status === "ANALYZING"
                                  ? "#D97706"
                                  : "#DC2626",
                            },
                          ]}
                        >
                          {video.status === "READY"
                            ? "Sẵn sàng"
                            : video.status === "ANALYZING"
                            ? "Đang phân tích"
                            : "Lỗi"}
                        </Text>
                      </View>
                    </View>

                    {/* Video Actions */}
                    <View style={styles.videoActionsRow}>
                      <TouchableOpacity
                        style={styles.videoActionButton}
                        onPress={() => updateVideo(video.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil" size={14} color="#FFFFFF" />
                        <Text style={styles.videoActionButtonText}>
                          Chỉnh sửa
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.videoActionButton,
                          styles.videoActionButtonDelete,
                        ]}
                        onPress={() => {
                          Alert.alert(
                            "Xác nhận xóa",
                            `Bạn có chắc chắn muốn xóa video "${video.title}" không?`,
                            [
                              { text: "Hủy", style: "cancel" },
                              {
                                text: "Xóa",
                                style: "destructive",
                                onPress: () =>
                                  deleteVideo(video.id, video.title),
                              },
                            ]
                          );
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash" size={14} color="#FFFFFF" />
                        <Text style={styles.videoActionButtonText}>Xóa</Text>
                      </TouchableOpacity>
                    </View>

                    {video.description && (
                      <View style={styles.videoDescriptionSection}>
                        <Text style={styles.videoDescription}>
                          {video.description}
                        </Text>
                      </View>
                    )}

                    {/* Quick Metadata Row */}
                    <View style={styles.quickMetadataRow}>
                      <View style={styles.quickMetadataItem}>
                        <Ionicons name="time" size={14} color="#059669" />
                        <Text style={styles.quickMetadataText}>
                          {Math.floor(video.duration / 60)}:
                          {String(video.duration % 60).padStart(2, "0")}
                        </Text>
                      </View>
                      {video.drillPracticeSets && (
                        <View style={styles.quickMetadataItem}>
                          <Ionicons name="fitness" size={14} color="#059669" />
                          <Text style={styles.quickMetadataText}>
                            {video.drillPracticeSets} bộ
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Drill Information - Expandable Section */}
                    {(video.drillName ||
                      video.drillDescription ||
                      video.drillPracticeSets) && (
                      <View style={styles.drillInfoSection}>
                        <TouchableOpacity
                          style={styles.drillInfoHeader}
                          onPress={() =>
                            setExpandedDrill(
                              expandedDrill === video.id ? null : video.id
                            )
                          }
                          activeOpacity={0.7}
                        >
                          <View style={styles.drillInfoTitleContainer}>
                            <Ionicons
                              name="barbell"
                              size={16}
                              color="#FFFFFF"
                              style={{ marginRight: 8 }}
                            />
                            <Text style={styles.drillInfoTitle}>
                              Thông tin bài tập
                            </Text>
                          </View>
                          <Ionicons
                            name={
                              expandedDrill === video.id
                                ? "chevron-up"
                                : "chevron-down"
                            }
                            size={20}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>

                        {expandedDrill === video.id && (
                          <View style={styles.drillInfoContent}>
                            {video.drillName && (
                              <View style={styles.drillInfoItem}>
                                <View style={styles.drillInfoItemIcon}>
                                  <Ionicons
                                    name="bookmark"
                                    size={14}
                                    color="#059669"
                                  />
                                </View>
                                <View style={styles.drillInfoItemText}>
                                  <Text style={styles.drillInfoLabel}>
                                    Tên bài tập
                                  </Text>
                                  <Text style={styles.drillInfoValue}>
                                    {video.drillName}
                                  </Text>
                                </View>
                              </View>
                            )}

                            {video.drillDescription && (
                              <View style={styles.drillInfoItem}>
                                <View style={styles.drillInfoItemIcon}>
                                  <Ionicons
                                    name="document-text"
                                    size={14}
                                    color="#059669"
                                  />
                                </View>
                                <View style={styles.drillInfoItemText}>
                                  <Text style={styles.drillInfoLabel}>
                                    Mô tả chi tiết
                                  </Text>
                                  <Text style={styles.drillInfoDescValue}>
                                    {video.drillDescription}
                                  </Text>
                                </View>
                              </View>
                            )}

                            {video.drillPracticeSets && (
                              <View style={styles.drillInfoItem}>
                                <View style={styles.drillInfoItemIcon}>
                                  <Ionicons
                                    name="repeat"
                                    size={14}
                                    color="#059669"
                                  />
                                </View>
                                <View style={styles.drillInfoItemText}>
                                  <Text style={styles.drillInfoLabel}>
                                    Số bộ tập luyện
                                  </Text>
                                  <Text style={styles.drillInfoValue}>
                                    {video.drillPracticeSets} bộ
                                  </Text>
                                </View>
                              </View>
                            )}

                            {video.duration && (
                              <View style={styles.drillInfoItem}>
                                <View style={styles.drillInfoItemIcon}>
                                  <Ionicons
                                    name="time"
                                    size={14}
                                    color="#059669"
                                  />
                                </View>
                                <View style={styles.drillInfoItemText}>
                                  <Text style={styles.drillInfoLabel}>
                                    Thời lượng video
                                  </Text>
                                  <Text style={styles.drillInfoValue}>
                                    {Math.floor(video.duration / 60)} phút{" "}
                                    {video.duration % 60} giây
                                  </Text>
                                </View>
                              </View>
                            )}

                            {video.status && (
                              <View style={styles.drillInfoItem}>
                                <View style={styles.drillInfoItemIcon}>
                                  <Ionicons
                                    name={
                                      video.status === "READY"
                                        ? "checkmark-circle"
                                        : video.status === "ANALYZING"
                                        ? "hourglass"
                                        : "alert-circle"
                                    }
                                    size={14}
                                    color={
                                      video.status === "READY"
                                        ? "#059669"
                                        : video.status === "ANALYZING"
                                        ? "#D97706"
                                        : "#DC2626"
                                    }
                                  />
                                </View>
                                <View style={styles.drillInfoItemText}>
                                  <Text style={styles.drillInfoLabel}>
                                    Trạng thái
                                  </Text>
                                  <Text style={styles.drillInfoValue}>
                                    {video.status === "READY"
                                      ? "Sẵn sàng"
                                      : video.status === "ANALYZING"
                                      ? "Đang phân tích"
                                      : "Lỗi"}
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Video Player Modal */}
            {selectedVideo && selectedVideo.publicUrl && (
              <Modal
                visible={true}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setSelectedVideo(null)}
              >
                <TouchableWithoutFeedback
                  onPress={() => setSelectedVideo(null)}
                >
                  <View style={styles.modalBackdrop} />
                </TouchableWithoutFeedback>

                <View style={styles.modalWrapper} pointerEvents="box-none">
                  <View style={styles.modalContent}>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setSelectedVideo(null)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={20} color="#FFF" />
                    </TouchableOpacity>

                    {playerId ? (
                      <VideoView
                        player={playerId as any}
                        style={styles.video}
                        allowsPictureInPicture
                      />
                    ) : (
                      <View
                        style={[
                          styles.video,
                          { justifyContent: "center", alignItems: "center" },
                        ]}
                      >
                        <ActivityIndicator size="large" color="#059669" />
                      </View>
                    )}
                  </View>
                </View>
              </Modal>
            )}
          </View>
        ) : (
          <>
            {loading && quiz === undefined ? (
              // Skeleton loading for quiz
              <View>
                {/* Quiz Header Skeleton */}
                <View style={styles.quizHeaderSkeleton}>
                  <View style={{ flex: 1 }}>
                    <View
                      style={[
                        styles.skeletonBar,
                        { width: "60%", height: 18, marginBottom: 6 },
                      ]}
                    />
                    <View
                      style={[styles.skeletonBar, { width: "30%", height: 14 }]}
                    />
                  </View>
                  <View
                    style={[
                      styles.skeletonBar,
                      { width: 100, height: 36, borderRadius: 8 },
                    ]}
                  />
                </View>

                {/* Quiz Info Skeleton */}
                <View style={styles.quizInfoSection}>
                  <View style={styles.quizCardSkeleton}>
                    <View
                      style={[
                        styles.skeletonBar,
                        { width: 24, height: 24, borderRadius: 12 },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <View
                        style={[
                          styles.skeletonBar,
                          { width: "40%", height: 12, marginBottom: 6 },
                        ]}
                      />
                      <View
                        style={[
                          styles.skeletonBar,
                          { width: "25%", height: 16 },
                        ]}
                      />
                    </View>
                  </View>
                </View>

                {/* Question Card Skeletons */}
                {[1, 2, 3].map((index) => (
                  <View key={index} style={styles.questionCardSkeleton}>
                    {/* Question Header Skeleton */}
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      <View
                        style={[
                          styles.skeletonBar,
                          { width: 36, height: 36, borderRadius: 18 },
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <View
                          style={[
                            styles.skeletonBar,
                            { width: "90%", height: 16, marginBottom: 6 },
                          ]}
                        />
                        <View
                          style={[
                            styles.skeletonBar,
                            { width: "70%", height: 14 },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Options Skeleton */}
                    <View style={{ gap: 10 }}>
                      {[1, 2, 3, 4].map((optIndex) => (
                        <View
                          key={optIndex}
                          style={[
                            styles.skeletonBar,
                            { width: "100%", height: 40, borderRadius: 10 },
                          ]}
                        />
                      ))}
                    </View>

                    {/* Action Buttons Skeleton */}
                    <View
                      style={{ flexDirection: "row", gap: 8, marginTop: 12 }}
                    >
                      <View
                        style={[
                          styles.skeletonBar,
                          { flex: 1, height: 36, borderRadius: 8 },
                        ]}
                      />
                      <View
                        style={[
                          styles.skeletonBar,
                          { flex: 1, height: 36, borderRadius: 8 },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : quiz === undefined ? (
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
                    <Text style={styles.quizHeaderTitle}>{quiz.title}</Text>
                    <Text style={styles.quizCount}>
                      {quiz.questions?.length || 0} câu hỏi
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addQuizButton}
                    onPress={handleOpenEditQuiz}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil" size={18} color="#FFFFFF" />
                    <Text style={styles.addQuizButtonText}>Sửa quiz</Text>
                  </TouchableOpacity>
                </View>

                {/* Quiz Info */}
                <View style={styles.quizInfoSection}>
                  <View style={styles.quizInfoCard}>
                    <View style={styles.quizInfoIcon}>
                      <Ionicons name="help-circle" size={24} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quizInfoLabel}>Tổng câu hỏi</Text>
                      <Text style={styles.quizInfoValue}>
                        {quiz.questions?.length || 0} câu
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Questions List */}
                {quiz.questions && quiz.questions.length > 0 ? (
                  quiz.questions
                    .sort((a, b) => {
                      const dateA = a.createdAt
                        ? new Date(a.createdAt).getTime()
                        : 0;
                      const dateB = b.createdAt
                        ? new Date(b.createdAt).getTime()
                        : 0;
                      return dateA - dateB;
                    })
                    .map((question, qIndex) => (
                      <View key={question.id} style={styles.questionCard}>
                        {/* Question Number and Title */}
                        <View style={styles.questionHeader}>
                          <View style={styles.questionNumberBadge}>
                            <Text style={styles.questionNumber}>
                              {qIndex + 1}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={styles.questionTitle}
                              numberOfLines={3}
                            >
                              {question.title}
                            </Text>
                            {question.explanation && (
                              <Text
                                style={styles.questionExplanation}
                                numberOfLines={2}
                              >
                                {question.explanation}
                              </Text>
                            )}
                          </View>
                        </View>

                        {/* Options */}
                        <View style={styles.optionsContainer}>
                          {question.options.length === 0 ? (
                            <View style={styles.emptyOptions}>
                              <Ionicons
                                name="alert-circle"
                                size={20}
                                color="#9CA3AF"
                              />
                              <Text style={styles.emptyOptionsText}>
                                Không có đáp án
                              </Text>
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
                                      option.isCorrect &&
                                        styles.optionLetterCorrect,
                                    ]}
                                  >
                                    <Text style={styles.optionLetterText}>
                                      {String.fromCharCode(
                                        97 + oIndex
                                      ).toUpperCase()}
                                    </Text>
                                  </View>
                                  <Text style={styles.optionText}>
                                    {option.content}
                                  </Text>
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
                            <Text style={styles.questionActionButtonText}>
                              Sửa
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.questionActionButton,
                              styles.questionActionButtonDelete,
                            ]}
                            onPress={() => handleDeleteQuestion(question.id)}
                          >
                            <Ionicons name="trash" size={16} color="#FFFFFF" />
                            <Text style={styles.questionActionButtonText}>
                              Xóa
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                ) : (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                      <Ionicons
                        name="help-circle-outline"
                        size={56}
                        color="#059669"
                      />
                    </View>
                    <Text style={styles.emptyTitle}>Chưa có câu hỏi nào</Text>
                    <Text style={styles.emptyDescription}>
                      Thêm câu hỏi đầu tiên cho quiz này
                    </Text>
                  </View>
                )}

                {/* Create Question FAB */}
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
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Edit Quiz Modal */}
      <Modal
        visible={showEditQuiz}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditQuiz(false)}
      >
        <View style={styles.modalContainer}>
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
                    <TextInput
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
                      onValueChange={() => handleToggleEditCorrect(option.id)}
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

      {/* Create Question Modal */}
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
                    <TextInput
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
                      onValueChange={() => handleToggleCorrect(option.id)}
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

// TextInput wrapper component
const TextInput = ({ ...props }: any) => <RNTextInput {...props} />;

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
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabWrapper: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  tabButtonActive: {
    backgroundColor: "#059669",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabActiveIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  contentContainer: {
    flex: 1,
  },
  contentContainerPadding: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addVideoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addVideoButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
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
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
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
    fontWeight: "500",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  quizIconContainer: {
    width: 48,
    height: 48,
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
    fontWeight: "500",
  },
  quizActions: {
    flexDirection: "row",
    gap: 8,
  },
  quizActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  quizActionButtonDelete: {
    backgroundColor: "#DC2626",
  },
  quizActionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  // Video Styles
  videosHeader: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  videosHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  videoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
  },
  videoCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  videoCardTitle: {
    flex: 1,
  },
  videoStepLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 17,
  },
  videoDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
    fontWeight: "400",
    lineHeight: 15,
  },
  videoDescriptionSection: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#059669",
  },
  videoMetadataSection: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  metadataColumn: {
    flex: 1,
    gap: 12,
  },
  metadataItem: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  metadataLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginTop: 2,
  },
  videoDrillLabel: {
    fontWeight: "700",
    color: "#059669",
  },
  videoStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    minWidth: 75,
    alignItems: "center",
    fontWeight: "600",
  },
  videoStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  videoCardInfo: {
    gap: 8,
  },
  videoInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  videoInfoText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  /* Video Thumbnail Styles */
  videoThumbnail: {
    width: "100%",
    height: 140,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  videoThumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#9CA3AF",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayButtonOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Video Player Modal Styles
  modalBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  closeButton: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  videoPlayer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000000",
  },

  /* Quick Metadata Row */
  quickMetadataRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  quickMetadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    flex: 1,
  },
  quickMetadataText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },

  /* Video Actions Row */
  videoActionsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  videoActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 5,
    gap: 4,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  videoActionButtonDelete: {
    backgroundColor: "#DC2626",
    shadowColor: "#DC2626",
  },
  videoActionButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  /* Drill Information Section */
  drillInfoSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  drillInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#059669",
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 6,
  },
  drillInfoTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  drillInfoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  drillInfoContent: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 10,
  },
  drillInfoItem: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  drillInfoItemIcon: {
    width: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
  },
  drillInfoItemText: {
    flex: 1,
    gap: 3,
  },
  drillInfoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  drillInfoValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  drillInfoDescValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    lineHeight: 16,
  },

  /* Skeleton Loading Styles */
  videoCardSkeleton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
  },
  videoThumbnailSkeleton: {
    width: "100%",
    height: 140,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 10,
    opacity: 0.6,
  },
  skeletonBar: {
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    opacity: 0.6,
  },
  quizHeaderSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  quizCardSkeleton: {
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
  questionCardSkeleton: {
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

  // Quiz Info Styles (from quizId.tsx)
  quizInfoSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  quizInfoCard: {
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
  quizInfoIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  quizInfoLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  quizInfoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
    marginTop: 2,
  },

  // Question Card Styles
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

  // Options Styles
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

  // Question Actions
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

  // Modal Styles (from quizId.tsx)
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
});
