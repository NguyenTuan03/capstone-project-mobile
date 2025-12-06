import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LessonVideoPlayer from "./LessonVideoPlayer";
import VideoCaptureComponent from "./VideoCaptureComponent";

interface VideoUploadSectionProps {
  localVideo: {
    uri: string;
    name: string;
    duration?: number;
    tags?: string[];
    uploaded?: boolean;
  } | null;
  isUploading: boolean;
  hasCoachVideo: boolean;
  coachVideoId?: number;
  coachVideoDuration?: number;
  onPickVideo: () => void;
  onUploadVideo: (coachVideoId: number) => void;
  onVideoCapture?: (video: {
    uri: string;
    name: string;
    duration?: number;
  }) => void;
}

const VideoUploadSection: React.FC<VideoUploadSectionProps> = ({
  localVideo,
  isUploading,
  hasCoachVideo,
  coachVideoId,
  coachVideoDuration,
  onPickVideo,
  onUploadVideo,
  onVideoCapture,
}) => {
  const [showCapture, setShowCapture] = useState(false);

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVideoCapture = (uri: string, name: string, duration: number) => {
    // Pass captured video back to parent component with duration in seconds
    onVideoCapture?.({ uri, name, duration });
    setShowCapture(false);
  };

  const handleCaptureCancel = () => {
    setShowCapture(false);
  };

  const handleRecapture = () => {
    setShowCapture(true);
  };

  // Use localVideo which now includes both captured and picked videos
  const videoToDisplay = localVideo;

  // Show upload button if no local video and no captured video
  if (!videoToDisplay) {
    return (
      <>
        <TouchableOpacity
          style={styles.captureButtonCard}
          onPress={() => setShowCapture(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="camera" size={24} color="#FFFFFF" />
          <Text style={styles.captureButtonText}>Quay video của bạn</Text>
          <Text style={styles.captureButtonSubtext}>
            Chạm để bắt đầu quay video
          </Text>
        </TouchableOpacity>

        {/* Fullscreen Video Capture Modal */}
        <Modal
          visible={showCapture}
          animationType="fade"
          presentationStyle="fullScreen"
          onRequestClose={handleCaptureCancel}
        >
          <VideoCaptureComponent
            duration={coachVideoDuration || 10}
            onVideoCapture={handleVideoCapture}
            onCancel={handleCaptureCancel}
          />
        </Modal>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={onPickVideo}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="upload" size={18} color="#059669" />
          <Text style={styles.uploadButtonText}>
            Hoặc chọn video từ thiết bị
          </Text>
        </TouchableOpacity>
      </>
    );
  }

  // Show video preview and upload button if local video exists
  return (
    <>
      <View style={styles.resourceCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <Text style={styles.resourceTitle} numberOfLines={1}>
              {videoToDisplay.name}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Từ thiết bị</Text>
              {localVideo?.duration && (
                <>
                  <Text style={styles.metaDivider}>•</Text>
                  <Text style={styles.metaText}>
                    {formatDuration(localVideo.duration)}
                  </Text>
                </>
              )}
            </View>
          </View>
          {localVideo?.uploaded && (
            <View style={styles.uploadedBadge}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#059669" />
              <Text style={styles.uploadedBadgeText}>Đã nộp</Text>
            </View>
          )}
        </View>

        <LessonVideoPlayer source={videoToDisplay.uri} />

        {!localVideo?.uploaded && hasCoachVideo && coachVideoId && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isUploading && styles.submitButtonDisabled,
              ]}
              onPress={() => onUploadVideo(coachVideoId)}
              disabled={isUploading}
              activeOpacity={0.7}
            >
              {isUploading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Đang upload...</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="upload"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.submitButtonText}>Nộp bài</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recaptureButton}
              onPress={handleRecapture}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="camera-retake" size={18} color="#059669" />
              <Text style={styles.recaptureButtonText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Fullscreen Video Capture Modal - always available for recapture */}
      <Modal
        visible={showCapture}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={handleCaptureCancel}
      >
        <VideoCaptureComponent
          duration={coachVideoDuration || 10}
          onVideoCapture={handleVideoCapture}
          onCancel={handleCaptureCancel}
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Initial state buttons
  captureButtonCard: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  captureButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  captureButtonSubtext: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
    opacity: 0.9,
  },
  uploadButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    flexDirection: "row",
    gap: 6,
  },
  uploadButtonText: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Video preview card
  resourceCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  headerContent: {
    flex: 1,
    gap: 3,
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  metaDivider: {
    fontSize: 12,
    color: "#D1D5DB",
    fontWeight: "500",
  },
  uploadedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  uploadedBadgeText: {
    color: "#059669",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Action buttons
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#059669",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  recaptureButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  recaptureButtonText: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});

export default VideoUploadSection;
