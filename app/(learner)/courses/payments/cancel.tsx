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

export default function PaymentCancelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.text}>Đang xử lý hủy thanh toán...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  text: { color: "#6B7280", fontSize: 14 },
});
