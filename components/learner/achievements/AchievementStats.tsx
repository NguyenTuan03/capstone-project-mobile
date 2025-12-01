import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { AchievementStats as AchievementStatsType } from "./types";

interface AchievementStatsProps {
  stats: AchievementStatsType | null;
}

export default function AchievementStats({ stats }: AchievementStatsProps) {
  if (!stats) return null;

  return (
    <View style={styles.statsWrapper}>
      <View style={styles.statsCard}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="trophy" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats.totalEarned}</Text>
            <Text style={styles.statLabel}>Đã đạt được</Text>
          </View>

          <View style={[styles.statItem, styles.statItemMiddle]}>
            <View style={[styles.statIconBg, { backgroundColor: "#DBEAFE" }]}>
              <Ionicons name="hourglass" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{stats.totalInProgress}</Text>
            <Text style={styles.statLabel}>Đang làm</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: "#D1FAE5" }]}>
              <Ionicons name="trending-up" size={28} color="#10B981" />
            </View>
            <Text style={styles.statValue}>
              {Math.round(stats.completionRate)}%
            </Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsWrapper: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  statsCard: {
    borderRadius: 16,
    backgroundColor: "#059669",
    padding: 20,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statItemMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  statIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "600",
    textAlign: "center",
  },
});

