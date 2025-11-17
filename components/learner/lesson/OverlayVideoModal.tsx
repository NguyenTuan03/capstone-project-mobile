import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEvent } from "expo";
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
          {/* Modern Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons
                name="compare"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.modalTitle} numberOfLines={1}>
                Video So Sánh
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
              activeOpacity={0.6}
            >
              <MaterialCommunityIcons
                name="close"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
          >
            {overlayVideoUrl && (
              <View style={styles.modalVideoWrapper}>
                <LessonVideoPlayer source={overlayVideoUrl} />
                <View style={styles.infoBox}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={16}
                    color="#0891B2"
                  />
                  <Text style={styles.modalVideoDescription}>
                    Kỹ thuật của bạn (mờ) so sánh với video mẫu
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Video Player */}
          <View style={styles.modalVideoContainer}>
            {isOverlayLoading && (
              <View style={styles.videoLoadingOverlay}>
                <ActivityIndicator size="large" color="#059669" />
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
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={32}
                  color="#EF4444"
                />
                <Text style={styles.errorText}>
                  Không thể tải video
                </Text>
              </View>
            )}
          </View>

          {/* Modern Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalFooterButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="check"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.modalFooterButtonText}>Đã hiểu</Text>
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
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#059669",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  modalVideoWrapper: {
    gap: 8,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderLeftWidth: 4,
    borderLeftColor: "#0891B2",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  modalVideoDescription: {
    fontSize: 12,
    color: "#0891B2",
    lineHeight: 16,
    flex: 1,
    fontWeight: "500",
  },
  modalVideoContainer: {
    marginVertical: 8,
    marginHorizontal: 12,
    gap: 6,
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
    position: "relative",
  },
  videoPlayer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  videoLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    gap: 8,
  },
  videoLoadingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
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
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "500",
  },
  modalFooter: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  modalFooterButton: {
    backgroundColor: "#059669",
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  modalFooterButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});

export default OverlayVideoModal;

