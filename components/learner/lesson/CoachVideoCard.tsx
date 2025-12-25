import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { VideoType } from "../../../types/video";
import LessonVideoPlayer from "./LessonVideoPlayer";

interface CoachVideoCardProps {
  video: VideoType;
  onPress?: () => void;
  fullDescription?: boolean;
}

const CoachVideoCard: React.FC<CoachVideoCardProps> = ({
  video,
  onPress,
  fullDescription = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(fullDescription);
  const rotation = useSharedValue(fullDescription ? 180 : 0);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    rotation.value = withSpring(!isExpanded ? 180 : 0);
  };

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Helper to structure long descriptions into steps or chunks
  const descriptionChunks = video.drillDescription
    ? video.drillDescription.split(/\n+/).filter((chunk) => chunk.trim() !== "")
    : [];

  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={onPress || toggleExpand}
        activeOpacity={0.9}
        disabled={fullDescription}
      >
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{video.title}</Text>
          </View>

          <TouchableOpacity
            onPress={toggleExpand}
            style={styles.expandButton}
            activeOpacity={0.7}
          >
            <Animated.View style={rotationStyle}>
              <Ionicons name="chevron-down" size={20} color="#059669" />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <Text
          style={styles.description}
          numberOfLines={isExpanded ? undefined : 2}
        >
          {video.description}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <Animated.View
          entering={FadeInUp.delay(100).springify().damping(18)}
          style={styles.drillsSection}
        >
          {/* Main Drill Header */}
          <View style={styles.drillMainCard}>
            <View style={styles.drillHeader}>
              <View style={styles.drillIconContainer}>
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.drillNameSmall}>BÀI TẬP TRỌNG TÂM</Text>
                <Text style={styles.drillName}>
                  {video.drillName || "Nội dung bài tập"}
                </Text>
              </View>
            </View>

            {/* Structured Steps/Description */}
            <View style={styles.guidanceContainer}>
              {descriptionChunks.length > 0 ? (
                descriptionChunks.map((chunk, index) => (
                  <View key={index} style={styles.stepRow}>
                    <View style={styles.stepIndicator}>
                      <Text style={styles.stepNumber}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{chunk.trim()}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>
                  Chưa có hướng dẫn chi tiết.
                </Text>
              )}
            </View>

            {/* Immersive Stat Bar */}
            <View style={styles.immersiveStatBar}>
              <View style={styles.statItem}>
                <Ionicons name="repeat" size={16} color="#059669" />
                <View>
                  <Text style={styles.statLabel}>LUYỆN TẬP</Text>
                  <Text style={styles.statValue}>
                    {video.drillPracticeSets}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      <View style={styles.videoWrapper}>
        <View style={styles.videoContainer}>
          {video.publicUrl ? (
            <LessonVideoPlayer source={video.publicUrl} />
          ) : (
            <View style={styles.noVideo}>
              <Ionicons name="alert-circle" size={40} color="#9CA3AF" />
              <Text style={styles.noVideoText}>Video hiện không khả dụng</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.6,
    lineHeight: 24,
    flexShrink: 1,
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginLeft: 12,
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    fontWeight: "500",
  },
  drillsSection: {
    marginTop: 2,
  },
  drillMainCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 14,
  },
  drillHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  drillIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  drillNameSmall: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.8,
    marginBottom: 0,
  },
  drillName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: -0.4,
    flexShrink: 1,
    flex: 1,
  },
  guidanceContainer: {
    gap: 12,
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
  },
  stepIndicator: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  stepNumber: {
    fontSize: 10,
    fontWeight: "800",
    color: "#059669",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: "#475569",
    lineHeight: 18,
    fontWeight: "500",
  },
  immersiveStatBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.4,
    marginBottom: 0,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0F172A",
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#F1F5F9",
    marginHorizontal: 12,
  },
  noDataText: {
    fontSize: 13,
    color: "#94A3B8",
    fontStyle: "italic",
    textAlign: "center",
  },
  videoWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  videoContainer: {
    aspectRatio: 16 / 9,
  },
  noVideo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 30,
    backgroundColor: "#111827",
  },
  noVideoText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default CoachVideoCard;
