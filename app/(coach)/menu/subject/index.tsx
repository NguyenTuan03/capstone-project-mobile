import { get } from "@/services/http/httpService";
import { Subject } from "@/types/subject";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const CoachSubjectScreen = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const handleOpenMenu = (subject: any) => {
    setSelectedSubject(subject);
    setModalVisible(true);
  };

  const handleEdit = (s: Subject | null) => {
    if (!s) return;
    setModalVisible(false);
    router.push({
      pathname: "/(coach)/menu/subject/edit" as any,
      params: {
        subjectId: s.id,
        subjectName: s.name,
        subjectDescription: s.description,
        subjectLevel: s.level,
      },
    });
  };

  const handleDelete = () => {
    // setSubjects((prev) =>
    //   prev.filter((item) => item.id !== selectedSubject.id)
    // );
    setModalVisible(false);
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const userString = await AsyncStorage.getItem("user");
      if (!userString) {
        console.warn("Không tìm thấy thông tin người dùng");
        return;
      }
      const user = JSON.parse(userString);
      const userId = user.id;

      const res = await get<{ items: Subject[] }>(
        `${API_URL}/v1/subjects?filter=createdBy_eq_${userId}&filter=status_eq_PUBLISHED`
      );
      setSubjects(res.data.items || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách môn học:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 20,
      }}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        Danh sách môn học của tôi
      </Text>

      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#EAEAEA",
          marginBottom: 10,
        }}
        onPress={() => router.push("/(coach)/menu/subject/create" as any)}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="add" size={22} color="#000" />
          <Text style={{ marginLeft: 10, fontSize: 16 }}>Tạo môn học</Text>
        </View>
      </TouchableOpacity>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#000" />
          <Text style={{ marginTop: 10, color: "#666" }}>
            Đang tải dữ liệu...
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {subjects.length === 0 ? (
            <Text style={{ textAlign: "center", color: "#888", marginTop: 20 }}>
              Bạn chưa có môn học nào.
            </Text>
          ) : (
            subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={{
                  backgroundColor: "#f9f9f9",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#eee",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                onPress={() =>
                  router.push({
                    pathname:
                      `/(coach)/menu/subject/${subject.id}/lesson` as any,
                    params: { subjectName: subject.name },
                  })
                }
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: "#333",
                    marginBottom: 6,
                  }}
                >
                  {subject.name}
                </Text>
                <Text style={{ fontSize: 14, color: "#666" }}>
                  {subject.description ||
                    "Không có mô tả chi tiết cho môn học này."}
                </Text>
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    padding: 6,
                  }}
                  onPress={() => handleOpenMenu(subject)}
                >
                  <Feather name="more-vertical" size={22} color="#000" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
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
              onPress={() => handleEdit(selectedSubject)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ fontSize: 16 }}>✏️ Chỉnh sửa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
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

export default CoachSubjectScreen;
