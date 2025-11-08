import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PaymentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [paymentStep, setPaymentStep] = useState<1 | 2>(1);
  const [method, setMethod] = useState<"card" | "momo" | "bank">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  const course = {
    id: id ?? "1",
    title: "Cơ bản Pickleball cho người mới bắt đầu",
    coach: "Huấn luyện viên Nguyễn Văn A",
    price: "500.000 VNĐ",
    startDate: "2025-01-15",
    location: "Sân Pickleball Quận 3",
    totalSessions: 8,
  };

  const handlePay = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsProcessing(false);
    setPaymentStep(2);
  };

  const Header = () => (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <TouchableOpacity
        onPress={() => (paymentStep === 1 ? router.back() : setPaymentStep(1))}
        style={styles.backBtn}
        activeOpacity={0.8}
        disabled={paymentStep === 2}
      >
        <Text style={styles.backText}>Quay lại</Text>
      </TouchableOpacity>
      <Text style={styles.title}>
        {paymentStep === 1 ? "Thanh toán" : "Hoàn thành"}
      </Text>
      <View style={{ width: 64 }} />
    </View>
  );

  const CourseBar = () =>
    paymentStep === 1 ? (
      <View style={styles.courseBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.meta}>{course.coach}</Text>
          <View style={styles.rowGap8}>
            <Text style={styles.meta}>{course.startDate}</Text>
            <Text style={styles.meta}>• {course.location}</Text>
            <Text style={styles.meta}>• {course.totalSessions} buổi</Text>
          </View>
        </View>
      </View>
    ) : null;

  const Step1 = () => (
    <View style={{ gap: 16 }}>
      {/* Payment method */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Phương thức thanh toán</Text>
        <View style={{ gap: 8 }}>
          {[
            { id: "card", label: "Thẻ tín dụng/Ghi nợ" },
            { id: "momo", label: "Ví MoMo" },
            { id: "bank", label: "Chuyển khoản ngân hàng" },
          ].map((m) => {
            const active = method === (m.id as any);
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => setMethod(m.id as any)}
                style={[styles.radioRow, active && styles.radioRowActive]}
                activeOpacity={0.9}
              >
                <View
                  style={[styles.radioDot, active && styles.radioDotActive]}
                />
                <Text style={styles.radioLabel}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {method === "card" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin thẻ</Text>
          <View style={{ gap: 10 }}>
            <View>
              <Text style={styles.label}>Số thẻ *</Text>
              <TextInput
                value={form.cardNumber}
                onChangeText={(t) => setForm((p) => ({ ...p, cardNumber: t }))}
                placeholder="1234 5678 9012 3456"
                style={styles.input}
              />
            </View>
            <View>
              <Text style={styles.label}>Tên trên thẻ *</Text>
              <TextInput
                value={form.cardName}
                onChangeText={(t) => setForm((p) => ({ ...p, cardName: t }))}
                placeholder="NGUYEN VAN A"
                style={styles.input}
              />
            </View>
            <View style={styles.rowGap12}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Hết hạn *</Text>
                <TextInput
                  value={form.expiry}
                  onChangeText={(t) => setForm((p) => ({ ...p, expiry: t }))}
                  placeholder="MM/YY"
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>CVV *</Text>
                <TextInput
                  value={form.cvv}
                  onChangeText={(t) => setForm((p) => ({ ...p, cvv: t }))}
                  placeholder="123"
                  style={styles.input}
                />
              </View>
            </View>
          </View>
        </View>
      )}

      {method === "momo" && (
        <View
          style={[
            styles.card,
            { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
          ]}
        >
          <Text style={[styles.cardTitle, { color: "#991B1B" }]}>
            Thanh toán qua MoMo
          </Text>
          <Text style={{ color: "#7F1D1D", fontSize: 12 }}>
            Sau khi nhấn &quot;Thanh toán&quot;, bạn sẽ được chuyển đến ứng dụng
            MoMo để hoàn tất.
          </Text>
        </View>
      )}

      {method === "bank" && (
        <View
          style={[
            styles.card,
            { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
          ]}
        >
          <Text style={[styles.cardTitle, { color: "#065F46" }]}>
            Chuyển khoản ngân hàng
          </Text>
          <Text style={{ color: "#065F46", fontSize: 12 }}>
            Quét mã QR hiển thị sau khi bấm &quot;Thanh toán&quot; hoặc chuyển
            khoản theo hướng dẫn.
          </Text>
        </View>
      )}
    </View>
  );

  const Step2 = () => (
    <View style={{ gap: 16 }}>
      <View
        style={[
          styles.card,
          { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
        ]}
      >
        <View style={{ alignItems: "center", gap: 6 }}>
          <View style={styles.successIcon} />
          <Text style={styles.successTitle}>Đăng ký thành công!</Text>
          <Text style={styles.meta}>Bạn đã thanh toán {course.price}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Thông tin đăng ký</Text>
        <View style={{ gap: 6 }}>
          <Row
            label="Mã đăng ký"
            value={`PKL-${Date.now().toString().slice(-6)}`}
          />
          <Row label="Khóa học" value={course.title} />
          <Row label="Ngày bắt đầu" value={course.startDate} />
        </View>
      </View>

      <View style={styles.rowGap12}>
        <TouchableOpacity
          style={[styles.ghostBtn, { flex: 1 }]}
          activeOpacity={0.9}
          onPress={() => router.back()}
        >
          <Text style={styles.ghostBtnText}>Quay lại trang chính</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { flex: 1 }]}
          activeOpacity={0.9}
          onPress={() => router.push("/(learner)/my-courses" as any)}
        >
          <Text style={styles.primaryBtnText}>Xem khóa học</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const Row = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.rowBetween}>
      <Text style={[styles.meta, { color: "#065F46" }]}>{label}:</Text>
      <Text style={[styles.meta, { color: "#065F46", fontWeight: "700" }]}>
        {value}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Header />
      <CourseBar />
      <ScrollView contentContainerStyle={styles.container}>
        {paymentStep === 1 ? <Step1 /> : <Step2 />}
        <View style={{ height: 88 }} />
      </ScrollView>
      {paymentStep === 1 && (
        <View style={styles.bottomBar}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
            <Text style={styles.totalValue}>{course.price}</Text>
          </View>
          <TouchableOpacity
            onPress={handlePay}
            style={[styles.primaryBtn, { flex: 1 }]}
            activeOpacity={0.9}
            disabled={isProcessing}
          >
            <Text style={styles.primaryBtnText}>
              {isProcessing ? "Đang xử lý..." : `Thanh toán ${course.price}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  backText: { color: "#374151" },
  title: { fontWeight: "700", color: "#111827" },
  container: { padding: 16, gap: 16 },
  courseBar: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    padding: 12,
  },
  courseTitle: { fontWeight: "700", color: "#065F46" },
  meta: { color: "#6B7280", fontSize: 12 },
  rowGap8: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowGap12: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  cardTitle: { fontWeight: "700", color: "#111827", marginBottom: 8 },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
  },
  radioRowActive: { borderColor: "#10B981", backgroundColor: "#ECFDF5" },
  radioDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  radioDotActive: { borderColor: "#10B981", backgroundColor: "#10B981" },
  radioLabel: { color: "#111827", fontWeight: "600" },
  label: { color: "#374151", fontSize: 12, marginBottom: 4, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111827",
  },
  primaryBtn: {
    backgroundColor: "#10B981",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  ghostBtn: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  ghostBtnText: { color: "#111827", fontWeight: "600" },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    padding: 12,
    gap: 12,
  },
  totalBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: { color: "#111827", fontWeight: "700" },
  totalValue: { color: "#059669", fontWeight: "800", fontSize: 16 },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#10B981",
  },
  successTitle: { color: "#065F46", fontWeight: "800" },
});
