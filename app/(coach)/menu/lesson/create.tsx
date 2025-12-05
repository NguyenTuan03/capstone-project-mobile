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
  View,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function CreateLessonScreen() {
  const { subjectId, subjectName } = useLocalSearchParams<{
    subjectId?: string;
    subjectName?: string;
  }>();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên bài học.");
      return;
    }
    try {
      setSaving(true);
      const payload: any = {
        name: name.trim(),
        description: description.trim(),
      };

      await post(`${API_URL}/v1/lessons/subjects/${subjectId}`, payload);

      Alert.alert("Thành công", "Tạo bài học thành công!", [
        {
          text: "OK",
          onPress: () => {
            router.replace("/(coach)/menu/subject");
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
                placeholderTextColor="#6B7280"
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
          </View>

          {/* Create Button */}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={saving}
            style={[styles.createButton, saving && styles.createButtonDisabled]}
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
