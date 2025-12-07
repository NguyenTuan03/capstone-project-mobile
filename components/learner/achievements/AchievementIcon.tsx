import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import type { Achievement } from "./types";

interface AchievementIconProps {
  achievement: Achievement;
  isEarned: boolean;
}

export default function AchievementIcon({
  achievement,
  isEarned,
}: AchievementIconProps) {
  const [imageError, setImageError] = useState(false);
  const hasValidIconUrl =
    achievement.iconUrl &&
    typeof achievement.iconUrl === "string" &&
    achievement.iconUrl.trim() !== "" &&
    achievement.iconUrl !== "null" &&
    achievement.iconUrl !== "undefined" &&
    (achievement.iconUrl.startsWith("http") ||
      achievement.iconUrl.startsWith("https"));

  // Convert SVG URL to PNG for React Native compatibility
  const getImageUrl = (url: string): string => {
    if (url.includes("dicebear.com") && url.includes("/svg?")) {
      // Replace /svg? with /png? for dicebear API
      return url.replace("/svg?", "/png?");
    }
    return url;
  };

  if (!hasValidIconUrl || imageError) {
    return (
      <Ionicons
        name="trophy"
        size={36}
        color={isEarned ? "#F59E0B" : "#9CA3AF"}
      />
    );
  }

  const imageUrl = getImageUrl(achievement.iconUrl);

  return (
    <View style={[styles.iconWrapper, isEarned && styles.iconWrapperEarned]}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.icon}
        resizeMode="cover"
        onError={() => {
          setImageError(true);
        }}
      />
      {isEarned && (
        <View style={styles.earnedCheckmark}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "visible",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#E5E7EB",
  },
  iconWrapperEarned: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  earnedCheckmark: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
});
