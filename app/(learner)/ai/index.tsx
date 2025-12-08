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
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="sparkles" size={24} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Phân tích Video AI</Text>
              <Text style={styles.headerSubtitle}>
                Xem lại các buổi tập được phân tích
              </Text>
            </View>
          </View>
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
            <View style={styles.emptyIconContainer}>
              <Ionicons name="analytics-outline" size={48} color="#D1D5DB" />
            </View>
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
                {/* Course/Drill Name */}
                <Text style={styles.analysisTitle} numberOfLines={2}>
                  {r.video?.session?.course.name ||
                    r.video?.title ||
                    "Phân tích Video"}
                </Text>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  {/* Session Badge */}
                  <View style={styles.sessionBadge}>
                    <Ionicons name="videocam" size={12} color="#059669" />
                    <Text style={styles.sessionBadgeText}>
                      {r.video?.session?.sessionNumber
                        ? `Buổi ${r.video?.session.sessionNumber}`
                        : "Buổi tập"}
                    </Text>
                  </View>

                  {/* Score Badge */}
                  <View style={[
                    styles.scoreBadge,
                    (r.learnerScore || 0) >= 70
                      ? styles.scoreBadgePass
                      : (r.learnerScore || 0) >= 50
                      ? styles.scoreBadgeWarning
                      : styles.scoreBadgeFail
                  ]}>
                    <Ionicons 
                      name={(r.learnerScore || 0) >= 70 ? "checkmark-circle" : "alert-circle"} 
                      size={12} 
                      color={(r.learnerScore || 0) >= 70 ? "#059669" : (r.learnerScore || 0) >= 50 ? "#F59E0B" : "#DC2626"}
                    />
                    <Text style={[
                      styles.scoreBadgeText,
                      (r.learnerScore || 0) >= 70
                        ? styles.scoreTextPass
                        : (r.learnerScore || 0) >= 50
                        ? styles.scoreTextWarning
                        : styles.scoreTextFail
                    ]}>
                      {r.learnerScore || 0}
                    </Text>
                  </View>
                </View>

                {/* Date */}
                <View style={styles.metaRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={13}
                    color="#6B7280"
                  />
                  <Text style={styles.meta}>{formatDate(r.createdAt)}</Text>
                  <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.viewText}>Xem chi tiết</Text>
                    <Ionicons name="chevron-forward" size={14} color="#059669" />
                  </View>
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
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
    fontWeight: "500",
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
    marginVertical: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
    gap: 10,
    minHeight: 220,
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7F1D1D",
    marginTop: 6,
  },
  errorText: {
    fontSize: 13,
    color: "#991B1B",
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 6,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  emptyContainer: {
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    gap: 10,
    minHeight: 250,
    justifyContent: "center",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginTop: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 2,
    fontWeight: "500",
  },
  recordsContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  analysisCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  analysisTitle: {
    fontWeight: "700",
    color: "#111827",
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sessionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  sessionBadgeText: {
    color: "#059669",
    fontSize: 11,
    fontWeight: "700",
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  scoreBadgePass: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  scoreBadgeWarning: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
  },
  scoreBadgeFail: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  scoreBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  scoreTextPass: {
    color: "#059669",
  },
  scoreTextWarning: {
    color: "#F59E0B",
  },
  scoreTextFail: {
    color: "#DC2626",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  meta: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "500",
  },
  viewText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "700",
  },
});
