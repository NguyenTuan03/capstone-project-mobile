import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CoursesStackLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#FFFFFF",
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 80,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="payments/return" options={{ headerShown: false }} />
      <Stack.Screen name="payments/cancel" options={{ headerShown: false }} />
    </Stack>
  );
}
