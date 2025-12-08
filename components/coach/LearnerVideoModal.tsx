import { compareVideosWithBackend } from "@/services/ai/geminiService";
import learnerVideoService from "@/services/learnerVideo.service";
import { AiVideoComparisonDetailsType } from "@/types/ai";
import { LearnerVideo } from "@/types/video";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface LearnerVideoModalProps {
  visible: boolean;
  onClose: () => void;
  learnerVideo: LearnerVideo | null;
  learnerVideos?: LearnerVideo[];
  videoTitle: string;
}

export default function LearnerVideoModal({
  visible,
  onClose,
  learnerVideo,
  learnerVideos,
  videoTitle,
}: LearnerVideoModalProps) {
  const [selectedVideo, setSelectedVideo] = useState(learnerVideo);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coachNote, setCoachNote] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    keyDifferences: true,
    details: true,
    recommendations: true,
    coachNote: true,
  });
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (learnerVideo) {
      setSelectedVideo(learnerVideo);
    }
  }, [learnerVideo]);

  if (!selectedVideo) return null;

  const mapAiReultTypeToVN = (type: AiVideoComparisonDetailsType) => {
    switch (type) {
      case AiVideoComparisonDetailsType.PREPARATION:
        return "Tư thế chuẩn bị";
      case AiVideoComparisonDetailsType.SWING_AND_CONTACT:
        return "Vung vợt và tiếp xúc bóng";
      case AiVideoComparisonDetailsType.FOLLOW_THROUGH:
        return "Động tác kết thúc";
      default:
        return "";
    }
  };

  const getLatestAiResult = (video: LearnerVideo) => {
    if (
      !video.aiVideoComparisonResults ||
      !Array.isArray(video.aiVideoComparisonResults) ||
      video.aiVideoComparisonResults.length === 0
    ) {
      return null;
    }
    return [...video.aiVideoComparisonResults].sort(
      (a, b) =>
        (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
        (a.createdAt ? new Date(a.createdAt).getTime() : 0)
    )[0];
  };

  const handleGenerateAI = async () => {
    if (!selectedVideo?.publicUrl || !selectedVideo?.video?.publicUrl) {
      Alert.alert("Lỗi", "Không tìm thấy video để phân tích");
      return;
    }

    try {
      setIsGenerating(true);
      const result = await compareVideosWithBackend(
        selectedVideo.video.publicUrl,
        selectedVideo.publicUrl
      );

      setSelectedVideo({
        ...selectedVideo,
        aiVideoComparisonResults: [
          ...(selectedVideo.aiVideoComparisonResults || []),
          result,
        ],
      });
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tạo phân tích AI. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitCoachNote = async () => {
    if (!coachNote.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập ghi chú của HLV");
      return;
    }

    if (!aiResult) {
      Alert.alert("Lỗi", "Không tìm thấy kết quả phân tích AI");
      return;
    }

    try {
      setIsSubmitting(true);
      const aiData = {
        summary: aiResult.summary || "",
        learnerScore: aiResult.learnerScore || 0,
        keyDifferents: aiResult.keyDifferents || [],
        details: aiResult.details || [],
        recommendationDrills: aiResult.recommendationDrills || [],
      };

      await learnerVideoService.submitAiFeedback(
        selectedVideo.id,
        aiData,
        coachNote
      );

      // Update the selected video with the coach note
      setSelectedVideo({
        ...selectedVideo,
        aiVideoComparisonResults:
          selectedVideo.aiVideoComparisonResults?.map((result) =>
            result === aiResult ? { ...result, coachNote } : result
          ) || [],
      });

      setCoachNote("");
      Alert.alert("Thành công", "Đã lưu ghi chú của HLV");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lưu ghi chú. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const aiResult = getLatestAiResult(selectedVideo);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.headerTitle}>Video học viên</Text>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {videoTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Video Selector - Show if multiple videos */}
          {learnerVideos && learnerVideos.length > 1 && (
            <View style={styles.videoSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {learnerVideos
                  .sort(
                    (a, b) =>
                      (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
                      (a.createdAt ? new Date(a.createdAt).getTime() : 0)
                  )
                  .map((video, index) => {
                    const latestResult = getLatestAiResult(video);
                    return (
                      <TouchableOpacity
                        key={video.id}
                        style={[
                          styles.videoTab,
                          selectedVideo?.id === video.id &&
                            styles.videoTabActive,
                        ]}
                        onPress={() => setSelectedVideo(video)}
                      >
                        <Text
                          style={[
                            styles.videoTabText,
                            selectedVideo?.id === video.id &&
                              styles.videoTabTextActive,
                          ]}
                        >
                          Lần {index + 1}
                        </Text>
                        {latestResult?.learnerScore && (
                          <View style={[
                            styles.scoreTabBadge,
                            latestResult.learnerScore >= 70
                              ? styles.passScoreBadge
                              : styles.failScoreBadge
                          ]}>
                            <Text
                              style={[
                                styles.videoTabScore,
                                latestResult.learnerScore >= 70
                                  ? { color: "#059669" }
                                  : { color: "#DC2626" },
                              ]}
                            >
                              {latestResult.learnerScore}đ
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          )}

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Video Player */}
            {selectedVideo.publicUrl && (
              <View style={styles.videoContainer}>
                <Video
                  ref={videoRef}
                  source={{ uri: selectedVideo.publicUrl }}
                  style={styles.video}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping={false}
                />
              </View>
            )}

            {/* AI Analysis Results */}
            {aiResult && (
              <View style={styles.analysisSection}>
                <Text style={styles.sectionTitle}>Phân tích AI</Text>

                {/* Score */}
                {aiResult.learnerScore !== null && (
                  <View style={styles.scoreCard}>
                    <View style={styles.scoreIconContainer}>
                      <Ionicons 
                        name={aiResult.learnerScore >= 50 ? "trophy" : "analytics"} 
                        size={28} 
                        color={aiResult.learnerScore >= 50 ? "#059669" : "#DC2626"} 
                      />
                    </View>
                    <Text style={styles.scoreLabel}>Đánh giá từ AI</Text>
                    <Text
                      style={[
                        styles.scoreValue,
                        aiResult.learnerScore >= 50
                          ? { color: "#059669" }
                          : { color: "#DC2626" },
                      ]}
                    >
                      {aiResult.learnerScore}/100
                    </Text>
                    <View style={[
                      styles.scoreStatusBadge,
                      aiResult.learnerScore >= 50 ? styles.passedBadge : styles.failedBadge
                    ]}>
                      <Text style={[
                        styles.scoreStatusText,
                        aiResult.learnerScore >= 50 ? styles.passedText : styles.failedText
                      ]}>
                        {aiResult.learnerScore >= 50 ? "Đạt" : "Chưa đạt"}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Summary */}
                {aiResult.summary && (
                  <View style={styles.card}>
                    <TouchableOpacity
                      style={styles.cardTitleRow}
                      onPress={() => toggleSection('summary')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="document-text" size={18} color="#059669" />
                      <Text style={styles.cardTitle}>Tổng quan</Text>
                      <Ionicons
                        name={expandedSections.summary ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#6B7280"
                        style={{ marginLeft: 'auto' }}
                      />
                    </TouchableOpacity>
                    {expandedSections.summary && (
                      <Text style={styles.cardContent}>{aiResult.summary}</Text>
                    )}
                  </View>
                )}

                {/* Key Differences */}
                {aiResult.keyDifferents &&
                  aiResult.keyDifferents.length > 0 && (
                    <View style={styles.card}>
                      <TouchableOpacity
                        style={styles.cardTitleRow}
                        onPress={() => toggleSection('keyDifferences')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="git-compare" size={18} color="#F59E0B" />
                        <Text style={styles.cardTitle}>Điểm khác biệt chính</Text>
                        <Ionicons
                          name={expandedSections.keyDifferences ? "chevron-up" : "chevron-down"}
                          size={20}
                          color="#6B7280"
                          style={{ marginLeft: 'auto' }}
                        />
                      </TouchableOpacity>
                      {expandedSections.keyDifferences && (<>
                      {aiResult.keyDifferents.map((diff, index) => (
                        <View key={index} style={styles.differenceItem}>
                          <Text style={styles.differenceAspect}>
                            {diff.aspect}
                          </Text>
                          <View style={styles.techniqueComparison}>
                            <View style={styles.techniqueRow}>
                              <Text style={styles.techniqueLabel}>
                                Học viên:
                              </Text>
                              <Text style={styles.learnerTechnique}>
                                {diff.learnerTechnique}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.impactContainer}>
                            <Ionicons name="information-circle" size={14} color="#6B7280" />
                            <Text style={styles.impactText}>
                              {diff.impact}
                            </Text>
                          </View>
                        </View>
                      ))}
                      </>
                    )}
                    </View>
                  )}

                {/* Details */}
                {aiResult.details && aiResult.details.length > 0 && (
                  <View style={styles.card}>
                    <TouchableOpacity
                      style={styles.cardTitleRow}
                      onPress={() => toggleSection('details')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="list" size={18} color="#6366F1" />
                      <Text style={styles.cardTitle}>Chi tiết phân tích</Text>
                      <Ionicons
                        name={expandedSections.details ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#6B7280"
                        style={{ marginLeft: 'auto' }}
                      />
                    </TouchableOpacity>
                    {expandedSections.details && (<>
                    {aiResult.details.map((detail, index) => (
                      <View key={index} style={styles.detailItem}>
                        <Text style={styles.detailType}>
                          {mapAiReultTypeToVN(detail.type)}
                        </Text>
                        <Text style={styles.detailText}>{detail.advanced}</Text>
                        {detail.strengths && detail.strengths.length > 0 && (
                          <View style={styles.listSection}>
                            <View style={styles.listTitleRow}>
                              <Ionicons name="checkmark-circle" size={14} color="#059669" />
                              <Text style={styles.listTitle}>Điểm mạnh:</Text>
                            </View>
                            {detail.strengths.map((strength, i) => (
                              <Text key={i} style={styles.strengthText}>
                                • {strength}
                              </Text>
                            ))}
                          </View>
                        )}
                        {detail.weaknesses && detail.weaknesses.length > 0 && (
                          <View style={styles.listSection}>
                            <View style={styles.listTitleRow}>
                              <Ionicons name="close-circle" size={14} color="#DC2626" />
                              <Text style={styles.listTitle}>Cần cải thiện:</Text>
                            </View>
                            {detail.weaknesses.map((weakness, i) => (
                              <Text key={i} style={styles.weaknessText}>
                                • {weakness}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                      </>
                    )}
                    </View>
                  )}

                {/* Recommendations */}
                {aiResult.recommendationDrills &&
                  aiResult.recommendationDrills.length > 0 && (
                    <View style={styles.card}>
                      <TouchableOpacity
                        style={styles.cardTitleRow}
                        onPress={() => toggleSection('recommendations')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="fitness" size={18} color="#059669" />
                        <Text style={styles.cardTitle}>Bài tập đề xuất</Text>
                        <Ionicons
                          name={expandedSections.recommendations ? "chevron-up" : "chevron-down"}
                          size={20}
                          color="#6B7280"
                          style={{ marginLeft: 'auto' }}
                        />
                      </TouchableOpacity>
                      {expandedSections.recommendations && (<>
                      {aiResult.recommendationDrills.map((drill, index) => (
                        <View key={index} style={styles.drillItem}>
                          <Text style={styles.drillName}>{drill.name}</Text>
                          <Text style={styles.drillDescription}>
                            {drill.description}
                          </Text>
                          <Text style={styles.drillPractice}>
                            Luyện tập: {drill.practiceSets}
                          </Text>
                        </View>
                      ))}
                      </>
                    )}
                    </View>
                  )}

                {/* Coach Note Input */}
                <View style={[styles.card, { paddingBottom: 200 }]}>
                  <TouchableOpacity
                    style={styles.cardTitleRow}
                    onPress={() => toggleSection('coachNote')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create" size={18} color="#059669" />
                    <Text style={styles.cardTitle}>Ghi chú của HLV</Text>
                    <Ionicons
                      name={expandedSections.coachNote ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#6B7280"
                      style={{ marginLeft: 'auto' }}
                    />
                  </TouchableOpacity>
                  {expandedSections.coachNote && (
                    <>
                      {aiResult.coachNote ? (
                        <Text style={styles.cardContent}>{aiResult.coachNote}</Text>
                      ) : (
                        <View>
                          <TextInput
                            style={styles.coachNoteInput}
                            placeholder="Nhập ghi chú, nhận xét cho học viên..."
                            multiline
                            numberOfLines={4}
                            value={coachNote}
                            onChangeText={setCoachNote}
                            textAlignVertical="top"
                          />
                          <TouchableOpacity
                            style={[
                              styles.submitButton,
                              isSubmitting && { opacity: 0.6 },
                            ]}
                            onPress={handleSubmitCoachNote}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                              <Text style={styles.submitButtonText}>
                                Lưu ghi chú
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>
            )}

            {!aiResult && (
              <View style={styles.noAnalysis}>
                <View style={styles.noAnalysisIconContainer}>
                  <Ionicons name="analytics-outline" size={48} color="#D1D5DB" />
                </View>
                <Text style={styles.noAnalysisTitle}>
                  Chưa có phân tích AI
                </Text>
                <Text style={styles.noAnalysisSubtitle}>
                  Tạo phân tích AI để đánh giá kỹ thuật của học viên
                </Text>
                <View style={styles.infoBox}>
                  <Ionicons name="time" size={16} color="#059669" />
                  <Text style={styles.infoText}>
                    AI sẽ phân tích trong vòng 15 giây
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={handleGenerateAI}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                      <Text style={styles.generateButtonText}>
                        Tạo phân tích AI
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#F9FAFB",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "90%",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  videoTitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 3,
    fontWeight: "500",
    lineHeight: 17,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  videoSelector: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  videoTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 75,
    alignItems: "center",
  },
  videoTabActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#059669",
  },
  videoTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 6,
  },
  videoTabTextActive: {
    color: "#059669",
  },
  scoreTabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  passScoreBadge: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  failScoreBadge: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  videoTabScore: {
    fontSize: 12,
    fontWeight: "700",
  },
  videoTabScoreActive: {
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  videoContainer: {
    backgroundColor: "#000",
    aspectRatio: 16 / 9,
    width: "100%",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  analysisSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  scoreCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  scoreIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
    fontWeight: "500",
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  scoreStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  passedBadge: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  failedBadge: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  scoreStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  passedText: {
    color: "#059669",
  },
  failedText: {
    color: "#DC2626",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  cardContent: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 19,
    fontWeight: "500",
  },
  differenceItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  differenceAspect: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  techniqueComparison: {
    marginBottom: 6,
  },
  techniqueRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  techniqueLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    width: 75,
  },
  coachTechnique: {
    flex: 1,
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },
  learnerTechnique: {
    flex: 1,
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "500",
  },
  detailItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  detailType: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6366F1",
    marginBottom: 6,
    textTransform: "capitalize",
  },
  detailText: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
    lineHeight: 18,
    fontWeight: "500",
  },
  listSection: {
    marginTop: 6,
  },
  listTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  listTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  impactContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 4,
  },
  impactText: {
    flex: 1,
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 17,
  },
  strengthText: {
    fontSize: 12,
    color: "#059669",
    marginLeft: 8,
    marginBottom: 2,
    fontWeight: "500",
  },
  weaknessText: {
    fontSize: 12,
    color: "#DC2626",
    marginLeft: 8,
    marginBottom: 2,
    fontWeight: "500",
  },
  drillItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  drillName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  drillDescription: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
    lineHeight: 18,
    fontWeight: "500",
  },
  drillPractice: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  noAnalysis: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  noAnalysisIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  noAnalysisTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  noAnalysisSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  infoText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "700",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  coachNoteInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: "#374151",
    backgroundColor: "#F9FAFB",
    minHeight: 100,
    marginBottom: 10,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#059669",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
