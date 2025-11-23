import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AiVideoCompareResult } from "../../../types/ai";
import { VideoType } from "../../../types/video";
import AIAnalysisResult from "./AIAnalysisResult";
import CoachVideoCard from "./CoachVideoCard";
import SubmittedVideoCard from "./SubmittedVideoCard";
import VideoDetailsModal from "./VideoDetailsModal";
import VideoOverlayPlayer from "./VideoOverlayPlayer";
import VideoUploadSection from "./VideoUploadSection";

interface VideoListProps {
  video: VideoType | undefined;
  submittedVideo: {
    publicUrl: string;
    thumbnailUrl?: string | null;
    status?: string;
    createdAt?: string;
    id?: number;
  } | null;
  localVideo: {
    uri: string;
    name: string;
    duration?: number;
    tags?: string[];
    uploaded?: boolean;
  } | null;
  overlayVideoUrl: string | null;
  loadingAnalysis: boolean;
  aiAnalysisResult: AiVideoCompareResult | null;
  onViewOverlay: () => void;
  onPickVideo: () => void;
  onUploadVideo: (coachVideoId: number) => void;
  onVideoCapture?: (video: {
    uri: string;
    name: string;
    duration?: number;
  }) => void;
  isUploading: boolean;
  coachVideoId?: number;
  coachVideoDuration?: number;
}

const VideoList: React.FC<VideoListProps> = ({
  video,
  submittedVideo,
  localVideo,
  overlayVideoUrl,
  loadingAnalysis,
  aiAnalysisResult,
  onViewOverlay,
  onPickVideo,
  onUploadVideo,
  onVideoCapture,
  isUploading,
  coachVideoId,
  coachVideoDuration,
}) => {
  const [showCoachVideosModal, setShowCoachVideosModal] = useState(false);
  const [showOverlayPlayer, setShowOverlayPlayer] = useState(false);

  console.log(video?.duration, submittedVideo?.status);

  return (
    <>
      {submittedVideo && (
        <SubmittedVideoCard
          submittedVideo={submittedVideo}
          overlayVideoUrl={overlayVideoUrl}
          onViewOverlay={() => setShowOverlayPlayer(true)}
        />
      )}

      {/* Chỉ hiển thị phần quay video nếu chưa có kết quả AI */}
      {!aiAnalysisResult && (
        <VideoUploadSection
          localVideo={localVideo}
          isUploading={isUploading}
          hasCoachVideo={videos.length > 0}
          coachVideoId={coachVideoId}
          coachVideoDuration={coachVideoDuration}
          onPickVideo={onPickVideo}
          onUploadVideo={onUploadVideo}
          onVideoCapture={onVideoCapture}
        />
      )}

      {video === null && !localVideo && (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-off-outline" size={32} color="#9CA3AF" />
          <Text style={styles.emptyText}>
            Chưa có video nào cho bài học này.
          </Text>
        </View>
      )}

      {/* Coach Videos Section */}
      {video && (
        <View style={styles.coachVideosSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="videocam" size={20} color="#059669" />
              </View>
              <Text style={styles.sectionTitle}>Video từ Coach</Text>
            </View>
          </View>

          {/* Show preview (first video only) */}
          <View style={styles.previewContainer}>
            <CoachVideoCard video={video} />
          </View>
        </View>
      )}

      <AIAnalysisResult loading={loadingAnalysis} result={aiAnalysisResult} />

      {/* Coach Videos Modal */}
      <VideoDetailsModal
        visible={showCoachVideosModal}
        video={video}
        onClose={() => setShowCoachVideosModal(false)}
        title="Video từ Coach"
      />

      {/* Custom Overlay Player */}
      {video && video.publicUrl && submittedVideo && (
        <VideoOverlayPlayer
          visible={showOverlayPlayer}
          onClose={() => setShowOverlayPlayer(false)}
          coachVideoUrl={video.publicUrl}
          learnerVideoUrl={submittedVideo.publicUrl}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    fontStyle: "italic",
  },
  coachVideosSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  videoBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  videoBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  previewContainer: {
    gap: 12,
  },
  moreVideosCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "#ECFDF5",
    borderStyle: "dashed",
  },
  moreVideosText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  moreVideosSubtext: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
  },
});

export default VideoList;
