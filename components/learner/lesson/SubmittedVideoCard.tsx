import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LessonVideoPlayer from "./LessonVideoPlayer";

interface SubmittedVideoCardProps {
  submittedVideo: {
    publicUrl: string;
    thumbnailUrl?: string | null;
    status?: string;
    createdAt?: string;
    id?: number;
  };
  overlayVideoUrl: string | null;
  onViewOverlay: () => void;
}

const SubmittedVideoCard: React.FC<SubmittedVideoCardProps> = ({
  submittedVideo,
  overlayVideoUrl,
  onViewOverlay,
}) => {
  return (
    <View style={styles.submittedVideoCard}>
      <View style={styles.submittedVideoHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="videocam" size={20} color="#059669" />
          </View>
          <View>
            <Text style={styles.submittedVideoTitle}>Video bạn đã nộp</Text>
            {submittedVideo.createdAt && (
              <Text style={styles.submittedVideoMeta}>
                {new Date(submittedVideo.createdAt).toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
            )}
          </View>
        </View>

        {submittedVideo.status && (
          <View style={styles.statusBadgeContainer}>
            <View
              style={[
                styles.statusBadge,
                submittedVideo.status === "PROCESSING" &&
                  styles.statusProcessing,
                submittedVideo.status === "COMPLETED" && styles.statusCompleted,
                submittedVideo.status === "FAILED" && styles.statusFailed,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  submittedVideo.status === "PROCESSING" &&
                    styles.statusProcessingText,
                  submittedVideo.status === "READY" &&
                    styles.statusCompletedText,
                  submittedVideo.status === "FAILED" && styles.statusFailedText,
                ]}
              >
                {submittedVideo.status === "PROCESSING" && "Đang xử lý"}
                {submittedVideo.status === "READY" && ""}
                {submittedVideo.status === "FAILED" && "Thất bại"}
                {!["PROCESSING", "READY", "FAILED"].includes(
                  submittedVideo.status
                ) && submittedVideo.status}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.videoContainer}>
        <LessonVideoPlayer source={submittedVideo.publicUrl} />
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.customCompareButton}
          onPress={onViewOverlay}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#10B981", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.compareButtonGradient}
          >
            <Ionicons name="layers" size={20} color="#FFFFFF" />
            <Text style={styles.compareButtonText}>Xem phân tích AI</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  submittedVideoCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  submittedVideoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  submittedVideoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  submittedVideoMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusBadgeContainer: {
    flexDirection: "row",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusProcessing: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  statusCompleted: {
    backgroundColor: "#D1FAE5",
    borderColor: "#10B981",
  },
  statusFailed: {
    backgroundColor: "#FEE2E2",
    borderColor: "#EF4444",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusProcessingText: {
    color: "#B45309",
  },
  statusCompletedText: {
    color: "#047857",
  },
  statusFailedText: {
    color: "#B91C1C",
  },
  videoContainer: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  actionButtonContainer: {
    marginTop: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  viewOverlayButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  viewOverlayButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  compareButton: {
    flex: 1,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  compareButtonDisabled: {
    opacity: 0.7,
  },
  compareButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  compareButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  customCompareButton: {
    flex: 1,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default SubmittedVideoCard;
