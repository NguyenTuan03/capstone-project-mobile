import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView
      style={[
        styles.safe,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 50 },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Welcome Card */}
        <View style={[styles.card, styles.welcomeCard]}>
          <View style={styles.welcomeRow}>
            <View>
              <Text style={styles.welcomeTitle}>Chào mừng trở lại!</Text>
              <Text style={styles.welcomeSubtitle}>
                Tiếp tục hành trình Pickleball của bạn
              </Text>
            </View>
            <View style={styles.streakBox}>
              <Text style={styles.streakNumber}>7</Text>
              <Text style={styles.streakText}>ngày liên tục</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.card, styles.statCard]}>
            <View style={styles.statIcon} />
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Khóa học</Text>
          </View>
          <View style={[styles.card, styles.statCard]}>
            <View style={[styles.statIcon, { backgroundColor: "#DCFCE7" }]} />
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Giờ tập</Text>
          </View>
        </View>

        {/* AI Analysis Quick */}
        <View style={[styles.card, styles.aiCard]}>
          <View style={styles.aiRow}>
            <View style={styles.aiIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>Phân tích kỹ thuật AI</Text>
              <Text style={styles.aiSub}>
                2 video đã phân tích • Xem chi tiết
              </Text>
            </View>
          </View>
        </View>

        {/* Upcoming Sessions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Buổi học sắp tới</Text>
          <View style={styles.sessionItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionTitle}>
                Cơ bản Pickleball - Buổi 3
              </Text>
              <Text style={styles.sessionCoach}>HLV Nguyễn Văn A</Text>
              <View style={styles.sessionMetaRow}>
                <Text style={styles.sessionMeta}>Hôm nay, 19:00</Text>
                <Text style={styles.sessionMeta}>• Sân Pickleball Quận 3</Text>
              </View>
            </View>
            <View style={styles.chev} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 16, gap: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  welcomeCard: { backgroundColor: "#10B981", borderColor: "#10B981" },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  welcomeSubtitle: { color: "#ECFDF5", marginTop: 4 },
  streakBox: { alignItems: "center" },
  streakNumber: { color: "#fff", fontSize: 22, fontWeight: "800" },
  streakText: { color: "#fff", fontSize: 11 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, alignItems: "center" },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
    marginBottom: 8,
  },
  statNumber: { fontSize: 18, fontWeight: "700", color: "#111827" },
  statLabel: { color: "#6B7280", fontSize: 12 },
  aiCard: { backgroundColor: "#F3E8FF", borderColor: "#E9D5FF" },
  aiRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#9333EA",
  },
  aiTitle: { color: "#581C87", fontWeight: "700" },
  aiSub: { color: "#7C3AED", fontSize: 12, marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sessionTitle: { color: "#111827", fontWeight: "600" },
  sessionCoach: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  sessionMetaRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  sessionMeta: { color: "#6B7280", fontSize: 12 },
  chev: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#D1D5DB" },
});
