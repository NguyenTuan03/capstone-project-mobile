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
  hasAiResult?: boolean;
  onUpdate?: () => void;
}

const SubmittedVideoCard: React.FC<SubmittedVideoCardProps> = ({
  submittedVideo,
  overlayVideoUrl,
  onViewOverlay,
  hasAiResult,
  onUpdate,
}) => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={["#ECFDF5", "#D1FAE5"]}
            style={styles.iconWrapper}
          >
            <Ionicons name="videocam" size={20} color="#059669" />
          </LinearGradient>
          <View>
            <Text style={styles.title}>Kết quả luyện tập</Text>
            {submittedVideo.createdAt && (
              <View style={styles.timestamp}>
                <Ionicons name="time-outline" size={12} color="#94A3B8" />
                <Text style={styles.timeText}>
                  {new Date(submittedVideo.createdAt).toLocaleDateString(
                    "vi-VN",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }
                  )}
                </Text>
              </View>
            )}
          </View>
        </View>

        {submittedVideo.status && (
          <View
            style={[
              styles.statusChip,
              submittedVideo.status === "PROCESSING" && styles.statusProcessing,
              (submittedVideo.status === "COMPLETED" ||
                submittedVideo.status === "READY") &&
                styles.statusCompleted,
              submittedVideo.status === "FAILED" && styles.statusFailed,
            ]}
          >
            <View
              style={[
                styles.pulse,
                submittedVideo.status === "PROCESSING" &&
                  styles.pulseProcessing,
                (submittedVideo.status === "COMPLETED" ||
                  submittedVideo.status === "READY") &&
                  styles.pulseCompleted,
              ]}
            />
          </View>
        )}
      </View>

      <View style={styles.videoWrapper}>
        <LessonVideoPlayer source={submittedVideo.publicUrl} />
      </View>

      <View style={styles.footer}>
        {hasAiResult && (
          <TouchableOpacity
            onPress={onViewOverlay}
            activeOpacity={0.8}
            style={styles.aiButton}
          >
            <LinearGradient
              colors={["#059669", "#065F46"]}
              style={styles.aiGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              <Text style={styles.aiButtonText}>Xem phân tích AI</Text>
              <View style={styles.aiGlow} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {onUpdate && (
          <TouchableOpacity
            onPress={onUpdate}
            activeOpacity={0.7}
            style={styles.secondaryButton}
          >
            <Ionicons name="refresh-outline" size={16} color="#64748B" />
            <Text style={styles.secondaryButtonText}>Thay đổi video</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
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
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.1)",
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  timestamp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  timeText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
  },
  statusProcessing: { backgroundColor: "#FFFBEB" },
  statusCompleted: { backgroundColor: "#F0FDF4" },
  statusFailed: { backgroundColor: "#FEF2F2" },
  pulse: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#94A3B8",
  },
  pulseProcessing: { backgroundColor: "#F59E0B" },
  pulseCompleted: { backgroundColor: "#10B981" },
  statusText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  textProcessing: { color: "#D97706" },
  textCompleted: { color: "#059669" },
  textFailed: { color: "#DC2626" },
  videoWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
  },
  videoOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    justifyContent: "flex-end",
    padding: 12,
  },
  overlayContent: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  qualityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  qualityText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  footer: {
    marginTop: 16,
    gap: 10,
  },
  aiButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  aiGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  aiButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  aiGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
});

export default SubmittedVideoCard;
