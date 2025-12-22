import aiSubjectGenerationService from "@/services/aiSubjectGeneration.service";
import {
  AiSubjectGeneration,
  AiSubjectGenerationStatus,
  PickleballLevel,
} from "@/types/ai-subject-generation";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const AI_GENERATION_PAGE_SIZE = 10;

const AIGenerationsScreen = () => {
  const params = useLocalSearchParams<{ highlight?: string }>();

  const [generations, setGenerations] = useState<AiSubjectGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [filterStatus, setFilterStatus] = useState<
    AiSubjectGenerationStatus | undefined
  >(AiSubjectGenerationStatus.PENDING);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGeneration, setSelectedGeneration] =
    useState<AiSubjectGeneration | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedLessons, setExpandedLessons] = useState<Set<number>>(
    new Set()
  );

  const fetchGenerations = useCallback(
    async (pageNum: number, isRefresh = false) => {
      try {
        if (isRefresh) {
          setLoading(true);
        } else if (pageNum > 1) {
          setLoadingMore(true);
        }

        const response = await aiSubjectGenerationService.getAll(
          pageNum,
          AI_GENERATION_PAGE_SIZE,
          filterStatus
        );

        const newGenerations = response.items || [];

        if (isRefresh || pageNum === 1) {
          setGenerations(newGenerations);
        } else {
          setGenerations((prev) => [...prev, ...newGenerations]);
        }

        setTotal(response?.total || 0);
        setHasMore(
          (response?.page || 0) < (response?.totalPages || 0)
        );
      } catch (error) {
        Alert.alert("Lỗi", "Không thể tải danh sách tài liệu AI");
        console.error("Fetch AI generations error:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filterStatus]
  );

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      fetchGenerations(1, true);
    }, [fetchGenerations])
  );

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchGenerations(nextPage);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    fetchGenerations(1, true);
  };

  const handleFilterChange = (
    status: AiSubjectGenerationStatus | undefined
  ) => {
    setFilterStatus(status);
    setPage(1);
  };

  const handleOpenDetail = (generation: AiSubjectGeneration) => {
    setSelectedGeneration(generation);
    setExpandedLessons(new Set());
    setModalVisible(true);
  };

  const toggleLessonExpand = (index: number) => {
    setExpandedLessons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleUseGeneration = async () => {
    if (!selectedGeneration) return;

    Alert.alert(
      "Xác nhận sử dụng",
      `Bạn có chắc muốn sử dụng tài liệu "${selectedGeneration.generatedData.name}"?\n\nTài liệu sẽ được tạo thành tài liệu chính thức và trạng thái sẽ chuyển sang "Đã sử dụng".`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Sử dụng",
          style: "default",
          onPress: async () => {
            try {
              setDeleting(true); // Reuse deleting state for loading indicator
              const createdSubject = await aiSubjectGenerationService.useGeneratedSubject(
                selectedGeneration.id
              );
              
              Alert.alert(
                "Thành công",
                `Đã tạo tài liệu từ AI thành công`,
                [
                  {
                    text: "OK",
                    onPress: () => {
                      setModalVisible(false);
                      handleRefresh();
                    },
                  },
                ]
              );
            } catch (error) {
              console.error("Use generation error:", error);
              Alert.alert(
                "Lỗi",
                "Không thể tạo tài liệu từ AI. Vui lòng thử lại."
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleEditPress = () => {
    if (!selectedGeneration) return;
    setModalVisible(false);
    router.push({
      pathname: "/(coach)/menu/subject/edit-ai-generation" as any,
      params: {
        generationId: selectedGeneration.id.toString(),
      },
    });
  };

  const handleDelete = async () => {
    if (!selectedGeneration) return;

    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa tài liệu AI này? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await aiSubjectGenerationService.delete(selectedGeneration.id);
              Alert.alert("Thành công", "Đã xóa tài liệu AI");
              setModalVisible(false);
              handleRefresh();
            } catch (error) {
              Alert.alert("Lỗi", "Không thể xóa tài liệu");
              console.error("Delete generation error:", error);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const renderGenerationCard = ({ item }: { item: AiSubjectGeneration }) => {
    const isHighlighted = params.highlight === item.id.toString();
    const isUsed = item.status === AiSubjectGenerationStatus.USED;

    return (
      <TouchableOpacity
        style={[
          styles.generationCard,
          isHighlighted && styles.highlightedCard,
          isUsed && styles.usedCard,
        ]}
        onPress={() => handleOpenDetail(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {isUsed ? "Đã sử dụng" : "Chưa dùng"}
            </Text>
          </View>
          {isUsed && item.createdSubject && (
            <View style={styles.linkedBadge}>
              <Ionicons name="link" size={14} color="#059669" />
              <Text style={styles.linkedText}>
                Tài liệu #{item.createdSubject.id}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.promptText} numberOfLines={2}>
          {item.prompt}
        </Text>

        <View style={styles.generatedInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="school" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>
              {item.generatedData.name || "Chưa có tên"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="layers" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {item.generatedData.lessons?.length || 0} bài học
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString("vi-VN")}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="sparkles-outline" size={48} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>
          {filterStatus === AiSubjectGenerationStatus.PENDING
            ? "Chưa có tài liệu chờ sử dụng"
            : "Chưa có tài liệu nào"}
        </Text>
        <Text style={styles.emptyDescription}>
          Tạo tài liệu mới với AI để bắt đầu
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.back()}
        >
          <Text style={styles.emptyButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#8B5CF6" />
      </View>
    );
  };

  return (
    <View style={[styles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tài liệu AI</Text>
        <View style={styles.headerRight}>
          <Text style={styles.totalText}>{total} tài liệu</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterStatus === AiSubjectGenerationStatus.PENDING &&
              styles.filterTabActive,
          ]}
          onPress={() => handleFilterChange(AiSubjectGenerationStatus.PENDING)}
        >
          <Text
            style={[
              styles.filterTabText,
              filterStatus === AiSubjectGenerationStatus.PENDING &&
                styles.filterTabTextActive,
            ]}
          >
            Chưa dùng
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterStatus === AiSubjectGenerationStatus.USED &&
              styles.filterTabActive,
          ]}
          onPress={() => handleFilterChange(AiSubjectGenerationStatus.USED)}
        >
          <Text
            style={[
              styles.filterTabText,
              filterStatus === AiSubjectGenerationStatus.USED &&
                styles.filterTabTextActive,
            ]}
          >
            Đã sử dụng
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterStatus === undefined && styles.filterTabActive,
          ]}
          onPress={() => handleFilterChange(undefined)}
        >
          <Text
            style={[
              styles.filterTabText,
              filterStatus === undefined && styles.filterTabTextActive,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Đang tải tài liệu AI...</Text>
        </View>
      ) : (
        <FlatList
          data={generations}
          renderItem={renderGenerationCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshing={false}
          onRefresh={handleRefresh}
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết tài liệu AI</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedGeneration && (
              <>
                {/* Status */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Trạng thái</Text>
                  <View
                    style={[
                      styles.statusBadgeLarge,
                      selectedGeneration.status ===
                        AiSubjectGenerationStatus.USED && styles.statusUsed,
                    ]}
                  >
                    <Text style={styles.statusTextLarge}>
                      {selectedGeneration.status ===
                      AiSubjectGenerationStatus.USED
                        ? "Đã sử dụng"
                        : "Chưa sử dụng"}
                    </Text>
                  </View>
                </View>

                {/* Prompt */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Yêu cầu ban đầu</Text>
                  <Text style={styles.promptDetail}>
                    {selectedGeneration.prompt}
                  </Text>
                </View>

                {/* Generated Data */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Nội dung tạo ra</Text>

                  <View style={styles.generatedCard}>
                    <Text style={styles.generatedTitle}>
                      {selectedGeneration.generatedData.name}
                    </Text>
                    <Text style={styles.generatedDescription}>
                      {selectedGeneration.generatedData.description}
                    </Text>

                    <View style={styles.levelBadge}>
                      <Ionicons name="trophy" size={14} color="#F59E0B" />
                      <Text style={styles.levelText}>
                        {getLevelLabel(selectedGeneration.generatedData.level)}
                      </Text>
                    </View>

                    <View style={styles.lessonsSection}>
                      <Text style={styles.lessonsTitle}>
                        {selectedGeneration.generatedData.lessons?.length || 0}{" "}
                        Bài học
                      </Text>
                      {selectedGeneration.generatedData.lessons?.map(
                        (lesson, index) => {
                          const isExpanded = expandedLessons.has(index);
                          return (
                            <TouchableOpacity
                              key={index}
                              style={styles.lessonCard}
                              onPress={() => toggleLessonExpand(index)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.lessonHeader}>
                                <Text style={styles.lessonNumber}>
                                  Bài {lesson.lessonNumber}
                                </Text>
                                <Text style={styles.lessonName}>
                                  {lesson.name}
                                </Text>
                                <Ionicons
                                  name={
                                    isExpanded
                                      ? "chevron-up"
                                      : "chevron-down"
                                  }
                                  size={20}
                                  color="#6B7280"
                                />
                              </View>
                              <Text style={styles.lessonDescription}>
                                {lesson.description}
                              </Text>

                              {isExpanded && (
                                <View style={styles.lessonDetails}>
                                  {/* Video Details */}
                                  <View style={styles.detailBlock}>
                                    <View style={styles.detailBlockHeader}>
                                      <Ionicons
                                        name="videocam"
                                        size={18}
                                        color="#8B5CF6"
                                      />
                                      <Text style={styles.detailBlockTitle}>
                                        Video
                                      </Text>
                                    </View>
                                    {/* Create Instructions (AI-generated) */}
                                    {lesson.video.createInstructions && (
                                      <View style={{ marginBottom: 8, marginTop: 2, backgroundColor: '#FEF3C7', borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                                        <Ionicons name="bulb" size={16} color="#F59E0B" style={{ marginTop: 2 }} />
                                        <View style={{ flex: 1 }}>
                                          <Text style={[styles.detailLabel, { color: '#B45309', fontWeight: '700', marginBottom: 2 }]}>Hướng dẫn tạo video:</Text>
                                          <Text style={{ color: '#92400E', fontSize: 13, lineHeight: 18 }}>{lesson.video.createInstructions}</Text>
                                        </View>
                                      </View>
                                    )}
                                    <Text style={styles.detailText}>
                                      <Text style={styles.detailLabel}>
                                        Tiêu đề:
                                      </Text>{" "}
                                      {lesson.video.title}
                                    </Text>
                                    <Text style={styles.detailText}>
                                      <Text style={styles.detailLabel}>
                                        Mô tả:
                                      </Text>{" "}
                                      {lesson.video.description}
                                    </Text>
                                    {lesson.video.drillName && (
                                      <Text style={styles.detailText}>
                                        <Text style={styles.detailLabel}>
                                          Bài tập:
                                        </Text>{" "}
                                        {lesson.video.drillName}
                                      </Text>
                                    )}
                                    {lesson.video.drillDescription && (
                                      <Text style={styles.detailText}>
                                        <Text style={styles.detailLabel}>
                                          Hướng dẫn:
                                        </Text>{" "}
                                        {lesson.video.drillDescription}
                                      </Text>
                                    )}
                                    {lesson.video.tags &&
                                      lesson.video.tags.length > 0 && (
                                        <View style={styles.tagsContainer}>
                                          {lesson.video.tags.map(
                                            (tag, tagIndex) => (
                                              <View
                                                key={tagIndex}
                                                style={styles.tagBadge}
                                              >
                                                <Text style={styles.tagText}>
                                                  {tag}
                                                </Text>
                                              </View>
                                            )
                                          )}
                                        </View>
                                      )}
                                  </View>

                                  {/* Quiz Details */}
                                  <View style={styles.detailBlock}>
                                    <View style={styles.detailBlockHeader}>
                                      <Ionicons
                                        name="help-circle"
                                        size={18}
                                        color="#10B981"
                                      />
                                      <Text style={styles.detailBlockTitle}>
                                        Quiz ({lesson.quiz.questions?.length || 0}{" "}
                                        câu hỏi)
                                      </Text>
                                    </View>
                                    <Text style={styles.detailText}>
                                      <Text style={styles.detailLabel}>
                                        Tiêu đề:
                                      </Text>{" "}
                                      {lesson.quiz.title}
                                    </Text>
                                    <Text style={styles.detailText}>
                                      <Text style={styles.detailLabel}>
                                        Mô tả:
                                      </Text>{" "}
                                      {lesson.quiz.description}
                                    </Text>

                                    {/* Quiz Questions */}
                                    <View style={styles.questionsContainer}>
                                      {lesson.quiz.questions?.map(
                                        (question, qIndex) => (
                                          <View
                                            key={qIndex}
                                            style={styles.questionCard}
                                          >
                                            <Text style={styles.questionTitle}>
                                              Câu {qIndex + 1}: {question.title}
                                            </Text>
                                            {question.explanation && (
                                              <Text
                                                style={styles.questionExplanation}
                                              >
                                                Giải thích: {question.explanation}
                                              </Text>
                                            )}
                                            <View style={styles.optionsContainer}>
                                              {question.options?.map(
                                                (option, oIndex) => (
                                                  <View
                                                    key={oIndex}
                                                    style={[
                                                      styles.optionItem,
                                                      option.isCorrect &&
                                                        styles.correctOption,
                                                    ]}
                                                  >
                                                    <Ionicons
                                                      name={
                                                        option.isCorrect
                                                          ? "checkmark-circle"
                                                          : "ellipse-outline"
                                                      }
                                                      size={16}
                                                      color={
                                                        option.isCorrect
                                                          ? "#10B981"
                                                          : "#9CA3AF"
                                                      }
                                                    />
                                                    <Text
                                                      style={[
                                                        styles.optionText,
                                                        option.isCorrect &&
                                                          styles.correctOptionText,
                                                      ]}
                                                    >
                                                      {option.content}
                                                    </Text>
                                                  </View>
                                                )
                                              )}
                                            </View>
                                          </View>
                                        )
                                      )}
                                    </View>
                                  </View>
                                </View>
                              )}

                              {!isExpanded && (
                                <View style={styles.lessonMeta}>
                                  <View style={styles.metaItem}>
                                    <Ionicons
                                      name="videocam"
                                      size={14}
                                      color="#8B5CF6"
                                    />
                                    <Text style={styles.metaText}>
                                      Video: {lesson.video.title}
                                    </Text>
                                  </View>
                                  <View style={styles.metaItem}>
                                    <Ionicons
                                      name="help-circle"
                                      size={14}
                                      color="#10B981"
                                    />
                                    <Text style={styles.metaText}>
                                      Quiz: {lesson.quiz.questions?.length || 0}{" "}
                                      câu
                                    </Text>
                                  </View>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        }
                      )}
                    </View>
                  </View>
                </View>

                {/* Linked Subject */}
                {selectedGeneration.createdSubject && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Tài liệu đã tạo</Text>
                    <View style={styles.linkedSubjectCard}>
                      <Ionicons
                        name="document-text"
                        size={20}
                        color="#059669"
                      />
                      <Text style={styles.linkedSubjectText}>
                        {selectedGeneration.createdSubject.name} #
                        {selectedGeneration.createdSubject.id}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Created Date */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Ngày tạo</Text>
                  <Text style={styles.dateDetail}>
                    {new Date(selectedGeneration.createdAt).toLocaleDateString(
                      "vi-VN",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          {/* Action Buttons */}
          {selectedGeneration?.status === AiSubjectGenerationStatus.PENDING && (
            <View style={styles.modalActions}>
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditPress}
                  disabled={deleting}
                >
                  <Ionicons name="pencil" size={18} color="#3B82F6" />
                  <Text style={styles.editButtonText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#DC2626" />
                  ) : (
                    <>
                      <Ionicons name="trash" size={18} color="#DC2626" />
                      <Text style={styles.deleteButtonText}>Xóa</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.useButton}
                onPress={handleUseGeneration}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.useButtonText}>Sử dụng tài liệu này</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const getLevelLabel = (level: PickleballLevel): string => {
  switch (level) {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 36,
  },
  totalText: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "right",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterTabActive: {
    backgroundColor: "#EDE9FE",
    borderColor: "#8B5CF6",
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterTabTextActive: {
    color: "#8B5CF6",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  generationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  highlightedCard: {
    borderColor: "#8B5CF6",
    backgroundColor: "#F5F3FF",
  },
  usedCard: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#92400E",
  },
  linkedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#ECFDF5",
  },
  linkedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  promptText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 20,
  },
  generatedInfo: {
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  infoText: {
    fontSize: 13,
    color: "#6B7280",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  dateText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  emptyDescription: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalContent: {
    padding: 20,
    gap: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  detailSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusBadgeLarge: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#FEF3C7",
  },
  statusUsed: {
    backgroundColor: "#D1FAE5",
  },
  statusTextLarge: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
  },
  promptDetail: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  generatedCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  generatedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  generatedDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
  },
  levelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  lessonsSection: {
    gap: 8,
    marginTop: 8,
  },
  lessonsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  lessonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  lessonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lessonNumber: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8B5CF6",
    backgroundColor: "#EDE9FE",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  lessonName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  lessonDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  lessonMeta: {
    gap: 4,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: "#6B7280",
  },
  linkedSubjectCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#059669",
  },
  linkedSubjectText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  dateDetail: {
    fontSize: 14,
    color: "#374151",
  },
  modalActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 10,
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
  },
  useButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  useButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  editModalContent: {
    padding: 20,
    gap: 12,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  editInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 160,
    textAlignVertical: "top",
  },
  editHint: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },
  editModalActions: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "#8B5CF6",
    borderRadius: 10,
  },
  saveButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  lessonDetails: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  detailBlock: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  detailBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  detailBlockTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  detailText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
  detailLabel: {
    fontWeight: "600",
    color: "#6B7280",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  tagBadge: {
    backgroundColor: "#EDE9FE",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    color: "#8B5CF6",
    fontWeight: "500",
  },
  questionsContainer: {
    gap: 10,
    marginTop: 8,
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  questionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  questionExplanation: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
    marginBottom: 8,
  },
  optionsContainer: {
    gap: 6,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 4,
  },
  correctOption: {
    backgroundColor: "#F0FDF4",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  optionText: {
    fontSize: 12,
    color: "#4B5563",
    flex: 1,
  },
  correctOptionText: {
    fontWeight: "600",
    color: "#10B981",
  },
});

export default AIGenerationsScreen;
