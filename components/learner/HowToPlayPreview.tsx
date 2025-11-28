import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface HowToPlayPreviewProps {
  onPress: () => void;
}

export default function HowToPlayPreview({ onPress }: HowToPlayPreviewProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.animationContainer}>
          <LottieView
            source={require("@/assets/animations/pickleball-bounce.json")}
            autoPlay
            loop
            style={styles.animation}
          />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Cách Chơi Pickleball</Text>
            <Ionicons name="chevron-forward" size={18} color="#059669" />
          </View>
          <Text style={styles.subtitle}>
            Tìm hiểu các quy tắc và kỹ thuật cơ bản
          </Text>
        </View>
      </View>

      <View style={styles.badge}>
        <MaterialCommunityIcons name="play-circle" size={16} color="#fff" />
        <Text style={styles.badgeText}>Mở hướng dẫn</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBFBB0",
    overflow: "hidden",
    marginBottom: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  animationContainer: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  animation: {
    width: 52,
    height: 52,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.2,
    flex: 1,
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "400",
    lineHeight: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 8,
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.2,
  },
});
