import storageService from "@/services/storageService";
import { Ionicons, Octicons } from "@expo/vector-icons";
import axios from "axios";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function UploadVideoScreen() {
  const {
    lessonId,
    videoId,
    videoTitle,
    videoDescription,
    drillName: paramDrillName,
    drillDescription: paramDrillDescription,
    drillPracticeSets: paramDrillPracticeSets,
  } = useLocalSearchParams<{
    lessonId: string;
    videoId?: string;
    videoTitle?: string;
    videoDescription?: string;
    drillName?: string;
    drillDescription?: string;
    drillPracticeSets?: string;
  }>();

  const [title, setTitle] = useState(videoTitle || "");
  const [description, setDescription] = useState(videoDescription || "");
  const [duration, setDuration] = useState(0);
  const [drillName, setDrillName] = useState(paramDrillName || "");
  const [drillDescription, setDrillDescription] = useState(
    paramDrillDescription || ""
  );
  const [drillPracticeSets, setDrillPracticeSets] = useState(
    paramDrillPracticeSets || ""
  );
  const [video, setVideo] = useState<
    ImagePicker.ImagePickerAsset | undefined
  >();
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoRef = useRef<Video>(null);

  // Update state when params change (e.g. when navigating between different videos)
  React.useEffect(() => {
    setTitle(videoTitle || "");
    setDescription(videoDescription || "");
    setDrillName(paramDrillName || "");
    setDrillDescription(paramDrillDescription || "");
    setDrillPracticeSets(paramDrillPracticeSets || "");
    setVideo(undefined); // Reset selected video on param change
  }, [
    videoId,
    videoTitle,
    videoDescription,
    paramDrillName,
    paramDrillDescription,
    paramDrillPracticeSets,
  ]);

  const pickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Quyền truy cập bị từ chối", "Cần quyền để chọn video.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedVideo = result.assets[0];
      setVideo(selectedVideo);
    }
  };

  const handleUploadVideo = async () => {
    const token = await storageService.getToken();
    if (!title.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề video.");
      return;
    }

    // For new videos, video selection is required
    // For updates, video is optional (can keep existing video)
    if (!videoId && !video) {
      Alert.alert("Lỗi", "Vui lòng chọn một video.");
      return;
    }

    // === Chuẩn bị FormData ===
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description?.trim() || "");

    // Only validate and append duration if we have a new video
    if (video) {
      const durNum = Number(duration);
      if (Number.isNaN(durNum) || durNum <= 0) {
        Alert.alert("Lỗi", "Thời lượng video không hợp lệ.");
        return;
      }
      formData.append("duration", String(duration));
      formData.append("video", {
        uri: video.uri,
        type: video.type,
        name: video.fileName,
      } as any);
    }

    formData.append("drillName", drillName.trim() || "");
    formData.append("drillDescription", drillDescription?.trim() || "");
    formData.append("drillPracticeSets", drillPracticeSets?.trim() || "");

    try {
      setSaving(true);
      setUploadProgress(0);
      

      let response;
      if (videoId) {
        // UPDATE mode
        response = await axios.put(
          `${API_URL}/v1/videos/${videoId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
              );
              setUploadProgress(progress);
              
            },
          }
        );
      } else {
        // CREATE mode
        response = await axios.post(
          `${API_URL}/v1/videos/lessons/${lessonId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
              );
              setUploadProgress(progress);
              
            },
          }
        );
      }

      if (response.status === 200 || response.status === 201) {
        const successMessage = videoId
          ? "Video đã được cập nhật thành công!"
          : "Video đã được tải lên!";
        Alert.alert("Thành công", successMessage, [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Lỗi", "Máy chủ phản hồi không hợp lệ.");
        console.error("Server response:", response.data);
      }
    } catch (err: any) {
      console.error("❌ Lỗi:", err.message);
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể lưu video. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView
        style={{ paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
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
            {videoId ? "Chỉnh sửa video" : "Thêm video mới"}
          </Text>

          <View style={{ width: 24 }} />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: "600", marginBottom: 6 }}>
            Tiêu đề video
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Tiêu đề video"
            placeholderTextColor="#6B7280"
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}
          />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: "600", marginBottom: 6 }}>Mô tả</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Mô tả video"
            placeholderTextColor="#6B7280"
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}
          />
        </View>

        {[
          {
            label: "Tên bài tập (drill)",
            value: drillName,
            setter: setDrillName,
          },
          {
            label: "Mô tả bài tập",
            value: drillDescription,
            setter: setDrillDescription,
          },
          {
            label: "Số set luyện tập",
            value: drillPracticeSets,
            setter: setDrillPracticeSets,
          },
        ].map((field, index) => (
          <View key={index} style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: "600", marginBottom: 6 }}>
              {field.label}
            </Text>
            <TextInput
              value={field.value}
              onChangeText={field.setter}
              placeholder={field.label}
              placeholderTextColor="#6B7280"
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
            />
          </View>
        ))}

        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontWeight: "600",
              marginBottom: 12,
              fontSize: 14,
              color: "#111827",
            }}
          >
            Video
          </Text>

          {!video ? (
            <TouchableOpacity
              onPress={pickVideo}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#059669",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 10,
                shadowColor: "#059669",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Octicons name="upload" size={20} color="white" />
              <Text
                style={{
                  color: "white",
                  fontWeight: "600",
                  fontSize: 14,
                  marginLeft: 8,
                }}
              >
                Chọn video
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 12 }}>
              {/* Video Preview */}
              <View
                style={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: 10,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <Video
                  ref={videoRef}
                  source={{ uri: video.uri }}
                  style={{ width: "100%", height: 200 }}
                  resizeMode={"contain" as any}
                  onLoad={(status) => {
                    if (status.isLoaded && status.durationMillis) {
                      setDuration(Math.floor(status.durationMillis / 1000));
                    }
                  }}
                  useNativeControls
                />
              </View>

              {/* Video Info Card */}
              <View
                style={{
                  backgroundColor: "#F9FAFB",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="film" size={18} color="#059669" />
                    <Text
                      style={{
                        marginLeft: 6,
                        fontWeight: "600",
                        fontSize: 13,
                        color: "#111827",
                      }}
                    >
                      {video.fileName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setVideo(undefined)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: "#FEE2E2",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#DC2626", fontWeight: "bold" }}>
                      ×
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Duration Display */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingTop: 4,
                  }}
                >
                  <Ionicons name="time" size={16} color="#6B7280" />
                  <Text
                    style={{
                      marginLeft: 6,
                      fontSize: 12,
                      color: "#6B7280",
                      fontWeight: "500",
                    }}
                  >
                    {duration > 0 ? `${duration} giây` : "Đang tải..."}
                  </Text>
                </View>
              </View>

              {/* Change Video Button */}
              <TouchableOpacity
                onPress={pickVideo}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#059669", fontWeight: "600", fontSize: 13 }}
                >
                  Chọn video khác
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={handleUploadVideo}
          disabled={saving || (!videoId && !video)}
          activeOpacity={0.8}
          style={{
            backgroundColor:
              saving || (!videoId && !video) ? "#9CA3AF" : "#059669",
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: "center",
            marginBottom: 30,
            gap: 8,
          }}
        >
          {saving ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text
                style={{
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                {videoId ? "Đang cập nhật" : "Đang tải lên"}... {uploadProgress}
                %
              </Text>
            </>
          ) : (
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
              {videoId ? "Cập nhật video" : "Tải video lên"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
