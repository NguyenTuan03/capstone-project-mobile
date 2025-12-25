import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  video: VideoType | undefined;
  onClose: () => void;
  title?: string;
}

const VideoDetailsModal: React.FC<VideoDetailsModalProps> = ({
  visible,
  video,
  onClose,
  title = "Video từ HLV",
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <View style={styles.titleWrapper}>
              <LinearGradient
                colors={["#ECFDF5", "#D1FAE5"]}
                style={styles.iconBox}
              >
                <Ionicons name="school" size={20} color="#059669" />
              </LinearGradient>
              <View>
                <Text style={styles.titleText}>{title}</Text>
                <Text style={styles.subtitleText}>
                  Giáo trình huấn luyện nâng cao
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={28} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {video ? (
              <CoachVideoCard video={video} fullDescription={true} />
            ) : (
              <View style={styles.empty}>
                <View style={styles.emptyCircle}>
                  <Ionicons name="videocam-off" size={64} color="#059669" />
                </View>
                <Text style={styles.emptyTitle}>Nội dung chưa sẵn sàng</Text>
                <Text style={styles.emptyText}>
                  Video hướng dẫn đang được HLV chuẩn bị. Vui lòng quay lại sau!
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 25,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  titleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  titleText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
  },
});

export default VideoDetailsModal;
