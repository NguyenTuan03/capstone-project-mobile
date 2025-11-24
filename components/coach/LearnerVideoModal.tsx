import { compareVideosWithBackend } from "@/services/ai/geminiService";
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
    console.log("Selected Video:", selectedVideo.video);
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
      console.error("AI Generation Error:", error);
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
      const { default: learnerVideoService } = await import(
        "@/services/learnerVideo.service"
      );

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
      console.error("Submit Coach Note Error:", error);
      Alert.alert("Lỗi", "Không thể lưu ghi chú. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const aiResult = getLatestAiResult(selectedVideo);

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
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Video học viên</Text>
              <Text style={styles.videoTitle} numberOfLines={1}>
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
                          <Text
                            style={[
                              styles.videoTabScore,
                              selectedVideo?.id === video.id &&
                                styles.videoTabScoreActive,
                              latestResult.learnerScore >= 70
                                ? { color: "#059669" }
                                : { color: "#DC2626" },
                            ]}
                          >
                            {latestResult.learnerScore}đ
                          </Text>
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
                    <Text style={styles.scoreLabel}>Điểm đánh giá</Text>
                    <Text
                      style={[
                        styles.scoreValue,
                        aiResult.learnerScore >= 70
                          ? { color: "#059669" }
                          : { color: "#DC2626" },
                      ]}
                    >
                      {aiResult.learnerScore}/100
                    </Text>
                  </View>
                )}

                {/* Summary */}
                {aiResult.summary && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Tổng quan</Text>
                    <Text style={styles.cardContent}>{aiResult.summary}</Text>
                  </View>
                )}

                {/* Key Differences */}
                {aiResult.keyDifferents &&
                  aiResult.keyDifferents.length > 0 && (
                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>Điểm khác biệt chính</Text>
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
                          <Text style={styles.impactText}>
                            💡 {diff.impact}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                {/* Details */}
                {aiResult.details && aiResult.details.length > 0 && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Chi tiết phân tích</Text>
                    {aiResult.details.map((detail, index) => (
                      <View key={index} style={styles.detailItem}>
                        <Text style={styles.detailType}>
                          {mapAiReultTypeToVN(detail.type)}
                        </Text>
                        <Text style={styles.detailText}>{detail.advanced}</Text>
                        {detail.strengths && detail.strengths.length > 0 && (
                          <View style={styles.listSection}>
                            <Text style={styles.listTitle}>✓ Điểm mạnh:</Text>
                            {detail.strengths.map((strength, i) => (
                              <Text key={i} style={styles.strengthText}>
                                • {strength}
                              </Text>
                            ))}
                          </View>
                        )}
                        {detail.weaknesses && detail.weaknesses.length > 0 && (
                          <View style={styles.listSection}>
                            <Text style={styles.listTitle}>
                              ⚠ Cần cải thiện:
                            </Text>
                            {detail.weaknesses.map((weakness, i) => (
                              <Text key={i} style={styles.weaknessText}>
                                • {weakness}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Recommendations */}
                {aiResult.recommendationDrills &&
                  aiResult.recommendationDrills.length > 0 && (
                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>Bài tập đề xuất</Text>
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
                    </View>
                  )}

                {/* Coach Note Input */}
                <View style={[styles.card, { paddingBottom: 200 }]}>
                  <Text style={styles.cardTitle}>Ghi chú của HLV</Text>
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
                </View>
              </View>
            )}

            {!aiResult && (
              <View style={styles.noAnalysis}>
                <Ionicons name="analytics-outline" size={48} color="#6366F1" />
                <Text style={styles.noAnalysisText}>
                  Chưa có phân tích AI cho video này
                </Text>
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
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  videoTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  videoSelector: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  videoTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 80,
    alignItems: "center",
  },
  videoTabActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366F1",
  },
  videoTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  videoTabTextActive: {
    color: "#6366F1",
  },
  videoTabScore: {
    fontSize: 14,
    fontWeight: "bold",
  },
  videoTabScoreActive: {
    fontWeight: "bold",
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
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  scoreCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  scoreLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  cardContent: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  differenceItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  differenceAspect: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  techniqueComparison: {
    marginBottom: 8,
  },
  techniqueRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  techniqueLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    width: 80,
  },
  coachTechnique: {
    flex: 1,
    fontSize: 13,
    color: "#059669",
  },
  learnerTechnique: {
    flex: 1,
    fontSize: 13,
    color: "#DC2626",
  },
  impactText: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 4,
  },
  detailItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  detailType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366F1",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  detailText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    lineHeight: 20,
  },
  listSection: {
    marginTop: 8,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  strengthText: {
    fontSize: 13,
    color: "#059669",
    marginLeft: 8,
    marginBottom: 2,
  },
  weaknessText: {
    fontSize: 13,
    color: "#DC2626",
    marginLeft: 8,
    marginBottom: 2,
  },
  drillItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  drillName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  drillDescription: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    lineHeight: 20,
  },
  drillPractice: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
  },
  noAnalysis: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  noAnalysisText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 12,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366F1",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  coachNoteInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#374151",
    backgroundColor: "#F9FAFB",
    minHeight: 100,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: "#059669",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
