import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

const toBool = (v?: string) => (v ?? "").toLowerCase().trim() === "true";

export default function PaymentCancelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string;
    id?: string;
    cancel?: string; // "true" | "false"
    status?: string; // "CANCELLED" | ...
    orderCode?: string;
  }>();

  useEffect(() => {
    const status = (params.status ?? "").toString().toUpperCase().trim();
    const isCanceled = toBool(params.cancel) || status === "CANCELLED";

    console.log("[PAYMENT CANCEL] params =", params);

    // (Optional) verify với BE:
    // await get(`/v1/payments/by-order?orderCode=${params.orderCode}`);

    Alert.alert(
      "Đã hủy thanh toán",
      isCanceled
        ? `Bạn đã hủy giao dịch.\nMã đơn: ${params.orderCode ?? "N/A"}`
        : "Không xác định trạng thái hủy, vui lòng thử lại.",
      [
        {
          text: "OK",
          onPress: () => router.replace("/(learner)/courses" as any),
        },
      ]
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.text}>Thanh toán đã bị hủy.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  text: { color: "#6B7280", fontSize: 14 },
});
