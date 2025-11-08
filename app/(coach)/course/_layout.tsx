import { Stack } from "expo-router";

export default function CourseStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="create" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="assignment/[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="assignment/ai-analysis"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
