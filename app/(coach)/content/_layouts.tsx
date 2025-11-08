import { Stack } from "expo-router";

export default function ContentStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
