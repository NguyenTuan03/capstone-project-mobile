import { StyleSheet, Text, View } from "react-native";

export default function CoachSessionBlocksScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Khối buổi học</Text>
      <Text style={styles.meta}>
        Quản lý block, lịch mở đăng ký và lịch học.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", gap: 8 },
  title: { fontWeight: "700", color: "#111827" },
  meta: { color: "#6B7280" },
});
