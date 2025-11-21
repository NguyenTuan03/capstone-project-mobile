import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { VideoType } from "../../../types/video";
import CoachVideoCard from "./CoachVideoCard";

interface VideoDetailsModalProps {
  visible: boolean;
  videos: VideoType[];
  onClose: () => void;
  title?: string;
}

const VideoDetailsModal: React.FC<VideoDetailsModalProps> = ({
  visible,
  videos,
  onClose,
  title = "Video từ Coach",
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Ionicons name="videocam" size={24} color="#059669" />
              <Text style={styles.modalTitle}>{title}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{videos.length}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {videos.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="film-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>Chưa có video nào</Text>
              </View>
            ) : (
              videos.map((video) => (
                <CoachVideoCard key={video.id} video={video} />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  countBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },
});

export default VideoDetailsModal;
