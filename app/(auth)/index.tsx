import AppForm from "@/components/common/AppForm";
import { User } from "@/types/user";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Href, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Toast from "react-native-toast-message";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function AuthScreen() {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = async (values: Record<string, string>) => {
    setSubmitting(true);
    try {
      // Convert phone number from 0xxx to +84xxx format
      const phoneNumber = values.phoneNumber.startsWith("0")
        ? "+84" + values.phoneNumber.substring(1)
        : values.phoneNumber;

      const res = await axios.post(`${API_URL}/v1/auth/login`, {
        phoneNumber: phoneNumber,
        password: values.password,
      });
      const { accessToken, refreshToken } = res.data.metadata;
      const user = res.data.metadata.user as User;
      // console.log("Logged in user:", user);

      await AsyncStorage.setItem("token", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      // Show success toast message
      Toast.show({
        type: "success",
        text1: "Đăng nhập thành công!",
        text2: `Chào mừng ${user.fullName} 👋`,
        position: "top",
        visibilityTime: 3000,
      });

      if (user.role.name === "COACH") {
        router.push("/(coach)/home" as Href);
      }
      if (user.role.name === "LEARNER") {
        router.push("/(learner)/home" as Href);
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Đăng nhập thất bại",
        text2:
          err.response?.data?.message ||
          "Vui lòng kiểm tra lại số điện thoại và mật khẩu của bạn.",
        position: "top",
        visibilityTime: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppForm
      title="Chào mừng trở lại 👋"
      subtitle="Đăng nhập để tiếp tục hành trình tập luyện của bạn."
      items={[
        {
          name: "phoneNumber",
          label: "Số điện thoại",
          placeholder: "0123456789",
          keyboardType: "phone-pad",
        },
        {
          name: "password",
          label: "Mật khẩu",
          placeholder: "••••••••",
          secureTextEntry: true,
        },
      ]}
      onSubmit={handleLogin}
      submitting={submitting}
      submitText="Đăng nhập"
      footer={
        <View style={{ gap: 6, alignItems: "center" }}>
          <Pressable
            onPress={() => router.push("/(auth)/forgot-password" as Href)}
          >
            <Text
              style={{
                color: "#6b7280",
                fontSize: 13,
                textDecorationLine: "underline",
              }}
            >
              Quên mật khẩu?
            </Text>
          </Pressable>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Text style={{ color: "#6b7280", fontSize: 13 }}>
              Chưa có tài khoản?
            </Text>
            <Pressable onPress={() => router.push("/(auth)/register" as Href)}>
              <Text
                style={{ color: "#059669", fontWeight: "700", fontSize: 13 }}
              >
                Đăng ký
              </Text>
            </Pressable>
          </View>
        </View>
      }
    />
  );
}
