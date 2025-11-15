import { useEvent } from "expo";
import type { PlayerError } from "expo-video";
import { useVideoPlayer, VideoView } from "expo-video";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface LessonVideoPlayerProps {
  source: string;
}

const LessonVideoPlayer: React.FC<LessonVideoPlayerProps> = ({ source }) => {
  const player = useVideoPlayer({ uri: source, contentType: "auto" }, (p) => {
    p.loop = false;
  });

  const statusEvent = useEvent(player, "statusChange", {
    status: player.status,
  });
  const status = statusEvent?.status ?? player.status;
  const playerError: PlayerError | undefined = statusEvent?.error ?? undefined;

  const isLoading = status === "loading";

  return (
    <View style={styles.videoContainer}>
      {isLoading && (
        <View style={styles.videoLoadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.videoLoadingText}>Đang tải video...</Text>
        </View>
      )}
      <VideoView
        style={styles.videoPlayer}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        crossOrigin="anonymous"
      />
      {status === "error" && (
        <View style={styles.videoErrorOverlay}>
          <Text style={styles.errorText}>
            Không phát được video: {String(playerError ?? "Unknown")}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  videoContainer: {
    marginTop: 9,
    gap: 8,
    padding: 8,
    borderRadius: 9,
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  videoPlayer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  videoLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    gap: 8,
  },
  videoLoadingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
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
    padding: 16,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    textAlign: "center",
  },
});

export default LessonVideoPlayer;

