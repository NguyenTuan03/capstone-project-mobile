import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const records = [
    {
      id: 1,
      title: "Phân tích Forehand",
      date: "2 ngày trước",
      score: 85,
      tech: "Forehand",
    },
    {
      id: 2,
      title: "Phân tích Serve",
      date: "5 ngày trước",
      score: 72,
      tech: "Serve",
    },
  ];
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

        {records.map((r) => (
          <View key={r.id} style={styles.analysisCard}>
            <View style={styles.analysisRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.analysisTitle}>{r.title}</Text>
                <Text style={styles.meta}>{r.date}</Text>
                <View style={[styles.badge, styles.badgeNeutral]}>
                  <Text style={[styles.badgeText, { color: "#111827" }]}>
                    {r.tech}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={styles.score}>{r.score}%</Text>
                <Text style={styles.meta}>Điểm số</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
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
