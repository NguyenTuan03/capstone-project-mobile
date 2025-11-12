import storageService from "@/services/storageService";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
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

export default function EditCoachProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const userData = await storageService.getUser();
      if (userData) {
        setUser(userData);
        setFullName(userData.fullName || "");
        setPhoneNumber(userData.phoneNumber || "");
        setEmail(userData.email || "");
      }
    };
    loadUser();
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = "Họ và tên không được để trống";
    }

    if (!phoneNumber.trim()) {
      errors.phoneNumber = "Số điện thoại không được để trống";
    } else if (!/^0[0-9]{8,9}$/.test(phoneNumber.trim())) {
      errors.phoneNumber =
        "Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và có 10 chữ số)";
    }

    if (!email.trim()) {
      errors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Email không hợp lệ";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
      };

      await axios.put(`${API_URL}/v1/users/profile`, payload);

      setSuccess(true);
      
      // Update user data in storage
      const updatedUser = { ...user, ...payload };
      await storageService.setUser(updatedUser);
      
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#059669" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Chỉnh sửa hồ sơ</Text>
            <Text style={styles.subtitle}>Cập nhật thông tin cá nhân</Text>
          </View>
        </View>

        {/* Alert Messages */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {success && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>Cập nhật thành công!</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.card}>
          {/* Full Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={[
                styles.input,
                fieldErrors.fullName ? styles.inputError : undefined,
              ]}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (fieldErrors.fullName) clearFieldError("fullName");
              }}
              editable={!loading}
            />
            {fieldErrors.fullName && (
              <Text style={styles.fieldError}>{fieldErrors.fullName}</Text>
            )}
          </View>

          {/* Phone Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={[
                styles.input,
                fieldErrors.phoneNumber ? styles.inputError : undefined,
              ]}
              placeholder="Nhập số điện thoại"
              placeholderTextColor="#9CA3AF"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                if (fieldErrors.phoneNumber) clearFieldError("phoneNumber");
              }}
              keyboardType="phone-pad"
              editable={!loading}
            />
            {fieldErrors.phoneNumber && (
              <Text style={styles.fieldError}>{fieldErrors.phoneNumber}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[
                styles.input,
                fieldErrors.email ? styles.inputError : undefined,
              ]}
              placeholder="Nhập email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (fieldErrors.email) clearFieldError("email");
              }}
              keyboardType="email-address"
              editable={!loading}
            />
            {fieldErrors.email && (
              <Text style={styles.fieldError}>{fieldErrors.email}</Text>
            )}
          </View>

          {/* Save Button */}
          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Lưu thay đổi</Text>
            )}
          </Pressable>

          {/* Cancel Button */}
          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
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
  successContainer: {
    backgroundColor: "#ECFDF5",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  successText: {
    color: "#047857",
    fontWeight: "600",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
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
  fieldError: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#059669",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
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
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
});
