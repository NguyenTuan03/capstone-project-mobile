import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StudentsStackLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#FFFFFF",
          paddingBottom: insets.bottom + 20,
          paddingTop: insets.top,
        },
      }}
    />
  );
}
