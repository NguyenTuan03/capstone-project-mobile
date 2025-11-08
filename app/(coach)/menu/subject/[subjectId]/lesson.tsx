import { get } from "@/services/http/httpService";
import { Lesson } from "@/types/subject";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const CoachLessonScreen = () => {
  const { subjectId, subjectName } = useLocalSearchParams<{
    subjectId: string;
    subjectName: string;
  }>();
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const fetchLessons = async () => {
    try {
      const res = await get<{ items: Lesson[] }>(
        `${API_URL}/v1/lessons?filter=subject.id_eq_${subjectId}`
      );
      setLessons(res.data.items || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách bài học:", error);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 20,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#059669" />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            textAlign: "center",
            flex: 1,
          }}
        >
          {subjectName}
        </Text>

        <TouchableOpacity>
          <Ionicons
            name="information-circle-outline"
            size={24}
            color="#059669"
          />
        </TouchableOpacity>
      </View>
      <Text>Tạo bài học mới cho khóa học</Text>
      <Text>Nội dung môn học</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {lessons.map((lesson) => (
          <TouchableOpacity
            key={lesson.id}
            style={{
              backgroundColor: "#f9f9f9",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "#eee",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 4 }}>
              {lesson.name}
            </Text>
            <Text style={{ fontSize: 14, color: "#666" }}>
              {lesson.description}
            </Text>
            <Text style={{ fontSize: 14, color: "#666" }}>
              {lesson.duration}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CoachLessonScreen;
