import http from "@/services/http/interceptor";
import { Ionicons, Octicons } from "@expo/vector-icons";
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

      // Ensure URI has file:// prefix for Android compatibility
      const videoUri = video.uri.startsWith("file://")
        ? video.uri
        : `file://${video.uri}`;

      // Ensure filename ends with proper extension
      const videoName = video.fileName?.endsWith(".mp4")
        ? video.fileName
        : `${video.fileName || "video"}.mp4`;

      formData.append("video", {
        uri: videoUri,
        type: "video/mp4", // Explicit MIME type for Android
        name: videoName,
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
        response = await http.put(`/v1/videos/${videoId}`, formData, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
            );
            setUploadProgress(progress);
          },
        });
      } else {
        // CREATE mode
        response = await http.post(`/v1/videos/lessons/${lessonId}`, formData, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
            );
            setUploadProgress(progress);
          },
        });
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
      }
    } catch (err: any) {
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
        style={{ paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 10,
            marginBottom: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" }}
          >
            <Ionicons name="arrow-back" size={20} color="#059669" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              textAlign: "center",
              flex: 1,
              marginLeft: -36, // visually center title
            }}
            numberOfLines={1}
          >
            {videoId ? "Chỉnh sửa video" : "Thêm video mới"}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Form Fields */}
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontWeight: "600", fontSize: 13, marginBottom: 4, color: "#374151" }}>
            Tiêu đề video
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Tiêu đề video"
            placeholderTextColor="#9CA3AF"
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              fontSize: 14,
              color: "#111827",
            }}
            maxLength={60}
          />
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontWeight: "600", fontSize: 13, marginBottom: 4, color: "#374151" }}>Mô tả</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Mô tả video"
            placeholderTextColor="#9CA3AF"
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              fontSize: 14,
              color: "#111827",
            }}
            multiline
            maxLength={200}
          />
        </View>

        {[
          {
            label: "Tên bài tập",
            value: drillName,
            setter: setDrillName,
            placeholder: "Tên bài tập",
          },
          {
            label: "Mô tả bài tập",
            value: drillDescription,
            setter: setDrillDescription,
            placeholder: "Mô tả bài tập",
          },
          {
            label: "Số set luyện tập",
            value: drillPracticeSets,
            setter: setDrillPracticeSets,
            placeholder: "Số set luyện tập",
            keyboardType: "numeric",
          },
        ].map((field, index) => (
          <View key={index} style={{ marginBottom: 8 }}>
            <Text style={{ fontWeight: "600", fontSize: 13, marginBottom: 4, color: "#374151" }}>
              {field.label}
            </Text>
            <TextInput
              value={field.value}
              onChangeText={field.setter}
              placeholder={field.placeholder}
              placeholderTextColor="#9CA3AF"
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 12,
                fontSize: 14,
                color: "#111827",
              }}
              keyboardType={(field.keyboardType as import("react-native").KeyboardTypeOptions) || "default"}
              maxLength={field.keyboardType === "numeric" ? 3 : 60}
            />
          </View>
        ))}

        {/* Video Section */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontWeight: "600",
              marginBottom: 8,
              fontSize: 14,
              color: "#059669",
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
                paddingHorizontal: 18,
                paddingVertical: 13,
                borderRadius: 8,
                shadowColor: "#059669",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
                marginBottom: 2,
              }}
            >
              <Octicons name="upload" size={18} color="white" />
              <Text
                style={{
                  color: "white",
                  fontWeight: "700",
                  fontSize: 14,
                  marginLeft: 7,
                  letterSpacing: 0.3,
                }}
              >
                Chọn video
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 8 }}>
              {/* Video Preview */}
              <View
                style={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: 10,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  marginBottom: 4,
                }}
              >
                <Video
                  ref={videoRef}
                  source={{ uri: video.uri }}
                  style={{ width: "100%", height: 180 }}
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
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Ionicons name="film" size={16} color="#059669" />
                  <Text
                    style={{
                      marginLeft: 6,
                      fontWeight: "600",
                      fontSize: 12,
                      color: "#111827",
                      maxWidth: 120,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {video.fileName}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setVideo(undefined)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    backgroundColor: "#FEE2E2",
                    justifyContent: "center",
                    alignItems: "center",
                    marginLeft: 8,
                  }}
                >
                  <Text style={{ color: "#DC2626", fontWeight: "bold", fontSize: 16 }}>
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Duration Display */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingTop: 2,
                  marginBottom: 2,
                }}
              >
                <Ionicons name="time" size={14} color="#6B7280" />
                <Text
                  style={{
                    marginLeft: 5,
                    fontSize: 12,
                    color: "#6B7280",
                    fontWeight: "500",
                  }}
                >
                  {duration > 0 ? `${duration} giây` : "Đang tải..."}
                </Text>
              </View>

              {/* Change Video Button */}
              <TouchableOpacity
                onPress={pickVideo}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 10,
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 8,
                  alignItems: "center",
                  marginTop: 2,
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

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          {/* Secondary Button: Cancel/Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.85}
            style={{
              flex: 1,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 13,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.07,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text style={{ color: '#374151', fontSize: 15, fontWeight: '600', letterSpacing: 0.2 }}>
              Huỷ
            </Text>
          </TouchableOpacity>

          {/* Primary Button: Upload/Update */}
          <TouchableOpacity
            onPress={handleUploadVideo}
            disabled={saving || (!videoId && !video)}
            activeOpacity={0.85}
            style={{
              flex: 1,
              backgroundColor:
                saving || (!videoId && !video) ? '#9CA3AF' : '#059669',
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 13,
              shadowColor: '#059669',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 3,
              flexDirection: 'row',
              gap: 8,
            }}
          >
            {saving ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: '700',
                    marginLeft: 8,
                    letterSpacing: 0.3,
                  }}
                >
                  {videoId ? 'Đang cập nhật' : 'Đang tải lên'}... {uploadProgress}%
                </Text>
              </>
            ) : (
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>
                {videoId ? 'Cập nhật video' : 'Tải video lên'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
