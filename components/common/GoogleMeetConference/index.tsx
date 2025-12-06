import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface GoogleMeetConferenceProps {
  isVisible: boolean;
  onClose: () => void;
  meetLink: string; // Google Meet link (e.g., https://meet.google.com/abc-defg-hij)
  userName?: string;
}

const GoogleMeetConference: React.FC<GoogleMeetConferenceProps> = ({
  isVisible,
  onClose,
  meetLink,
  userName = "Bạn",
}) => {
  const openMeetInBrowser = useCallback(async () => {
    try {
      const result = await WebBrowser.openBrowserAsync(meetLink);

      // Close the modal when browser is closed
      if (result.type === "cancel" || result.type === "dismiss") {
        onClose();
      }
    } catch (error) {
      // Fallback: try to open with system default handler
      try {
        await Linking.openURL(meetLink);
        onClose();
      } catch {
        Alert.alert(
          "Lỗi",
          "Không thể mở Google Meet. Vui lòng kiểm tra kết nối internet."
        );
      }
    }
  }, [meetLink, onClose]);

  React.useEffect(() => {
    if (isVisible) {
      openMeetInBrowser();
    }
     
  }, [isVisible, openMeetInBrowser]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Lớp học trực tuyến</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Loading/Info Message */}
        <View style={styles.loadingContainer}>
          <Ionicons name="videocam" size={64} color="#059669" />
          <Text style={styles.loadingText}>Đang mở Google Meet...</Text>
          <Text style={styles.infoText}>
            Google Meet sẽ mở trong trình duyệt của bạn
          </Text>
          <ActivityIndicator
            size="large"
            color="#059669"
            style={{ marginTop: 20 }}
          />
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <View style={styles.userInfo}>
            <Ionicons name="person-circle" size={32} color="#059669" />
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity
            style={styles.exitButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Ionicons name="exit" size={20} color="#FFFFFF" />
            <Text style={styles.exitButtonText}>Thoát</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  exitButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EF4444",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exitButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default GoogleMeetConference;
