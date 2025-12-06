import VideoOverlayPlayer from "@/components/learner/lesson/VideoOverlayPlayer";
import { getAiVideoComparisonResultsByUser } from "@/services/ai/geminiService";
import { useJWTAuth } from "@/services/jwt-auth/JWTAuthProvider";
import { AiVideoCompareResult } from "@/types/ai";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useJWTAuth();
  const [records, setRecords] = useState<AiVideoCompareResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] =
    useState<AiVideoCompareResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (user?.id) {
        try {
          setLoading(true);
          setError(null);
          const data = await getAiVideoComparisonResultsByUser(user.id);
          setRecords(data || []);
        } catch (error) {
      console.error("Failed to fetch AI results:", error);
          setError("Không thể tải dữ liệu phân tích. Vui lòng thử lại.");
          setRecords([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchResults();
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  };

  const handleOpenResult = (result: AiVideoCompareResult) => {
    if (result.video?.publicUrl && result.learnerVideo?.publicUrl) {
      setSelectedResult(result);
      setModalVisible(true);
    } else {
      // Handle case where videos are missing if necessary
      console.error("Missing video URLs for comparison");
    }
  };

  return (
    <View
      style={[
        styles.safe,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 50 },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Phân tích Video</Text>
          <Text style={styles.headerSubtitle}>
            Xem lại các buổi tập được phân tích bằng AI
          </Text>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        )}

        {/* Error State */}
        {!loading && error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Lỗi tải dữ liệu</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setLoading(true);
                // Retry fetch
                if (user?.id) {
                  getAiVideoComparisonResultsByUser(user.id)
                    .then((data) => setRecords(data || []))
                    .catch(() =>
                      setError(
                        "Không thể tải dữ liệu phân tích. Vui lòng thử lại."
                      )
                    )
                    .finally(() => setLoading(false));
                }
              }}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && records.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-outline" size={56} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Chưa có phân tích nào</Text>
            <Text style={styles.emptyText}>
              Hoàn thành các buổi tập để nhận phân tích video từ AI
            </Text>
          </View>
        )}

        {/* Records List */}
        {!loading && !error && records.length > 0 && (
          <View style={styles.recordsContainer}>
            {records.map((r, index) => (
              <TouchableOpacity
                key={r.id}
                style={styles.analysisCard}
                onPress={() => handleOpenResult(r)}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  {/* Left Section */}
                  <View style={styles.leftSection}>
                    {/* Course/Drill Name */}
                    <Text style={styles.analysisTitle} numberOfLines={2}>
                      {r.video?.session?.course.name ||
                        r.video?.title ||
                        "Phân tích Video"}
                    </Text>

                    {/* Session Info */}
                    <View style={styles.sessionBadge}>
                      <Text style={styles.sessionBadgeText}>
                        {r.video?.session?.sessionNumber
                          ? `Buổi ${r.video?.session.sessionNumber}`
                          : "Buổi chưa xác định"}
                      </Text>
                    </View>

                    {/* Date */}
                    <View style={styles.metaRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#6B7280"
                      />
                      <Text style={styles.meta}>{formatDate(r.createdAt)}</Text>
                    </View>
                  </View>

                  {/* Right Section - Score */}
                  <View style={styles.scoreSection}>
                    <View style={styles.scoreCircle}>
                      <Text style={styles.score}>{r.learnerScore || 0}</Text>
                    </View>
                    <Text style={styles.scoreLabel}>Điểm số</Text>
                  </View>
                </View>

                {/* Status Indicator */}
                <View style={styles.statusBar}>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        width: `${Math.min(r.learnerScore || 0, 100)}%`,
                        backgroundColor:
                          (r.learnerScore || 0) >= 70
                            ? "#10B981"
                            : (r.learnerScore || 0) >= 50
                            ? "#F59E0B"
                            : "#EF4444",
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {selectedResult && (
        <VideoOverlayPlayer
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          coachVideoUrl={selectedResult.video?.publicUrl || ""}
          learnerVideoUrl={selectedResult.learnerVideo?.publicUrl || ""}
          aiAnalysisResult={selectedResult}
          isPaddingTopEnabled={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContainer: { paddingBottom: 20 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
    gap: 12,
    minHeight: 280,
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#7F1D1D",
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#991B1B",
    textAlign: "center",
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyContainer: {
    marginHorizontal: 16,
    marginVertical: 40,
    paddingVertical: 40,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    gap: 12,
    minHeight: 320,
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
  },
  recordsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  analysisCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  leftSection: {
    flex: 1,
    marginRight: 12,
  },
  analysisTitle: {
    fontWeight: "700",
    color: "#111827",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  sessionBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  sessionBadgeText: {
    color: "#0369A1",
    fontSize: 12,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  meta: {
    color: "#6B7280",
    fontSize: 12,
  },
  scoreSection: {
    alignItems: "center",
    gap: 6,
  },
  scoreCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0FDF4",
    borderWidth: 2,
    borderColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  score: {
    color: "#059669",
    fontWeight: "800",
    fontSize: 16,
  },
  scoreLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
  },
  statusBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    width: "100%",
  },
  statusIndicator: {
    height: "100%",
  },
});
