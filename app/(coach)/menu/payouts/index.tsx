import { StyleSheet, Text, View } from "react-native";

export default function CoachPayoutsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payouts</Text>
      <Text style={styles.meta}>
        Thiết lập tài khoản nhận tiền và lịch thanh toán.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", gap: 8 },
  title: { fontWeight: "700", color: "#111827" },
  meta: { color: "#6B7280" },
});
