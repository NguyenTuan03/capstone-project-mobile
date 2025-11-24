import { LearnerVideo } from "@/types/video";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
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
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (learnerVideo) {
      setSelectedVideo(learnerVideo);
    }
  }, [learnerVideo]);

  if (!selectedVideo) return null;

  const aiResult = selectedVideo.aiVideoComparisonResults;

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
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((video, index) => (
                    <TouchableOpacity
                      key={video.id}
                      style={[
                        styles.videoTab,
                        selectedVideo?.id === video.id && styles.videoTabActive,
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
                      {video.aiVideoComparisonResults?.learnerScore && (
                        <Text
                          style={[
                            styles.videoTabScore,
                            selectedVideo?.id === video.id &&
                              styles.videoTabScoreActive,
                            video.aiVideoComparisonResults?.learnerScore >= 70
                              ? { color: "#059669" }
                              : { color: "#DC2626" },
                          ]}
                        >
                          {video.aiVideoComparisonResults?.learnerScore}đ
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
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
                              <Text style={styles.techniqueLabel}>HLV:</Text>
                              <Text style={styles.coachTechnique}>
                                {diff.coachTechnique}
                              </Text>
                            </View>
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
                          {detail.type.replace(/_/g, " ")}
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

                {/* Coach Note */}
                {aiResult.coachNote && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Ghi chú của HLV</Text>
                    <Text style={styles.cardContent}>{aiResult.coachNote}</Text>
                  </View>
                )}
              </View>
            )}

            {!aiResult && (
              <View style={styles.noAnalysis}>
                <Ionicons
                  name="information-circle-outline"
                  size={48}
                  color="#9CA3AF"
                />
                <Text style={styles.noAnalysisText}>Chưa có phân tích AI</Text>
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
});
