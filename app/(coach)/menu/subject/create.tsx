import { post } from "@/services/http/httpService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

      const res = await post("/v1/subjects", payload);

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
    <SafeAreaView>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo Tài liệu mới</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView>
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Tiêu đề <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, !subjectName && styles.inputError]}
                placeholder="VD: Pickleball cơ bản cho người mới bắt đầu"
                value={subjectName}
                onChangeText={setSubjectName}
                placeholderTextColor="#9CA3AF"
              />
              {!subjectName && (
                <Text style={styles.errorText}>Tiêu đề là bắt buộc</Text>
              )}
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô tả</Text>
            <TextInput
              style={[
                styles.input,
                !description && styles.inputError,
                { borderColor: "green" },
              ]}
              placeholder="VD: Pickleball cơ bản cho người mới bắt đầu"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Trình độ</Text>
            <View style={styles.segmentControl}>
              {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.segmentButton,
                    level === lvl && styles.segmentButtonActive,
                  ]}
                  onPress={() => setLevel(lvl as any)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      level === lvl && styles.segmentTextActive,
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

        <TouchableOpacity
          onPress={handleCreateSubject}
          disabled={loading}
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: loading ? "#86efac" : "#10b981",
              borderRadius: 12,
              marginHorizontal: 16,
              marginTop: 24,
              paddingVertical: 14,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3.84,
              elevation: 4,
              transform: [{ scale: loading ? 0.98 : 1 }],
            },
          ]}
          activeOpacity={0.85}
        >
          {loading ? (
            <>
              <ActivityIndicator
                size="small"
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                }}
              >
                Đang tạo...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                }}
              >
                Tạo tài liệu mới
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  },
  segmentControl: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  segmentTextActive: {
    color: "#059669",
    fontWeight: "600",
  },
  typeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  typeCardActive: {
    borderColor: "#059669",
    backgroundColor: "#F0FDF4",
  },
  typeCardContent: {
    flex: 1,
  },
  typeCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  typeCardDesc: {
    fontSize: 13,
    color: "#6B7280",
  },
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 14,
    color: "#111827",
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 14,
    color: "#111827",
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  scheduleForm: {
    marginBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 6,
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  warningContent: {
    flex: 1,
    marginLeft: 8,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 8,
  },
  conflictItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  conflictText: {
    fontSize: 12,
    color: "#92400E",
    marginLeft: 6,
  },
  warningNote: {
    fontSize: 11,
    color: "#D97706",
    marginTop: 6,
    fontStyle: "italic",
  },
  textArea: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 100,
  },
  priceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  priceButton: {
    width: "25%",
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    alignItems: "center",
  },
  priceButtonActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#059669",
  },
  priceButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  priceButtonTextActive: {
    color: "#059669",
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#1E40AF",
    marginLeft: 8,
    lineHeight: 18,
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#059669",
    paddingVertical: 12,
    borderRadius: 8,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    marginLeft: 6,
  },
  bottomActions: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -2 },
      },
      android: { elevation: 8 },
    }),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    backgroundColor: "#059669",
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
