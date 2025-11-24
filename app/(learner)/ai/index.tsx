import VideoOverlayPlayer from "@/components/learner/lesson/VideoOverlayPlayer";
import { getAiVideoComparisonResultsByUser } from "@/services/ai/geminiService";
import { useJWTAuth } from "@/services/jwt-auth/JWTAuthProvider";
import { AiVideoCompareResult } from "@/types/ai";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
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
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] =
    useState<AiVideoCompareResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (user?.id) {
        try {
          setLoading(true);
          const data = await getAiVideoComparisonResultsByUser(user.id);
          setRecords(data);
        } catch (error) {
          console.error("Failed to fetch AI results:", error);
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
      console.warn("Missing video URLs for comparison");
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 50 },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <MaterialCommunityIcons
              name="video-check"
              size={24}
              color="black"
            />
            <Text style={styles.cardTitle}>AI có thể phân tích:</Text>
          </View>
          <View style={{ gap: 6 }}>
            <Text style={styles.item}>• Kỹ thuật giao bóng (serve)</Text>
            <Text style={styles.item}>• Cú đánh trái (forehand)</Text>
            <Text style={styles.item}>• Cú đánh phải (backhand)</Text>
            <Text style={styles.item}>• Volley ở gần lưới</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Video đã phân tích</Text>

        {loading ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            Đang tải dữ liệu...
          </Text>
        ) : (
          records.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.analysisCard}
              onPress={() => handleOpenResult(r)}
            >
              <View style={styles.analysisRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.analysisTitle}>
                    {r.video?.session?.course.name ||
                      r.video?.title ||
                      "Phân tích Video"}
                  </Text>
                  <Text style={styles.meta}>{formatDate(r.createdAt)}</Text>
                  <View style={[styles.badge, styles.badgeNeutral]}>
                    <Text style={[styles.badgeText, { color: "#111827" }]}>
                      {r.video?.session?.sessionNumber
                        ? `Buổi ${r.video?.session.sessionNumber}`
                        : r.video?.drillName || "Kỹ thuật chưa xác định"}
                      : {r.video?.session?.name}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.score}>{r.learnerScore || 0}%</Text>
                  <Text style={styles.meta}>Điểm số</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {selectedResult && (
        <VideoOverlayPlayer
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          coachVideoUrl={selectedResult.video?.publicUrl || ""}
          learnerVideoUrl={selectedResult.learnerVideo?.publicUrl || ""}
          aiAnalysisResult={selectedResult}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 16, gap: 16 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: { fontWeight: "700", color: "#111827", marginLeft: 8 },
  item: { color: "#374151" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  analysisCard: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
  },
  analysisRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  analysisTitle: { fontWeight: "700", color: "#111827" },
  meta: { color: "#6B7280", fontSize: 12 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  badgeNeutral: { backgroundColor: "#E5E7EB" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  score: { color: "#10B981", fontWeight: "800", fontSize: 22 },
});
