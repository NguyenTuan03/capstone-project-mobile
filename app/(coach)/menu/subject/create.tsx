import { post } from "@/services/http/httpService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CreateSubjectScreen() {
  const [subjectName, setSubjectName] = useState("");
  const [level, setLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">(
    "BEGINNER"
  );
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateSubject = async () => {
    if (!subjectName.trim()) {
      Alert.alert("Lỗi", "Tên tài liệu là bắt buộc.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: subjectName,
        description,
        level,
      };
      console.log("Payload gửi lên API:", payload);

      await post("/v1/subjects", payload);

      Alert.alert("Thành công", "Tạo tài liệu mới thành công!");
      router.back();
    } catch (error: any) {
      console.error("Lỗi khi tạo tài liệu:", error);
      Alert.alert("Lỗi", "Không thể tạo tài liệu. Vui lòng thử lại.");
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
              <Text style={styles.infoDescription}>Thêm một tài liệu cho học viên của bạn</Text>
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
});
