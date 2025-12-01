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

  const handleVideoCapture = (uri: string, name: string, duration: number) => {
    // Pass captured video back to parent component with duration in seconds
    // Convert to minutes for consistency with picked videos
    const durationInMinutes = Math.round(duration / 60);
    onVideoCapture?.({ uri, name, duration: durationInMinutes });
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
      <View style={[styles.resourceCard, { backgroundColor: "#F0F9FF" }]}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.resourceTitle}>{videoToDisplay.name}</Text>
            <Text style={styles.metaText}>Từ thiết bị của bạn</Text>
          </View>
          {localVideo?.uploaded && (
            <View style={styles.uploadedBadge}>
              <Text style={styles.uploadedBadgeText}>✓ Đã upload</Text>
            </View>
          )}
        </View>
        {localVideo?.duration && (
          <Text style={{ ...styles.metaText, marginTop: 5 }}>
            ⏱ {localVideo.duration} phút
          </Text>
        )}
        <LessonVideoPlayer source={videoToDisplay.uri} />
        {!localVideo?.uploaded && hasCoachVideo && coachVideoId && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              isUploading && styles.submitButtonDisabled,
            ]}
            onPress={() => onUploadVideo(coachVideoId)}
            disabled={isUploading}
            activeOpacity={0.85}
          >
            {isUploading ? (
              <View style={styles.submitButtonContent}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Đang upload...</Text>
              </View>
            ) : (
              <View style={styles.submitButtonContent}>
                <MaterialCommunityIcons
                  name="upload"
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.submitButtonText}>Nộp bài</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {!localVideo?.uploaded && hasCoachVideo && coachVideoId && (
          <TouchableOpacity
            style={styles.recaptureButton}
            onPress={handleRecapture}
            activeOpacity={0.85}
          >
            <View style={styles.recaptureButtonContent}>
              <MaterialCommunityIcons name="camera" size={16} color="#059669" />
              <Text style={styles.recaptureButtonText}>Quay lại video</Text>
            </View>
          </TouchableOpacity>
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
  captureButtonCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 10,
  },
  captureButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  captureButtonSubtext: {
    fontSize: 10,
    color: "#E0F2FE",
    fontWeight: "500",
  },
  uploadButton: {
    backgroundColor: "transparent",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#059669",
    borderStyle: "dashed",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  uploadButtonText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.15,
  },
  resourceCard: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#CFF0F5",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  resourceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0369A1",
    marginBottom: 2,
  },
  metaText: {
    fontSize: 10,
    color: "#0891B2",
    fontWeight: "500",
  },
  uploadedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: "#34D399",
  },
  uploadedBadgeText: {
    color: "#047857",
    fontSize: 10,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#059669",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.75,
    shadowOpacity: 0.08,
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  recaptureButton: {
    backgroundColor: "transparent",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#059669",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  recaptureButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recaptureButtonText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});

export default VideoUploadSection;
