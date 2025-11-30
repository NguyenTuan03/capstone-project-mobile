import achievementService from "@/services/achievement.service";
import type { LearnerAchievement } from "@/types/achievement";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const ACHIEVEMENTS_PER_PAGE = 12;

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const [achievements, setAchievements] = useState<LearnerAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchAchievements = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const response = await achievementService.getMyEarnedAchievements(
          pageNum,
          ACHIEVEMENTS_PER_PAGE
        );

        if (append) {
          setAchievements((prev) => [...prev, ...(response.items || [])]);
        } else {
          setAchievements(response.items || []);
        }

        setTotal(response.total || 0);
        setPage(response.page || pageNum);
      } catch {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không thể tải thành tích",
          position: "top",
          visibilityTime: 3000,
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchAchievements(1, false);
  }, [fetchAchievements]);

  const loadMore = useCallback(() => {
    if (!loadingMore && achievements.length < total) {
      fetchAchievements(page + 1, true);
    }
  }, [achievements.length, fetchAchievements, loadingMore, page, total]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thành tích</Text>
          <View style={styles.headerSpacer} />
        </View>
        <Text style={styles.headerSubtitle}>
          {total > 0 ? `${total} thành tích đã đạt được` : "Chưa có thành tích"}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : achievements.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          bounces={false}
        >
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="trophy-outline" size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có thành tích</Text>
            <Text style={styles.emptyText}>
              Hoàn thành các khóa học và bài tập để nhận thành tích
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Section */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <View style={styles.statIconBox}>
                <Ionicons name="trophy" size={28} color="#D97706" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Tổng thành tích</Text>
                <Text style={styles.statValue}>{total}</Text>
              </View>
              <View style={styles.statProgress}>
                <View style={styles.progressDot} />
              </View>
            </View>
          </View>

          {/* Achievements Grid */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Thành tích đã đạt được</Text>
            <View style={styles.achievementGrid}>
              {achievements.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.achievementCard}
                  activeOpacity={0.7}
                >
                  {/* Achievement Icon */}
                  <View style={styles.iconContainer}>
                    {item.achievement.iconUrl ? (
                      <Image
                        source={{ uri: item.achievement.iconUrl }}
                        style={styles.achievementIcon}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.placeholderIcon}>
                        <Ionicons
                          name="medal-outline"
                          size={36}
                          color="#059669"
                        />
                      </View>
                    )}
                    <View style={styles.earnedBadge}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  </View>

                  {/* Achievement Info */}
                  <View style={styles.achievementInfo}>
                    <Text
                      style={styles.achievementName}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.achievement.name}
                    </Text>
                    {item.achievement.description && (
                      <Text
                        style={styles.achievementDescription}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {item.achievement.description}
                      </Text>
                    )}
                    <View style={styles.earnedDateContainer}>
                      <Ionicons
                        name="calendar-outline"
                        size={11}
                        color="#9CA3AF"
                      />
                      <Text style={styles.earnedDate}>
                        {formatDate(item.earnedAt)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Load More */}
          {loadingMore ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#059669" />
            </View>
          ) : achievements.length < total ? (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={loadMore}
              activeOpacity={0.8}
            >
              <Text style={styles.loadMoreText}>Tải thêm</Text>
            </TouchableOpacity>
          ) : null}

          {/* Footer Spacing */}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerSection: {
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    width: 36,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: "center",
    gap: 16,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  statsSection: {
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  statIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#059669",
  },
  statProgress: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#059669",
  },
  sectionContainer: {
    gap: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 4,
  },
  achievementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 11,
    justifyContent: "space-between",
  },
  achievementCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    position: "relative",
    width: 68,
    height: 68,
  },
  achievementIcon: {
    width: 68,
    height: 68,
    borderRadius: 14,
  },
  placeholderIcon: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  earnedBadge: {
    position: "absolute",
    bottom: -6,
    right: -6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    shadowColor: "#059669",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  achievementInfo: {
    width: "100%",
    gap: 6,
  },
  achievementName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    lineHeight: 18,
  },
  achievementDescription: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
  },
  earnedDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  earnedDate: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadMoreBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#059669",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 12,
    shadowColor: "#059669",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  loadMoreText: {
    color: "#059669",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
