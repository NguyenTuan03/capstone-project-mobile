import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios"; // ⭐ Import axios trực tiếp
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import http from "@/services/http/interceptor"; // Import cho non-upload requests

export default function CreateSubjectScreen() {
  const [subjectName, setSubjectName] = useState("");
  const [level, setLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">(
    "BEGINNER"
  );
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    mimeType?: string;
    type?: string;
    fileName?: string;
  } | null>(null);

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Quyền truy cập",
          text2: "Cần quyền truy cập thư viện để chọn ảnh.",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          mimeType: asset.mimeType,
          type: asset.type,
          fileName:
            asset.fileName || asset.uri.split("/").pop() || "subject_image.jpg",
        });
      }
    } catch (err: any) {
      console.error("❌ Error picking image:", err);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể chọn ảnh. Vui lòng thử lại.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const handleCreateSubject = async () => {
    if (!subjectName.trim()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng điền tên tài liệu",
      });
      return;
    }

    try {
      setLoading(true);

      if (selectedImage) {
        // ⭐ DÙNG FETCH API thay vì axios cho FormData
        const formData = new FormData();
        formData.append("name", subjectName);
        formData.append("level", level);
        if (description) {
          formData.append("description", description);
        }

        const localUri = selectedImage.uri;
        const filename =
          localUri.split("/").pop() || `subject_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append("subject_image", {
          uri: localUri,
          name: filename,
          type: type,
        } as any);

        console.log("📤 Uploading with fetch API...");
        console.log("  Name:", subjectName);
        console.log("  Level:", level);
        console.log("  File:", filename, type);

        const token = await AsyncStorage.getItem("token");

        // ⭐ DÙNG FETCH - không set Content-Type
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/v1/subjects`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "ngrok-skip-browser-warning": "true",
              // ⭐ KHÔNG set Content-Type - fetch sẽ tự động set với boundary
            },
            body: formData,
          }
        );

        console.log("📥 Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Response error:", errorText);
          throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log("✅ Upload successful:", result);
      } else {
        // JSON payload - dùng http instance
        const payload = {
          name: subjectName,
          level,
          description: description || undefined,
        };

        console.log("📤 Creating without image...");

        await http.post("/v1/subjects", payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("✅ Create successful!");
      }

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Tạo tài liệu mới thành công!",
        position: "top",
        visibilityTime: 3000,
      });

      router.back();
    } catch (error: any) {
      console.error("❌ Error creating subject:", {
        message: error.message,
        error: error,
      });

      let errorMessage = "Không thể tạo tài liệu. Vui lòng thử lại.";

      if (error.message) {
        if (error.message.includes("Network request failed")) {
          errorMessage = "Lỗi kết nối mạng. Kiểm tra ngrok và backend.";
        } else if (error.message.includes("401")) {
          errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
        } else if (error.message.includes("413")) {
          errorMessage = "File ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn.";
        } else {
          errorMessage = error.message;
        }
      }

      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: errorMessage,
        position: "top",
        visibilityTime: 5000,
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo tài liệu</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Subject Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text" size={28} color="#059669" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Tạo tài liệu mới</Text>
              <Text style={styles.infoDescription}>
                Thêm một tài liệu cho học viên của bạn
              </Text>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Subject Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Tên tài liệu <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, !subjectName && styles.inputError]}
                placeholder="VD: Pickleball cơ bản"
                placeholderTextColor="#9CA3AF"
                value={subjectName}
                onChangeText={setSubjectName}
                editable={!loading}
              />
              {!subjectName && (
                <Text style={styles.errorText}>Tên tài liệu là bắt buộc</Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Mô tả</Text>
              <TextInput
                style={styles.textAreaInput}
                placeholder="Mô tả chi tiết về tài liệu (tùy chọn)"
                placeholderTextColor="#6B7280"
                value={description}
                onChangeText={setDescription}
                editable={!loading}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Image Upload - Optional */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Ảnh môn học (tùy chọn)</Text>
              {selectedImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setSelectedImage(null)}
                    disabled={loading}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={handlePickImage}
                    disabled={loading}
                  >
                    <Ionicons name="camera" size={18} color="#059669" />
                    <Text style={styles.changeImageText}>Đổi ảnh</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={handlePickImage}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons name="image-outline" size={32} color="#059669" />
                  <Text style={styles.imagePickerText}>
                    Chọn ảnh cho môn học (tùy chọn)
                  </Text>
                  <Text style={styles.imagePickerHint}>
                    Tỷ lệ khuyến nghị: 16:9
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Level Selection */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Trình độ</Text>
              <View style={styles.levelContainer}>
                {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    style={[
                      styles.levelButton,
                      level === lvl && styles.levelButtonActive,
                    ]}
                    onPress={() => setLevel(lvl as any)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.levelText,
                        level === lvl && styles.levelTextActive,
                      ]}
                    >
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
          </View>

          {/* Create Button */}
          <TouchableOpacity
            onPress={handleCreateSubject}
            disabled={loading}
            style={[
              styles.createButton,
              loading && styles.createButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Tạo tài liệu</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Styles giữ nguyên
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  infoDescription: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 2,
  },
  formSection: {
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  required: {
    color: "#EF4444",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  textAreaInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    textAlignVertical: "top",
    minHeight: 100,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 2,
  },
  levelContainer: {
    flexDirection: "row",
    gap: 8,
  },
  levelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  levelButtonActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#059669",
  },
  levelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  levelTextActive: {
    color: "#059669",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
    shadowColor: "#059669",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  imagePickerButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#059669",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    marginTop: 4,
  },
  imagePickerHint: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  imagePreview: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#F3F4F6",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  changeImageButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#059669",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  changeImageText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
});
