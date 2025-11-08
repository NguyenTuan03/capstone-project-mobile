import { Stack } from "expo-router";

export default function MenuStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#FFFFFF",
          paddingBottom: 80,
        },
      }}
    />
  );
}
