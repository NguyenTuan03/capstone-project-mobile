import { get, post } from "@/services/http/httpService";
import http from "@/services/http/interceptor";
import { QuizType } from "@/types/quiz";
import { VideoType } from "@/types/video";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { createVideoPlayer, VideoView } from "expo-video";
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

  // Video player is created dynamically in the modal when needed

  const fetchQuizByLesson = useCallback(async () => {
    try {
      setLoading(true);
      const response = await get<QuizType>(
        `${API_URL}/v1/quizzes/lessons/${lessonId}`
      );
      setQuiz(response.data);
    } catch (error) {
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
            {!video && (
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
            )}
            {loading ? (
              <View style={styles.videoCardSkeleton}>
                <View style={styles.videoThumbnailSkeleton} />
                <View style={{ gap: 8, paddingHorizontal: 4 }}>
                  <View style={[styles.skeletonBar, { width: "70%" }]} />
                  <View style={[styles.skeletonBar, { width: "40%" }]} />
                </View>
              </View>
            ) : video === undefined ? null : (
              <View>
                <View style={styles.videosHeader}>
                  <Text style={styles.videosHeaderTitle}>Video bài giảng</Text>
                </View>
                {video && (
                  <View style={styles.videoCard}>
                    <View style={styles.videoCardContent}>
                      <TouchableOpacity
                        style={styles.thumbnailContainer}
                        activeOpacity={0.8}
                        onPress={() => setSelectedVideo(video)}
                      >
                        {video.thumbnailUrl ? (
                          <Image
                            source={{ uri: video.thumbnailUrl }}
                            style={styles.thumbnailImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.thumbnailPlaceholder}>
                            <Ionicons
                              name="film"
                              size={32}
                              color="rgba(255, 255, 255, 0.5)"
                            />
                          </View>
                        )}
                        <View style={styles.thumbnailOverlay}>
                          <View style={styles.playButtonGlass}>
                            <Ionicons
                              name="play"
                              size={20}
                              color="#FFFFFF"
                              style={{ marginLeft: 2 }}
                            />
                          </View>
                        </View>
                        <View style={styles.durationOverlayBadge}>
                          <Text style={styles.durationOverlayText}>
                            {`${Math.floor(
                              (video.duration || 0) / 60
                            )}:${String((video.duration || 0) % 60).padStart(
                              2,
                              "0"
                            )}`}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <View style={styles.videoInfoContainer}>
                        <View>
                          <View style={styles.videoTitleRow}>
                            <Text
                              style={styles.videoTitleText}
                              numberOfLines={2}
                            >
                              {video.title}
                            </Text>
                          </View>

                          <View style={[styles.metaRow, { marginTop: 2 }]}>
                            <View style={styles.metaBadge}>
                              <Ionicons
                                name="time-outline"
                                size={12}
                                color="#6B7280"
                              />
                              <Text style={styles.metaBadgeText}>
                                Video bài giảng
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.videoActionsContainer}>
                          <TouchableOpacity
                            style={styles.actionButtonSecondary}
                            onPress={() => updateVideo(video.id)}
                          >
                            <Ionicons
                              name="create-outline"
                              size={16}
                              color="#4B5563"
                            />
                            <Text style={styles.actionButtonTextSecondary}>
                              Sửa
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButtonDanger}
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
                          >
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color="#DC2626"
                            />
                            <Text style={styles.actionButtonTextDanger}>
                              Xóa
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Description & Drill Info (Refined) */}
                    {!!(
                      video.description ||
                      video.drillName ||
                      video.drillDescription ||
                      video.drillPracticeSets
                    ) && (
                      <View style={styles.expandableContainer}>
                        <TouchableOpacity
                          style={styles.expandHeader}
                          onPress={() =>
                            setExpandedDrill(
                              expandedDrill === video.id ? null : video.id
                            )
                          }
                          activeOpacity={0.7}
                        >
                          <View style={styles.expandHeaderTitle}>
                            <Ionicons
                              name={
                                expandedDrill === video.id
                                  ? "information-circle"
                                  : "information-circle-outline"
                              }
                              size={18}
                              color="#059669"
                            />
                            <Text style={styles.expandHeaderText}>
                              Thông tin chi tiết
                            </Text>
                          </View>
                          <Ionicons
                            name={
                              expandedDrill === video.id
                                ? "chevron-up"
                                : "chevron-down"
                            }
                            size={18}
                            color="#9CA3AF"
                          />
                        </TouchableOpacity>

                        {expandedDrill === video.id && (
                          <View style={styles.expandedContent}>
                            {!!video.description && (
                              <View style={styles.videoDescriptionBox}>
                                <Text style={styles.videoDescriptionText}>
                                  {video.description}
                                </Text>
                              </View>
                            )}

                            {!!(video.drillName || video.drillPracticeSets) && (
                              <View style={styles.drillInfoCard}>
                                <View style={styles.drillCardHeader}>
                                  <View style={styles.drillTitleContainer}>
                                    <View style={styles.drillIconCircle}>
                                      <Ionicons
                                        name="fitness"
                                        size={16}
                                        color="#FFFFFF"
                                      />
                                    </View>
                                    <Text style={styles.drillTitleText}>
                                      {video.drillName || "Bài tập tập luyện"}
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.drillCardBody}>
                                  {!!video.drillPracticeSets && (
                                    <View style={styles.drillMetaItem}>
                                      <View style={styles.drillMetaIcon}>
                                        <Ionicons
                                          name="repeat"
                                          size={14}
                                          color="#059669"
                                        />
                                      </View>
                                      <View style={styles.drillMetaContent}>
                                        <Text style={styles.drillMetaLabel}>
                                          Số SET tập luyện
                                        </Text>
                                        <Text style={styles.drillMetaValue}>
                                          {video.drillPracticeSets} bộ
                                        </Text>
                                      </View>
                                    </View>
                                  )}
                                  {!!video.drillDescription && (
                                    <View style={styles.drillMetaItem}>
                                      <View style={styles.drillMetaIcon}>
                                        <Ionicons
                                          name="book-outline"
                                          size={14}
                                          color="#059669"
                                        />
                                      </View>
                                      <View style={styles.drillMetaContent}>
                                        <Text style={styles.drillMetaLabel}>
                                          Hướng dẫn
                                        </Text>
                                        <Text style={styles.drillMetaDesc}>
                                          {video.drillDescription}
                                        </Text>
                                      </View>
                                    </View>
                                  )}
                                </View>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
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
            ) : !quiz ? (
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
                    <Ionicons name="pencil" size={14} color="#FFFFFF" />
                    <Text style={styles.addQuizButtonText}>Sửa</Text>
                  </TouchableOpacity>
                </View>

                {/* Add Question Button */}
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#059669",
                    paddingVertical: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                    gap: 8,
                    shadowColor: "#059669",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  onPress={() => setShowCreateQuestion(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    Thêm câu hỏi mới
                  </Text>
                </TouchableOpacity>

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
                            <Ionicons name="pencil" size={14} color="#FFFFFF" />
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
                            <Ionicons name="trash" size={14} color="#FFFFFF" />
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

      {/* Video Player Modal - Premium Dark Theme */}
      <Modal
        visible={selectedVideo !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedVideo(null)}
      >
        <View style={styles.videoModalContainer}>
          {/* Backdrop Blur/Overlay */}
          <View style={styles.videoModalBackdrop} />

          <View style={styles.videoModalContent}>
            {/* Elegant Header */}
            <View style={styles.videoModalHeader}>
              <TouchableOpacity
                onPress={() => setSelectedVideo(null)}
                style={styles.videoModalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.videoModalTitleContainer}>
                <Text style={styles.videoModalTitle} numberOfLines={1}>
                  {selectedVideo?.title || "Video bài giảng"}
                </Text>
                <Text style={styles.videoModalSubtitle}>{lessonName}</Text>
              </View>
            </View>

            {/* Video Player Area */}
            <View style={styles.videoModalPlayerArea}>
              {selectedVideo?.publicUrl ? (
                <View style={styles.videoPlayerWrapper}>
                  <VideoView
                    player={createVideoPlayer({
                      uri: selectedVideo.publicUrl,
                    })}
                    style={styles.premiumVideoView}
                    nativeControls
                    contentFit="contain"
                  />
                </View>
              ) : (
                <View style={styles.videoLoadingCenter}>
                  <ActivityIndicator size="large" color="#059669" />
                  <Text style={styles.videoLoadingText}>
                    Đang chuẩn bị video...
                  </Text>
                </View>
              )}
            </View>
          </View>
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
    paddingVertical: 12,
    paddingTop: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 11,
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
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
    lineHeight: 20,
  },
  tabContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabWrapper: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  tabButtonActive: {
    backgroundColor: "#059669",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
    fontSize: 12,
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
    paddingVertical: 12,
  },
  addVideoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 10,
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
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  videoSection: {
    marginBottom: 16,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 6,
  },
  videoContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 18,
  },
  emptyCreateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCreateButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  quizHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  quizHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  quizCount: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },
  addQuizButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  addQuizButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  quizCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  quizIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  quizContent: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  quizDesc: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
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
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  quizActionButtonDelete: {
    backgroundColor: "#DC2626",
  },
  quizActionButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  videosHeader: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  videosHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  // --- PREMIUM VIDEO SECTION STYLES ---
  videoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  videoCardContent: {
    flexDirection: "row",
    gap: 16,
  },
  thumbnailContainer: {
    width: 130,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#111827",
    overflow: "hidden",
    position: "relative",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    opacity: 0.9,
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#374151",
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  playButtonGlass: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(4px)", // Fallback for some systems
  },
  durationOverlayBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationOverlayText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  videoInfoContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  videoTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  videoTitleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    lineHeight: 20,
  },
  statusBadgeRefined: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTextRefined: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaBadgeText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  videoActionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonTextSecondary: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  actionButtonDanger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(220, 38, 38, 0.05)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonTextDanger: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
  },

  // --- EXPANDABLE DRILL INFO ---
  expandableContainer: {
    marginTop: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  expandHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  expandHeaderTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  expandHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  expandedContent: {
    padding: 12,
    paddingTop: 0,
    gap: 12,
  },
  videoDescriptionBox: {
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
  },
  videoDescriptionText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
  drillInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ECFDF5",
    overflow: "hidden",
  },
  drillCardHeader: {
    backgroundColor: "#10B981",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  drillTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  drillIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  drillTitleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  drillCardBody: {
    padding: 10,
    gap: 10,
  },
  drillMetaItem: {
    flexDirection: "row",
    gap: 10,
  },
  drillMetaIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  drillMetaContent: {
    flex: 1,
  },
  drillMetaLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  drillMetaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  drillMetaDesc: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 16,
  },

  modalContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
  },
  // --- PREMIUM VIDEO PLAYER MODAL ---
  videoModalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  videoModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  videoModalContent: {
    flex: 1,
  },
  videoModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  videoModalCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoModalTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  videoModalTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  videoModalSubtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  videoModalPlayerArea: {
    flex: 1,
    justifyContent: "center",
  },
  videoPlayerWrapper: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#111827",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  premiumVideoView: {
    flex: 1,
  },
  videoLoadingCenter: {
    alignItems: "center",
    gap: 16,
  },
  videoLoadingText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  /* Skeleton Loading Styles */
  videoCardSkeleton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
    overflow: "hidden",
  },
  videoThumbnailSkeleton: {
    width: "100%",
    height: 120,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    marginBottom: 8,
    opacity: 0.6,
  },
  skeletonBar: {
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    opacity: 0.6,
  },
  quizHeaderSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  quizCardSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  questionCardSkeleton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },

  // Quiz Info Styles (from quizId.tsx)
  quizInfoSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  quizInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  quizInfoIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  quizInfoLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },
  quizInfoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
    marginTop: 2,
  },

  // Question Card Styles
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  questionHeader: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  questionNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#10B981",
    flexShrink: 0,
  },
  questionNumber: {
    fontSize: 13,
    fontWeight: "800",
    color: "#059669",
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    lineHeight: 18,
  },
  questionExplanation: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 15,
  },

  // Options Styles
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  optionCorrect: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  optionLetterCorrect: {
    backgroundColor: "#10B981",
  },
  optionLetterText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  optionText: {
    fontSize: 13,
    color: "#1A1A1A",
    fontWeight: "500",
    flex: 1,
  },
  emptyOptions: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  emptyOptionsText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },

  // Question Actions
  questionActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  questionActionButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#059669",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  questionActionButtonDelete: {
    backgroundColor: "#DC2626",
  },
  questionActionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
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
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    textAlign: "center",
  },
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
    color: "#111827",
    minHeight: 40,
  },
  optionInputCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 8,
    minHeight: 44,
  },
  optionLabelBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#10B981",
    flexShrink: 0,
  },
  optionLabelText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#059669",
  },
  optionInputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  optionTextInputRaw: {
    fontSize: 13,
    color: "#111827",
    minHeight: 20,
    padding: 0,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 12,
    borderRadius: 8,
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
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
