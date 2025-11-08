import { StyleSheet, Text, View } from "react-native";

export default function CoachProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hồ sơ HLV</Text>
      <Text style={styles.meta}>Thông tin cá nhân và cài đặt hồ sơ.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", gap: 8 },
  title: { fontWeight: "700", color: "#111827" },
  meta: { color: "#6B7280" },
});
