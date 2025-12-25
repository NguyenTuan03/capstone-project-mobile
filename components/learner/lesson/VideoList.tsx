import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { AiVideoCompareResult } from "../../../types/ai";
import { VideoType } from "../../../types/video";
import CoachVideoCard from "./CoachVideoCard";
import SubmittedVideoCard from "./SubmittedVideoCard";
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
  const [showOverlayPlayer, setShowOverlayPlayer] = useState(false);
  const [isReuploading, setIsReuploading] = useState(false);

  // Auto-reset isReuploading when upload finished
  useEffect(() => {
    if (!isUploading && isReuploading && submittedVideo) {
      setIsReuploading(false);
    }
  }, [isUploading, submittedVideo]);

  return (
    <View style={styles.container}>
      {/* Immersive Background Element */}
      <View style={styles.bgDecoration} pointerEvents="none" />

      {/* Learning Path Header */}
      <Animated.View
        entering={FadeInUp.duration(600).springify()}
        style={styles.pageHeader}
      >
        <View style={styles.headerIndicator} />
        <Text style={styles.headerTitleText}>Lộ trình luyện tập</Text>
        <Text style={styles.headerSubtitleText}>
          Theo dõi và cải thiện kỹ thuật của bạn
        </Text>
      </Animated.View>

      {submittedVideo && !isReuploading && (
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.sectionWrapper}
        >
          <View style={styles.sectionBadge}>
            <LinearGradient
              colors={["#059669", "#047857"]}
              style={styles.badgeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="sparkles" size={10} color="#FFFFFF" />
              <Text style={styles.badgeText}>BÀI TẬP HIỆN TẠI</Text>
            </LinearGradient>
          </View>
          <SubmittedVideoCard
            submittedVideo={submittedVideo}
            overlayVideoUrl={overlayVideoUrl}
            onViewOverlay={() => setShowOverlayPlayer(true)}
            hasAiResult={!!aiAnalysisResult}
            onUpdate={() => setIsReuploading(true)}
          />
        </Animated.View>
      )}

      {video && (
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.coachSection}
        >
          <View style={styles.coachCardWrapper}>
            <CoachVideoCard video={video} />
          </View>
        </Animated.View>
      )}

      {/* Hiển thị upload nếu chưa có kết quả AI HOẶC đang muốn upload lại */}
      {(!aiAnalysisResult || isReuploading) && (
        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={styles.uploadSectionWrapper}
        >
          <View style={styles.sectionDivider}>
            <View style={styles.dividerLine} />
            {isReuploading ? (
              <TouchableOpacity
                onPress={() => setIsReuploading(false)}
                style={styles.cancelButton}
              >
                <Ionicons name="close-circle" size={16} color="#EF4444" />
                <Text style={styles.cancelText}>Hủy cập nhật</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.dividerDots}>
                <View style={styles.dot} />
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
              </View>
            )}
            <View style={styles.dividerLine} />
          </View>

          <VideoUploadSection
            localVideo={localVideo}
            isUploading={isUploading}
            hasCoachVideo={video !== null}
            coachVideoId={coachVideoId}
            coachVideoDuration={coachVideoDuration}
            onPickVideo={onPickVideo}
            onUploadVideo={onUploadVideo}
            onVideoCapture={onVideoCapture}
          />
        </Animated.View>
      )}

      {video === null && !localVideo && (
        <Animated.View
          entering={FadeInUp.delay(400)}
          style={styles.emptyContainer}
        >
          <View style={styles.emptyIconGlow}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="videocam-off" size={48} color="#059669" />
            </View>
          </View>
          <Text style={styles.emptyTitle}>Khám phá bài học mới</Text>
          <Text style={styles.emptyText}>
            Bạn chưa có video hướng dẫn hay bài tập nào. Hãy bắt đầu hành trình
            ngay!
          </Text>
        </Animated.View>
      )}

      {/* Custom Overlay Player */}
      {video && video.publicUrl && submittedVideo && (
        <VideoOverlayPlayer
          visible={showOverlayPlayer}
          onClose={() => setShowOverlayPlayer(false)}
          coachVideoUrl={video.publicUrl}
          learnerVideoUrl={submittedVideo.publicUrl}
          aiAnalysisResult={aiAnalysisResult}
          isPaddingTopEnabled={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
  },
  bgDecoration: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(5, 150, 105, 0.03)",
  },
  pageHeader: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  headerIndicator: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#059669",
    marginBottom: 8,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -0.6,
  },
  headerSubtitleText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 2,
  },
  sectionWrapper: {
    marginBottom: 16,
  },
  sectionBadge: {
    alignSelf: "flex-start",
    marginBottom: -10,
    zIndex: 10,
    marginLeft: 10,
  },
  badgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  uploadSectionWrapper: {
    marginTop: 8,
  },
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerDots: {
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#E5E7EB",
  },
  dotActive: {
    width: 6,
    backgroundColor: "#059669",
  },
  coachSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
    marginBottom: 4,
  },
  coachCardWrapper: {
    padding: 0,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyIconGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(5, 150, 105, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  cancelText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#EF4444",
  },
});

export default VideoList;
