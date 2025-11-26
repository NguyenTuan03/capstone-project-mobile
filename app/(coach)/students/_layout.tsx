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
          // paddingTop: insets.top,
          paddingBottom: insets.bottom+20,
        },
      }}
    />
  );
}
