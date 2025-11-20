import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { VideoType } from "../../../types/video";
import LessonVideoPlayer from "./LessonVideoPlayer";

interface CoachVideoCardProps {
  video: VideoType;
}

const CoachVideoCard: React.FC<CoachVideoCardProps> = ({ video }) => {
  return (
    <View style={styles.resourceCard}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.resourceTitle}>{video.title}</Text>
        {video.description && (
          <Text style={styles.resourceDescription}>{video.description}</Text>
        )}
      </View>

      {/* Drill Info Section */}
      {(video.drillName || video.drillDescription) && (
        <View style={styles.drillSection}>
          {video.drillName && (
            <View style={styles.drillHeader}>
              <Ionicons name="fitness" size={16} color="#059669" />
              <Text style={styles.drillName}>{video.drillName}</Text>
            </View>
          )}
          {video.drillDescription && (
            <Text style={styles.drillDescription}>
              {video.drillDescription}
            </Text>
          )}
        </View>
      )}

      {/* Meta Info Row */}
      <View style={styles.metaRow}>
        {video.duration != null && (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{video.duration} phút</Text>
          </View>
        )}
        {video.drillPracticeSets && (
          <View style={styles.metaItem}>
            <Ionicons name="bar-chart-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>
              {video.drillPracticeSets} hiệp tập
            </Text>
          </View>
        )}
      </View>

      {/* Video Player Section */}
      <View style={styles.videoContainer}>
        {video.publicUrl ? (
          <LessonVideoPlayer source={video.publicUrl} />
        ) : (
          <View style={styles.fallbackContainer}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <Text style={styles.fallbackText}>Video hiện chưa khả dụng</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  resourceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  headerSection: {
    gap: 6,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 24,
  },
  resourceDescription: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  drillSection: {
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  drillHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  drillName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#166534",
  },
  drillDescription: {
    fontSize: 13,
    color: "#15803D",
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },
  videoContainer: {
    marginTop: 4,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  fallbackContainer: {
    backgroundColor: "#FEF2F2",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fallbackText: {
    fontSize: 13,
    color: "#B91C1C",
    fontWeight: "600",
  },
});

export default CoachVideoCard;
