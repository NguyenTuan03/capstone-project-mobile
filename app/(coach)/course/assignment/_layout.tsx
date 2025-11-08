import { Stack } from "expo-router";

export default function CourseAssignmentStackLayout() {
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
