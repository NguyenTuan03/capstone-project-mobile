import {Alert, Image, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { useState } from "react";
import { useRouter, Href } from "expo-router";
import { useJWTAuthActions } from "@/services/jwt-auth/JWTAuthProvider";
import storageService from "@/services/storageService";
import AppForm from "@/components/common/AppForm";

export default function AuthScreen() {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { signInUser } = useJWTAuthActions();

  const handleLogin = async (values: Record<string, string>) => {
    setSubmitting(true);
    try {
      // Convert phone number from 0xxx to +84xxx format
      const phoneNumber = values.phoneNumber.startsWith("0")
        ? "+84" + values.phoneNumber.substring(1)
        : values.phoneNumber;

      await signInUser({
        phoneNumber: phoneNumber,
        password: values.password,
      });

      const user = await storageService.getUser();

      if (user?.role?.name === "COACH") {
        router.push("/(coach)/home" as Href);
      } else if (user?.role?.name === "LEARNER") {
        router.push("/(learner)/home" as Href);
      }
    } catch (err: any) {
      Alert.alert(
        "Đăng nhập thất bại",
        "Vui lòng kiểm tra lại sdt và mật khẩu của bạn.",
        [{ text: "OK" }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <Image
        source={require("@/assets/images/login.jpg")}
        style={{
          width: "100%",
          height: 240,
          resizeMode: "cover",
        }}
      />
      <View
        style={{
          backgroundColor: "#f8fafc",
          marginTop: -30,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
        }}
      >
        <Text
          style={{
            fontSize: 30,
            fontWeight: "700",
            textAlign: "center",
            marginTop: 20,
            marginBottom: 16,
          }}
        >
          Đăng nhập
        </Text>
        <Text
          style={{
            fontSize: 16,
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          Đăng nhập để tiếp tục hành trình tập luyện của bạn.
        </Text>
      </View>
      <AppForm
        title="Chào mừng trở lại 👋"
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
              <Pressable
                onPress={() => router.push("/(auth)/register" as Href)}
              >

                <Text
                  style={{
                    color: "#059669",
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
 
                  Đăng ký
                </Text>
              </Pressable>
            </View>
          </View>
        }
      />
    </View>
    </KeyboardAvoidingView>
  );
}
