import { useJWTAuth } from "@/services/jwt-auth/JWTAuthProvider";
import { Href, Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { isAuthenticated, user } = useJWTAuth();
  console.log("AuthLayout user:", JSON.stringify(user, null, 2));

  if (isAuthenticated && user && user.role) {
    if (user.role.name === "COACH") {
      return <Redirect href={"/(coach)/home" as Href} />;
    }
    if (user.role?.name === "LEARNER") {
      return <Redirect href={"/(learner)/home" as Href} />;
    }

    if (!user.role) {
      console.warn("User authenticated but has no role:", user);
    }
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="verify-phone" options={{ headerShown: false }} />
    </Stack>
  );
}
