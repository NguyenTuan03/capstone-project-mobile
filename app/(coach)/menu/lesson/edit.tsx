import { put } from "@/services/http/httpService";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function EditSubjectScreen() {
  const { lessonId, lessonName, lessonDescription, lessonDuration } =
    useLocalSearchParams<{
      lessonId: string;
      lessonName: string;
      lessonDescription: string;
      lessonDuration: string;
    }>();

  const [editNameLesson, setEditNameLesson] = useState(lessonName || "");
  const [editDescriptionLesson, setEditDescriptionLesson] = useState(
    lessonDescription || ""
  );
  const [editDuration, setEditDuration] = useState(lessonDuration || "");

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await put(`${API_URL}/v1/lessons/${lessonId}`, {
        name: editNameLesson,
        description: editDescriptionLesson,
        duration: editDuration,
      });

      Alert.alert("Thành công", "Cập nhật bài học thành công!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Lỗi khi lưu chỉnh sửa bài học:", error);
      Alert.alert("Lỗi", "Không thể lưu thay đổi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View
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
          Chinh sửa bài học
        </Text>

        <TouchableOpacity>
          <Ionicons
            name="information-circle-outline"
            size={24}
            color="#059669"
          />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 6 }}>
          Tên bài học
        </Text>
        <TextInput
          value={editNameLesson}
          onChangeText={setEditNameLesson}
          placeholder={lessonName}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            padding: 10,
            marginBottom: 20,
          }}
        />

        <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 6 }}>
          Mô tả bài học
        </Text>
        <TextInput
          value={editDescriptionLesson}
          onChangeText={setEditDescriptionLesson}
          placeholder={lessonDescription}
          multiline
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            padding: 10,
            height: 100,
            textAlignVertical: "top",
            marginBottom: 30,
          }}
        />

        <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 6 }}>
          Thời lượng (phút)
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            onPress={() =>
              setEditDuration((prev) => {
                const num = parseInt(prev || "0", 10);
                return num > 0 ? String(num - 1) : "0";
              })
            }
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              backgroundColor: "#E5E7EB",
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "600" }}>−</Text>
          </TouchableOpacity>

          <TextInput
            value={editDuration}
            onChangeText={(text) => {
              const sanitized = text.replace(/[^0-9]/g, "");
              setEditDuration(sanitized);
            }}
            placeholder={lessonDuration}
            keyboardType="numeric"
            editable={!saving}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 16,
            }}
          />
          <TouchableOpacity
            onPress={() =>
              setEditDuration((prev) => {
                const num = parseInt(prev || "0", 10);
                return String(num + 1);
              })
            }
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              backgroundColor: "#059669",
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "600", color: "white" }}>
              +
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: saving ? "#999" : "#059669",
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
