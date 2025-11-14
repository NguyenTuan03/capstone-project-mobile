import { get } from "@/services/http/httpService";
import { QuizType } from "@/types/quiz";
import { VideoType } from "@/types/video";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

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
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [expandedDrill, setExpandedDrill] = useState<number | null>(null);
  const [generatedThumbnails, setGeneratedThumbnails] = useState<Record<number, string>>({});

  // Generate thumbnail from video on demand
  const generateThumbnail = useCallback(async (videoId: number, videoUrl: string) => {
    // Skip if already generated
    if (generatedThumbnails[videoId]) {
      return;
    }
    
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, {
        time: 1000, // 1 second into the video
      });
      setGeneratedThumbnails(prev => ({
        ...prev,
        [videoId]: uri
      }));
      console.log("✓ Thumbnail generated for video", videoId);
    } catch (error) {
      console.warn("⚠️ Failed to generate thumbnail for video", videoId, error);
      // Continue without thumbnail - it's optional
    }
  }, [generatedThumbnails]);

  // Create player instance for selected video
  const player = useVideoPlayer(selectedVideo?.publicUrl || null);
  // Extract the numeric player ID for VideoView component
  const playerId = (player && (((player as any).__expo_shared_object_id__ ?? (typeof player === 'number' ? player : null)))) || null;

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

  const fetchVideosByLesson = useCallback(async () => {
    try {
      const response = await get<VideoType[]>(
        `${API_URL}/v1/videos/lessons/${lessonId}`
      );
      const videoList = Array.isArray(response.data) ? response.data : [];
      setVideos(videoList);
      
      // Generate thumbnails for all videos that don't have one
      videoList.forEach(video => {
        if (video.publicUrl && !video.thumbnailUrl) {
          generateThumbnail(video.id, video.publicUrl);
        }
      });
    } catch (error) {
      console.error("Lỗi khi tải danh sách videos:", error);
      setVideos([]);
    }
  }, [lessonId, generateThumbnail]);

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

  if (loading && quizzes.length === 0) {
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
              {activeTab === tab && (
                <View style={styles.tabActiveIndicator} />
              )}
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab && styles.tabButtonTextActive,
                ]}
              >
                {tab === "VIDEO LESSON" ? (
                  <>
                    <Ionicons name="film" size={14} color={activeTab === tab ? "#FFFFFF" : "#6B7280"} /> Video
                  </>
                ) : (
                  <>
                    <Ionicons name="document-text" size={14} color={activeTab === tab ? "#FFFFFF" : "#6B7280"} /> Quiz
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
            {videos.length === 0 ? (
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
                  <Text style={styles.videosHeaderTitle}>
                    Video bài giảng ({videos.length})
                  </Text>
                </View>
                {videos.map((video, index) => (
                  <TouchableOpacity
                    key={video.id}
                    style={styles.videoCard}
                    activeOpacity={0.7}
                    onPress={() => setSelectedVideo(video)}
                  >
                    {/* Video Thumbnail */}
                    <View style={styles.videoThumbnail}>
                      {video.thumbnailUrl || generatedThumbnails[video.id] ? (
                        <Image
                          source={{ uri: video.thumbnailUrl || generatedThumbnails[video.id] }}
                          style={{ width: "100%", height: "100%" }}
                        />
                      ) : (
                        <View style={styles.videoThumbnailPlaceholder}>
                          <Ionicons
                            name="film"
                            size={40}
                            color="#FFFFFF"
                          />
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
                        <Text style={styles.videoStepLabel}>
                          Video {index + 1}
                        </Text>
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

                    {video.description && (
                      <View style={styles.videoDescriptionSection}>
                        <Text style={styles.videoDescription}>{video.description}</Text>
                      </View>
                    )}

                    {/* Quick Metadata Row */}
                    <View style={styles.quickMetadataRow}>
                      <View style={styles.quickMetadataItem}>
                        <Ionicons name="time" size={14} color="#059669" />
                        <Text style={styles.quickMetadataText}>
                          {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")}
                        </Text>
                      </View>
                      {video.drillPracticeSets && (
                        <View style={styles.quickMetadataItem}>
                          <Ionicons name="fitness" size={14} color="#059669" />
                          <Text style={styles.quickMetadataText}>{video.drillPracticeSets} bộ</Text>
                        </View>
                      )}
                    </View>

                    {/* Drill Information - Expandable Section */}
                    {(video.drillName || video.drillDescription) && (
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
                              style={{marginRight: 8}}
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
                                    name="ellipse"
                                    size={6}
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
                                    name="ellipse"
                                    size={6}
                                    color="#059669"
                                  />
                                </View>
                                <View style={styles.drillInfoItemText}>
                                  <Text style={styles.drillInfoLabel}>
                                    Mô tả chi tiết
                                  </Text>
                                  <Text
                                    style={styles.drillInfoDescValue}
                                  >
                                    {video.drillDescription}
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
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
                <TouchableWithoutFeedback onPress={() => setSelectedVideo(null)}>
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
                      <View style={[styles.video, { justifyContent: 'center', alignItems: 'center' }]}>
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
                    <Text style={styles.quizHeaderTitle}>
                      Danh sách bài quiz
                    </Text>
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
                                onPress: () =>
                                  console.log("Xóa quiz:", quiz.id),
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addVideoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  addVideoButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
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
    flexDirection: "row",
    alignItems: "center",
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
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  // Video Styles
  videosHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  videosHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  videoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  videoCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 10,
  },
  videoCardTitle: {
    flex: 1,
  },
  videoStepLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 18,
  },
  videoDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "400",
    lineHeight: 16,
  },
  videoDescriptionSection: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 90,
    alignItems: "center",
    fontWeight: "600",
  },
  videoStatusText: {
    fontSize: 12,
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
  // Video Thumbnail Styles
  videoThumbnail: {
    width: "100%",
    height: 160,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    marginBottom: 12,
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "95%",
    maxWidth: 900,
    height: 240,
    backgroundColor: "#000",
    borderRadius: 8,
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    right: 8,
    top: 8,
    zIndex: 10,
    padding: 6,
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
    gap: 12,
    marginBottom: 12,
  },
  quickMetadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
  },
  quickMetadataText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },

  /* Drill Information Section */
  drillInfoSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  drillInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  drillInfoTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  drillInfoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  drillInfoContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  drillInfoItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  drillInfoItemIcon: {
    width: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 3,
  },
  drillInfoItemText: {
    flex: 1,
    gap: 4,
  },
  drillInfoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  drillInfoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  drillInfoDescValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    lineHeight: 18,
  },
});
