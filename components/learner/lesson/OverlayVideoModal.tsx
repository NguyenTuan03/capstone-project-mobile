import { useEvent } from "expo";
import type { PlayerError } from "expo-video";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import LessonVideoPlayer from "./LessonVideoPlayer";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface OverlayVideoModalProps {
  visible: boolean;
  overlayVideoUrl: string | null;
  onClose: () => void;
}

const OverlayVideoModal: React.FC<OverlayVideoModalProps> = ({
  visible,
  overlayVideoUrl,
  onClose,
}) => {
  const overlayVideoPlayer = useVideoPlayer(
    overlayVideoUrl ? { uri: overlayVideoUrl, contentType: "auto" } : null,
    (p) => {
      p.loop = false;
    }
  );

  useEffect(() => {
    if (overlayVideoUrl && overlayVideoPlayer) {
      overlayVideoPlayer.replaceAsync({
        uri: overlayVideoUrl,
        contentType: "auto",
      });
    }
  }, [overlayVideoUrl, overlayVideoPlayer]);

  const overlayStatusEvent = useEvent(overlayVideoPlayer, "statusChange", {
    status: overlayVideoPlayer.status,
  });
  const overlayStatus = overlayStatusEvent?.status ?? overlayVideoPlayer.status;
  const overlayPlayerError: PlayerError | undefined =
    overlayStatusEvent?.error ?? undefined;
  const isOverlayLoading = overlayStatus === "loading";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📊 Video So Sánh với Coach</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
          >
            {overlayVideoUrl && (
              <View style={styles.modalVideoWrapper}>
                <LessonVideoPlayer source={overlayVideoUrl} />
                <Text style={styles.modalVideoDescription}>
                  Video này là kết quả so sánh giữa kỹ thuật của bạn và coach.
                  Video của bạn được hiển thị với độ mờ 50% chồng lên video mẫu
                  của coach.
                </Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.modalVideoContainer}>
            {isOverlayLoading && (
              <View style={styles.videoLoadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.videoLoadingText}>Đang tải video...</Text>
              </View>
            )}
            <VideoView
              style={styles.videoPlayer}
              player={overlayVideoPlayer}
              allowsFullscreen
              allowsPictureInPicture
              crossOrigin="anonymous"
            />
            {overlayStatus === "error" && (
              <View style={styles.videoErrorOverlay}>
                <Text style={styles.errorText}>
                  Không phát được video:{" "}
                  {String(overlayPlayerError ?? "Unknown")}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalFooterButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.modalFooterButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.95,
    maxHeight: SCREEN_HEIGHT * 0.9,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#059669",
    borderBottomWidth: 1,
    borderBottomColor: "#047857",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 16,
  },
  modalVideoWrapper: {
    gap: 12,
  },
  modalVideoDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  modalVideoContainer: {
    marginTop: 9,
    marginHorizontal: 16,
    marginBottom: 9,
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
    position: "relative",
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
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  modalFooterButton: {
    backgroundColor: "#059669",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  modalFooterButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

export default OverlayVideoModal;

