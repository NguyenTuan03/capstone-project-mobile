import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CoachMenuScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu</Text>
      <View style={{ gap: 8 }}>
        <MenuItem
          label="Hồ sơ"
          onPress={() => router.push("/(coach)/menu/profile" as any)}
        />
        <MenuItem
          label="Phân tích"
          onPress={() => router.push("/(coach)/menu/analytics" as any)}
        />
        <MenuItem
          label="Khối buổi học"
          onPress={() => router.push("/(coach)/menu/session-blocks" as any)}
        />
        <MenuItem
          label="Giảng dạy"
          onPress={() => router.push("/(coach)/menu/teaching" as any)}
        />
        <MenuItem
          label="Thanh toán"
          onPress={() => router.push("/(coach)/menu/payouts" as any)}
        />
        <MenuItem
          label="Môn học"
          onPress={() => router.push("/(coach)/menu/subject" as any)}
        />
      </View>
    </View>
  );
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.9} onPress={onPress}>
      <Text style={styles.itemText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", gap: 12 },
  title: { fontWeight: "700", color: "#111827" },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  itemText: { color: "#111827", fontWeight: "600" },
});
