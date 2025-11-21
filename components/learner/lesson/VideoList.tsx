import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AiVideoCompareResult } from "../../../types/ai";
import { VideoType } from "../../../types/video";
import AIAnalysisResult from "./AIAnalysisResult";
import CoachVideoCard from "./CoachVideoCard";
import SubmittedVideoCard from "./SubmittedVideoCard";
import VideoDetailsModal from "./VideoDetailsModal";
import VideoUploadSection from "./VideoUploadSection";

interface VideoListProps {
  videos: VideoType[];
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
  generatingOverlay: boolean;
  loadingAnalysis: boolean;
  aiAnalysisResult: AiVideoCompareResult | null;
  onGenerateOverlay: () => void;
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
  videos,
  submittedVideo,
  localVideo,
  overlayVideoUrl,
  generatingOverlay,
  loadingAnalysis,
  aiAnalysisResult,
  onGenerateOverlay,
  onViewOverlay,
  onPickVideo,
  onUploadVideo,
  onVideoCapture,
  isUploading,
  coachVideoId,
  coachVideoDuration,
}) => {
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [showCoachVideosModal, setShowCoachVideosModal] = useState(false);

  return (
    <>
      {submittedVideo && (
        <SubmittedVideoCard
          submittedVideo={submittedVideo}
          overlayVideoUrl={overlayVideoUrl}
          generatingOverlay={generatingOverlay}
          onGenerateOverlay={onGenerateOverlay}
          onViewOverlay={onViewOverlay}
        />
      )}

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

      {videos.length === 0 && !localVideo && (
        <Text style={styles.emptyText}>Chưa có video nào cho bài học này.</Text>
      )}

      {/* Coach Videos Section */}
      {videos.length > 0 && (
        <View style={styles.coachVideosSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="videocam" size={20} color="#059669" />
              <Text style={styles.sectionTitle}>Video từ Coach</Text>
              <View style={styles.videoBadge}>
                <Text style={styles.videoBadgeText}>{videos.length}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowCoachVideosModal(true)}
              style={styles.viewAllButton}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>Xem tất cả</Text>
              <Ionicons name="arrow-forward" size={16} color="#059669" />
            </TouchableOpacity>
          </View>

          {/* Show preview (first video only) */}
          <View style={styles.previewContainer}>
            <CoachVideoCard video={videos[0]} />
            {videos.length > 1 && (
              <TouchableOpacity
                style={styles.moreVideosCard}
                onPress={() => setShowCoachVideosModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="albums-outline" size={32} color="#059669" />
                <Text style={styles.moreVideosText}>
                  +{videos.length - 1} video khác
                </Text>
                <Text style={styles.moreVideosSubtext}>
                  Nhấn để xem tất cả video
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <AIAnalysisResult loading={loadingAnalysis} result={aiAnalysisResult} />

      {/* Coach Videos Modal */}
      <VideoDetailsModal
        visible={showCoachVideosModal}
        videos={videos}
        onClose={() => setShowCoachVideosModal(false)}
        title="Video từ Coach"
      />
    </>
  );
};

const styles = StyleSheet.create({
  emptyText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 20,
    fontStyle: "italic",
  },
  coachVideosSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
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
    backgroundColor: "#ECFDF5",
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
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
