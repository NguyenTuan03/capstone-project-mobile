import { Stack } from "expo-router";

export default function StudentsStackLayout() {
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
