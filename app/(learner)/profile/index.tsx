import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView
      style={[
        styles.safe,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 50 },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.card, { gap: 12 }]}>
          <View style={styles.rowGap12}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>LH</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>Lâm Tiên Hưng</Text>
              <Text style={styles.meta}>SE170216</Text>
              <View style={styles.badgesRow}>
                <View style={[styles.badge, styles.badgeNeutral]}>
                  <Text style={[styles.badgeText, { color: "#111827" }]}>
                    Trung cấp
                  </Text>
                </View>
                <View style={[styles.badge, styles.badgePrimary]}>
                  <Text style={styles.badgeText}>Học viên</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* Card 1 */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <FontAwesome
              name="calendar"
              size={32}
              color="#2563eb"
              style={{ marginBottom: 8 }}
            />
            <Text
              style={{ fontSize: 16, fontWeight: "500", textAlign: "center" }}
            >
              Lịch học
            </Text>
          </TouchableOpacity>

          {/* Card 2 */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <MaterialCommunityIcons
              name="trophy-award"
              size={32}
              color="#ca8a04"
              style={{ marginBottom: 8 }}
            />
            <Text
              style={{ fontSize: 16, fontWeight: "500", textAlign: "center" }}
            >
              Thành tựu
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {[
            {
              key: "info",
              label: "Thông tin cá nhân",
              to: "/(learner)/menu/account",
            },
            {
              key: "enrolled",
              label: "Khóa học đã đăng ký",
              to: "/(learner)/my-courses",
            },
            {
              key: "achievements",
              label: "Thành tựu",
              to: "/(learner)/profile",
            },
            { key: "settings", label: "Cài đặt", to: "/(learner)/profile" },
          ].map((m, i) => (
            <TouchableOpacity
              key={m.key}
              style={styles.menuItem}
              activeOpacity={0.8}
              onPress={() => router.push(m.to as any)}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon} />
                <Text style={styles.menuText}>{m.label}</Text>
              </View>
              <View style={styles.chev} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.ghostBtn, { marginTop: 8 }]}
          activeOpacity={0.9}
        >
          <Text style={styles.ghostBtnText}>Đăng xuất</Text>
        </TouchableOpacity>
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
  rowGap12: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  name: { fontSize: 18, fontWeight: "700", color: "#111827" },
  meta: { color: "#6B7280", fontSize: 12 },
  badgesRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  badgePrimary: { backgroundColor: "#10B981" },
  badgeNeutral: { backgroundColor: "#E5E7EB" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  menuIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#6B7280",
  },
  menuText: { color: "#111827" },
  chev: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#D1D5DB" },
  ghostBtn: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  ghostBtnText: { color: "#111827", fontWeight: "600" },
});
