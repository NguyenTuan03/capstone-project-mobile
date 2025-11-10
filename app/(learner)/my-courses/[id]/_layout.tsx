import { Stack } from "expo-router";

export default function EnrollmentStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#FFFFFF",
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="info" options={{ headerShown: false }} />
      <Stack.Screen
        name="lesson/[lessonId]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

