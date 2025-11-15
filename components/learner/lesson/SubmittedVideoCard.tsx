import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
        <View>
          <Text style={styles.submittedVideoTitle}>📹 Video bạn đã nộp</Text>
          {submittedVideo.status && (
            <View style={styles.statusBadgeContainer}>
              <View
                style={[
                  styles.statusBadge,
                  submittedVideo.status === "PROCESSING" &&
                    styles.statusProcessing,
                  submittedVideo.status === "COMPLETED" &&
                    styles.statusCompleted,
                  submittedVideo.status === "FAILED" && styles.statusFailed,
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {submittedVideo.status}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
      {submittedVideo.createdAt && (
        <Text style={styles.submittedVideoMeta}>
          Nộp lúc: {new Date(submittedVideo.createdAt).toLocaleString()}
        </Text>
      )}
      <LessonVideoPlayer source={submittedVideo.publicUrl} />

      {overlayVideoUrl ? (
        <TouchableOpacity
          style={styles.viewOverlayButton}
          onPress={onViewOverlay}
          activeOpacity={0.7}
        >
          <Text style={styles.viewOverlayButtonText}>
            👁️ Xem so sánh với Coach
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.compareButton,
            generatingOverlay && styles.compareButtonDisabled,
          ]}
          onPress={onGenerateOverlay}
          disabled={generatingOverlay}
          activeOpacity={0.7}
        >
          {generatingOverlay ? (
            <View style={styles.compareButtonContent}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.compareButtonText}>
                Đang tạo video overlay...
              </Text>
            </View>
          ) : (
            <Text style={styles.compareButtonText}>🔄 So sánh với Coach</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  submittedVideoCard: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBEF63",
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  submittedVideoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  submittedVideoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#047857",
    marginBottom: 4,
  },
  submittedVideoMeta: {
    fontSize: 10,
    color: "#059669",
    fontStyle: "italic",
  },
  statusBadgeContainer: {
    flexDirection: "row",
    gap: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#FEF08A",
    borderWidth: 0.5,
    borderColor: "#EAB308",
  },
  statusProcessing: {
    backgroundColor: "#FEF08A",
    borderColor: "#EAB308",
  },
  statusCompleted: {
    backgroundColor: "#DCFCE7",
    borderColor: "#34D399",
  },
  statusFailed: {
    backgroundColor: "#FEE2E2",
    borderColor: "#F87171",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#854D0E",
  },
  compareButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3.5,
    elevation: 3,
  },
  compareButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.8,
  },
  compareButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compareButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  viewOverlayButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3.5,
    elevation: 3,
  },
  viewOverlayButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

export default SubmittedVideoCard;

