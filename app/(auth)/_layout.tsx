import { useJWTAuth } from "@/services/jwt-auth/JWTAuthProvider";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { isAuthenticated } = useJWTAuth();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: "Register" }} />
    </Stack>
  );
}
