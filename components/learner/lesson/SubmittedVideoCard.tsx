import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
  generatingOverlay: boolean;
  onGenerateOverlay: () => void;
  onViewOverlay: () => void;
}

const SubmittedVideoCard: React.FC<SubmittedVideoCardProps> = ({
  submittedVideo,
  overlayVideoUrl,
  generatingOverlay,
  onGenerateOverlay,
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
                  submittedVideo.status === "COMPLETED" &&
                    styles.statusCompletedText,
                  submittedVideo.status === "FAILED" && styles.statusFailedText,
                ]}
              >
                {submittedVideo.status === "PROCESSING" && "Đang xử lý"}
                {submittedVideo.status === "COMPLETED" && "Hoàn thành"}
                {submittedVideo.status === "FAILED" && "Thất bại"}
                {!["PROCESSING", "COMPLETED", "FAILED"].includes(
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

      {overlayVideoUrl ? (
        <TouchableOpacity
          onPress={onViewOverlay}
          activeOpacity={0.8}
          style={styles.actionButtonContainer}
        >
          <LinearGradient
            colors={["#3B82F6", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="eye" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Xem so sánh với Coach</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onGenerateOverlay}
          disabled={generatingOverlay}
          activeOpacity={0.8}
          style={styles.actionButtonContainer}
        >
          <LinearGradient
            colors={
              generatingOverlay
                ? ["#9CA3AF", "#6B7280"]
                : ["#8B5CF6", "#7C3AED"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButtonGradient}
          >
            {generatingOverlay ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  Đang tạo video overlay...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="scan-circle" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>So sánh với Coach</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}
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
});

export default SubmittedVideoCard;
