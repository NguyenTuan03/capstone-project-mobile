import CreateEditCourseModal from "@/components/coach/course/modal/CreateEditCourseModal";
import { post } from "@/services/http/httpService";
import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateCourseScreen() {
  const [modalVisible, setModalVisible] = useState(true);

  const handleSubmit = async (data: {
    subjectId: number;
    learningFormat: string;
    minParticipants: number;
    maxParticipants: number;
    pricePerParticipant: number;
    startDate: string;
    address: string;
    province: number;
    district: number;
    schedules?: any[];
  }) => {
    try {
      // Tách subjectId ra khỏi payload vì nó đã có trong URL
      const { subjectId, ...payload } = data;

      await post(`/v1/courses/subjects/${subjectId}`, payload);
      Alert.alert("Thành công", "Tạo khóa học thành công!", [
        {
          text: "OK",
          onPress: () => {
            setModalVisible(false);
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.error("Lỗi khi tạo khóa học:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Không thể tạo khóa học. Vui lòng thử lại.";
      Alert.alert("Lỗi", errorMessage);
      throw error;
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <CreateEditCourseModal
        visible={modalVisible}
        onClose={handleClose}
        onSubmit={handleSubmit}
        mode="create"
      />
    </SafeAreaView>
  );
}
