import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Overview = {
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  totalSessions: number;
  growthRate: number;
};

type Monthly = {
  month: string;
  students: number;
  revenue: number;
  sessions: number;
};
type Source = { source: string; count: number; percentage: number };
type CoursePerf = {
  courseName: string;
  enrollments: number;
  completionRate: number;
  revenue: number;
  averageRating: number;
};

export default function CoachAnalyticsScreen() {
  const [timeRange, setTimeRange] = useState<"3months" | "6months" | "1year">(
    "6months"
  );

  const data = useMemo(() => getMockData(timeRange), [timeRange]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Phân tích học viên</Text>
          <Text style={styles.meta}>
            Theo dõi hiệu quả và phát triển kinh doanh
          </Text>
        </View>
        <View style={styles.rangeRow}>
          {(["3months", "6months", "1year"] as const).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setTimeRange(r)}
              activeOpacity={0.9}
              style={[styles.chip, timeRange === r && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  timeRange === r && styles.chipTextActive,
                ]}
              >
                {r === "3months"
                  ? "3 tháng"
                  : r === "6months"
                  ? "6 tháng"
                  : "1 năm"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Overview cards */}
      <View style={styles.grid5}>
        <KPI
          title="Tổng học viên"
          value={`${data.overview.totalStudents}`}
          hint={`+${data.overview.growthRate}% so với kỳ trước`}
        />
        <KPI
          title="Doanh thu"
          value={`${formatPrice(data.overview.totalRevenue)}đ`}
          hint={`+${Math.round(data.overview.growthRate)}% so với kỳ trước`}
        />
        <KPI
          title="Đánh giá TB"
          value={`${data.overview.averageRating}/5`}
          hint={`Dựa trên ${data.overview.totalSessions} buổi`}
        />
        <KPI
          title="Tổng buổi học"
          value={`${data.overview.totalSessions}`}
          hint={`Trung bình ${Math.round(
            data.overview.totalSessions / 6
          )} buổi/tháng`}
        />
        <KPI
          title="Chuyển đổi"
          value={`24.8%`}
          hint={`Từ demo thành đăng ký`}
        />
      </View>

      {/* Student sources */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nguồn học viên</Text>
        <View style={{ gap: 8 }}>
          {data.studentSources.map((s, i) => (
            <View key={`${s.source}-${i}`} style={styles.rowBetween}>
              <Text style={styles.itemLabel}>{s.source}</Text>
              <View style={styles.rowCenter}>
                <Text style={styles.itemValue}>{s.count} HV</Text>
                <Text style={[styles.meta, { marginLeft: 8 }]}>
                  {s.percentage}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Course performance */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hiệu suất khóa học</Text>
        <View style={{ gap: 8 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2 }]}>Khóa học</Text>
            <Text style={[styles.th, { flex: 1, textAlign: "center" }]}>
              Học viên
            </Text>
            <Text style={[styles.th, { flex: 1, textAlign: "center" }]}>
              Hoàn thành
            </Text>
            <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>
              Doanh thu
            </Text>
            <Text style={[styles.th, { flex: 1, textAlign: "center" }]}>
              Đánh giá
            </Text>
          </View>
          {data.coursePerformance.map((c, i) => (
            <View key={`${c.courseName}-${i}`} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 2 }]} numberOfLines={1}>
                {c.courseName}
              </Text>
              <Text style={[styles.td, { flex: 1, textAlign: "center" }]}>
                {c.enrollments}
              </Text>
              <Text
                style={[
                  styles.td,
                  {
                    flex: 1,
                    textAlign: "center",
                    color: c.completionRate >= 90 ? "#065F46" : "#374151",
                  },
                ]}
              >
                {c.completionRate}%
              </Text>
              <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
                {formatPrice(c.revenue)}đ
              </Text>
              <Text style={[styles.td, { flex: 1, textAlign: "center" }]}>
                {c.averageRating}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Student progress summary (textual) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Phát triển học viên (tóm tắt)</Text>
        <View style={{ gap: 6 }}>
          {data.studentProgress.map((m, idx) => (
            <Text key={`m-${idx}`} style={styles.meta}>
              {m.month}: mới {m.newStudents}, quay lại {m.returningStudents},
              tổng {m.totalStudents}
            </Text>
          ))}
        </View>
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

function getMockData(range: "3months" | "6months" | "1year") {
  if (range === "3months") {
    return baseData({
      months: ["T4", "T5", "T6"],
      totals: {
        totalStudents: 89,
        totalRevenue: 68400000,
        averageRating: 4.7,
        totalSessions: 648,
        growthRate: 18.2,
      },
    });
  }
  if (range === "1year") {
    return baseData({
      months: ["T7", "T8", "T9", "T10", "T11", "T12"],
      totals: {
        totalStudents: 284,
        totalRevenue: 286800000,
        averageRating: 4.8,
        totalSessions: 2496,
        growthRate: 31.4,
      },
    });
  }
  return baseData({
    months: ["T1", "T2", "T3", "T4", "T5", "T6"],
    totals: {
      totalStudents: 156,
      totalRevenue: 124500000,
      averageRating: 4.8,
      totalSessions: 1248,
      growthRate: 23.5,
    },
  });
}

function baseData({ months, totals }: { months: string[]; totals: Overview }) {
  const monthly: Monthly[] = months.map((m, i) => ({
    month: m,
    students: 20 + i * 5,
    revenue: 10_000_000 + i * 4_000_000,
    sessions: 100 + i * 40,
  }));
  const sources: Source[] = [
    { source: "Tìm kiếm tự nhiên", count: 68, percentage: 43.6 },
    { source: "Giới thiệu", count: 45, percentage: 28.8 },
    { source: "Mạng xã hội", count: 28, percentage: 17.9 },
    { source: "Quảng cáo", count: 15, percentage: 9.7 },
  ];
  const courses: CoursePerf[] = [
    {
      courseName: "Pickleball cơ bản",
      enrollments: 48,
      completionRate: 92,
      revenue: 38_400_000,
      averageRating: 4.9,
    },
    {
      courseName: "Kỹ thuật nâng cao",
      enrollments: 36,
      completionRate: 85,
      revenue: 36_000_000,
      averageRating: 4.7,
    },
    {
      courseName: "Chiến thuật thi đấu",
      enrollments: 28,
      completionRate: 88,
      revenue: 28_000_000,
      averageRating: 4.8,
    },
    {
      courseName: "Lớp private 1-1",
      enrollments: 44,
      completionRate: 95,
      revenue: 22_000_000,
      averageRating: 4.9,
    },
  ];
  const progress = months.map((m, i) => ({
    month: m,
    newStudents: 12 + i * 4,
    returningStudents: 8 + i * 5,
    totalStudents: 20 + i * 9,
  }));
  return {
    overview: totals,
    monthlyData: monthly,
    studentSources: sources,
    coursePerformance: courses,
    studentProgress: progress,
  };
}

function formatPrice(price: number) {
  try {
    return new Intl.NumberFormat("vi-VN").format(price);
  } catch {
    return String(price);
  }
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontWeight: "700", color: "#111827" },
  meta: { color: "#6B7280", fontSize: 12 },
  rangeRow: { flexDirection: "row", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  chipActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  chipText: { color: "#111827", fontWeight: "600" },
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
  kpiValue: { color: "#111827", fontWeight: "700", marginTop: 4 },
  kpiHint: { color: "#6B7280", fontSize: 11, marginTop: 4 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  cardTitle: { fontWeight: "700", color: "#111827", marginBottom: 10 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  itemLabel: { color: "#111827", fontWeight: "600" },
  itemValue: { color: "#111827" },

  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 6,
  },
  th: { color: "#6B7280", fontSize: 12 },
  tableRow: {
    flexDirection: "row",
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 8,
  },
  td: { color: "#111827", fontSize: 12 },
});
