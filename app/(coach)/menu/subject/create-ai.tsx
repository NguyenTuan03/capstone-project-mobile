import aiSubjectGenerationService from "@/services/aiSubjectGeneration.service";
import http from "@/services/http/interceptor";
import {
    AiSubjectGeneration,
    PickleballLevel
} from "@/types/ai-subject-generation";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
import Toast from "react-native-toast-message";

export default function CreateAISubjectScreen() {
  const params = useLocalSearchParams<{ generationId: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [generation, setGeneration] = useState<AiSubjectGeneration | null>(
    null
  );
  const [subjectName, setSubjectName] = useState("");
  const [level, setLevel] = useState<PickleballLevel>(PickleballLevel.BEGINNER);
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadGeneration();
  }, [params.generationId]);

  const loadGeneration = async () => {
    try {
      setLoading(true);
      // Get generation from list - it already contains the data
      const response = await aiSubjectGenerationService.getAll(1, 100);
      const found = response.items.find(
        (item) => item.id.toString() === params.generationId
      );

      if (found) {
        setGeneration(found);
        setSubjectName(found.generatedData.name);
        setLevel(found.generatedData.level);
        setDescription(found.generatedData.description);
      } else {
        Alert.alert("Lỗi", "Không tìm thấy tài liệu AI");
        router.back();
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải tài liệu AI");
      console.error("Load generation error:", error);
      router.back();
    } finally {
      setLoading(false);
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

    if (!generation) return;

    try {
      setSubmitting(true);

      // Build lessons payload from AI data
      const lessonsPayload = generation.generatedData.lessons.map((lesson) => ({
        name: lesson.name,
        description: lesson.description,
        lessonNumber: lesson.lessonNumber,
        video: {
          title: lesson.video.title,
          description: lesson.video.description,
          tags: lesson.video.tags,
          drillName: lesson.video.drillName,
          drillDescription: lesson.video.drillDescription,
          drillPracticeSets: lesson.video.drillPracticeSets,
          // Video file will be uploaded separately by coach
          url: "", // Placeholder - coach must upload
        },
        quiz: {
          title: lesson.quiz.title,
          description: lesson.quiz.description,
          questions: lesson.quiz.questions.map((q) => ({
            title: q.title,
            explanation: q.explanation,
            options: q.options.map((opt) => ({
              content: opt.content,
              isCorrect: opt.isCorrect,
            })),
          })),
        },
      }));

      const payload = {
        name: subjectName.trim(),
        level,
        description: description.trim() || undefined,
        lessons: lessonsPayload,
        aiGenerationId: generation.id, // Link to AI generation
      };

      await http.post("/v1/subjects", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Tài liệu đã được tạo từ AI",
      });

      router.replace("/(coach)/menu/subject");
    } catch (error) {
      console.error("Create subject error:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tạo tài liệu. Vui lòng thử lại.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getLevelLabel = (lvl: PickleballLevel): string => {
    switch (lvl) {
      case PickleballLevel.BEGINNER:
        return "Cơ bản";
      case PickleballLevel.INTERMEDIATE:
        return "Trung cấp";
      case PickleballLevel.ADVANCED:
        return "Nâng cao";
      default:
        return "Không xác định";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Đang tải dữ liệu AI...</Text>
      </View>
    );
  }

  if (!generation) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="sparkles" size={20} color="#8B5CF6" />
            <Text style={styles.headerTitle}>Tạo từ AI</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* AI Prompt Info */}
        <View style={styles.promptSection}>
          <View style={styles.promptHeader}>
            <Ionicons name="bulb" size={16} color="#F59E0B" />
            <Text style={styles.promptLabel}>Yêu cầu ban đầu:</Text>
          </View>
          <Text style={styles.promptText}>{generation.prompt}</Text>
        </View>

        {/* Basic Info Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Tên tài liệu <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Kỹ thuật backhand cơ bản"
              value={subjectName}
              onChangeText={setSubjectName}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Cấp độ <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.levelOptions}>
              {[
                PickleballLevel.BEGINNER,
                PickleballLevel.INTERMEDIATE,
                PickleballLevel.ADVANCED,
              ].map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.levelOption,
                    level === lvl && styles.levelOptionActive,
                  ]}
                  onPress={() => setLevel(lvl)}
                >
                  <Text
                    style={[
                      styles.levelOptionText,
                      level === lvl && styles.levelOptionTextActive,
                    ]}
                  >
                    {getLevelLabel(lvl)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô tả</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Mô tả chi tiết về tài liệu..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Lessons Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Bài học ({generation.generatedData.lessons.length})
          </Text>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={16} color="#3B82F6" />
            <Text style={styles.infoText}>
              AI đã tạo {generation.generatedData.lessons.length} bài học với
              video và quiz. Bạn cần tải lên video sau khi tạo tài liệu.
            </Text>
          </View>

          {generation.generatedData.lessons.map((lesson, index) => (
            <View key={index} style={styles.lessonCard}>
              <View style={styles.lessonHeader}>
                <View style={styles.lessonNumber}>
                  <Text style={styles.lessonNumberText}>
                    Bài {lesson.lessonNumber}
                  </Text>
                </View>
                <Text style={styles.lessonName}>{lesson.name}</Text>
              </View>

              <Text style={styles.lessonDescription}>{lesson.description}</Text>

              <View style={styles.lessonMeta}>
                <View style={styles.metaRow}>
                  <Ionicons name="videocam" size={16} color="#8B5CF6" />
                  <Text style={styles.metaLabel}>Video:</Text>
                  <Text style={styles.metaValue}>{lesson.video.title}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="help-circle" size={16} color="#10B981" />
                  <Text style={styles.metaLabel}>Quiz:</Text>
                  <Text style={styles.metaValue}>
                    {lesson.quiz.questions.length} câu hỏi
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={18} color="#DC2626" />
          <Text style={styles.warningText}>
            Lưu ý: Bạn cần tải lên video cho mỗi bài học sau khi tạo tài liệu.
            Video hiện tại chỉ là mô tả từ AI.
          </Text>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, submitting && styles.createButtonDisabled]}
          onPress={handleCreateSubject}
          disabled={submitting || !subjectName.trim()}
        >
          {submitting ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.createButtonText}>Đang tạo...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Tạo tài liệu</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerRight: {
    width: 36,
  },
  promptSection: {
    backgroundColor: "#FFFBEB",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
    gap: 6,
  },
  promptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  promptText: {
    fontSize: 13,
    color: "#78350F",
    lineHeight: 18,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  required: {
    color: "#DC2626",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  levelOptions: {
    flexDirection: "row",
    gap: 8,
  },
  levelOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  levelOptionActive: {
    backgroundColor: "#EDE9FE",
    borderColor: "#8B5CF6",
  },
  levelOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  levelOptionTextActive: {
    color: "#8B5CF6",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#1E40AF",
    lineHeight: 18,
  },
  lessonCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  lessonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lessonNumber: {
    backgroundColor: "#EDE9FE",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  lessonNumberText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8B5CF6",
  },
  lessonName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  lessonDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  lessonMeta: {
    gap: 6,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  metaValue: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: "#991B1B",
    lineHeight: 18,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    marginTop: 8,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
