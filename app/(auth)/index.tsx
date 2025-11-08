import AppForm from "@/components/common/AppForm";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Href, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function AuthScreen() {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = async (values: Record<string, string>) => {
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/v1/auth/login`, {
        email: values.email,
        password: values.password,
      });
      const { accessToken, refreshToken, user } = res.data.metadata;

      await AsyncStorage.setItem("token", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      if (user.role.name === "COACH") {
        router.push("/(coach)/home" as Href);
      }
      if (user.role.name === "LEARNER") {
        router.push("/(learner)/home" as Href);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      Alert.alert(
        "Đăng nhập thất bại",
        "Vui lòng kiểm tra lại email và mật khẩu của bạn.",
        [{ text: "OK" }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppForm
      title="Chào mừng trở lại 👋"
      subtitle="Đăng nhập để tiếp tục hành trình tập luyện của bạn."
      skipValidation={true}
      items={[
        {
          name: "email",
          label: "Email",
          placeholder: "ban@example.com",
          keyboardType: "email-address",
          leftIcon: null, // dùng default mail icon
        },
        {
          name: "password",
          label: "Mật khẩu",
          placeholder: "••••••••",
          secureTextEntry: true,
          leftIcon: null, // dùng default lock icon
        },
      ]}
      onSubmit={handleLogin}
      submitting={submitting}
      submitText="Đăng nhập"
      footer={
        <View style={{ gap: 8, alignItems: "center" }}>
          <Pressable
            onPress={() => router.push("/(auth)/forgot-password" as Href)}
          >
            <Text style={{ color: "#6b7280", textDecorationLine: "underline" }}>
              Quên mật khẩu?
            </Text>
          </Pressable>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Text style={{ color: "#6b7280" }}>Chưa có tài khoản?</Text>
            <Pressable onPress={() => router.push("/(auth)/register" as Href)}>
              <Text style={{ color: "#2563eb", fontWeight: "700" }}>
                Đăng ký
              </Text>
            </Pressable>
          </View>
        </View>
      }
    />
  );
}
