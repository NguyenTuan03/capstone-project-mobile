import { Ionicons } from "@expo/vector-icons";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import AchievementItem from "./AchievementItem";
import type {
    AchievementProgress,
    EarnedAchievement,
    TabType,
} from "./types";

interface AchievementTabContentProps {
  activeTab: TabType;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  allAchievements: AchievementProgress[];
  earnedAchievements: EarnedAchievement[];
  progressAchievements: AchievementProgress[];
  onRefresh: () => void;
  onRetry: () => void;
  onLoadMoreEarned: () => void;
  onLoadMoreProgress: () => void;
  onLoadMore: () => void;
  loadingMoreEarned: boolean;
  loadingMoreProgress: boolean;
  loadingMore: boolean;
}

export default function AchievementTabContent({
  activeTab,
  loading,
  refreshing,
  error,
  allAchievements,
  earnedAchievements,
  progressAchievements,
  onRefresh,
  onRetry,
  onLoadMoreEarned,
  onLoadMoreProgress,
  onLoadMore,
  loadingMoreEarned,
  loadingMoreProgress,
  loadingMore,
}: AchievementTabContentProps) {
  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Đang tải thành tựu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorIcon}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  if (activeTab === "earned") {
    // Filter: Đã hoàn thành: isEarned === true || currentProgress === 100
    const completedAchievements = allAchievements.filter(
      (item) => item.isEarned || item.currentProgress === 100
    );

    if (completedAchievements.length === 0 && earnedAchievements.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="trophy-outline" size={80} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có thành tựu</Text>
          <Text style={styles.emptySubtext}>
            Hãy tiếp tục học tập để mở khóa thành tựu đầu tiên!
          </Text>
        </View>
      );
    }

    // Use earnedAchievements from API if available, otherwise use completed from allAchievements
    const displayData =
      earnedAchievements.length > 0
        ? earnedAchievements.map((ea) => ({
            achievement: ea.achievement,
            currentProgress: 100,
            updatedAt: ea.earnedAt,
            isEarned: true,
          }))
        : completedAchievements;

    return (
      <FlatList
        data={displayData}
        renderItem={({ item }) => <AchievementItem item={item} />}
        keyExtractor={(item) => `earned-${item.achievement.id}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#059669"
            colors={["#059669"]}
          />
        }
        onEndReached={onLoadMoreEarned}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMoreEarned ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#059669" />
            </View>
          ) : null
        }
      />
    );
  }

  if (activeTab === "progress") {
    if (progressAchievements.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="checkmark-done-circle-outline"
              size={80}
              color="#10B981"
            />
          </View>
          <Text style={styles.emptyTitle}>Tuyệt vời!</Text>
          <Text style={styles.emptySubtext}>
            Bạn đã hoàn thành tất cả thành tựu hiện có
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={progressAchievements}
        renderItem={({ item }) => <AchievementItem item={item} />}
        keyExtractor={(item) => `progress-${item.achievement.id}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#059669"
            colors={["#059669"]}
          />
        }
        onEndReached={onLoadMoreProgress}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMoreProgress ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#059669" />
            </View>
          ) : null
        }
      />
    );
  }

  // All tab
  if (allAchievements.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons name="trophy-outline" size={80} color="#D1D5DB" />
        </View>
        <Text style={styles.emptyTitle}>Không có thành tựu</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={allAchievements}
      renderItem={({ item, index }) => (
        <AchievementItem item={item} />
      )}
      keyExtractor={(item, index) => `all-${item.achievement.id}-${index}`}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#059669"
          colors={["#059669"]}
        />
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.loadMoreContainer}>
            <ActivityIndicator size="small" color="#059669" />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  errorIcon: {
    marginBottom: 8,
  },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    color: "#EF4444",
    textAlign: "center",
    fontWeight: "500",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#059669",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

