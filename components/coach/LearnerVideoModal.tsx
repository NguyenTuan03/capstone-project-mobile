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
  const [coachNotesInput, setCoachNotesInput] = useState<
    Record<number, string>
  >({});
  const [expandedResultIndices, setExpandedResultIndices] = useState<number[]>([
    0,
  ]);
  const [expandedSections, setExpandedSections] = useState({
    analysis: true,
    summary: true,
    keyDifferences: true,
    details: true,
    recommendations: true,
    coachNote: true,
  });
  const [editingResultIndex, setEditingResultIndex] = useState<number | null>(
    null
  );
  const [editingValues, setEditingValues] = useState<{
    summary: string;
    overallForPlayer2: string; // Changed from learnerScore
    keyDifferents: {
      aspect: string;
      learnerTechnique: string;
      impact: string;
    }[];
    details: {
      type: string;
      advanced: string;
      strengths: string[];
      weaknesses: string[];
    }[];
    recommendationDrills: {
      name: string;
      description: string;
      practiceSets: string;
    }[];
  }>({
    summary: "",
    overallForPlayer2: "",
    keyDifferents: [],
    details: [],
    recommendationDrills: [],
  });
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (learnerVideo) {
      setSelectedVideo(learnerVideo);
      setExpandedResultIndices([0]);
      setCoachNotesInput({});
    }
  }, [learnerVideo]);

  useEffect(() => {
    setExpandedResultIndices([0]);
    setCoachNotesInput({});
  }, [selectedVideo?.id]);

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
      setExpandedResultIndices([0]); // Select the new latest result
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tạo phân tích AI. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitCoachNote = async (
    aiResult: any,
    note: string,
    index: number
  ) => {
    if (!note.trim()) {
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

      await learnerVideoService.submitAiFeedback(aiResult.id, note);

      // Update the selected video with the coach note
      setSelectedVideo({
        ...selectedVideo,
        aiVideoComparisonResults:
          selectedVideo.aiVideoComparisonResults?.map((result) =>
            result === aiResult ? { ...result, coachNote: note } : result
          ) || [],
      });

      // Update local input state to reflect saved status if needed, or just keep as is
      setCoachNotesInput((prev) => ({ ...prev, [index]: note }));
      Alert.alert("Thành công", "Đã lưu ghi chú của HLV");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lưu ghi chú. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedAiResults = selectedVideo?.aiVideoComparisonResults
    ? [...selectedVideo.aiVideoComparisonResults].sort(
        (a, b) =>
          (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
          (a.createdAt ? new Date(a.createdAt).getTime() : 0)
      )
    : [];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleResultExpansion = (index: number) => {
    setExpandedResultIndices((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        // If "accordion" style is desired (only one open at a time):
        // return [index];
        // If multiple open allowed:
        return [...prev, index];
      }
    });
  };

  const handleSaveEdit = async (result: any, index: number) => {
    if (!result.id) return;
    try {
      setIsSubmitting(true);
      const updatedData = {
        summary: editingValues.summary,
        overallScoreForPlayer2: parseInt(editingValues.overallForPlayer2) || 0, // Changed payload key
        keyDifferents: editingValues.keyDifferents,
        details: editingValues.details,
        recommendationDrills: editingValues.recommendationDrills,
      };

      await learnerVideoService.updateAiFeedback(result.id, updatedData);

      // Optimistic update via selectedVideo
      if (selectedVideo) {
        setSelectedVideo({
          ...selectedVideo,
          aiVideoComparisonResults: selectedVideo.aiVideoComparisonResults?.map(
            (r) =>
              r.id === result.id
                ? {
                    ...r,
                    ...updatedData,
                    details: updatedData.details.map((d, i) => ({
                      ...d,
                      learnerTimestamp: r.details?.[i]?.learnerTimestamp || 0,
                      coachTimestamp: r.details?.[i]?.coachTimestamp || 0,
                      type: r.details?.[i]?.type as any, // Cast to any or correct enum to avoid mismatch logic issues here
                    })),
                    // Update display logic locally immediately
                    overallScoreForPlayer2: updatedData.overallScoreForPlayer2,
                  }
                : r
          ),
        });
      }
      setEditingResultIndex(null);
    } catch (error) {
      console.error("Error updating AI feedback:", error);
      Alert.alert("Lỗi", "Không thể cập nhật kết quả phân tích.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (result: any, index: number) => {
    setEditingResultIndex(index);
    setEditingValues({
      summary: result.summary || "",
      // Use overallScoreForPlayer2 if available, else learnerScore, else ""
      overallForPlayer2: (
        result.overallScoreForPlayer2 ??
        result.learnerScore ??
        ""
      ).toString(),
      keyDifferents: result.keyDifferents
        ? JSON.parse(JSON.stringify(result.keyDifferents))
        : [],
      details: result.details ? JSON.parse(JSON.stringify(result.details)) : [],
      recommendationDrills: result.recommendationDrills
        ? JSON.parse(JSON.stringify(result.recommendationDrills))
        : [],
    });
  };

  const cancelEditing = () => {
    setEditingResultIndex(null);
    setEditingValues({
      summary: "",
      overallForPlayer2: "",
      keyDifferents: [],
      details: [],
      recommendationDrills: [],
    });
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
                          <View
                            style={[
                              styles.scoreTabBadge,
                              latestResult.learnerScore >= 70
                                ? styles.passScoreBadge
                                : styles.failScoreBadge,
                            ]}
                          >
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
            {sortedAiResults.length > 0 && (
              <View style={styles.analysisSection}>
                <View style={styles.analysisHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>Phân tích AI</Text>
                  </View>
                </View>

                <View>
                  {!sortedAiResults.some(
                    (r) => r.status === "USED" || r.status === undefined
                  ) && (
                    <TouchableOpacity
                      style={[styles.generateButton, { marginBottom: 20 }]}
                      onPress={handleGenerateAI}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                          <Text style={styles.generateButtonText}>
                            Tạo với AI
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  {sortedAiResults.map((result, index) => {
                    const isExpanded = expandedResultIndices.includes(index);
                    return (
                      <View
                        key={index}
                        style={[
                          styles.unifiedCard,
                          result.status === "USED" && styles.usedResultCard,
                        ]}
                      >
                        {/* Result Card Header */}
                        <TouchableOpacity
                          style={[
                            styles.resultCardHeader,
                            result.status === "USED" && styles.usedResultHeader,
                          ]}
                          onPress={() => toggleResultExpansion(index)}
                          activeOpacity={0.7}
                        >
                          <View>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <Text style={styles.resultCardTitle}>
                                Kết quả {sortedAiResults.length - index}
                                {index === 0 ? " (Mới nhất)" : ""}
                              </Text>
                              {result.status === "USED" && (
                                <View style={styles.usedBadge}>
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={12}
                                    color="#059669"
                                  />
                                  <Text style={styles.usedBadgeText}>
                                    Đã sử dụng
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.resultCardDate}>
                              {result.createdAt
                                ? new Date(result.createdAt).toLocaleString(
                                    "vi-VN",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    }
                                  )
                                : ""}
                            </Text>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {/* Mini Score Badge in Header */}
                            {result.learnerScore !== null && (
                              <View
                                style={[
                                  styles.headerScoreBadge,
                                  result.learnerScore >= 50
                                    ? styles.passedBadge
                                    : styles.failedBadge,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.headerScoreText,
                                    result.learnerScore >= 50
                                      ? styles.passedText
                                      : styles.failedText,
                                  ]}
                                >
                                  {result.learnerScore}/100
                                </Text>
                              </View>
                            )}
                            {/* Edit Button */}
                            {result.status !== "USED" && (
                              <TouchableOpacity
                                style={{ padding: 4 }}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  startEditing(result, index);
                                }}
                              >
                                <Ionicons
                                  name="pencil"
                                  size={18}
                                  color="#6B7280"
                                />
                              </TouchableOpacity>
                            )}
                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={20}
                              color="#6B7280"
                            />
                          </View>
                        </TouchableOpacity>

                        {isExpanded && (
                          <View>
                            {editingResultIndex === index ? (
                              <View style={{ padding: 16 }}>
                                <Text style={styles.inputLabel}>
                                  Điểm đánh giá
                                </Text>
                                <TextInput
                                  style={styles.inputField}
                                  value={editingValues.overallForPlayer2}
                                  onChangeText={(text) =>
                                    setEditingValues((prev) => ({
                                      ...prev,
                                      overallForPlayer2: text,
                                    }))
                                  }
                                  keyboardType="numeric"
                                  placeholder="0-100"
                                />

                                <Text
                                  style={[styles.inputLabel, { marginTop: 12 }]}
                                >
                                  Tổng quan
                                </Text>
                                <TextInput
                                  style={[
                                    styles.inputField,
                                    { minHeight: 100 },
                                  ]}
                                  value={editingValues.summary}
                                  onChangeText={(text) =>
                                    setEditingValues((prev) => ({
                                      ...prev,
                                      summary: text,
                                    }))
                                  }
                                  multiline
                                  textAlignVertical="top"
                                  placeholder="Nhập nhận xét tổng quan..."
                                />

                                {/* Edit Key Differences */}
                                <Text
                                  style={[styles.inputLabel, { marginTop: 12 }]}
                                >
                                  Điểm khác biệt chính
                                </Text>
                                {editingValues.keyDifferents.map(
                                  (item, idx) => (
                                    <View key={idx} style={styles.editListItem}>
                                      <Text style={styles.editListIndex}>
                                        #{idx + 1}
                                      </Text>
                                      <TextInput
                                        style={[
                                          styles.inputField,
                                          { marginBottom: 8 },
                                        ]}
                                        value={item.aspect}
                                        onChangeText={(text) => {
                                          const newKeyDiffs = [
                                            ...editingValues.keyDifferents,
                                          ];
                                          newKeyDiffs[idx].aspect = text;
                                          setEditingValues((prev) => ({
                                            ...prev,
                                            keyDifferents: newKeyDiffs,
                                          }));
                                        }}
                                        placeholder="Khía cạnh"
                                      />
                                      <TextInput
                                        style={[
                                          styles.inputField,
                                          { marginBottom: 8 },
                                        ]}
                                        value={item.learnerTechnique}
                                        onChangeText={(text) => {
                                          const newKeyDiffs = [
                                            ...editingValues.keyDifferents,
                                          ];
                                          newKeyDiffs[idx].learnerTechnique =
                                            text;
                                          setEditingValues((prev) => ({
                                            ...prev,
                                            keyDifferents: newKeyDiffs,
                                          }));
                                        }}
                                        placeholder="Kỹ thuật của học viên"
                                      />
                                      <TextInput
                                        style={[
                                          styles.inputField,
                                          { minHeight: 60 },
                                        ]}
                                        value={item.impact}
                                        onChangeText={(text) => {
                                          const newKeyDiffs = [
                                            ...editingValues.keyDifferents,
                                          ];
                                          newKeyDiffs[idx].impact = text;
                                          setEditingValues((prev) => ({
                                            ...prev,
                                            keyDifferents: newKeyDiffs,
                                          }));
                                        }}
                                        multiline
                                        placeholder="Tác động"
                                      />
                                    </View>
                                  )
                                )}

                                {/* Edit Details */}
                                <Text
                                  style={[styles.inputLabel, { marginTop: 12 }]}
                                >
                                  Chi tiết phân tích
                                </Text>
                                {editingValues.details.map((detail, idx) => (
                                  <View key={idx} style={styles.editListItem}>
                                    <Text
                                      style={[
                                        styles.editListIndex,
                                        { marginBottom: 4, color: "#6366F1" },
                                      ]}
                                    >
                                      {mapAiReultTypeToVN(detail.type as any)}
                                    </Text>
                                    <TextInput
                                      style={[
                                        styles.inputField,
                                        { minHeight: 60, marginBottom: 8 },
                                      ]}
                                      value={detail.advanced}
                                      onChangeText={(text) => {
                                        const newDetails = [
                                          ...editingValues.details,
                                        ];
                                        newDetails[idx].advanced = text;
                                        setEditingValues((prev) => ({
                                          ...prev,
                                          details: newDetails,
                                        }));
                                      }}
                                      multiline
                                      placeholder="Phân tích nâng cao"
                                    />

                                    <Text
                                      style={[
                                        styles.inputLabel,
                                        { fontSize: 12, marginBottom: 4 },
                                      ]}
                                    >
                                      Điểm mạnh (Mỗi dòng 1 ý)
                                    </Text>
                                    <TextInput
                                      style={[
                                        styles.inputField,
                                        { minHeight: 60, marginBottom: 8 },
                                      ]}
                                      value={detail.strengths.join("\n")}
                                      onChangeText={(text) => {
                                        const newDetails = [
                                          ...editingValues.details,
                                        ];
                                        newDetails[idx].strengths =
                                          text.split("\n");
                                        setEditingValues((prev) => ({
                                          ...prev,
                                          details: newDetails,
                                        }));
                                      }}
                                      multiline
                                      placeholder="Nhập các điểm mạnh..."
                                    />

                                    <Text
                                      style={[
                                        styles.inputLabel,
                                        { fontSize: 12, marginBottom: 4 },
                                      ]}
                                    >
                                      Cần cải thiện (Mỗi dòng 1 ý)
                                    </Text>
                                    <TextInput
                                      style={[
                                        styles.inputField,
                                        { minHeight: 60 },
                                      ]}
                                      value={detail.weaknesses.join("\n")}
                                      onChangeText={(text) => {
                                        const newDetails = [
                                          ...editingValues.details,
                                        ];
                                        newDetails[idx].weaknesses =
                                          text.split("\n");
                                        setEditingValues((prev) => ({
                                          ...prev,
                                          details: newDetails,
                                        }));
                                      }}
                                      multiline
                                      placeholder="Nhập các điểm yếu..."
                                    />
                                  </View>
                                ))}

                                {/* Edit Recommendations */}
                                <Text
                                  style={[styles.inputLabel, { marginTop: 12 }]}
                                >
                                  Bài tập đề xuất
                                </Text>
                                {editingValues.recommendationDrills.map(
                                  (drill, idx) => (
                                    <View key={idx} style={styles.editListItem}>
                                      <Text style={styles.editListIndex}>
                                        #{idx + 1}
                                      </Text>
                                      <TextInput
                                        style={[
                                          styles.inputField,
                                          { marginBottom: 8 },
                                        ]}
                                        value={drill.name}
                                        onChangeText={(text) => {
                                          const newDrills = [
                                            ...editingValues.recommendationDrills,
                                          ];
                                          newDrills[idx].name = text;
                                          setEditingValues((prev) => ({
                                            ...prev,
                                            recommendationDrills: newDrills,
                                          }));
                                        }}
                                        placeholder="Tên bài tập"
                                      />
                                      <TextInput
                                        style={[
                                          styles.inputField,
                                          { minHeight: 60, marginBottom: 8 },
                                        ]}
                                        value={drill.description}
                                        onChangeText={(text) => {
                                          const newDrills = [
                                            ...editingValues.recommendationDrills,
                                          ];
                                          newDrills[idx].description = text;
                                          setEditingValues((prev) => ({
                                            ...prev,
                                            recommendationDrills: newDrills,
                                          }));
                                        }}
                                        multiline
                                        placeholder="Mô tả bài tập"
                                      />
                                      <TextInput
                                        style={[styles.inputField]}
                                        value={drill.practiceSets}
                                        onChangeText={(text) => {
                                          const newDrills = [
                                            ...editingValues.recommendationDrills,
                                          ];
                                          newDrills[idx].practiceSets = text;
                                          setEditingValues((prev) => ({
                                            ...prev,
                                            recommendationDrills: newDrills,
                                          }));
                                        }}
                                        placeholder="Số lượng tập (VD: 3 hiệp x 10 lần)"
                                      />
                                    </View>
                                  )
                                )}

                                <View style={styles.editActionButtons}>
                                  <TouchableOpacity
                                    style={[
                                      styles.actionButton,
                                      styles.cancelButton,
                                    ]}
                                    onPress={cancelEditing}
                                    disabled={isSubmitting}
                                  >
                                    <Text style={styles.cancelButtonText}>
                                      Hủy
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[
                                      styles.actionButton,
                                      styles.saveButton,
                                    ]}
                                    onPress={() =>
                                      handleSaveEdit(result, index)
                                    }
                                    disabled={isSubmitting}
                                  >
                                    {isSubmitting ? (
                                      <ActivityIndicator
                                        color="#FFFFFF"
                                        size="small"
                                      />
                                    ) : (
                                      <Text style={styles.saveButtonText}>
                                        Lưu
                                      </Text>
                                    )}
                                  </TouchableOpacity>
                                </View>
                              </View>
                            ) : (
                              <View>
                                {/* Score Section (Detailed) */}
                                {(result.overallForPlayer2 !== undefined ||
                                  result.learnerScore !== null) && (
                                  <View style={styles.scoreSection}>
                                    <View style={styles.scoreIconContainer}>
                                      <Ionicons
                                        name={
                                          (result.overallForPlayer2 ??
                                            result.learnerScore) >= 50
                                            ? "trophy"
                                            : "analytics"
                                        }
                                        size={28}
                                        color={
                                          (result.overallForPlayer2 ??
                                            result.learnerScore) >= 50
                                            ? "#059669"
                                            : "#DC2626"
                                        }
                                      />
                                    </View>
                                    <Text style={styles.scoreLabel}>
                                      Đánh giá từ AI
                                    </Text>
                                    <Text
                                      style={[
                                        styles.scoreValue,
                                        (result.overallForPlayer2 ??
                                          result.learnerScore) >= 50
                                          ? { color: "#059669" }
                                          : { color: "#DC2626" },
                                      ]}
                                    >
                                      {result.overallForPlayer2 ??
                                        result.learnerScore}
                                      /100
                                    </Text>
                                    <View
                                      style={[
                                        styles.scoreStatusBadge,
                                        (result.overallForPlayer2 ??
                                          result.learnerScore) >= 50
                                          ? styles.passedBadge
                                          : styles.failedBadge,
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.scoreStatusText,
                                          (result.overallForPlayer2 ??
                                            result.learnerScore) >= 50
                                            ? styles.passedText
                                            : styles.failedText,
                                        ]}
                                      >
                                        {(result.overallForPlayer2 ??
                                          result.learnerScore) >= 50
                                          ? "Đạt"
                                          : "Chưa đạt"}
                                      </Text>
                                    </View>
                                  </View>
                                )}

                                {/* Summary */}
                                {result.summary && (
                                  <>
                                    <View style={styles.sectionDivider} />
                                    <View style={styles.innerSection}>
                                      <View style={styles.cardTitleRow}>
                                        <Ionicons
                                          name="document-text"
                                          size={18}
                                          color="#059669"
                                        />
                                        <Text style={styles.cardTitle}>
                                          Tổng quan
                                        </Text>
                                      </View>
                                      <Text style={styles.cardContent}>
                                        {result.summary}
                                      </Text>
                                    </View>
                                  </>
                                )}

                                {/* Key Differences */}
                                {result.keyDifferents &&
                                  result.keyDifferents.length > 0 && (
                                    <>
                                      <View style={styles.sectionDivider} />
                                      <View style={styles.innerSection}>
                                        <View style={styles.cardTitleRow}>
                                          <Ionicons
                                            name="git-compare"
                                            size={18}
                                            color="#F59E0B"
                                          />
                                          <Text style={styles.cardTitle}>
                                            Điểm khác biệt chính
                                          </Text>
                                        </View>
                                        {result.keyDifferents.map(
                                          (diff, idx) => (
                                            <View
                                              key={idx}
                                              style={styles.differenceItem}
                                            >
                                              <Text
                                                style={styles.differenceAspect}
                                              >
                                                {diff.aspect}
                                              </Text>
                                              <View
                                                style={
                                                  styles.techniqueComparison
                                                }
                                              >
                                                <View
                                                  style={styles.techniqueRow}
                                                >
                                                  <Text
                                                    style={
                                                      styles.techniqueLabel
                                                    }
                                                  >
                                                    Học viên:
                                                  </Text>
                                                  <Text
                                                    style={
                                                      styles.learnerTechnique
                                                    }
                                                  >
                                                    {diff.learnerTechnique}
                                                  </Text>
                                                </View>
                                              </View>
                                              <View
                                                style={styles.impactContainer}
                                              >
                                                <Ionicons
                                                  name="information-circle"
                                                  size={14}
                                                  color="#6B7280"
                                                />
                                                <Text style={styles.impactText}>
                                                  {diff.impact}
                                                </Text>
                                              </View>
                                            </View>
                                          )
                                        )}
                                      </View>
                                    </>
                                  )}

                                {/* Details */}
                                {result.details &&
                                  result.details.length > 0 && (
                                    <>
                                      <View style={styles.sectionDivider} />
                                      <View style={styles.innerSection}>
                                        <View style={styles.cardTitleRow}>
                                          <Ionicons
                                            name="list"
                                            size={18}
                                            color="#6366F1"
                                          />
                                          <Text style={styles.cardTitle}>
                                            Chi tiết phân tích
                                          </Text>
                                        </View>
                                        {result.details.map((detail, idx) => (
                                          <View
                                            key={idx}
                                            style={styles.detailItem}
                                          >
                                            <Text style={styles.detailType}>
                                              {mapAiReultTypeToVN(detail.type)}
                                            </Text>
                                            <Text style={styles.detailText}>
                                              {detail.advanced}
                                            </Text>
                                            {detail.strengths &&
                                              detail.strengths.length > 0 && (
                                                <View
                                                  style={styles.listSection}
                                                >
                                                  <View
                                                    style={styles.listTitleRow}
                                                  >
                                                    <Ionicons
                                                      name="checkmark-circle"
                                                      size={14}
                                                      color="#059669"
                                                    />
                                                    <Text
                                                      style={styles.listTitle}
                                                    >
                                                      Điểm mạnh:
                                                    </Text>
                                                  </View>
                                                  {detail.strengths.map(
                                                    (strength, i) => (
                                                      <Text
                                                        key={i}
                                                        style={
                                                          styles.strengthText
                                                        }
                                                      >
                                                        • {strength}
                                                      </Text>
                                                    )
                                                  )}
                                                </View>
                                              )}
                                            {detail.weaknesses &&
                                              detail.weaknesses.length > 0 && (
                                                <View
                                                  style={styles.listSection}
                                                >
                                                  <View
                                                    style={styles.listTitleRow}
                                                  >
                                                    <Ionicons
                                                      name="close-circle"
                                                      size={14}
                                                      color="#DC2626"
                                                    />
                                                    <Text
                                                      style={styles.listTitle}
                                                    >
                                                      Cần cải thiện:
                                                    </Text>
                                                  </View>
                                                  {detail.weaknesses.map(
                                                    (weakness, i) => (
                                                      <Text
                                                        key={i}
                                                        style={
                                                          styles.weaknessText
                                                        }
                                                      >
                                                        • {weakness}
                                                      </Text>
                                                    )
                                                  )}
                                                </View>
                                              )}
                                          </View>
                                        ))}
                                      </View>
                                    </>
                                  )}

                                {/* Recommendations */}
                                {result.recommendationDrills &&
                                  result.recommendationDrills.length > 0 && (
                                    <>
                                      <View style={styles.sectionDivider} />
                                      <View style={styles.innerSection}>
                                        <View style={styles.cardTitleRow}>
                                          <Ionicons
                                            name="fitness"
                                            size={18}
                                            color="#059669"
                                          />
                                          <Text style={styles.cardTitle}>
                                            Bài tập đề xuất
                                          </Text>
                                        </View>
                                        {result.recommendationDrills.map(
                                          (drill, idx) => (
                                            <View
                                              key={idx}
                                              style={styles.drillItem}
                                            >
                                              <Text style={styles.drillName}>
                                                {drill.name}
                                              </Text>
                                              <Text
                                                style={styles.drillDescription}
                                              >
                                                {drill.description}
                                              </Text>
                                              <Text
                                                style={styles.drillPractice}
                                              >
                                                Luyện tập: {drill.practiceSets}
                                              </Text>
                                            </View>
                                          )
                                        )}
                                      </View>
                                    </>
                                  )}

                                {/* Coach Note Input */}
                                <View style={styles.sectionDivider} />
                                <View
                                  style={[
                                    styles.innerSection,
                                    { paddingBottom: 20 },
                                  ]}
                                >
                                  <View style={styles.cardTitleRow}>
                                    <Ionicons
                                      name="create"
                                      size={18}
                                      color="#059669"
                                    />
                                    <Text style={styles.cardTitle}>
                                      Ghi chú của HLV
                                    </Text>
                                  </View>
                                  {result.coachNote &&
                                  !coachNotesInput[index] &&
                                  coachNotesInput[index] !== "" ? (
                                    <View>
                                      <Text style={styles.cardContent}>
                                        {result.coachNote}
                                      </Text>
                                      <TouchableOpacity
                                        style={{ marginTop: 8 }}
                                        onPress={() =>
                                          setCoachNotesInput((prev) => ({
                                            ...prev,
                                            [index]: result.coachNote || "",
                                          }))
                                        }
                                      >
                                        <Text
                                          style={{
                                            color: "#059669",
                                            fontWeight: "600",
                                            fontSize: 13,
                                          }}
                                        >
                                          Chỉnh sửa
                                        </Text>
                                      </TouchableOpacity>
                                    </View>
                                  ) : (
                                    <View>
                                      <TextInput
                                        style={styles.coachNoteInput}
                                        placeholder="Nhập ghi chú, nhận xét cho học viên..."
                                        multiline
                                        numberOfLines={4}
                                        value={
                                          coachNotesInput[index] !== undefined
                                            ? coachNotesInput[index]
                                            : result.coachNote || ""
                                        }
                                        onChangeText={(text) =>
                                          setCoachNotesInput((prev) => ({
                                            ...prev,
                                            [index]: text,
                                          }))
                                        }
                                        textAlignVertical="top"
                                      />
                                      <TouchableOpacity
                                        style={[
                                          styles.submitButton,
                                          isSubmitting && { opacity: 0.6 },
                                        ]}
                                        onPress={() =>
                                          handleSubmitCoachNote(
                                            result,
                                            coachNotesInput[index] !== undefined
                                              ? coachNotesInput[index]
                                              : result.coachNote || "",
                                            index
                                          )
                                        }
                                        disabled={isSubmitting}
                                      >
                                        {isSubmitting ? (
                                          <ActivityIndicator
                                            color="#FFFFFF"
                                            size="small"
                                          />
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
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {sortedAiResults.length === 0 && (
              <View style={styles.noAnalysis}>
                <View style={styles.noAnalysisIconContainer}>
                  <Ionicons
                    name="analytics-outline"
                    size={48}
                    color="#D1D5DB"
                  />
                </View>
                <Text style={styles.noAnalysisTitle}>Chưa có phân tích AI</Text>
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
  analysisHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  resultCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  resultCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  resultCardDate: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  headerScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  headerScoreText: {
    fontSize: 12,
    fontWeight: "700",
  },
  unifiedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  scoreSection: {
    padding: 16,
    alignItems: "center",
  },
  innerSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
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
  editListItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    marginBottom: 12,
  },
  editListIndex: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
    marginBottom: 8,
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
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  inputField: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111827",
  },
  editActionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  saveButton: {
    backgroundColor: "#059669",
  },
  cancelButtonText: {
    color: "#4B5563",
    fontWeight: "600",
    fontSize: 14,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
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
  usedResultCard: {
    borderColor: "#059669",
    borderWidth: 2,
    backgroundColor: "#F0FDF4",
  },
  usedResultHeader: {
    backgroundColor: "#ECFDF5",
    borderBottomColor: "#A7F3D0",
  },
  usedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#6EE7B7",
  },
  usedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
});
