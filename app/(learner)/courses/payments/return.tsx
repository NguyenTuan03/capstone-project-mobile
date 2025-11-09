import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const toBool = (v?: string) => (v ?? "").toLowerCase().trim() === "true";

export default function PaymentReturnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    code?: string;
    id?: string;
    cancel?: string; // "true" | "false"
    status?: string; // "PAID" | "CANCELLED" | ...
    orderCode?: string;
  }>();

  useEffect(() => {
    const status = (params.status ?? "").toString().toUpperCase().trim();
    const isCanceled = toBool(params.cancel) || status === "CANCELLED";
    const isPaid = status === "PAID" && !toBool(params.cancel);

    console.log("[PAYMENT RETURN] params =", params);

    // (Optional) verify với BE:
    // const verify = await get(`/v1/payments/by-order?orderCode=${params.orderCode}`);
    // if (verify.data.status !== "SUCCESS") { ... }

    if (isPaid) {
      Alert.alert(
        "Thanh toán thành công",
        `Thanh toán OK!\nMã đơn: ${params.orderCode || "N/A"}`,
        [
          {
            text: "OK",
            onPress: () => router.replace("/(learner)/courses" as any),
          },
        ]
      );
    } else if (isCanceled) {
      Alert.alert(
        "Đã hủy thanh toán",
        `Giao dịch bị hủy.\nMã đơn: ${params.orderCode || "N/A"}`,
        [
          {
            text: "OK",
            onPress: () => router.replace("/(learner)/courses" as any),
          },
        ]
      );
    } else {
      Alert.alert(
        "Không rõ trạng thái",
        "Hệ thống chưa xác định được kết quả thanh toán.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(learner)/courses" as any),
          },
        ]
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.text}>Đang xử lý kết quả thanh toán...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  text: { color: "#6B7280", fontSize: 14 },
});
