import VideoOverlayPlayer from "@/components/learner/lesson/VideoOverlayPlayer";
import { LearnerVideo } from "@/types/video";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SessionVideosScreen() {
  const router = useRouter();
  const { sessionData, learnerVideosData } = useLocalSearchParams<{
    sessionId: string;
    sessionData?: string;
    learnerVideosData?: string;
  }>();

  const [session, setSession] = useState<any>(null);
  const [learnerVideos, setLearnerVideos] = useState<LearnerVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<"coach" | number | null>(
    null
  );
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [selectedCoachVideo, setSelectedCoachVideo] = useState<string | null>(null);
  const [selectedLearnerVideo, setSelectedLearnerVideo] = useState<LearnerVideo | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

  useEffect(() => {
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        setSession(parsed);
      } catch (e) {
        console.error("Failed to parse session data:", e);
      }
    }
  }, [sessionData]);

  useEffect(() => {
    if (learnerVideosData) {
      try {
        const parsed = JSON.parse(learnerVideosData);
        setLearnerVideos(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error("Failed to parse learner videos data:", e);
      }
    }
  }, [learnerVideosData]);

  const coachVideo = session?.video;
  const hasCoachVideo = coachVideo?.publicUrl;
  const hasLearnerVideos = learnerVideos.length > 0;

  const getLatestAiResult = (video: LearnerVideo): any => {
    if (
      !video.aiVideoComparisonResults ||
      !Array.isArray(video.aiVideoComparisonResults) ||
      video.aiVideoComparisonResults.length === 0
    ) {
      return null;
    }
    return [...video.aiVideoComparisonResults].sort(
      (a, b) =>
        (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
        (a.createdAt ? new Date(a.createdAt).getTime() : 0)
    )[0];
  };

  const handleCompareVideos = (learnerVideo: LearnerVideo) => {
    setSelectedCoachVideo(coachVideo?.publicUrl || null);
    setSelectedLearnerVideo(learnerVideo);
    setAiAnalysisResult(getLatestAiResult(learnerVideo));
    setOverlayVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {session?.name || `Buổi ${session?.sessionNumber}`}
          </Text>
          <Text style={styles.headerSubtitle}>Video bài giảng</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Coach Video Section */}
        {hasCoachVideo && (
          <View style={styles.videoSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="videocam" size={20} color="#059669" />
              <Text style={styles.sectionTitle}>Video của Coach</Text>
            </View>
            <View style={styles.videoCard}>
              {selectedVideo === "coach" ? (
                <VideoPlayer
                  source={coachVideo.publicUrl}
                  title={coachVideo.title || "Video Coach"}
                  onClose={() => setSelectedVideo(null)}
                />
              ) : (
                <TouchableOpacity
                  style={styles.videoThumbnailContainer}
                  onPress={() => setSelectedVideo("coach")}
                  activeOpacity={0.8}
                >
                  <View style={styles.thumbnailImageWrapper}>
                    <Image
                      source={{
                        uri: coachVideo.thumbnailUrl || "https://via.placeholder.com/400x300?text=Video",
                      }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                    {coachVideo.duration && (
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>
                          {Math.floor(coachVideo.duration / 60)}
                          {":"}
                          {String(Math.round(coachVideo.duration % 60)).padStart(
                            2,
                            "0"
                          )}
                        </Text>
                      </View>
                    )}
                    <View style={styles.playIconOverlay}>
                      <Ionicons name="play-circle" size={48} color="#FFFFFF" />
                    </View>
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle} numberOfLines={2}>
                      {coachVideo.title || "Video bài giảng"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Learner Videos Section */}
        {hasLearnerVideos && (
          <View style={styles.videoSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="videocam-outline" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>
                Video của Học viên ({learnerVideos.length})
              </Text>
            </View>
            {learnerVideos.map((video, index) => (
              <View key={video.id} style={styles.videoCard}>
                {selectedVideo === video.id ? (
                  <VideoPlayer
                    source={video.publicUrl || ""}
                    title={`Video nộp bài ${index + 1}`}
                    onClose={() => setSelectedVideo(null)}
                  />
                ) : (
                  <View>
                    <TouchableOpacity
                      style={styles.videoThumbnailContainer}
                      onPress={() => setSelectedVideo(video.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.thumbnailImageWrapper}>
                        <Image
                          source={{
                            uri: video.thumbnailUrl || "https://via.placeholder.com/400x300?text=Video",
                          }}
                          style={styles.thumbnailImage}
                          resizeMode="cover"
                        />
                        {video.duration && (
                          <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>
                              {Math.floor(video.duration / 60)}
                              {":"}
                              {String(Math.round(video.duration % 60)).padStart(
                                2,
                                "0"
                              )}
                            </Text>
                          </View>
                        )}
                        <View style={styles.playIconOverlay}>
                          <Ionicons name="play-circle" size={48} color="#FFFFFF" />
                        </View>
                      </View>
                      <View style={styles.videoInfo}>
                        <Text style={styles.videoTitle} numberOfLines={2}>
                          Video nộp bài {index + 1}
                        </Text>
                        <Text style={styles.videoMeta}>
                          {new Date(video.createdAt).toLocaleDateString("vi-VN")}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {hasCoachVideo && (
                      <TouchableOpacity
                        style={styles.compareButton}
                        onPress={() => handleCompareVideos(video)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="layers" size={16} color="#FFFFFF" />
                        <Text style={styles.compareButtonText}>So sánh video</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!hasCoachVideo && !hasLearnerVideos && (
          <View style={styles.emptyState}>
            <Ionicons name="videocam-off" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>Chưa có video nào</Text>
          </View>
        )}
      </ScrollView>

      {/* Video Overlay Player */}
      {selectedCoachVideo && selectedLearnerVideo && (
        <VideoOverlayPlayer
          visible={overlayVisible}
          onClose={() => setOverlayVisible(false)}
          coachVideoUrl={selectedCoachVideo}
          learnerVideoUrl={selectedLearnerVideo.publicUrl || ""}
          aiAnalysisResult={aiAnalysisResult}
        />
      )}
    </View>
  );
}

interface VideoPlayerProps {
  source: string;
  title: string;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  source,
  title,
  onClose,
}) => {
  const player = useVideoPlayer(source, (player) => {
    player.loop = false;
    player.play();
  });

  return (
    <View style={styles.playerContainer}>
      <View style={styles.playerHeader}>
        <Text style={styles.playerTitle} numberOfLines={1}>
          {title}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <VideoView
        player={player}
        style={styles.videoPlayer}
        contentFit="contain"
        nativeControls
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 20,
  },
  videoSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  videoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  videoThumbnailContainer: {
    padding: 12,
    gap: 10,
  },
  thumbnailImageWrapper: {
    position: "relative",
    width: "100%",
    height: 180,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1F2937",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  playIconOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -24,
    marginLeft: -24,
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  videoInfo: {
    flex: 1,
    justifyContent: "center",
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  videoMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  videoDuration: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },
  playerContainer: {
    backgroundColor: "#000000",
  },
  playerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  playerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  videoPlayer: {
    width: "100%",
    height: 250,
    backgroundColor: "#000000",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  compareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: "#059669",
    borderRadius: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  compareButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
