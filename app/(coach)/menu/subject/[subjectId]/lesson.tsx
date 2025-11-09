import { get, remove } from "@/services/http/httpService";
import { Lesson } from "@/types/subject";
import { Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const CoachLessonScreen = () => {
  const { subjectId, subjectName } = useLocalSearchParams<{
    subjectId: string;
    subjectName: string;
  }>();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const handleOpenMenu = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setMenuVisible(true);
  };

  const fetchLessons = async () => {
    try {
      const res = await get<{ items: Lesson[] }>(
        `${API_URL}/v1/lessons/subjects/${subjectId}`
      );
      setLessons(res.data.items || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách bài học:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLessons();
    }, [subjectId])
  );

  const handleDeleteLesson = (lesson: Lesson) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa bài học "${lesson.name}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(`${API_URL}/v1/lessons/${lesson.id}`);
              setLessons((prev) =>
                prev.filter((item) => item.id !== lesson.id)
              );
              setMenuVisible(false);
            } catch (error) {
              console.error("Lỗi khi xóa bài học:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleEdit = (lesson: Lesson | null) => {
    if (!lesson) return;
    setMenuVisible(false);
    router.push({
      pathname: "/(coach)/menu/lesson/edit",
      params: {
        lessonId: selectedLesson!.id,
        lessonName: selectedLesson!.name,
        lessonDescription: selectedLesson!.description,
        lessonDuration: selectedLesson!.duration,
      },
    });
  };

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
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}>
          Danh sách bài học
        </Text>

        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#059669",
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 8,
          }}
          onPress={() =>
            router.push({
              pathname: "/(coach)/menu/lesson/create",
              params: { subjectId, subjectName },
            })
          }
        >
          <FontAwesome6 name="add" size={24} color="white" />
          <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 6 }}>
            Tạo bài học
          </Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#059669" />
          <Text style={{ marginTop: 8, color: "#6B7280" }}>
            Đang tải danh sách bài học...
          </Text>
        </View>
      ) : lessons.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 30,
          }}
        >
          <Ionicons
            name="book-outline"
            size={64}
            color="#9CA3AF"
            style={{ marginBottom: 12 }}
          />
          <Text
            style={{
              fontSize: 16,
              color: "#6B7280",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Tài liệu này hiện chưa có bài học nào.
          </Text>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#10B981",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
            }}
            onPress={() =>
              router.push({
                pathname: "/(coach)/menu/lesson/create",
                params: { subjectId, subjectName },
              })
            }
          >
            <FontAwesome6 name="add" size={24} color="white" />
            <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 6 }}>
              Tạo bài học đầu tiên
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
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
                position: "relative",
              }}
              onPress={() =>
                router.push({
                  pathname: "/(coach)/menu/lesson/[lessonId]",
                  params: {
                    lessonId: lesson.id,
                    lessonName: lesson.name,
                    lessonDuration: lesson.duration,
                  },
                })
              }
              activeOpacity={0.9}
            >
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  padding: 6,
                }}
                onPress={() => handleOpenMenu(lesson)}
              >
                <Feather name="more-vertical" size={22} color="#000" />
              </TouchableOpacity>

              <View style={{ paddingRight: 36 }}>
                <Text
                  style={{ fontSize: 18, fontWeight: "600", marginBottom: 4 }}
                >
                  {lesson.name}
                </Text>
                <Text style={{ fontSize: 14, color: "#666" }}>
                  {lesson.description || "Chưa có mô tả."}
                </Text>
                {lesson.duration && (
                  <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                    ⏱ {lesson.duration} phút
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPressOut={() => setMenuVisible(false)}
        >
          <View
            style={{
              width: 220,
              backgroundColor: "#fff",
              borderRadius: 12,
              paddingVertical: 10,
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 5,
              elevation: 5,
            }}
          >
            <TouchableOpacity
              onPress={() => handleEdit(selectedLesson)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ fontSize: 16 }}>✏️ Chỉnh sửa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeleteLesson(selectedLesson!)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ fontSize: 16, color: "red" }}>🗑️ Xóa</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default CoachLessonScreen;
