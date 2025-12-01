import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import AchievementIcon from "./AchievementIcon";
import type {
    AchievementProgress,
    EarnedAchievement,
} from "./types";

interface AchievementItemProps {
  item: AchievementProgress | EarnedAchievement;
}

export default function AchievementItem({ item }: AchievementItemProps) {
  const achievement =
    "achievement" in item ? item.achievement : (item as any).achievement;
  const isEarned = "isEarned" in item ? item.isEarned : "earnedAt" in item;
  const currentProgress =
    "currentProgress" in item ? item.currentProgress : undefined;
  const earnedAt = "earnedAt" in item ? item.earnedAt : undefined;
  const targetValue = achievement.targetValue
    ? parseFloat(achievement.targetValue)
    : 0;
  const progressPercentage =
    currentProgress !== undefined && targetValue > 0
      ? Math.min((currentProgress / targetValue) * 100, 100)
      : 0;

  const formatEarnedDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <View
      style={[
        styles.achievementCard,
        isEarned && styles.achievementCardEarned,
      ]}
    >
      <View style={styles.achievementRow}>
        <View style={styles.achievementLeft}>
          <AchievementIcon achievement={achievement} isEarned={isEarned} />
        </View>

        <View style={styles.achievementRight}>
          <View style={styles.achievementHeader}>
            <Text style={styles.achievementName} numberOfLines={1}>
              {achievement.name}
            </Text>
            {isEarned && (
              <View style={styles.earnedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              </View>
            )}
          </View>

          <Text style={styles.achievementDescription} numberOfLines={2}>
            {achievement.description}
          </Text>

          {isEarned && earnedAt ? (
            <View style={styles.earnedInfo}>
              <Ionicons name="calendar-outline" size={14} color="#059669" />
              <Text style={styles.earnedDateText}>
                {formatEarnedDate(earnedAt)}
              </Text>
            </View>
          ) : currentProgress !== undefined ? (
            <View style={styles.progressSection}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercentage}%` },
                  ]}
                />
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                  {currentProgress} / {targetValue}
                </Text>
                <Text style={styles.progressPercent}>
                  {Math.round(progressPercentage)}%
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  achievementCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  achievementCardEarned: {
    borderColor: "#D1FAE5",
    backgroundColor: "#FFFFFF",
  },
  achievementRow: {
    flexDirection: "row",
    gap: 16,
  },
  achievementLeft: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  achievementRight: {
    flex: 1,
    gap: 8,
  },
  achievementHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  achievementName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
  },
  earnedBadge: {
    padding: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  earnedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  earnedDateText: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "600",
  },
  progressSection: {
    marginTop: 4,
    gap: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#059669",
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: "700",
    color: "#047857",
  },
});

