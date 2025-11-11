import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEvent } from "expo";
import * as ImagePicker from "expo-image-picker";
import type { PlayerError } from "expo-video";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useMemo, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLessonResources } from "../../../hooks/useLessonResources";
import http from "../../../services/http/interceptor";
import { QuizType } from "../../../types/quiz";
import { VideoType } from "../../../types/video";
import QuizAttemptCard from "../quiz/QuizAttempCard";

type LessonResourcesTab = "videos" | "quizzes";

export interface LessonResourcesTabsProps {
  lessonId: number;
  style?: StyleProp<ViewStyle>;
}

const LessonResourcesTabs: React.FC<LessonResourcesTabsProps> = React.memo(
  ({ lessonId, style }) => {
    const { quizzes, videos, loading, error } = useLessonResources(lessonId);
    const [activeTab, setActiveTab] = useState<LessonResourcesTab>("videos");
    const [localVideo, setLocalVideo] = useState<{
      uri: string;
      name: string;
      duration?: number;
      tags?: string[];
      uploaded?: boolean;
    } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [submittedVideo, setSubmittedVideo] = useState<{
      publicUrl: string;
      thumbnailUrl?: string | null;
      status?: string;
      createdAt?: string;
      id?: number;
    } | null>(null);

    const tabs: { key: LessonResourcesTab; label: string; count: number }[] =
      useMemo(
        () => [
          { key: "videos", label: "Video", count: videos.length },
          { key: "quizzes", label: "Quiz", count: quizzes.length },
        ],
        [quizzes.length, videos.length]
      );

    const renderTags = (tags: VideoType["tags"]) => {
      if (!tags) return null;

      const normalizedTags = Array.isArray(tags)
        ? tags
        : typeof tags === "string"
        ? parseTags(tags)
        : [];

      if (normalizedTags.length === 0) return null;

      return (
        <View style={styles.tagContainer}>
          {normalizedTags.map((tag: string) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      );
    };

    const handlePickVideo = async () => {
      try {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Quyền truy cập",
            "Cần quyền truy cập thư viện để chọn video."
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: false,
          quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setLocalVideo({
            uri: asset.uri,
            name: asset.fileName || "Video của bạn",
            duration: asset.duration
              ? Math.round(asset.duration / 60)
              : undefined,
            uploaded: false,
          });
        }
      } catch (err) {
        console.error("Lỗi khi chọn video:", err);
        Alert.alert("Lỗi", "Không thể chọn video. Vui lòng thử lại.");
      }
    };

    const loadSubmittedVideo = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (!userString) return;
        const userData = JSON.parse(userString);
        // normalize user id from possible shapes
        const userId =
          userData?.metadata?.user?.id ??
          userData?.user?.id ??
          userData?.id ??
          userData?.metadata?.user?.userId ??
          userData?.userId;
        if (!userId) return;
        const res = await http.get(`/v1/learner-videos/user/${userId}`);
        const list = Array.isArray(res?.data) ? res.data : [];
        if (list.length === 0) return;
        // pick the most recent by createdAt if available, else first item
        const picked =
          list
            .slice()
            .sort((a: any, b: any) =>
              new Date(b?.createdAt ?? 0).getTime() -
              new Date(a?.createdAt ?? 0).getTime()
            )[0] ?? list[0];
        if (picked?.publicUrl) {
          setSubmittedVideo({
            publicUrl: picked.publicUrl,
            thumbnailUrl: picked.thumbnailUrl,
            status: picked.status,
            createdAt: picked.createdAt,
            id: picked.id,
          });
        }
      } catch {
        // ignore silently; not critical to block UI
      }
    };

    const handleUploadVideo = async () => {
      if (!localVideo) return;

      setIsUploading(true);
      try {
        const fd = new FormData();

        fd.append("video", {
          uri: localVideo.uri.startsWith("file://")
            ? localVideo.uri
            : localVideo.uri,
          type: "video/mp4",
          name: localVideo.name?.endsWith(".mp4")
            ? localVideo.name
            : "video.mp4",
        } as any);

        fd.append("lessonId", String(lessonId));
        if (localVideo.duration != null)
          fd.append("duration", String(Math.round(localVideo.duration)));
        if (localVideo.tags?.length) {
          fd.append("tags", JSON.stringify(localVideo.tags));
        }

        await http.post("/v1/learner-videos", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        Alert.alert("Thành công", "Video đã được upload thành công!");
        // mark uploaded, then fetch submitted video and replace local preview
        setLocalVideo((prev) => (prev ? { ...prev, uploaded: true } : null));
        await loadSubmittedVideo();
        setLocalVideo(null);
      } catch (err: any) {
        console.error("Upload error:", err?.response?.data || err);
        Alert.alert(
          "Lỗi",
          err?.response?.data?.message ?? "Không thể upload video"
        );
      } finally {
        setIsUploading(false);
      }
    };

    const renderVideos = (items: VideoType[]) => {
      return (
        <>
          {submittedVideo && (
            <View style={styles.resourceCard}>
              <Text style={styles.resourceTitle}>Video bạn đã nộp</Text>
              {submittedVideo.status && (
                <Text style={styles.metaText}>
                  Trạng thái: {submittedVideo.status}
                </Text>
              )}
              {submittedVideo.createdAt && (
                <Text style={styles.metaText}>
                  Nộp lúc: {new Date(submittedVideo.createdAt).toLocaleString()}
                </Text>
              )}
              <LessonVideoPlayer source={submittedVideo.publicUrl} />
            </View>
          )}

          {!localVideo && !submittedVideo && (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePickVideo}
              activeOpacity={0.85}
            >
              <Text style={styles.uploadButtonText}>
                📤 Upload video của bạn tại đây
              </Text>
            </TouchableOpacity>
          )}

          {localVideo && (
            <View style={styles.resourceCard}>
              <Text style={styles.resourceTitle}>{localVideo.name}</Text>
              <Text style={styles.metaText}>Video từ thiết bị của bạn</Text>
              {localVideo.duration && (
                <Text style={styles.metaText}>
                  ⏱ {localVideo.duration} phút
                </Text>
              )}
              {localVideo.uploaded && (
                <View style={styles.uploadedBadge}>
                  <Text style={styles.uploadedBadgeText}>✓ Đã upload</Text>
                </View>
              )}
              <LessonVideoPlayer source={localVideo.uri} />
              {!localVideo.uploaded && (
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isUploading && styles.submitButtonDisabled,
                  ]}
                  onPress={handleUploadVideo}
                  disabled={isUploading}
                  activeOpacity={0.85}
                >
                  {isUploading ? (
                    <View style={styles.submitButtonContent}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>
                        Đang upload...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.submitButtonText}>📤 Nộp bài</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {items.length === 0 && !localVideo ? (
            <Text style={styles.emptyText}>
              Chưa có video nào cho bài học này.
            </Text>
          ) : null}

          {items.map((video) => (
            <View key={video.id} style={styles.resourceCard}>
              <Text style={styles.resourceTitle}>{video.title}</Text>
              {video.description && (
                <Text style={styles.resourceDescription}>
                  {video.description}
                </Text>
              )}
              {video.drillName && (
                <Text style={styles.metaText}>🎯 {video.drillName}</Text>
              )}
              {video.drillDescription && (
                <Text style={styles.metaText}>{video.drillDescription}</Text>
              )}
              <View style={styles.metaRow}>
                {video.duration != null && (
                  <Text style={styles.metaText}>⏱ {video.duration} phút</Text>
                )}
                {video.drillPracticeSets && (
                  <Text style={styles.metaText}>{video.drillPracticeSets}</Text>
                )}
              </View>
              {renderTags(video.tags)}
              {video.publicUrl ? (
                <LessonVideoPlayer source={video.publicUrl} />
              ) : (
                <Text style={styles.metaText}>
                  Video hiện chưa khả dụng trong ứng dụng.
                </Text>
              )}
            </View>
          ))}
        </>
      );
    };

    // Load submitted video on mount or when lesson changes
    React.useEffect(() => {
      loadSubmittedVideo();
    }, [lessonId]);

    const renderQuizzes = (items: QuizType[]) => {
      if (items.length === 0) {
        return (
          <Text style={styles.emptyText}>
            Chưa có quiz nào cho bài học này.
          </Text>
        );
      }

      return items.map((quiz) => (
        <View key={quiz.id} style={styles.resourceCard}>
          <QuizAttemptCard quiz={quiz} />
        </View>
      ));
    };
    if (!lessonId) {
      return null;
    }

    return (
      <View style={[styles.container, style]}>
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                >
                  {tab.label}
                  <Text style={styles.tabCounter}> ({tab.count})</Text>
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : activeTab === "videos" ? (
            renderVideos(videos)
          ) : (
            renderQuizzes(quizzes)
          )}
        </View>
      </View>
    );
  }
);

LessonResourcesTabs.displayName = "LessonResourcesTabs";

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabRow: {
    flexDirection: "row",
    padding: 8,
    gap: 8,
    backgroundColor: "#F3F4F6",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#10B981",
  },
  tabLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  tabCounter: {
    fontWeight: "400",
  },
  content: {
    padding: 12,
    gap: 12,
  },
  uploadButton: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#059669",
    borderStyle: "dashed",
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  submitButton: {
    backgroundColor: "#10B981",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  submitButtonDisabled: {
    backgroundColor: "#6B7280",
    opacity: 0.7,
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  uploadedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  uploadedBadgeText: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "600",
  },
  reuploadButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  reuploadButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  resourceCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  resourceDescription: {
    fontSize: 12,
    color: "#4B5563",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  linkButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  linkButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  outlineButtonText: {
    color: "#047857",
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  errorText: {
    fontSize: 13,
    color: "#DC2626",
    textAlign: "center",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#E0F2FE",
  },
  tagText: {
    fontSize: 11,
    color: "#0369A1",
    fontWeight: "500",
  },
  questionList: {
    marginTop: 12,
    gap: 12,
  },
  questionItem: {
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  questionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  questionExplanation: {
    fontSize: 12,
    color: "#4B5563",
  },
  optionList: {
    gap: 6,
  },
  optionItem: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  optionItemCorrect: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#34D399",
  },
  optionText: {
    fontSize: 12,
    color: "#374151",
  },
  optionTextCorrect: {
    color: "#047857",
    fontWeight: "600",
  },
  optionBadge: {
    marginTop: 4,
    fontSize: 11,
    color: "#047857",
    fontWeight: "600",
  },
  videoContainer: {
    marginTop: 12,
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#000000",
  },
  videoPlayer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: "hidden",
  },
  videoControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  controlButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#111827",
  },
  controlButtonLabel: {
    color: "#F9FAFB",
    fontWeight: "600",
  },
});

export default LessonResourcesTabs;

const LessonVideoPlayer: React.FC<{ source: string }> = ({ source }) => {
  const player = useVideoPlayer(
    { uri: source, contentType: "auto" }, // MP4 -> auto là đủ
    (p) => {
      p.loop = false;
    }
  );

  const statusEvent = useEvent(player, "statusChange", {
    status: player.status,
  });
  const status = statusEvent?.status ?? player.status;
  const playerError: PlayerError | undefined = statusEvent?.error ?? undefined;

  return (
    <View style={styles.videoContainer}>
      <VideoView
        style={styles.videoPlayer}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        crossOrigin="anonymous" // quan trọng cho web
      />
      {status === "error" && (
        <Text style={styles.errorText}>
          Không phát được video trong app: {String(playerError ?? "Unknown")}
        </Text>
      )}
      {/* controls giữ nguyên */}
    </View>
  );
};

const parseTags = (raw: string): string[] => {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    return raw
      .replace(/[{}"]/g, "")
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};
