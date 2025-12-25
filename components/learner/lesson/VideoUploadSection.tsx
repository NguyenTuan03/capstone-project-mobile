import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
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
  coachVideoDuration?: number;
  onPickVideo: () => void;
  onUploadVideo: (coachVideoId: number) => void;
  onVideoCapture?: (video: {
    uri: string;
    name: string;
    duration?: number;
  }) => void;
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const VideoUploadSection: React.FC<VideoUploadSectionProps> = ({
  localVideo,
  isUploading,
  hasCoachVideo,
  coachVideoId,
  coachVideoDuration,
  onPickVideo,
  onUploadVideo,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePickVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPickVideo();
  };

  const handleUploadVideo = (id: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onUploadVideo(id);
  };

  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!localVideo) {
    return (
      <View style={styles.container}>
        <AnimatedTouchableOpacity
          style={[styles.uploadZone, animatedStyle]}
          onPress={handlePickVideo}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <View style={styles.uploadCard}>
            <LinearGradient
              colors={["#FFFFFF", "#F0FDF4"]}
              style={styles.uploadInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.uploadIconWrapper}>
                <LinearGradient
                  colors={["#059669", "#065F46"]}
                  style={styles.iconGradient}
                >
                  <MaterialCommunityIcons
                    name="video-plus"
                    size={32}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                <View style={styles.uploadIconPulse} />
              </View>
              <View style={styles.uploadTextWrapper}>
                <Text style={styles.uploadTitle}>Bắt đầu luyện tập</Text>
                <Text style={styles.uploadSubtitle}>
                  Tải lên video của bạn để nhận phân tích từ AI
                </Text>
              </View>
              <View style={styles.uploadBadge}>
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={14}
                  color="#D97706"
                />
                <Text style={styles.uploadBadgeText}>Tốc độ cao</Text>
              </View>
            </LinearGradient>
          </View>
        </AnimatedTouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.previewCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerInfo}>
            <Text style={styles.previewTitle} numberOfLines={1}>
              {localVideo.name}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <MaterialCommunityIcons
                  name="clock"
                  size={12}
                  color="#6B7280"
                />
                <Text style={styles.metaText}>
                  {formatDuration(localVideo.duration)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.videoWrapper}>
          <LessonVideoPlayer source={localVideo.uri} />
        </View>

        {hasCoachVideo && coachVideoId && (
          <View style={styles.footer}>
            {!localVideo.uploaded && (
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => handleUploadVideo(coachVideoId)}
                disabled={isUploading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    isUploading
                      ? ["#9CA3AF", "#6B7280"]
                      : ["#059669", "#065F46"]
                  }
                  style={styles.gradientButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="arrow-up-circle"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.buttonText}>Nộp bài ngay</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                localVideo.uploaded && styles.fullWidthButton,
              ]}
              onPress={handlePickVideo}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={localVideo.uploaded ? "refresh" : "pencil-outline"}
                size={18}
                color={localVideo.uploaded ? "#059669" : "#6B7280"}
              />
              <Text
                style={[
                  styles.secondaryButtonText,
                  localVideo.uploaded && styles.greenText,
                ]}
              >
                {localVideo.uploaded ? "Nộp lại bài khác" : "Đổi video"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  uploadZone: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  uploadCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  uploadInner: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  uploadIconWrapper: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 2,
  },
  uploadIconPulse: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(5, 150, 105, 0.1)",
  },
  uploadTextWrapper: {
    alignItems: "center",
    gap: 6,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  uploadSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "500",
    paddingHorizontal: 12,
  },
  uploadBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 2,
  },
  uploadBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D97706",
    textTransform: "uppercase",
  },
  previewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#CBD5E1",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  statusBadgePending: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  pendingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#D97706",
  },
  statusTextPending: {
    fontSize: 9,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 0.4,
  },
  videoWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
  },
  footer: {
    gap: 10,
    marginTop: 2,
  },
  primaryActionButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 10,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.4,
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
  fullWidthButton: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  greenText: {
    color: "#059669",
  },
});

export default VideoUploadSection;
