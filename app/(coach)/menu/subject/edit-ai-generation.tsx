import aiSubjectGenerationService from "@/services/aiSubjectGeneration.service";
import {
    AiSubjectGenerationResponse,
    PickleballLevel,
} from "@/types/ai-subject-generation";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const EditAiGenerationScreen: React.FC = () => {
  const { generationId } = useLocalSearchParams();

  console.log(
    "EditAiGenerationScreen mounted with generationId:",
    generationId
  );

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<PickleballLevel>(PickleballLevel.BEGINNER);
  const [lessons, setLessons] = useState<
    AiSubjectGenerationResponse["lessons"]
  >([]);

  const loadGeneration = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Loading generation with ID:", generationId);

      const data = await aiSubjectGenerationService.getById(
        Number(generationId)
      );

      console.log("Loaded generation data:", data);

      // Initialize form with existing data
      setName(data.generatedData.name);
      setDescription(data.generatedData.description);
      setLevel(data.generatedData.level);
      setLessons(data.generatedData.lessons || []);

      console.log("Form initialized successfully");
    } catch (error) {
      console.error("Error loading generation:", error);
      Alert.alert(
        "Lỗi",
        `Không thể tải dữ liệu tạo AI: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        [
          {
            text: "Quay lại",
            onPress: () => router.back(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }, [generationId]);

  useEffect(() => {
    loadGeneration();
  }, [loadGeneration]);

  const handleSave = async () => {
    if (!name.trim() || !description.trim()) {
      Alert.alert("Lỗi", "Vui lòng điền tên và mô tả tài liệu");
      return;
    }

    if (lessons.length === 0) {
      Alert.alert("Lỗi", "Tài liệu phải có ít nhất 1 bài học");
      return;
    }

    // Validate quiz questions
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      if (lesson.quiz.questions && lesson.quiz.questions.length > 0) {
        for (let j = 0; j < lesson.quiz.questions.length; j++) {
          const question = lesson.quiz.questions[j];

          // Check if question has valid options
          const validOptions = question.options?.filter((opt) =>
            opt.content.trim()
          );
          if (!validOptions || validOptions.length < 2) {
            Alert.alert(
              "Lỗi",
              `Bài ${i + 1}, Câu hỏi ${j + 1}: Cần ít nhất 2 đáp án hợp lệ`
            );
            return;
          }

          // Check if exactly one option is marked as correct
          const correctCount = validOptions.filter(
            (opt) => opt.isCorrect
          ).length;
          if (correctCount === 0) {
            Alert.alert(
              "Lỗi",
              `Bài ${i + 1}, Câu hỏi ${j + 1}: Chưa chọn đáp án đúng`
            );
            return;
          }
          if (correctCount > 1) {
            Alert.alert(
              "Lỗi",
              `Bài ${i + 1}, Câu hỏi ${j + 1}: Chỉ được chọn 1 đáp án đúng`
            );
            return;
          }
        }
      }
    }

    try {
      setUpdating(true);
      const updatedData: AiSubjectGenerationResponse = {
        name,
        description,
        level,
        lessons,
      };

      console.log("Updating generation with data:", updatedData.name);

      await aiSubjectGenerationService.update(
        Number(generationId),
        updatedData
      );

      Alert.alert("Thành công", "Đã lưu thay đổi", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error updating generation:", error);
      Alert.alert("Lỗi", "Không thể lưu thay đổi");
    } finally {
      setUpdating(false);
    }
  };

  const updateLesson = (
    index: number,
    field: string,
    value: any,
    subField?: string
  ) => {
    setLessons((prev) => {
      const updated = [...prev];
      if (subField) {
        const currentFieldValue =
          updated[index][field as keyof (typeof updated)[0]];
        if (
          typeof currentFieldValue === "object" &&
          currentFieldValue !== null
        ) {
          updated[index] = {
            ...updated[index],
            [field]: {
              ...(currentFieldValue as object),
              [subField]: value,
            },
          };
        }
      } else {
        updated[index] = {
          ...updated[index],
          [field]: value,
        };
      }
      return updated;
    });
  };

  const updateQuestion = (
    lessonIndex: number,
    questionIndex: number,
    field: string,
    value: any
  ) => {
    setLessons((prev) => {
      const updated = [...prev];
      const questions = [...(updated[lessonIndex].quiz.questions || [])];
      questions[questionIndex] = {
        ...questions[questionIndex],
        [field]: value,
      };
      updated[lessonIndex] = {
        ...updated[lessonIndex],
        quiz: {
          ...updated[lessonIndex].quiz,
          questions,
        },
      };
      return updated;
    });
  };

  const updateOption = (
    lessonIndex: number,
    questionIndex: number,
    optionIndex: number,
    field: string,
    value: any
  ) => {
    setLessons((prev) => {
      const updated = [...prev];
      const questions = [...(updated[lessonIndex].quiz.questions || [])];
      const options = [...(questions[questionIndex].options || [])];

      // Single choice validation: when setting isCorrect to true, unset all others
      if (field === "isCorrect" && value === true) {
        options.forEach((opt, idx) => {
          opt.isCorrect = idx === optionIndex;
        });
      } else {
        options[optionIndex] = {
          ...options[optionIndex],
          [field]: value,
        };
      }

      questions[questionIndex] = {
        ...questions[questionIndex],
        options,
      };
      updated[lessonIndex] = {
        ...updated[lessonIndex],
        quiz: {
          ...updated[lessonIndex].quiz,
          questions,
        },
      };
      return updated;
    });
  };

  const addLesson = () => {
    const newLesson = {
      lessonNumber: lessons.length + 1,
      name: `Bài ${lessons.length + 1}`,
      description: "",
      video: {
        title: "",
        description: "",
        tags: [],
        drillName: "",
        drillDescription: "",
        drillPracticeSets: "",
      },
      quiz: {
        title: "",
        description: "",
        questions: [],
      },
    };
    setLessons([...lessons, newLesson]);
  };

  const removeLesson = (index: number) => {
    Alert.alert("Xác nhận", `Bạn có chắc muốn xóa bài học ${index + 1}?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          const updated = lessons.filter((_, i) => i !== index);
          // Renumber lessons
          updated.forEach((lesson, i) => {
            lesson.lessonNumber = i + 1;
          });
          setLessons(updated);
        },
      },
    ]);
  };

  const addQuestion = (lessonIndex: number) => {
    const newQuestion = {
      title: "",
      explanation: "",
      options: [
        { content: "", isCorrect: false },
        { content: "", isCorrect: false },
      ],
    };
    setLessons((prev) => {
      const updated = [...prev];
      updated[lessonIndex] = {
        ...updated[lessonIndex],
        quiz: {
          ...updated[lessonIndex].quiz,
          questions: [
            ...(updated[lessonIndex].quiz.questions || []),
            newQuestion,
          ],
        },
      };
      return updated;
    });
  };

  const removeQuestion = (lessonIndex: number, questionIndex: number) => {
    setLessons((prev) => {
      const updated = [...prev];
      updated[lessonIndex] = {
        ...updated[lessonIndex],
        quiz: {
          ...updated[lessonIndex].quiz,
          questions: updated[lessonIndex].quiz.questions?.filter(
            (_, i) => i !== questionIndex
          ),
        },
      };
      return updated;
    });
  };

  const addOption = (lessonIndex: number, questionIndex: number) => {
    setLessons((prev) => {
      const updated = [...prev];
      const questions = [...(updated[lessonIndex].quiz.questions || [])];
      questions[questionIndex] = {
        ...questions[questionIndex],
        options: [
          ...(questions[questionIndex].options || []),
          { content: "", isCorrect: false },
        ],
      };
      updated[lessonIndex] = {
        ...updated[lessonIndex],
        quiz: {
          ...updated[lessonIndex].quiz,
          questions,
        },
      };
      return updated;
    });
  };

  const removeOption = (
    lessonIndex: number,
    questionIndex: number,
    optionIndex: number
  ) => {
    setLessons((prev) => {
      const updated = [...prev];
      const questions = [...(updated[lessonIndex].quiz.questions || [])];
      questions[questionIndex] = {
        ...questions[questionIndex],
        options: questions[questionIndex].options?.filter(
          (_, i) => i !== optionIndex
        ),
      };
      updated[lessonIndex] = {
        ...updated[lessonIndex],
        quiz: {
          ...updated[lessonIndex].quiz,
          questions,
        },
      };
      return updated;
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa AI Generation</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Subject Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin tài liệu</Text>

          <Text style={styles.label}>Tên tài liệu</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên tài liệu..."
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Mô tả</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Nhập mô tả..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Cấp độ</Text>
          <View style={styles.levelButtons}>
            {[
              { value: PickleballLevel.BEGINNER, label: "Cơ bản" },
              { value: PickleballLevel.INTERMEDIATE, label: "Trung cấp" },
              { value: PickleballLevel.ADVANCED, label: "Nâng cao" },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.levelButton,
                  level === item.value && styles.levelButtonActive,
                ]}
                onPress={() => setLevel(item.value)}
              >
                <Text
                  style={[
                    styles.levelButtonText,
                    level === item.value && styles.levelButtonTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lessons */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bài học ({lessons.length})</Text>
            <TouchableOpacity style={styles.addButton} onPress={addLesson}>
              <Ionicons name="add-circle" size={20} color="#059669" />
              <Text style={styles.addButtonText}>Thêm bài</Text>
            </TouchableOpacity>
          </View>

          {lessons.map((lesson, lessonIndex) => (
            <View key={lessonIndex} style={styles.lessonCard}>
              <View style={styles.lessonHeader}>
                <Text style={styles.lessonTitle}>
                  Bài {lesson.lessonNumber}
                </Text>
                <TouchableOpacity
                  onPress={() => removeLesson(lessonIndex)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Tên bài học</Text>
              <TextInput
                style={styles.input}
                value={lesson.name}
                onChangeText={(value) =>
                  updateLesson(lessonIndex, "name", value)
                }
                placeholder="Nhập tên bài học..."
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>Mô tả</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={lesson.description}
                onChangeText={(value) =>
                  updateLesson(lessonIndex, "description", value)
                }
                placeholder="Nhập mô tả..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Video Section */}
              <View style={styles.subSection}>
                <View style={styles.subSectionHeader}>
                  <Ionicons name="videocam" size={18} color="#8B5CF6" />
                  <Text style={styles.subSectionTitle}>Video</Text>
                </View>

                <Text style={styles.label}>Tiêu đề video</Text>
                <TextInput
                  style={styles.input}
                  value={lesson.video.title}
                  onChangeText={(value) =>
                    updateLesson(lessonIndex, "video", value, "title")
                  }
                  placeholder="Nhập tiêu đề video..."
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.label}>Mô tả video</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={lesson.video.description}
                  onChangeText={(value) =>
                    updateLesson(lessonIndex, "video", value, "description")
                  }
                  placeholder="Nhập mô tả video..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <Text style={styles.label}>Tags (phân cách bằng dấu phẩy)</Text>
                <TextInput
                  style={styles.input}
                  value={lesson.video.tags?.join(", ") || ""}
                  onChangeText={(value) =>
                    updateLesson(
                      lessonIndex,
                      "video",
                      value.split(",").map((t) => t.trim()),
                      "tags"
                    )
                  }
                  placeholder="forehand, backhand, serve..."
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.label}>Tên bài tập</Text>
                <TextInput
                  style={styles.input}
                  value={lesson.video.drillName || ""}
                  onChangeText={(value) =>
                    updateLesson(lessonIndex, "video", value, "drillName")
                  }
                  placeholder="Nhập tên bài tập..."
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.label}>Hướng dẫn bài tập</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={lesson.video.drillDescription || ""}
                  onChangeText={(value) =>
                    updateLesson(
                      lessonIndex,
                      "video",
                      value,
                      "drillDescription"
                    )
                  }
                  placeholder="Nhập hướng dẫn..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <Text style={styles.label}>Số lần luyện tập</Text>
                <TextInput
                  style={styles.input}
                  value={lesson.video.drillPracticeSets || ""}
                  onChangeText={(value) =>
                    updateLesson(
                      lessonIndex,
                      "video",
                      value,
                      "drillPracticeSets"
                    )
                  }
                  placeholder="VD: 3 sets x 10 reps"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Quiz Section */}
              <View style={styles.subSection}>
                <View style={styles.subSectionHeader}>
                  <Ionicons name="help-circle" size={18} color="#10B981" />
                  <Text style={styles.subSectionTitle}>Quiz</Text>
                </View>

                <Text style={styles.label}>Tiêu đề quiz</Text>
                <TextInput
                  style={styles.input}
                  value={lesson.quiz.title}
                  onChangeText={(value) =>
                    updateLesson(lessonIndex, "quiz", value, "title")
                  }
                  placeholder="Nhập tiêu đề quiz..."
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.label}>Mô tả quiz</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={lesson.quiz.description}
                  onChangeText={(value) =>
                    updateLesson(lessonIndex, "quiz", value, "description")
                  }
                  placeholder="Nhập mô tả quiz..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                {/* Questions */}
                <View style={styles.questionsSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.label}>
                      Câu hỏi ({lesson.quiz.questions?.length || 0})
                    </Text>
                    <TouchableOpacity
                      style={styles.addSmallButton}
                      onPress={() => addQuestion(lessonIndex)}
                    >
                      <Ionicons name="add" size={16} color="#059669" />
                      <Text style={styles.addSmallButtonText}>
                        Thêm câu hỏi
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {lesson.quiz.questions?.map((question, questionIndex) => (
                    <View key={questionIndex} style={styles.questionCard}>
                      <View style={styles.questionHeader}>
                        <Text style={styles.questionNumber}>
                          Câu {questionIndex + 1}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            removeQuestion(lessonIndex, questionIndex)
                          }
                        >
                          <Ionicons
                            name="close-circle"
                            size={20}
                            color="#DC2626"
                          />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.label}>Câu hỏi</Text>
                      <TextInput
                        style={styles.input}
                        value={question.title}
                        onChangeText={(value) =>
                          updateQuestion(
                            lessonIndex,
                            questionIndex,
                            "title",
                            value
                          )
                        }
                        placeholder="Nhập câu hỏi..."
                        placeholderTextColor="#9CA3AF"
                      />

                      <Text style={styles.label}>Giải thích</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={question.explanation || ""}
                        onChangeText={(value) =>
                          updateQuestion(
                            lessonIndex,
                            questionIndex,
                            "explanation",
                            value
                          )
                        }
                        placeholder="Nhập giải thích..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={2}
                        textAlignVertical="top"
                      />

                      {/* Options */}
                      <View style={styles.optionsSection}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.label}>
                            Đáp án ({question.options?.length || 0})
                          </Text>
                          <TouchableOpacity
                            style={styles.addSmallButton}
                            onPress={() =>
                              addOption(lessonIndex, questionIndex)
                            }
                          >
                            <Ionicons name="add" size={14} color="#059669" />
                            <Text style={styles.addSmallButtonText}>
                              Thêm đáp án
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {question.options?.map((option, optionIndex) => (
                          <View key={optionIndex} style={styles.optionRow}>
                            <TouchableOpacity
                              style={[
                                styles.checkbox,
                                option.isCorrect && styles.checkboxChecked,
                              ]}
                              onPress={() =>
                                updateOption(
                                  lessonIndex,
                                  questionIndex,
                                  optionIndex,
                                  "isCorrect",
                                  !option.isCorrect
                                )
                              }
                            >
                              {option.isCorrect && (
                                <Ionicons
                                  name="checkmark"
                                  size={14}
                                  color="#FFFFFF"
                                />
                              )}
                            </TouchableOpacity>
                            <TextInput
                              style={[styles.input, styles.optionInput]}
                              value={option.content}
                              onChangeText={(value) =>
                                updateOption(
                                  lessonIndex,
                                  questionIndex,
                                  optionIndex,
                                  "content",
                                  value
                                )
                              }
                              placeholder={`Đáp án ${optionIndex + 1}...`}
                              placeholderTextColor="#9CA3AF"
                            />
                            {question.options &&
                              question.options.length > 2 && (
                                <TouchableOpacity
                                  onPress={() =>
                                    removeOption(
                                      lessonIndex,
                                      questionIndex,
                                      optionIndex
                                    )
                                  }
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={18}
                                    color="#DC2626"
                                  />
                                </TouchableOpacity>
                              )}
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, updating && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={updating}
        >
          {updating ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Đang lưu...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginTop: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  levelButtons: {
    flexDirection: "row",
    gap: 8,
  },
  levelButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  levelButtonActive: {
    backgroundColor: "#EDE9FE",
    borderColor: "#8B5CF6",
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  levelButtonTextActive: {
    color: "#8B5CF6",
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
  lessonCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 14,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  lessonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  deleteButton: {
    padding: 4,
  },
  subSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  subSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  questionsSection: {
    gap: 10,
    marginTop: 8,
  },
  addSmallButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 6,
  },
  addSmallButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  questionCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  questionNumber: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  optionsSection: {
    gap: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  optionInput: {
    flex: 1,
    marginTop: 0,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: "#8B5CF6",
    borderRadius: 10,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default EditAiGenerationScreen;
