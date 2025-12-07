import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { VideoType } from "../../../types/video";
import LessonVideoPlayer from "./LessonVideoPlayer";

interface CoachVideoCardProps {
  video: VideoType;
}

const CoachVideoCard: React.FC<CoachVideoCardProps> = ({ video }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasDetails = video.drillName || video.drillDescription || video.drillPracticeSets;

  return (
    <View style={styles.resourceCard}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <Text style={styles.resourceTitle}>{video.title}</Text>
          {hasDetails && (
            <TouchableOpacity
              onPress={() => setIsExpanded(!isExpanded)}
              style={styles.toggleButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#059669"
              />
            </TouchableOpacity>
          )}
        </View>
        {video.description && (
          <Text style={styles.resourceDescription} numberOfLines={2}>
            {video.description}
          </Text>
        )}
        {video.duration != null && (
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={12} color="#6B7280" />
            <Text style={styles.durationText}>{video.duration}s</Text>
          </View>
        )}
      </View>

      {/* Expandable Drill Info Section */}
      {isExpanded && hasDetails && (
        <View style={styles.detailsSection}>
          {video.drillName && (
            <View style={styles.drillHeader}>
              <Ionicons name="fitness" size={14} color="#059669" />
              <Text style={styles.drillName}>{video.drillName}</Text>
            </View>
          )}
          {video.drillDescription && (
            <Text style={styles.drillDescription}>
              {video.drillDescription}
            </Text>
          )}
          {video.drillPracticeSets && (
            <View style={styles.metaItem}>
              <Ionicons name="bar-chart-outline" size={12} color="#6B7280" />
              <Text style={styles.metaText}>
                {video.drillPracticeSets} hiệp tập
              </Text>
            </View>
          )}
        </View>
      )}

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
    borderRadius: 10,
    padding: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerSection: {
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  resourceTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 20,
  },
  toggleButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  resourceDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  durationText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },
  detailsSection: {
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  drillHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  drillName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
  },
  drillDescription: {
    fontSize: 12,
    color: "#16A34A",
    lineHeight: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  metaText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },
  videoContainer: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  fallbackContainer: {
    backgroundColor: "#FEF2F2",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  fallbackText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
  },
});

export default CoachVideoCard;
