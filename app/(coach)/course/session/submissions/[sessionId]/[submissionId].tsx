import { formatAnalysisResult } from "@/helper/FormatAnalysisResult";
import * as geminiService from "@/services/ai/geminiService";
import { get, post } from "@/services/http/httpService";
import type {
  AiVideoCompareResult,
  PoseLandmark,
  VideoComparisonResult,
} from "@/types/ai";
import type { Session } from "@/types/session";
import type { LearnerVideo } from "@/types/video";
import { Ionicons } from "@expo/vector-icons";
import { useEvent } from "expo";
import * as FileSystem from "expo-file-system";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString(
    "vi-VN"
  )}`;
};
const SubmissionReviewScreen: React.FC = () => {
  const router = useRouter();
  const { sessionId, submissionId } = useLocalSearchParams<{
    sessionId?: string;
    submissionId?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<LearnerVideo | null>(null);
  const [coachLocalPath, setCoachLocalPath] = useState<string | null>(null);
  const [learnerLocalPath, setLearnerLocalPath] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<VideoComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coachVideoReady, setCoachVideoReady] = useState(false);
  const [learnerVideoReady, setLearnerVideoReady] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compareResult, setCompareResult] =
    useState<AiVideoCompareResult | null>(null);
  const [loadingCompareResult, setLoadingCompareResult] = useState(false);

  const ensureLocalFile = useCallback(async (url: string, name: string) => {
    if (!url) return null;

    try {
      // Try to get FileSystem directories dynamically
      const FileSystemAny = FileSystem as any;
      const cacheDir = FileSystemAny.cacheDirectory;
      const docDir = FileSystemAny.documentDirectory;
      const baseDir = cacheDir || docDir;

      if (!baseDir) {
        return url; // ✅ Sử dụng URL trực tiếp
      }

      const filePath = `${baseDir}${name}`;

      // Check if file exists
      const info = await FileSystem.getInfoAsync(filePath);
      if (info.exists) {
        return filePath;
      }

      // Download file
      console.log(`⬇️ Downloading: ${url.substring(0, 80)}...`);
      const { uri } = await FileSystem.downloadAsync(url, filePath);
      console.log(`✅ Downloaded to: ${uri}`);
      return uri;
    } catch (e) {
      console.warn("⚠️ Failed to cache video, using URL directly:", e);
      return url; // ✅ Fallback to URL
    }
  }, []);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!sessionId || !submissionId) {
        setSubmission(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await get<LearnerVideo[]>(
          `/v1/learner-videos?sessionId=${sessionId}`
        );
        const list = Array.isArray(res.data) ? res.data : [];
        const found = list.find(
          (item) => String(item.id) === String(submissionId)
        );
        if (!found) {
          Alert.alert("Không tìm thấy", "Bài nộp này có thể đã bị xóa.");
        }
        let enhancedSubmission = found ?? null;
        if (found && sessionId) {
          try {
            const sessionRes = await get<Session>(`/v1/sessions/${sessionId}`);
            if (sessionRes?.data) {
              const sessionData = sessionRes.data;
              enhancedSubmission = {
                ...found,
                session: {
                  ...sessionData,
                  lesson: sessionData.lesson ?? found.session?.lesson,
                },
              } as LearnerVideo;
            }
          } catch (err) {
            console.warn(
              "Không thể tải session chi tiết cho coach video:",
              err
            );
          }
        }
        setSubmission(enhancedSubmission);
      } catch (err) {
        console.error(err);
        Alert.alert("Lỗi", "Không thể tải bài nộp.");
        setSubmission(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [sessionId, submissionId]);

  useEffect(() => {
    const fetchCompareResult = async () => {
      if (!submissionId) {
        setCompareResult(null);
        return;
      }

      try {
        setLoadingCompareResult(true);
        const res = await get<AiVideoCompareResult[]>(
          `/v1/ai-video-compare-results?learnerVideoId=${submissionId}`
        );
        const results = Array.isArray(res.data) ? res.data : [];
        // Get the most recent result (first item if sorted by createdAt desc)
        if (results.length > 0) {
          const result = results[0];
          setCompareResult(result);
          // Pre-populate feedback with coachNote if available and feedback is empty
          if (result.coachNote) {
            setFeedback((prev) => (prev ? prev : result.coachNote || ""));
          }
        } else {
          setCompareResult(null);
        }
      } catch (err) {
        console.error("Failed to fetch compare result:", err);
        setCompareResult(null);
      } finally {
        setLoadingCompareResult(false);
      }
    };

    fetchCompareResult();
  }, [submissionId]);

  useEffect(() => {
    let cancelled = false;
    const prepare = async () => {
      if (!submission) {
        setLearnerLocalPath(null);
        setCoachLocalPath(null);
        return;
      }
      const learnerUrl = submission.publicUrl ?? "";
      const coachUrl =
        submission.session?.video?.publicUrl ??
        submission.session?.lesson?.video?.publicUrl ??
        "";

      console.log("📹 Coach URL:", coachUrl);
      console.log("📹 Learner URL:", learnerUrl);

      const [learnerPath, coachPath] = await Promise.all([
        ensureLocalFile(learnerUrl, `learner-${submission.id}.mp4`),
        ensureLocalFile(
          coachUrl,
          `coach-${submission.session?.id ?? "video"}.mp4`
        ),
      ]);

      if (!cancelled) {
        console.log("✅ Coach local path:", coachPath);
        console.log("✅ Learner local path:", learnerPath);
        setLearnerLocalPath(learnerPath);
        setCoachLocalPath(coachPath);
      }
    };
    prepare();
    return () => {
      cancelled = true;
    };
  }, [submission, ensureLocalFile]);

  const learnerSource = useMemo(() => {
    if (submission?.publicUrl) {
      return { uri: submission.publicUrl, contentType: "auto" as const };
    }
    return null;
  }, [submission?.publicUrl]);

  const coachSource = useMemo(() => {
    const coachUrl = submission?.session?.video?.publicUrl;
    if (coachUrl) {
      return { uri: coachUrl, contentType: "auto" as const };
    }
    return null;
  }, [submission?.session?.video?.publicUrl]);

  const learnerPlayer = useVideoPlayer(learnerSource, (player) => {
    if (player) player.loop = false;
  });

  const coachPlayer = useVideoPlayer(coachSource, (player) => {
    if (player) player.loop = false;
  });

  // Theo dõi trạng thái tải của video coach
  const coachStatusEvent = useEvent(coachPlayer, "statusChange", {
    status: coachPlayer?.status,
  });
  const coachStatus = coachStatusEvent?.status ?? coachPlayer?.status;

  useEffect(() => {
    if (!coachSource) {
      setCoachVideoReady(false);
      return;
    }
    if (coachStatus === "readyToPlay") {
      setCoachVideoReady(true);
    } else if (coachStatus === "error") {
      setCoachVideoReady(false);
    }
  }, [coachStatus, coachSource]);

  // Theo dõi trạng thái tải của video learner
  const learnerStatusEvent = useEvent(learnerPlayer, "statusChange", {
    status: learnerPlayer?.status,
  });
  const learnerStatus = learnerStatusEvent?.status ?? learnerPlayer?.status;

  useEffect(() => {
    if (!learnerSource) {
      setLearnerVideoReady(false);
      return;
    }
    if (learnerStatus === "readyToPlay") {
      setLearnerVideoReady(true);
    } else if (learnerStatus === "error") {
      setLearnerVideoReady(false);
    }
  }, [learnerStatus, learnerSource]);

  const learnerName =
    submission?.user?.fullName ??
    (submission?.user?.id ? `Learner #${submission.user.id}` : "Học viên");

  const handleAnalyzeTechnique = useCallback(async () => {
    if (!coachLocalPath || !learnerLocalPath) {
      Alert.alert("Lỗi", "Video chưa sẵn sàng. Vui lòng thử lại.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      console.log("🔍 Starting pose extraction and analysis...");
      console.log("👨‍🏫 Coach video:", coachLocalPath);
      console.log("👨‍🎓 Learner video:", learnerLocalPath);

      // ✅ BƯỚC 1: Extract pose data từ video (sử dụng MediaPipe hoặc TensorFlow)
      // Bạn cần implement hàm extractPoseDataForTimestamps
      const coachDuration = submission?.session?.lesson?.video?.duration ?? 0;
      const learnerDuration = submission?.duration ?? 0;

      const coachTimestamps = [
        coachDuration * 0.25,
        coachDuration * 0.5,
        coachDuration * 0.75,
      ].map((t) => parseFloat(t.toFixed(2)));

      const learnerTimestamps = [
        learnerDuration * 0.25,
        learnerDuration * 0.5,
        learnerDuration * 0.75,
      ].map((t) => parseFloat(t.toFixed(2)));

      console.log("📊 Extracting pose data...");

      // TODO: Implement extractPoseDataForTimestamps function
      // const [coachPoses, learnerPoses] = await Promise.all([
      //   extractPoseDataForTimestamps(coachLocalPath, coachTimestamps),
      //   extractPoseDataForTimestamps(learnerLocalPath, learnerTimestamps)
      // ]);

      // TEMPORARY: Mock data for testing
      const coachPoses: PoseLandmark[][] = [[], [], []]; // Replace with actual extraction
      const learnerPoses: PoseLandmark[][] = [[], [], []]; // Replace with actual extraction

      console.log("🤖 Calling Gemini API with pose data...");

      // ✅ BƯỚC 2: Gọi API với pose data thay vì frames
      const analysisResult = await geminiService.comparePoseData(
        coachPoses,
        coachTimestamps,
        learnerPoses,
        learnerTimestamps
      );

      // ✅ BƯỚC 3: Merge API response với pose data
      const fullResult: VideoComparisonResult = {
        ...analysisResult,
        coachPoses,
        learnerPoses,
      };

      console.log("📊 Full Analysis Result:");
      console.log(JSON.stringify(fullResult, null, 2));

      setAnalysisResult(fullResult);
    } catch (err) {
      console.error("Analysis failed:", err);
      if (err instanceof Error) {
        if (err.message.includes("503") || err.message.includes("overloaded")) {
          setError(
            "Server AI đang quá tải. Vui lòng đợi 1-2 phút rồi thử lại."
          );
          Alert.alert(
            "Server quá tải",
            "Gemini API đang quá tải. Vui lòng thử lại sau 1-2 phút.",
            [{ text: "OK" }]
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Đã xảy ra lỗi không xác định khi so sánh kỹ thuật.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    coachLocalPath,
    learnerLocalPath,
    submission?.duration,
    submission?.session?.lesson?.video,
  ]);

  const derivedCompareResult = useMemo<AiVideoCompareResult | null>(() => {
    if (!analysisResult) return null;

    const keyDifferents =
      analysisResult.keyDifferences?.map((diff) => ({
        aspect: diff.aspect,
        coachTechnique: diff.player1_technique,
        learnerTechnique: diff.player2_technique,
        impact: diff.impact,
      })) ?? [];

    const recommendationDrills =
      analysisResult.recommendationsForPlayer2?.map((item) => ({
        name: item.drill?.title ?? item.recommendation,
        description: item.drill?.description ?? item.recommendation,
        practiceSets: item.drill?.practice_sets ?? "—",
      })) ?? [];

    return {
      id: -1,
      summary: analysisResult.summary,
      learnerScore: analysisResult.overallScoreForPlayer2,
      keyDifferents,
      details: null,
      recommendationDrills,
      coachNote: null,
      createdAt: new Date().toISOString(),
      video: null,
      learnerVideo: submission,
    };
  }, [analysisResult, submission]);

  const displayResult = derivedCompareResult ?? compareResult;

  const canAnalyze = Boolean(
    coachLocalPath &&
      learnerLocalPath &&
      coachVideoReady &&
      learnerVideoReady &&
      !isAnalyzing
  );

  // Nếu có lỗi, cho phép thử lại (nhưng vẫn cần video ready)
  const canRetry =
    error !== null
      ? Boolean(
          coachLocalPath &&
            learnerLocalPath &&
            coachVideoReady &&
            learnerVideoReady &&
            !isAnalyzing
        )
      : canAnalyze;

  // Cho phép submit khi có feedback hoặc có kết quả phân tích
  const canSubmitFeedback = Boolean(
    (feedback.trim() || analysisResult) && !isSubmitting
  );

  const handleSubmitFeedback = useCallback(async () => {
    if (!submissionId) {
      Alert.alert("Lỗi", "Không tìm thấy bài nộp.");
      return;
    }

    // Nếu không có feedback và không có kết quả phân tích
    if (!feedback.trim() && !analysisResult) {
      Alert.alert("Lỗi", "Vui lòng nhập feedback hoặc chờ kết quả phân tích.");
      return;
    }

    setIsSubmitting(true);
    try {
      let payload: any = {};

      // Nếu có kết quả phân tích, gửi toàn bộ dữ liệu
      if (analysisResult) {
        payload.summary = analysisResult.summary;
        payload.overallScoreForPlayer2 = analysisResult.overallScoreForPlayer2;
        payload.comparison = analysisResult.comparison;

        // Map keyDifferences để có coachTechnique và learnerTechnique
        if (
          analysisResult.keyDifferences &&
          analysisResult.keyDifferences.length > 0
        ) {
          payload.keyDifferences = analysisResult.keyDifferences.map((kd) => ({
            aspect: kd.aspect,
            impact: kd.impact,
            coachTechnique: kd.player1_technique,
            learnerTechnique: kd.player2_technique,
          }));
        }

        // Map recommendationsForPlayer2
        if (
          analysisResult.recommendationsForPlayer2 &&
          analysisResult.recommendationsForPlayer2.length > 0
        ) {
          payload.recommendationsForPlayer2 =
            analysisResult.recommendationsForPlayer2.map((rec) => ({
              recommendation: rec.recommendation,
              drill: rec.drill
                ? {
                    title: rec.drill.title,
                    description: rec.drill.description,
                    practice_sets: rec.drill.practice_sets,
                  }
                : undefined,
            }));
        }
      }

      // Thêm coachNote nếu có feedback
      if (feedback.trim()) {
        payload.coachNote = feedback.trim();
      }

      await post(`/v1/learner-videos/${submissionId}/ai-feedback`, payload);

      Alert.alert("Thành công", "Đã gửi kết quả và feedback cho học viên.", [
        {
          text: "OK",
          onPress: () => {
            // Refresh submission data
            if (sessionId && submissionId) {
              get<LearnerVideo[]>(
                `/v1/learner-videos?sessionId=${sessionId}`
              ).then((res) => {
                const list = Array.isArray(res.data) ? res.data : [];
                const found = list.find(
                  (item) => String(item.id) === String(submissionId)
                );
                if (found) {
                  setSubmission(found);
                }
              });
            }
            // Clear feedback after successful submission
            setFeedback("");
          },
        },
      ]);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      Alert.alert("Lỗi", "Không thể gửi feedback. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  }, [submissionId, analysisResult, feedback, sessionId]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {`Bài nộp của ${learnerName}`}
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            setAnalysisResult(null);
            setError(null);
          }}
        >
          <Ionicons name="refresh" size={20} color="#059669" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : !submission ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>Không tìm thấy bài nộp</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Thông tin bài nộp</Text>
            <InfoRow label="Học viên" value={learnerName} />
            <InfoRow label="Email" value={submission.user?.email ?? "—"} />
            <InfoRow
              label="Trạng thái"
              value={submission.status ?? "Đang xử lý"}
            />
            <InfoRow
              label="Thời gian nộp"
              value={formatDateTime(submission.createdAt)}
            />
            <InfoRow
              label="Độ dài"
              value={`${submission.duration ?? 0} giây`}
            />
          </View>

          <View style={styles.videoCard}>
            <View style={styles.videoHeader}>
              <Ionicons name="sparkles" size={18} color="#7C3AED" />
              <Text style={styles.cardTitle}>Video mẫu - Coach</Text>
            </View>
            {coachSource ? (
              <View style={styles.videoPlayerContainer}>
                {(coachStatus === "loading" || !coachVideoReady) && (
                  <View style={styles.videoLoadingOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.videoLoadingText}>
                      Đang tải video...
                    </Text>
                  </View>
                )}
                <VideoView
                  style={styles.videoPlayer}
                  allowsFullscreen
                  allowsPictureInPicture
                  player={coachPlayer}
                />
                {coachStatus === "error" && (
                  <View style={styles.videoErrorOverlay}>
                    <Text style={styles.errorText}>Không thể tải video</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>Chưa có video mẫu</Text>
            )}
          </View>

          <View style={styles.videoCard}>
            <Text style={styles.cardTitle}>Video học viên</Text>
            {learnerSource ? (
              <View style={styles.videoPlayerContainer}>
                {(learnerStatus === "loading" || !learnerVideoReady) && (
                  <View style={styles.videoLoadingOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.videoLoadingText}>
                      Đang tải video...
                    </Text>
                  </View>
                )}
                <VideoView
                  style={styles.videoPlayer}
                  allowsFullscreen
                  allowsPictureInPicture
                  player={learnerPlayer}
                />
                {learnerStatus === "error" && (
                  <View style={styles.videoErrorOverlay}>
                    <Text style={styles.errorText}>Không thể tải video</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>Video đang được xử lý</Text>
            )}
          </View>

          {/* Hiển thị kết quả nếu đã có response */}
          {displayResult ? (
            <View style={styles.actionCard}>
              {loadingCompareResult ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator size="small" color="#059669" />
                  <Text style={styles.loadingText}>
                    Đang tải kết quả so sánh...
                  </Text>
                </View>
              ) : (
                <View style={styles.compareResultCard}>
                  <View style={styles.compareResultHeader}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#059669"
                    />
                    <Text style={styles.cardTitle}>Kết quả so sánh AI</Text>
                  </View>
                  {displayResult.summary ? (
                    <View style={styles.compareResultSection}>
                      <Text style={styles.compareResultLabel}>Tóm tắt:</Text>
                      <Text style={styles.compareResultText}>
                        {displayResult.summary}
                      </Text>
                    </View>
                  ) : null}
                  {displayResult.learnerScore !== null &&
                  displayResult.learnerScore !== undefined ? (
                    <View style={styles.compareResultSection}>
                      <Text style={styles.compareResultLabel}>Điểm số:</Text>
                      <Text style={styles.compareResultScore}>
                        {displayResult.learnerScore}/100
                      </Text>
                    </View>
                  ) : null}
                  {displayResult.keyDifferents &&
                  displayResult.keyDifferents.length > 0 ? (
                    <View style={styles.compareResultSection}>
                      <Text style={styles.compareResultLabel}>
                        Điểm khác biệt chính:
                      </Text>
                      {displayResult.keyDifferents.map((diff, index) => (
                        <View key={index} style={styles.keyDifferenceItem}>
                          <Text style={styles.keyDifferenceAspect}>
                            {diff.aspect}
                          </Text>
                          <Text style={styles.keyDifferenceText}>
                            <Text style={styles.boldText}>Coach: </Text>
                            {diff.coachTechnique}
                          </Text>
                          <Text style={styles.keyDifferenceText}>
                            <Text style={styles.boldText}>Học viên: </Text>
                            {diff.learnerTechnique}
                          </Text>
                          <Text style={styles.keyDifferenceImpact}>
                            Tác động: {diff.impact}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {displayResult.recommendationDrills &&
                  displayResult.recommendationDrills.length > 0 ? (
                    <View style={styles.compareResultSection}>
                      <Text style={styles.compareResultLabel}>
                        Bài tập đề xuất:
                      </Text>
                      {displayResult.recommendationDrills.map(
                        (drill, index) => (
                          <View key={index} style={styles.drillItem}>
                            <Text style={styles.drillName}>{drill.name}</Text>
                            <Text style={styles.drillDescription}>
                              {drill.description}
                            </Text>
                            <Text style={styles.drillPracticeSets}>
                              Số lần tập: {drill.practiceSets}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  ) : null}
                  {displayResult.coachNote ? (
                    <View style={styles.compareResultSection}>
                      <Text style={styles.compareResultLabel}>
                        Ghi chú của coach:
                      </Text>
                      <Text style={styles.compareResultText}>
                        {displayResult.coachNote}
                      </Text>
                    </View>
                  ) : null}
                  {displayResult.createdAt ? (
                    <Text style={styles.compareResultDate}>
                      Tạo lúc: {formatDateTime(displayResult.createdAt)}
                    </Text>
                  ) : null}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.actionCard}>
              <TouchableOpacity
                style={[
                  styles.analyzeButton,
                  !canRetry && styles.analyzeButtonDisabled,
                ]}
                onPress={handleAnalyzeTechnique}
                disabled={!canRetry}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : error ? (
                  <>
                    <Ionicons name="refresh" size={16} color="#FFFFFF" />
                    <Text style={styles.analyzeText}>Thử lại</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                    <Text style={styles.analyzeText}>Chấm bài bằng AI</Text>
                  </>
                )}
              </TouchableOpacity>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {loadingCompareResult ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator size="small" color="#059669" />
                  <Text style={styles.loadingText}>
                    Đang tải kết quả so sánh...
                  </Text>
                </View>
              ) : null}
              {analysisResult ? (
                <View style={styles.analysisCard}>
                  <Text style={styles.cardTitle}>Kết quả phân tích</Text>
                  <ScrollView
                    style={{ maxHeight: 400 }}
                    showsVerticalScrollIndicator={true}
                  >
                    <Text style={styles.analysisText}>
                      {formatAnalysisResult(analysisResult)}
                    </Text>
                  </ScrollView>
                </View>
              ) : null}
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackLabel}>Feedback</Text>
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Nhập feedback cho học viên..."
                  placeholderTextColor="#9CA3AF"
                  value={feedback}
                  onChangeText={setFeedback}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!canSubmitFeedback || isSubmitting) &&
                      styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmitFeedback}
                  disabled={!canSubmitFeedback || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="send" size={16} color="#FFFFFF" />
                      <Text style={styles.submitText}>Trả kết quả</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
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
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 8,
  },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: { fontSize: 14, color: "#6B7280", textAlign: "center" },
  content: { flex: 1 },
  infoCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  videoCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  infoLabel: { fontSize: 13, color: "#6B7280" },
  infoValue: { fontSize: 13, color: "#111827", fontWeight: "600" },
  videoHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  videoPlayerContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  videoLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    gap: 8,
  },
  videoLoadingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
  },
  videoErrorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    padding: 16,
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    paddingVertical: 12,
  },
  analyzeButtonDisabled: {
    backgroundColor: "#C4B5FD",
  },
  analyzeText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  errorText: { color: "#DC2626", fontSize: 12 },
  analysisCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
  },
  analysisText: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
  },
  feedbackSection: {
    marginTop: 12,
    gap: 12,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  feedbackInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 100,
    maxHeight: 150,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#059669",
    paddingVertical: 12,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#6B7280",
  },
  compareResultCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#86EFAC",
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  compareResultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  compareResultSection: {
    marginTop: 8,
    gap: 6,
  },
  compareResultLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  compareResultText: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
  },
  compareResultScore: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
  },
  keyDifferenceItem: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    gap: 6,
  },
  keyDifferenceAspect: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  keyDifferenceText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  keyDifferenceImpact: {
    fontSize: 12,
    color: "#059669",
    fontStyle: "italic",
    marginTop: 4,
  },
  boldText: {
    fontWeight: "700",
    color: "#111827",
  },
  drillItem: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    gap: 6,
  },
  drillName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  drillDescription: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  drillPracticeSets: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
    marginTop: 4,
  },
  compareResultDate: {
    fontSize: 11,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 8,
  },
});

export default SubmissionReviewScreen;
