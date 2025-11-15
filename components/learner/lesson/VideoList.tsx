import React from "react";
import { StyleSheet, Text } from "react-native";
import { AiVideoCompareResult } from "../../../types/ai";
import { VideoType } from "../../../types/video";
import AIAnalysisResult from "./AIAnalysisResult";
import CoachVideoCard from "./CoachVideoCard";
import SubmittedVideoCard from "./SubmittedVideoCard";
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
  isUploading: boolean;
  coachVideoId?: number;
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
  isUploading,
  coachVideoId,
}) => {
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
        onPickVideo={onPickVideo}
        onUploadVideo={onUploadVideo}
      />

      {videos.length === 0 && !localVideo && (
        <Text style={styles.emptyText}>
          Chưa có video nào cho bài học này.
        </Text>
      )}

      {videos.map((video) => (
        <CoachVideoCard key={video.id} video={video} />
      ))}

      <AIAnalysisResult loading={loadingAnalysis} result={aiAnalysisResult} />
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
});

export default VideoList;

