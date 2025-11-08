import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CoachSessionBlockCreateScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tạo khối buổi học</Text>
      <Text style={styles.meta}>Form tạo block sẽ đặt ở đây.</Text>
      <TouchableOpacity
        style={styles.ghost}
        activeOpacity={0.9}
        onPress={() => router.back()}
      >
        <Text style={styles.ghostText}>Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", gap: 12 },
  title: { fontWeight: "700", color: "#111827" },
  meta: { color: "#6B7280" },
  ghost: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  ghostText: { color: "#111827", fontWeight: "600" },
});
