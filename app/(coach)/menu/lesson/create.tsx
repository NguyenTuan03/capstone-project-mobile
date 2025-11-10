import React, { useState } from "react";
import { post } from "@/services/http/httpService";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function CreateLessonScreen() {
  const { subjectId, subjectName } = useLocalSearchParams<{
    subjectId?: string;
    subjectName?: string;
  }>();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên bài học.");
      return;
    }
    const durNum = Number(duration);
    if (!duration.trim() || Number.isNaN(durNum) || durNum <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập thời lượng (phút) hợp lệ.");
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        name: name.trim(),
        description: description.trim(),
        duration: durNum,
      };
      console.log("Payload for creating lesson:", payload);

      await post(`${API_URL}/v1/lessons/subjects/${subjectId}`, payload);

      Alert.alert("Thành công", "Tạo bài học thành công!", [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error("Lỗi khi tạo bài học:", error);
      Alert.alert("Lỗi", "Không thể tạo bài học. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 }}
    >
      {/* Header */}
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
          Tạo bài học
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {subjectName ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: "#6B7280" }}>
                Bài học cho tài liệu
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "600", marginTop: 4 }}>
                {subjectName}
              </Text>
            </View>
          ) : null}
          <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 6 }}>
            Tên bài học
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên bài học"
            editable={!saving}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              padding: 10,
              marginBottom: 16,
            }}
          />

          <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 6 }}>
            Mô tả
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Nhập mô tả ngắn"
            editable={!saving}
            multiline
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              padding: 10,
              height: 110,
              textAlignVertical: "top",
              marginBottom: 16,
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
                setDuration((prev) => {
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
              value={duration}
              onChangeText={(text) => {
                const sanitized = text.replace(/[^0-9]/g, "");
                setDuration(sanitized);
              }}
              placeholder="00"
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
                setDuration((prev) => {
                  const num = parseInt(prev || "0", 10);
                  return String(num + 1);
                })
              }
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                backgroundColor: "#10B981",
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
            onPress={handleCreate}
            disabled={saving}
            style={{
              backgroundColor: saving ? "#999" : "#10B981",
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Tạo bài học
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
