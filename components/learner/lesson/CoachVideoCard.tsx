import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { VideoType } from "../../../types/video";
import LessonVideoPlayer from "./LessonVideoPlayer";
import VideoTags from "./VideoTags";

interface CoachVideoCardProps {
  video: VideoType;
}

const CoachVideoCard: React.FC<CoachVideoCardProps> = ({ video }) => {
  return (
    <View style={styles.resourceCard}>
      <Text style={styles.resourceTitle}>{video.title}</Text>
      {video.description && (
        <Text style={styles.resourceDescription}>{video.description}</Text>
      )}
      <View style={{ gap: 5, marginTop: 4 }}>
        {video.drillName && (
          <Text
            style={{
              ...styles.metaText,
              fontWeight: "600",
              color: "#059669",
            }}
          >
            🎯 {video.drillName}
          </Text>
        )}
        {video.drillDescription && (
          <Text style={styles.metaText}>{video.drillDescription}</Text>
        )}
      </View>
      <View style={styles.metaRow}>
        {video.duration != null && (
          <Text style={styles.metaText}>⏱ {video.duration} phút</Text>
        )}
        {video.drillPracticeSets && (
          <Text style={styles.metaText}>
            📊 {video.drillPracticeSets} hiệp tập
          </Text>
        )}
      </View>
      <VideoTags tags={video.tags} />
      <View style={{ marginTop: 6 }}>
        {video.publicUrl ? (
          <LessonVideoPlayer source={video.publicUrl} />
        ) : (
          <View
            style={{
              backgroundColor: "#FEE2E2",
              padding: 8,
              borderRadius: 6,
              borderLeftWidth: 3,
              borderLeftColor: "#EF4444",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: "#7F1D1D",
                fontWeight: "500",
              }}
            >
              ⚠️ Video hiện chưa khả dụng
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  resourceDescription: {
    fontSize: 11,
    color: "#4B5563",
    lineHeight: 15,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: "#6B7280",
  },
});

export default CoachVideoCard;

