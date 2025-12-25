import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface LessonVideoPlayerProps {
  source: string;
}

const LessonVideoPlayer: React.FC<LessonVideoPlayerProps> = ({ source }) => {
  // useVideoPlayer is optimized for fast loading and low latency
  const player = useVideoPlayer({ uri: source, contentType: "auto" }, (p) => {
    p.loop = false;
    p.pause();
  });

  const { status, error } = useEvent(player, "statusChange", {
    status: player.status,
  });

  // Fast loading state detection
  const isBuffering = status === "loading" || player.status === "loading";
  const hasError = status === "error";

  return (
    <View style={styles.videoContainer}>
      <VideoView
        style={styles.videoPlayer}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        contentFit="contain"
      />

      {isBuffering && (
        <View style={styles.videoLoadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.videoLoadingText}>Đang tải...</Text>
        </View>
      )}

      {hasError && (
        <View style={styles.videoErrorOverlay}>
          <Text style={styles.errorText}>
            Không phát được video:{" "}
            {String(error?.message || "Lỗi đường truyền")}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: "#000000",
    overflow: "hidden",
    position: "relative",
  },
  videoPlayer: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  videoLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    gap: 8,
  },
  videoLoadingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  videoErrorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    padding: 20,
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    textAlign: "center",
    fontWeight: "500",
  },
});

export default LessonVideoPlayer;
