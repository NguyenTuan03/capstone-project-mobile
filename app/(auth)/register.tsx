import AppForm from "@/components/common/AppForm";
import axios from "axios";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const Register = () => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (values: Record<string, string>) => {
    if (values.password !== values.confirm) {
      setError("Mật khẩu không khớp");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/v1/auth/register`, {
        email: values.email,
        password: values.password,
      });
      router.replace("/(auth)");
    } catch {
      setError("Đăng ký thất bại");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
      <AppForm
        title="Tạo Tài Khoản"
        items={[
          {
            name: "email",
            label: "Email",
            placeholder: "ban@example.com",
            keyboardType: "email-address",
          },
          {
            name: "password",
            label: "Mật khẩu",
            placeholder: "••••••••",
            secureTextEntry: true,
          },
          {
            name: "confirm",
            label: "Xác nhận mật khẩu",
            placeholder: "••••••••",
            secureTextEntry: true,
          },
        ]}
        onSubmit={handleRegister}
        submitting={submitting}
        error={error}
        submitText="Đăng ký"
        footer={
          <>
            <Text style={{ color: "#6b7280" }}>Đã có tài khoản?</Text>
            <Pressable onPress={() => router.replace("/(auth)")}>
              <Text style={{ color: "#3b82f6" }}>Đăng nhập</Text>
            </Pressable>
          </>
        }
      />
    </>
  );
};

export default Register;
