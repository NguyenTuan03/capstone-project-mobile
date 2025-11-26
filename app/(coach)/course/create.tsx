import CreateEditCourseModal from "@/components/coach/course/modal/CreateEditCourseModal";
import { post } from "@/services/http/httpService";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";

type CourseImagePayload = {
  uri: string;
  fileName?: string;
  mimeType?: string;
};

export default function CreateCourseScreen() {
  const [modalVisible, setModalVisible] = useState(true);

  const handleSubmit = async (data: {
    subjectId: number;
    learningFormat: string;
    minParticipants: number;
    maxParticipants: number;
    pricePerParticipant: number;
    startDate: string;
    court?: number | undefined;
    schedules?: any[];
    courseImage?: CourseImagePayload;
  }) => {
    try {
      const { subjectId, courseImage, ...payload } = data;

      if (courseImage) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (Array.isArray(value) || typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        });

        formData.append("course_image", {
          uri: courseImage.uri,
          name:
            courseImage.fileName ||
            courseImage.uri.split("/").pop() ||
            `course_${Date.now()}.jpg`,
          type: courseImage.mimeType || "image/jpeg",
        } as any);

        await post(`/v1/courses/subjects/${subjectId}`, formData);
      } else {
        await post(`/v1/courses/subjects/${subjectId}`, payload);
      }
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
      const errorMessage =
        error.response?.data?.message ||
        "Không thể tạo khóa học. Vui lòng thử lại.";
      Alert.alert("Lỗi", errorMessage);
      throw error;
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    router.replace("/(coach)/course" as any);
  };

  return (
    <View style={{ flex: 1 }}>
      <CreateEditCourseModal
        visible={modalVisible}
        onClose={handleClose}
        onSubmit={handleSubmit}
        mode="create"
      />
    </View>
  );
}
