import Ionicons from "@expo/vector-icons/Ionicons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const VerifyPhone = () => {
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams();

  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    if (!otp.trim()) {
      setError("Vui lòng nhập mã OTP");
      return;
    }

    if (otp.length < 6) {
      setError("Mã OTP phải có ít nhất 6 chữ số");
      return;
    }

    setError(null);
    setVerifying(true);

    try {
      const payload = {
        phoneNumber: phoneNumber || "",
        code: otp.trim(),
      };

      await axios.post(
        `${API_URL}/v1/auth/verify-phone`,
        payload
      );

      setSuccess(true);
      setOtp("");

      // Navigate to login after 1.5 seconds
      setTimeout(() => {
        router.replace("/(auth)");
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Xác minh thất bại. Vui lòng thử lại");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setResendLoading(true);

    try {
      await axios.post(`${API_URL}/v1/auth/resend-otp`, {
        phoneNumber: phoneNumber || "",
      });

      setResendTimer(60); // 60 seconds countdown
      setError(null);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Không thể gửi lại mã OTP. Vui lòng thử lại"
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {success ? (
              <Ionicons name="checkmark-circle" size={48} color="#059669" />
            ) : (
              <Ionicons name="phone-portrait" size={48} color="#6B7280" />
            )}
          </View>
          <Text style={styles.title}>
            {success ? "Xác minh thành công!" : "Xác minh Số Điện Thoại"}
          </Text>
          <Text style={styles.subtitle}>
            {success
              ? "Tài khoản của bạn đã được xác minh"
              : `Chúng tôi đã gửi mã OTP đến ${phoneNumber}`}
          </Text>
        </View>

        {/* Form Card */}
        {!success && (
          <View style={styles.card}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* OTP Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mã OTP</Text>
              <TextInput
                style={[
                  styles.input,
                  error ? styles.inputError : undefined,
                ]}
                placeholder="Nhập mã OTP (6 chữ số)"
                placeholderTextColor="#9CA3AF"
                value={otp}
                onChangeText={(text) => {
                  setOtp(text);
                  if (error) setError(null);
                }}
                keyboardType="number-pad"
                maxLength={6}
                editable={!verifying}
              />
            </View>

            {/* Verify Button */}
            <Pressable
              style={[styles.button, verifying && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={verifying}
            >
              <Text style={styles.buttonText}>
                {verifying ? "Đang xác minh..." : "Xác minh"}
              </Text>
            </Pressable>

            {/* Resend OTP */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Không nhận được mã?</Text>
              <Pressable
                onPress={handleResendOtp}
                disabled={resendTimer > 0 || resendLoading}
              >
                <Text
                  style={[
                    styles.resendLink,
                    (resendTimer > 0 || resendLoading) &&
                      styles.resendLinkDisabled,
                  ]}
                >
                  {resendTimer > 0
                    ? `Gửi lại sau ${resendTimer}s`
                    : resendLoading
                    ? "Đang gửi..."
                    : "Gửi lại"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Success Message */}
        {success && (
          <View style={styles.successCard}>
            <Text style={styles.successText}>
              Xác minh thành công! Bạn sẽ được chuyển đến trang đăng nhập...
            </Text>
          </View>
        )}

        {/* Footer */}
        {!success && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản?</Text>
            <Pressable onPress={() => router.replace("/(auth)/register")}>
              <Text style={styles.footerLink}>Đăng ký</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
    paddingTop: 24,
  },
  header: {
    paddingHorizontal: 16,
    gap: 12,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  card: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#B91C1C",
    fontWeight: "600",
    fontSize: 13,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  button: {
    backgroundColor: "#059669",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  resendText: {
    color: "#6B7280",
    fontSize: 13,
  },
  resendLink: {
    color: "#059669",
    fontWeight: "700",
    fontSize: 13,
  },
  resendLinkDisabled: {
    color: "#9CA3AF",
  },
  successCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  successText: {
    color: "#047857",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  footerText: {
    color: "#6B7280",
    fontSize: 13,
  },
  footerLink: {
    color: "#059669",
    fontWeight: "700",
    fontSize: 13,
  },
});

export default VerifyPhone;
