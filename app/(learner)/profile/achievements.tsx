import AchievementStats from "@/components/learner/achievements/AchievementStats";
import AchievementTabContent from "@/components/learner/achievements/AchievementTabContent";
import AchievementTabs from "@/components/learner/achievements/AchievementTabs";
import { achievementStyles } from "@/components/learner/achievements/styles";
import type {
  AchievementProgress,
  AchievementStats as AchievementStatsType,
  AllAchievementsResponse,
  EarnedAchievement,
  EarnedAchievementsResponse,
  TabType,
} from "@/components/learner/achievements/types";
import { get } from "@/services/http/httpService";
import storageService from "@/services/storageService";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AchievementStatsType | null>(null);
  const [earnedAchievements, setEarnedAchievements] = useState<
    EarnedAchievement[]
  >([]);
  const [earnedPage, setEarnedPage] = useState(1);
  const [earnedTotalPages, setEarnedTotalPages] = useState(1);
  const [loadingMoreEarned, setLoadingMoreEarned] = useState(false);
  const [progressAchievements, setProgressAchievements] = useState<
    AchievementProgress[]
  >([]);
  const [progressPage, setProgressPage] = useState(1);
  const [progressTotalPages, setProgressTotalPages] = useState(1);
  const [loadingMoreProgress, setLoadingMoreProgress] = useState(false);
  const [allAchievements, setAllAchievements] = useState<AchievementProgress[]>(
    []
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const token = await storageService.getToken();
      const response = await get<AchievementStatsType>(
        `${API_URL}/v1/achievements/my-stats`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      setStats(response.data);
    } catch (err: any) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  const fetchEarnedAchievements = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        const token = await storageService.getToken();
        const response = await get<EarnedAchievementsResponse>(
          `${API_URL}/v1/achievements/my-earned?page=${pageNum}&pageSize=10`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );
        if (append) {
          setEarnedAchievements((prev) => [...prev, ...response.data.data]);
        } else {
          setEarnedAchievements(response.data.data);
        }
        setEarnedPage(response.data.page);
        setEarnedTotalPages(response.data.totalPages);
      } catch (err: any) {
        console.error("Error fetching earned achievements:", err);
        if (!append) {
          setEarnedAchievements([]);
        }
      }
    },
    []
  );

  const fetchAllAchievements = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        const token = await storageService.getToken();
        const response = await get<AllAchievementsResponse>(
          `${API_URL}/v1/achievements/my-progress?page=${pageNum}&pageSize=10`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );
        if (append) {
          setAllAchievements((prev) => [...prev, ...response.data.data]);
        } else {
          setAllAchievements(response.data.data);
        }
        setPage(response.data.page);
        setTotalPages(response.data.totalPages);
      } catch (err: any) {
        console.error("Error fetching all achievements:", err);
        setError("Không thể tải thành tựu. Vui lòng thử lại.");
      }
    },
    []
  );

  const fetchProgressAchievements = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        const token = await storageService.getToken();
        const response = await get<AllAchievementsResponse>(
          `${API_URL}/v1/achievements/my-progress?page=${pageNum}&pageSize=10`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );
        // Filter: Đang thực hiện: isEarned === false && currentProgress > 0 && currentProgress < 100
        const inProgressData = response.data.data.filter(
          (item) =>
            !item.isEarned &&
            item.currentProgress > 0 &&
            item.currentProgress < 100
        );
        if (append) {
          setProgressAchievements((prev) => [...prev, ...inProgressData]);
        } else {
          setProgressAchievements(inProgressData);
        }
        setProgressPage(response.data.page);
        setProgressTotalPages(response.data.totalPages);
      } catch (err: any) {
        console.error("Error fetching progress achievements:", err);
        if (!append) {
          setProgressAchievements([]);
        }
      }
    },
    []
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchStats(),
        fetchEarnedAchievements(1, false),
        fetchAllAchievements(1, false),
        fetchProgressAchievements(1, false),
      ]);
    } catch {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [
    fetchStats,
    fetchEarnedAchievements,
    fetchAllAchievements,
    fetchProgressAchievements,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setEarnedPage(1);
    setProgressPage(1);
    try {
      await Promise.all([
        fetchStats(),
        fetchEarnedAchievements(1, false),
        fetchAllAchievements(1, false),
        fetchProgressAchievements(1, false),
      ]);
    } catch {
      setError("Không thể làm mới dữ liệu. Vui lòng thử lại.");
    } finally {
      setRefreshing(false);
    }
  }, [
    fetchStats,
    fetchEarnedAchievements,
    fetchAllAchievements,
    fetchProgressAchievements,
  ]);

  const loadMoreEarned = useCallback(async () => {
    if (
      loadingMoreEarned ||
      earnedPage >= earnedTotalPages ||
      activeTab !== "earned"
    )
      return;
    setLoadingMoreEarned(true);
    try {
      await fetchEarnedAchievements(earnedPage + 1, true);
    } catch (err) {
      console.error("Error loading more earned:", err);
    } finally {
      setLoadingMoreEarned(false);
    }
  }, [
    earnedPage,
    earnedTotalPages,
    activeTab,
    fetchEarnedAchievements,
    loadingMoreEarned,
  ]);

  const loadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages || activeTab !== "all") return;
    setLoadingMore(true);
    try {
      await fetchAllAchievements(page + 1, true);
    } catch (err) {
      console.error("Error loading more:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, totalPages, activeTab, fetchAllAchievements, loadingMore]);

  const loadMoreProgress = useCallback(async () => {
    if (
      loadingMoreProgress ||
      progressPage >= progressTotalPages ||
      activeTab !== "progress"
    )
      return;
    setLoadingMoreProgress(true);
    try {
      await fetchProgressAchievements(progressPage + 1, true);
    } catch (err) {
      console.error("Error loading more progress:", err);
    } finally {
      setLoadingMoreProgress(false);
    }
  }, [
    progressPage,
    progressTotalPages,
    activeTab,
    fetchProgressAchievements,
    loadingMoreProgress,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <View style={[achievementStyles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={achievementStyles.header}>
        <Pressable
          style={achievementStyles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={achievementStyles.headerTitle}>Thành tựu của tôi</Text>
        <View style={achievementStyles.headerRight} />
      </View>

      {/* Stats Section */}
      <AchievementStats stats={stats} />

      {/* Tabs */}
      <AchievementTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={stats}
      />

      {/* Content */}
      <AchievementTabContent
        activeTab={activeTab}
        loading={loading}
        refreshing={refreshing}
        error={error}
        allAchievements={allAchievements}
        earnedAchievements={earnedAchievements}
        progressAchievements={progressAchievements}
        onRefresh={onRefresh}
        onRetry={loadData}
        onLoadMoreEarned={loadMoreEarned}
        onLoadMoreProgress={loadMoreProgress}
        onLoadMore={loadMore}
        loadingMoreEarned={loadingMoreEarned}
        loadingMoreProgress={loadingMoreProgress}
        loadingMore={loadingMore}
      />
    </View>
  );
}

