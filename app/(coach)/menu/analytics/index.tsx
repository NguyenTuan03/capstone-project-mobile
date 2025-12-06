import coachService from "@/services/coach.service";
import storageService from "@/services/storageService";
import { MonthlyData } from "@/types/coach";
import { User } from "@/types/user";
import { formatPrice } from "@/utils/priceFormat";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");

export default function CoachAnalyticsScreen() {
  const [timeRange, setTimeRange] = useState<"3months" | "6months" | "1year">(
    "6months"
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [revenueData, setRevenueData] = useState<number>(0);
  const [learnerData, setLearnerData] = useState<number>(0);
  const [courseData, setCourseData] = useState<number>(0);
  const [ratingData, setRatingData] = useState<{
    overall: number;
    total: number;
  } | null>(null);

  // Monthly data arrays for charts
  const [revenueMonthly, setRevenueMonthly] = useState<MonthlyData[]>([]);
  const [learnerMonthly, setLearnerMonthly] = useState<MonthlyData[]>([]);
  const [courseMonthly, setCourseMonthly] = useState<MonthlyData[]>([]);

  const loadData = useCallback(async () => {
    const currentUser = await storageService.getUser();
    setUser(currentUser);

    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch all data without month/year filters to get aggregate data
      const [revenue, learners, courses, rating] = await Promise.all([
        coachService.getMonthlyRevenue(currentUser.id),
        coachService.getMonthlyLearnerCount(currentUser.id),
        coachService.getMonthlyCourseCount(currentUser.id),
        coachService.loadRating(currentUser.id),
      ]);

      // Store monthly data for charts
      setRevenueMonthly(revenue.data);
      setLearnerMonthly(learners.data);
      setCourseMonthly(courses.data);
      setRatingData(rating);

      // Calculate totals from all months
      const totalRevenue = revenue.data.reduce(
        (sum, item) => sum + item.data,
        0
      );
      const totalLearners = learners.data.reduce(
        (sum, item) => sum + item.data,
        0
      );
      const totalCourses = courses.data.reduce(
        (sum, item) => sum + item.data,
        0
      );

      setRevenueData(totalRevenue);
      setLearnerData(totalLearners);
      setCourseData(totalCourses);
    } catch (error) {
 "❌ Failed to load analytics data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper function to format month labels
  const formatMonthLabel = (month: string) => {
    const [m] = month.split("/");
    return `${m}`;
  };

  // Helper function to prepare chart data
  const prepareChartData = (monthlyData: MonthlyData[]) => {
    if (monthlyData.length === 0) {
      return {
        labels: [""],
        datasets: [{ data: [0] }],
      };
    }

    const dataPoints = monthlyData.map((item) => item.data);

    // Check if all values are 0, add small minimum value to prevent NaN
    // while keeping the shape of the data
    const allZero = dataPoints.every((val) => val === 0);
    const chartData = allZero
      ? dataPoints.map(() => 0.001) // Very small value shows flat line at 0
      : dataPoints;

    return {
      labels: monthlyData.map((item) => formatMonthLabel(item.month)),
      datasets: [
        {
          data: chartData,
        },
      ],
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Đang tải dữ liệu phân tích...</Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#10B981",
    },
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#059669"
        />
      }
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Phân tích học viên</Text>
          <Text style={styles.meta}>
            Theo dõi hiệu quả và phát triển kinh doanh
          </Text>
        </View>
      </View>

      {/* Overview cards */}
      <View style={styles.grid5}>
        <KPI
          title="Tổng học viên"
          value={`${learnerData}`}
          hint={`Tổng số học viên`}
        />
        <KPI
          title="Doanh thu"
          value={`${formatPrice(revenueData)}`}
          hint={`Tổng doanh thu`}
        />
        <KPI
          title="Đánh giá TB"
          value={`${ratingData?.overall}/5`}
          hint={`${ratingData?.total} đánh giá`}
        />
        <KPI
          title="Tổng khóa học"
          value={`${courseData}`}
          hint={`Số khóa học đã tạo`}
        />
      </View>

      {/* Revenue Chart */}
      {revenueMonthly.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Doanh thu theo tháng</Text>
          <LineChart
            data={prepareChartData(revenueMonthly)}
            width={width - 64}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
            }}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
          />
        </View>
      )}

      {/* Learners Chart */}
      {learnerMonthly.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Học viên theo tháng</Text>
          <LineChart
            data={prepareChartData(learnerMonthly)}
            width={width - 64}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#3B82F6",
              },
            }}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
          />
        </View>
      )}

      {/* Courses Chart */}
      {courseMonthly.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Khóa học theo tháng</Text>
          <LineChart
            data={prepareChartData(courseMonthly)}
            width={width - 64}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#8B5CF6",
              },
            }}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
          />
        </View>
      )}

      {/* Info message */}
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          📊 Dữ liệu phân tích chi tiết sẽ được cập nhật khi backend API hỗ trợ
          đầy đủ các endpoint analytics.
        </Text>
      </View>
    </ScrollView>
  );
}

function KPI({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {hint ? <Text style={styles.kpiHint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontWeight: "700", color: "#111827", fontSize: 20 },
  meta: { color: "#6B7280", fontSize: 12, marginTop: 4 },
  rangeRow: { flexDirection: "row", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  chipActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  chipText: { color: "#111827", fontWeight: "600", fontSize: 11 },
  chipTextActive: { color: "#fff" },

  grid5: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  kpi: {
    flexBasis: "48%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 12,
  },
  kpiTitle: { color: "#6B7280", fontSize: 12 },
  kpiValue: { color: "#111827", fontWeight: "700", marginTop: 4, fontSize: 18 },
  kpiHint: { color: "#6B7280", fontSize: 11, marginTop: 4 },

  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    alignItems: "center",
  },
  chartTitle: {
    fontWeight: "700",
    color: "#111827",
    fontSize: 16,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  chart: {
    borderRadius: 16,
  },

  infoCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 16,
  },
  infoText: {
    color: "#1E40AF",
    fontSize: 13,
    lineHeight: 20,
  },
});
