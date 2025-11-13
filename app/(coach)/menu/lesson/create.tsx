import { post } from "@/services/http/httpService";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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
  View
} from "react-native";

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo bài học</Text>
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
          {/* Subject Info */}
          {subjectName && (
            <View style={styles.subjectInfoCard}>
              <View style={styles.subjectIconContainer}>
                <Ionicons name="document" size={24} color="#059669" />
              </View>
              <View>
                <Text style={styles.subjectLabel}>Bài học cho tài liệu</Text>
                <Text style={styles.subjectName}>{subjectName}</Text>
              </View>
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Lesson Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Tên bài học</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nhập tên bài học"
                editable={!saving}
                style={styles.textInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Mô tả</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Nhập mô tả ngắn (tùy chọn)"
                editable={!saving}
                multiline
                numberOfLines={4}
                style={styles.textAreaInput}
                placeholderTextColor="#6B7280"
              />
            </View>

            {/* Duration */}
            <View style={styles.fieldGroup}>
              <View style={styles.durationHeader}>
                <Text style={styles.fieldLabel}>Thời lượng</Text>
                <Text style={styles.durationUnit}>(phút)</Text>
              </View>
              <View style={styles.durationControl}>
                <TouchableOpacity
                  onPress={() =>
                    setDuration((prev) => {
                      const num = parseInt(prev || "0", 10);
                      return num > 0 ? String(num - 1) : "0";
                    })
                  }
                  disabled={saving}
                  style={styles.durationButton}
                >
                  <Ionicons name="remove" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <TextInput
                  value={duration}
                  onChangeText={(text) => {
                    const sanitized = text.replace(/[^0-9]/g, "");
                    setDuration(sanitized);
                  }}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  editable={!saving}
                  style={styles.durationInput}
                />

                <TouchableOpacity
                  onPress={() =>
                    setDuration((prev) => {
                      const num = parseInt(prev || "0", 10);
                      return String(num + 1);
                    })
                  }
                  disabled={saving}
                  style={[styles.durationButton, styles.durationButtonAdd]}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={saving}
            style={[
              styles.createButton,
              saving && styles.createButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Tạo bài học</Text>
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
  subjectInfoCard: {
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
  subjectIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  subjectLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  subjectName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
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
  durationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  durationUnit: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  durationControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    gap: 1,
    overflow: "hidden",
  },
  durationButton: {
    width: 44,
    height: 44,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
  },
  durationButtonAdd: {
    backgroundColor: "#059669",
  },
  durationInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
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
