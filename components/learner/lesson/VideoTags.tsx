import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { VideoType } from "../../../types/video";

interface VideoTagsProps {
  tags: VideoType["tags"];
}

const parseTags = (raw: string): string[] => {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    return raw
      .replace(/[{}"]/g, "")
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const VideoTags: React.FC<VideoTagsProps> = ({ tags }) => {
  if (!tags) return null;

  const normalizedTags = Array.isArray(tags)
    ? tags
    : typeof tags === "string"
    ? parseTags(tags)
    : [];

  if (normalizedTags.length === 0) return null;

  return (
    <View style={styles.tagContainer}>
      {normalizedTags.map((tag: string) => (
        <View key={tag} style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#E0F2FE",
    borderWidth: 0.5,
    borderColor: "#0EA5E9",
  },
  tagText: {
    fontSize: 10,
    color: "#0369A1",
    fontWeight: "500",
  },
});

export default VideoTags;

