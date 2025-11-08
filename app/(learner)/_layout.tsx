import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function LearnerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#10B981",
        tabBarInactiveTintColor: "#9CA3AF",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses/index"
        options={{
          title: "Khóa học",
          tabBarIcon: ({ color, size }) => (
            <Feather name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-courses/index"
        options={{
          title: "Của tôi",
          tabBarIcon: ({ color, size }) => (
            <Feather name="file" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai/index"
        options={{
          title: "AI",
          tabBarIcon: ({ color, size }) => (
            <Feather name="video" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="course/[id]/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="course/[id]/lesson"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
    </Tabs>
  );
}
