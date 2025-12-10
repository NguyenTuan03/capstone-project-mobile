import aiSubjectGenerationService from "@/services/aiSubjectGeneration.service";
import { get, remove } from "@/services/http/httpService";
import storageService from "@/services/storageService";
import { Subject } from "@/types/subject";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PaginatedResponse {
  items: Subject[];
  page: number;
  pageSize: number;
  total: number;
}

const CoachSubjectScreen = () => {
  const insets = useSafeAreaInsets();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [lessonCount, setLessonCount] = useState(4);

  const handleOpenMenu = (subject: any) => {
    setSelectedSubject(subject);
    setModalVisible(true);
  };

  const handleEdit = (s: Subject | null) => {
    if (!s) return;
    setModalVisible(false);
    router.push({
      pathname: "/(coach)/menu/subject/edit",
      params: {
        subjectId: s.id,
        subjectName: s.name,
        subjectDescription: s.description,
        subjectLevel: s.level,
        subjectStatus: s.status,
      },
    });
  };
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập mô tả tài liệu bạn muốn tạo"
      );
      return;
    }

    setAiGenerating(true);
    try {
      // Call AI API to generate subject structure with lesson count
      const fullPrompt = `${aiPrompt.trim()}. Tài liệu sẽ có ${lessonCount} bài học.`;
      const generation = await aiSubjectGenerationService.create(fullPrompt);

      console.log("AI generation response:", generation);

      // Navigate to AI generations list with highlight
      setAiModalVisible(false);
      setAiPrompt("");
      setLessonCount(4);

      // Check if generation has id before navigating
      if (generation && generation.id) {
        router.push({
          pathname: "/(coach)/menu/subject/ai-generations" as any,
          params: {
            highlight: generation.id.toString(),
          },
        });
      } else {
        // Navigate without highlight if no id
        router.push("/(coach)/menu/subject/ai-generations" as any);
      }
    } catch (error) {
      console.error("AI generation error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      Alert.alert("Lỗi", "Không thể tạo tài liệu với AI. Vui lòng thử lại.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleDelete = (subject: Subject | null) => {
    if (!subject) return;

    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa tài liệu "${subject.name}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(`/v1/subjects/${subject.id}`);

              setSubjects((prev) => {
                const updated = prev.filter((item) => item.id !== subject.id);
                setTotal((prevTotal) => Math.max(0, prevTotal - 1));
                return updated;
              });
              setModalVisible(false);
            } catch (error) {
              Alert.alert(
                "Lỗi",
                "Không thể xóa tài liệu. Vui lòng thử lại sau."
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const fetchSubjects = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const user = await storageService.getUser();
        if (!user) {
          return;
        }
        const userId = user.id;

        const res = await get<PaginatedResponse>(
          `/v1/subjects?sort=updatedAt_desc&filter=createdBy_eq_${userId}&page=${pageNum}&pageSize=10`
        );

        if (append) {
          setSubjects((prev) => {
            const newItems = res.data.items || [];
            const updatedSubjects = [...prev, ...newItems];

            // Update pagination state
            const newPage = res.data.page;
            const newTotal = res.data.total;
            setPage(newPage);
            setTotal(newTotal);
            setHasMore(updatedSubjects.length < newTotal);

            return updatedSubjects;
          });
        } else {
          const newItems = res.data.items || [];
          setSubjects(newItems);

          const newPage = res.data.page;
          const newTotal = res.data.total;
          setPage(newPage);
          setTotal(newTotal);
          setHasMore(newItems.length < newTotal);
        }
      } catch (error) {
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchSubjects(page + 1, true);
    }
  }, [loadingMore, hasMore, page, fetchSubjects]);

  useFocusEffect(
    useCallback(() => {
      fetchSubjects();
    }, [fetchSubjects])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(coach)/content" as any)}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Tài liệu của tôi</Text>
          <Text style={styles.subheader}>{`${total} tài liệu`}</Text>
        </View>

        <View style={{ width: 32 }} />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => setAiModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            <Text style={styles.aiButtonText}>AI Tạo nhanh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push("/(coach)/menu/subject/create" as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Tạo thủ công</Text>
          </TouchableOpacity>
        </View>

        {/* View AI Generations Button */}
        <TouchableOpacity
          style={styles.viewAiGenerationsButton}
          onPress={() =>
            router.push("/(coach)/menu/subject/ai-generations" as any)
          }
          activeOpacity={0.7}
        >
          <Ionicons name="list" size={18} color="#8B5CF6" />
          <Text style={styles.viewAiGenerationsText}>
            Xem tài liệu AI đã tạo
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      {/* Subjects List */}
      {subjects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="document-outline" size={56} color="#059669" />
          </View>
          <Text style={styles.emptyText}>Bạn chưa có tài liệu nào</Text>
          <Text style={styles.emptySubtext}>
            Hãy tạo tài liệu đầu tiên để bắt đầu dạy học
          </Text>
          <TouchableOpacity
            style={styles.emptyCreateButton}
            onPress={() => router.push("/(coach)/menu/subject/create" as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.emptyCreateButtonText}>Tạo tài liệu mới</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          data={subjects}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item: subject }) => (
            <TouchableOpacity
              style={[
                styles.subjectCard,
                subject.isAIGenerated && styles.aiGeneratedCard,
              ]}
              onPress={() =>
                router.push({
                  pathname: `/(coach)/menu/subject/${subject.id}/lesson` as any,
                  params: {
                    subjectId: subject.id,
                    subjectName: subject.name,
                    lessons: JSON.stringify(subject.lessons || []),
                  },
                })
              }
              activeOpacity={0.7}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.subjectNameRow}>
                    <Text style={styles.subjectName} numberOfLines={2}>
                      {subject.name}
                    </Text>
                    {subject.isAIGenerated && (
                      <View style={styles.aiGeneratedBadge}>
                        <Ionicons name="sparkles" size={12} color="#8B5CF6" />
                        <Text style={styles.aiGeneratedText}>AI</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.statusRow}>
                    <Text
                      style={[
                        styles.statusBadge,
                        {
                          color:
                            subject.status === "DRAFT"
                              ? "#D97706"
                              : subject.status === "PUBLISHED"
                              ? "#059669"
                              : "#6B7280",
                        },
                      ]}
                    >
                      {subject.status === "DRAFT"
                        ? "● Bản nháp"
                        : subject.status === "PUBLISHED"
                        ? "● Công khai"
                        : "● " + subject.status}
                    </Text>
                    <View style={styles.lessonBadge}>
                      <Ionicons name="book-outline" size={12} color="#6B7280" />
                      <Text style={styles.lessonCount}>
                        {subject.lessons?.length || 0} bài
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Menu Button */}
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => handleOpenMenu(subject)}
                  hitSlop={8}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>

              {/* Card Description */}
              <Text style={styles.description} numberOfLines={2}>
                {subject.description || "Không có mô tả cho tài liệu này"}
              </Text>
            </TouchableOpacity>
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color="#059669" />
                <Text style={styles.loadMoreText}>Đang tải thêm...</Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Context Menu Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Quản lý tài liệu</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Selected Subject Info */}
          {selectedSubject && (
            <View style={styles.selectedSubjectInfo}>
              <View style={styles.subjectIconContainer}>
                <Ionicons name="document" size={32} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedSubjectName} numberOfLines={2}>
                  {selectedSubject.name}
                </Text>
                <Text style={styles.selectedSubjectStatus}>
                  {selectedSubject.status === "DRAFT"
                    ? "● Bản nháp"
                    : selectedSubject.status === "PUBLISHED"
                    ? "● Công khai"
                    : "● " + selectedSubject.status}
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              onPress={() => handleEdit(selectedSubject)}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <View style={styles.actionButtonIcon}>
                <Ionicons name="pencil" size={20} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionButtonTitle}>Chỉnh sửa tài liệu</Text>
                <Text style={styles.actionButtonDesc}>
                  Cập nhật tên, mô tả và cài đặt
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDelete(selectedSubject)}
              style={[styles.actionButton, styles.deleteButton]}
              activeOpacity={0.7}
            >
              <View
                style={[styles.actionButtonIcon, styles.deleteIconContainer]}
              >
                <Ionicons name="trash" size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionButtonTitle, { color: "#EF4444" }]}>
                  Xóa tài liệu
                </Text>
                <Text style={[styles.actionButtonDesc, { color: "#FCA5A5" }]}>
                  Hành động này không thể hoàn tác
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FECACA" />
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={styles.cancelButton}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* AI Generation Modal */}
      <Modal
        visible={aiModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
          {/* AI Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setAiModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>AI Tạo Tài Liệu</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.aiModalContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* AI Icon */}
            <View style={styles.aiIconContainer}>
              <Ionicons name="sparkles" size={48} color="#8B5CF6" />
            </View>

            {/* Instructions */}
            <Text style={styles.aiTitle}>Mô tả tài liệu bạn muốn tạo</Text>
            <Text style={styles.aiDescription}>
              AI sẽ tự động tạo cấu trúc tài liệu hoàn chỉnh với các bài học,
              bài kiểm tra và video placeholder. Bạn có thể chỉnh sửa trước khi
              tạo.
            </Text>

            {/* Examples */}
            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>Ví dụ:</Text>
              <TouchableOpacity
                style={styles.exampleChip}
                onPress={() =>
                  setAiPrompt(
                    "Tạo khóa học kỹ thuật backhand cơ bản cho người mới bắt đầu"
                  )
                }
              >
                <Text style={styles.exampleText}>
                  "Tạo khóa học kỹ thuật backhand cơ bản"
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exampleChip}
                onPress={() =>
                  setAiPrompt(
                    "Tài liệu về chiến thuật đánh đôi nâng cao trong pickleball"
                  )
                }
              >
                <Text style={styles.exampleText}>
                  "Chiến thuật đánh đôi nâng cao"
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exampleChip}
                onPress={() =>
                  setAiPrompt(
                    "Khóa học di chuyển và vị trí trên sân cho người trung cấp"
                  )
                }
              >
                <Text style={styles.exampleText}>
                  "Di chuyển và vị trí trên sân"
                </Text>
              </TouchableOpacity>
            </View>

            {/* Lesson Count Slider */}
            <View style={styles.lessonCountContainer}>
              <View style={styles.lessonCountHeader}>
                <Text style={styles.lessonCountLabel}>Số lượng bài học</Text>
                <View style={styles.lessonCountBadge}>
                  <Text style={styles.lessonCountValue}>{lessonCount}</Text>
                </View>
              </View>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>1</Text>
                <View style={styles.sliderTrack}>
                  <View style={styles.sliderButtons}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <TouchableOpacity
                        key={num}
                        style={[
                          styles.sliderButton,
                          lessonCount === num && styles.sliderButtonActive,
                        ]}
                        onPress={() => setLessonCount(num)}
                      >
                        <View
                          style={[
                            styles.sliderDot,
                            lessonCount === num && styles.sliderDotActive,
                            lessonCount >= num && styles.sliderDotFilled,
                          ]}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <Text style={styles.sliderLabel}>8</Text>
              </View>
              <Text style={styles.lessonCountHint}>
                AI sẽ tạo {lessonCount} bài học với video và quiz cho mỗi bài
              </Text>
            </View>

            {/* Text Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.aiInput}
                placeholder="Ví dụ: Tạo khóa học về kỹ thuật serve trong pickleball cho người mới..."
                placeholderTextColor="#9CA3AF"
                value={aiPrompt}
                onChangeText={setAiPrompt}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <View style={styles.inputFooter}>
                <Ionicons name="information-circle" size={14} color="#6B7280" />
                <Text style={styles.inputHint}>
                  Càng chi tiết càng tốt để AI tạo tài liệu chính xác hơn
                </Text>
              </View>
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={[
                styles.generateButton,
                (!aiPrompt.trim() || aiGenerating) &&
                  styles.generateButtonDisabled,
              ]}
              onPress={handleAIGenerate}
              disabled={!aiPrompt.trim() || aiGenerating}
              activeOpacity={0.7}
            >
              {aiGenerating ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.generateButtonText}>Đang tạo...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                  <Text style={styles.generateButtonText}>Tạo với AI</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.infoText}>
                Sau khi AI tạo xong, bạn sẽ được chuyển đến trang chỉnh sửa để
                xem lại và điều chỉnh nội dung trước khi lưu.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  subheader: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  viewAiGenerationsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F5F3FF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    gap: 6,
  },
  viewAiGenerationsText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  aiButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    gap: 6,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  aiButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  createButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#059669",
    borderRadius: 12,
    gap: 6,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  subjectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  aiGeneratedCard: {
    borderColor: "#8B5CF6",
    backgroundColor: "#FEFEFE",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  subjectNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  aiGeneratedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#F5F3FF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#8B5CF6",
  },
  aiGeneratedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8B5CF6",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "600",
  },
  lessonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
  },
  lessonCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  menuButton: {
    padding: 6,
    marginLeft: 8,
  },
  description: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 24,
    textAlign: "center",
  },
  emptyCreateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#059669",
    borderRadius: 12,
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCreateButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  loadMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 13,
    color: "#6B7280",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  selectedSubjectInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 12,
  },
  subjectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedSubjectName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  selectedSubjectStatus: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButton: {
    borderColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIconContainer: {
    backgroundColor: "#FEE2E2",
  },
  actionButtonTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  actionButtonDesc: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  cancelButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6B7280",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  contextMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 200,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  aiModalContent: {
    padding: 20,
    gap: 20,
  },
  aiIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 8,
  },
  aiTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  aiDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  examplesContainer: {
    gap: 8,
  },
  examplesTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  exampleChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  exampleText: {
    fontSize: 13,
    color: "#374151",
  },
  lessonCountContainer: {
    gap: 10,
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  lessonCountHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lessonCountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  lessonCountBadge: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
    minWidth: 36,
    alignItems: "center",
  },
  lessonCountValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  sliderTrack: {
    flex: 1,
    height: 40,
    justifyContent: "center",
  },
  sliderButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  sliderButtonActive: {
    transform: [{ scale: 1.1 }],
  },
  sliderDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  sliderDotFilled: {
    backgroundColor: "#C4B5FD",
    borderColor: "#8B5CF6",
  },
  sliderDotActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
    borderWidth: 3,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  lessonCountHint: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  inputContainer: {
    gap: 8,
  },
  aiInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 120,
  },
  inputFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inputHint: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    gap: 8,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    lineHeight: 18,
  },
});

export default CoachSubjectScreen;
