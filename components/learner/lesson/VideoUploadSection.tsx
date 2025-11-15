import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import LessonVideoPlayer from "./LessonVideoPlayer";

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
  onPickVideo: () => void;
  onUploadVideo: (coachVideoId: number) => void;
}

const VideoUploadSection: React.FC<VideoUploadSectionProps> = ({
  localVideo,
  isUploading,
  hasCoachVideo,
  coachVideoId,
  onPickVideo,
  onUploadVideo,
}) => {
  // Show upload button if no local video
  if (!localVideo) {
    return (
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={onPickVideo}
        activeOpacity={0.7}
      >
        <Text style={styles.uploadButtonText}>
          📤 Upload video của bạn tại đây
        </Text>
      </TouchableOpacity>
    );
  }

  // Show video preview and upload button if local video exists
  return (
    <View style={[styles.resourceCard, { backgroundColor: "#F0F9FF" }]}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.resourceTitle}>{localVideo.name}</Text>
          <Text style={styles.metaText}>Từ thiết bị của bạn</Text>
        </View>
        {localVideo.uploaded && (
          <View style={styles.uploadedBadge}>
            <Text style={styles.uploadedBadgeText}>✓ Đã upload</Text>
          </View>
        )}
      </View>
      {localVideo.duration && (
        <Text style={{ ...styles.metaText, marginTop: 5 }}>
          ⏱ {localVideo.duration} phút
        </Text>
      )}
      <LessonVideoPlayer source={localVideo.uri} />
      {!localVideo.uploaded && hasCoachVideo && coachVideoId && (
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
            <Text style={styles.submitButtonText}>📤 Nộp bài</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  uploadButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#059669",
    borderStyle: "dashed",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  uploadButtonText: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  resourceCard: {
    padding: 10,
    borderRadius: 9,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.04,
    shadowRadius: 1.5,
    elevation: 1,
  },
  resourceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  metaText: {
    fontSize: 11,
    color: "#6B7280",
  },
  uploadedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: "#34D399",
  },
  uploadedBadgeText: {
    color: "#047857",
    fontSize: 11,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3.5,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.8,
    shadowOpacity: 0.1,
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

export default VideoUploadSection;

