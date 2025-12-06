import { put } from "@/services/http/httpService";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function EditSubjectScreen() {
  const { subjectId, subjectName, subjectDescription, subjectLevel, subjectStatus } =
    useLocalSearchParams<{
      subjectId: string;
      subjectName: string;
      subjectDescription: string;
      subjectLevel: string;
      subjectStatus: string;
    }>();

  //   
  //   
  //   

  const [editNameSubject, setEditNameSubject] = useState(subjectName || "");
  const [editDescription, setEditDescription] = useState(
    subjectDescription || ""
  );
  const [editLevel, setEditLevel] = useState<
    "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  >(subjectLevel as any);
  const [editStatus, setEditStatus] = useState<"DRAFT" | "PUBLISHED">(subjectStatus as any);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await put(`${API_URL}/v1/subjects/${subjectId}`, {
        name: editNameSubject,
        description: editDescription,
        level: editLevel,
        status: editStatus,
      });

      Alert.alert("Thành công", "Cập nhật tài liệu thành công!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
 "Lỗi khi lưu tài liệu:", error);
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
          Chinh sửa tài liệu
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
          Tên tài liệu
        </Text>
        <TextInput
          value={editNameSubject}
          onChangeText={setEditNameSubject}
          placeholder={subjectName}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            padding: 10,
            marginBottom: 20,
          }}
        />

        <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 6 }}>
          Mô tả tài liệu
        </Text>
        <TextInput
          value={editDescription}
          onChangeText={setEditDescription}
          placeholder={subjectDescription}
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
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#374151",
              marginBottom: 8,
            }}
          >
            Trình độ
          </Text>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#F3F4F6",
              borderRadius: 8,
              padding: 4,
            }}
          >
            {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[
                  {
                    flex: 1,
                    paddingVertical: 10,
                    alignItems: "center",
                    borderRadius: 6,
                  },
                  editLevel === lvl && {
                    backgroundColor: "#FFFFFF",
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
                  },
                ]}
                onPress={() => setEditLevel(lvl as any)}
              >
                <Text>
                  {lvl === "BEGINNER"
                    ? "Cơ bản"
                    : lvl === "INTERMEDIATE"
                    ? "Trung bình"
                    : "Nâng cao"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "500",
            color: "#374151",
            marginBottom: 8,
          }}
        >
          Trạng thái
        </Text>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#F3F4F6",
            borderRadius: 8,
            padding: 4,
            marginBottom: 30,
          }}
        >
          {["DRAFT", "PUBLISHED"].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                {
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: "center",
                  borderRadius: 6,
                },
                editStatus === status && {
                  backgroundColor: "#FFFFFF",
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 1,
                },
              ]}
              onPress={() => setEditStatus(status as any)}
            >
              <Text>{status === "DRAFT" ? "Nháp" : "Công khai"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: saving ? "#999" : "#4CAF50",
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
