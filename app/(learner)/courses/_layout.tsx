import { Stack } from "expo-router";

export default function CoursesStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#FFFFFF",
          paddingBottom: 80,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="payments/return" options={{ headerShown: false }} />
      <Stack.Screen name="payments/cancel" options={{ headerShown: false }} />
    </Stack>
  );
}
