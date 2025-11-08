import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CoachSessionBlockEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sửa khối buổi học</Text>
      <Text style={styles.meta}>ID: {id}</Text>
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
