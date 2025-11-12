// app/(coach)/course/session/submissions/[sessionId]/[submissionId].tsx
import * as geminiService from "@/services/ai/geminiService";
import { get } from "@/services/http/httpService";
import { VideoComparisonResult } from "@/types/ai";
import type { LearnerVideo } from "@/types/video";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as FileSystemImport from "expo-file-system";
import * as VideoThumbnails from "expo-video-thumbnails";

const FileSystem = FileSystemImport as any;

const CACHE_DIR: string =
  FileSystem.cacheDirectory || FileSystem.documentDirectory || "";
const BASE64_ENCODING = "base64";

const SubmissionReviewScreen: React.FC = () => {
  const router = useRouter();

  const [techniqueResult, setTechniqueResult] =
    useState<VideoComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { sessionId, submissionId } = useLocalSearchParams<{
    sessionId?: string;
    submissionId?: string;
  }>();
  const [submission, setSubmission] = useState<LearnerVideo | null>(null);
  const [loading, setLoading] = useState(true);

  const [coachVideoUri, setCoachVideoUri] = useState<string | null>(null);
  const [learnerVideoUri, setLearnerVideoUri] = useState<string | null>(null);

  // ----- Helpers -----
  const fetchVideoToLocal = useCallback(
    async (url: string, filename: string) => {
      const target = `${CACHE_DIR}${filename}`;
      try {
        const info = await FileSystem.getInfoAsync(target);
        if (info.exists) return target;
        const { uri } = await FileSystem.downloadAsync(url, target);
        return uri;
      } catch {
        throw new Error("Không thể tải video để chấm bài.");
      }
    },
    []
  );

  // Lấy 3 frame dạng base64 từ video (best-effort nếu chưa có duration)
  const extractKeyFrames = async (videoUri: string) => {
    const candidateMs = [1000, 2000, 3000, 4000, 5000]; // thử nhiều mốc
    const frames: string[] = [];
    const timestamps: number[] = [];

    for (const ms of candidateMs) {
      if (frames.length >= 3) break;
      try {
        const { uri: imgUri } = await VideoThumbnails.getThumbnailAsync(
          videoUri,
          {
            time: ms,
            quality: 0.8,
          }
        );
        const b64 = await FileSystem.readAsStringAsync(imgUri, {
          encoding: BASE64_ENCODING,
        });
        frames.push(b64);
        timestamps.push(parseFloat((ms / 1000).toFixed(2)));
      } catch {
        // thumbnail có thể fail ở một số mốc -> bỏ qua
      }
    }

    if (frames.length < 3) {
      const fallback = [700, 1500, 2500];
      for (const ms of fallback) {
        if (frames.length >= 3) break;
        try {
          const { uri: imgUri } = await VideoThumbnails.getThumbnailAsync(
            videoUri,
            {
              time: ms,
              quality: 0.8,
            }
          );
          const b64 = await FileSystem.readAsStringAsync(imgUri, {
            encoding: BASE64_ENCODING,
          });
          frames.push(b64);
          timestamps.push(parseFloat((ms / 1000).toFixed(2)));
        } catch {}
      }
    }

    if (frames.length === 0) {
      throw new Error("Không trích xuất được frame từ video.");
    }

    return { frames, timestamps };
  };

  const handleAnalyzeTechnique = async () => {
    if (!coachVideoUri || !learnerVideoUri) return;

    setIsLoading(true);
    setError(null);
    setTechniqueResult(null);

    try {
      const [coachData, learnerData] = await Promise.all([
        extractKeyFrames(coachVideoUri),
        extractKeyFrames(learnerVideoUri),
      ]);

      const analysisResult = await geminiService.compareVideos(
        coachData.frames,
        coachData.timestamps,
        learnerData.frames,
        learnerData.timestamps
      );
      setTechniqueResult(analysisResult);
      console.log("Technique comparison result", analysisResult);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi không xác định khi so sánh kỹ thuật."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmission = useCallback(async () => {
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
      setSubmission(found ?? null);
    } catch {
      Alert.alert("Lỗi", "Không thể tải bài nộp");
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId, submissionId]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  // ---- Video sources for players ----
  const learnerSource = useMemo(() => {
    if (submission?.publicUrl) {
      return { uri: submission.publicUrl, contentType: "auto" as const };
    }
    return null;
  }, [submission?.publicUrl]);

  const coachSource = useMemo(() => {
    const coachUrl = submission?.session?.lesson?.videos?.[0]?.publicUrl;
    if (coachUrl) {
      return { uri: coachUrl, contentType: "auto" as const };
    }
    return null;
  }, [submission?.session?.lesson?.videos]);

  const learnerPlayer = useVideoPlayer(learnerSource, (player) => {
    if (player) player.loop = false;
  });
  const coachPlayer = useVideoPlayer(coachSource, (player) => {
    if (player) player.loop = false;
  });

  // Tải video về local để AI trích frame
  useEffect(() => {
    const prepare = async () => {
      if (!submission) return;
      try {
        if (!coachVideoUri && coachSource?.uri) {
          const uri = await fetchVideoToLocal(
            coachSource.uri,
            `coach-${submission.session?.id ?? "video"}.mp4`
          );
          setCoachVideoUri(uri);
        }
        if (!learnerVideoUri && learnerSource?.uri) {
          const uri = await fetchVideoToLocal(
            learnerSource.uri,
            `learner-${submission.id}.mp4`
          );
          setLearnerVideoUri(uri);
        }
      } catch (e) {
        console.error("Unable to prepare video files for AI analysis", e);
      }
    };
    prepare();
  }, [
    submission,
    coachSource?.uri,
    learnerSource?.uri,
    coachVideoUri,
    learnerVideoUri,
    fetchVideoToLocal,
  ]);

  const learnerName = submission?.user?.fullName
    ? submission.user.fullName
    : submission?.user?.id
    ? `Learner #${submission.user.id}`
    : "Learner";

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {`Chấm bài ${learnerName}`}
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchSubmission}
        >
          <Ionicons name="refresh" size={20} color="#059669" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : !submission ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>Không tìm thấy bài nộp</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Thông tin bài nộp</Text>
            <InfoRow label="Học viên" value={learnerName} />
            <InfoRow
              label="Số điện thoại"
              value={submission.user?.phoneNumber || "—"}
            />
            <InfoRow
              label="Thời gian nộp"
              value={formatDateTime(submission.createdAt)}
            />
            <InfoRow label="Trạng thái" value={submission.status || "—"} />
          </View>

          <View style={styles.videoSection}>
            <View style={styles.videoHeader}>
              <Ionicons name="sparkles" size={18} color="#7C3AED" />
              <Text style={styles.videoHeaderTitle}>Video mẫu - Coach</Text>
            </View>
            {coachSource ? (
              <VideoView
                style={styles.videoPlayer}
                player={coachPlayer}
                allowsFullscreen
                allowsPictureInPicture
              />
            ) : (
              <Text style={styles.emptyText}>Chưa có video mẫu</Text>
            )}
          </View>

          <View style={styles.videoSection}>
            <View style={styles.videoHeader}>
              <Ionicons name="videocam" size={18} color="#059669" />
              <Text style={styles.videoHeaderTitle}>Video học viên</Text>
            </View>
            {learnerSource ? (
              <VideoView
                style={styles.videoPlayer}
                player={learnerPlayer}
                allowsFullscreen
                allowsPictureInPicture
              />
            ) : (
              <Text style={styles.emptyText}>Video đang xử lý</Text>
            )}
          </View>

          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[
                styles.analyzeButton,
                (!coachVideoUri || !learnerVideoUri || isLoading) &&
                  styles.analyzeButtonDisabled,
              ]}
              onPress={handleAnalyzeTechnique}
              disabled={isLoading || !coachVideoUri || !learnerVideoUri}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  <Text style={styles.analyzeButtonText}>Chấm bài bằng AI</Text>
                </>
              )}
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {techniqueResult ? (
              <View style={styles.resultBox}>
                <Text style={styles.resultTitle}>Kết quả phân tích</Text>
                <Text style={styles.resultJson}>
                  {JSON.stringify(techniqueResult, null, 2)}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "—"}</Text>
  </View>
);

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString(
    "vi-VN"
  )}`;
};

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
  backButton: { padding: 8 },
  refreshButton: { padding: 8 },
  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: { fontSize: 14, color: "#6B7280", textAlign: "center" },
  scroll: { flex: 1 },
  infoSection: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 13, color: "#6B7280" },
  infoValue: { fontSize: 13, color: "#111827", fontWeight: "600" },
  videoSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  videoHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  videoHeaderTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  videoPlayer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  actionSection: {
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
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingVertical: 12,
  },
  analyzeButtonDisabled: { backgroundColor: "#C4B5FD" },
  analyzeButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  errorText: { color: "#DC2626", fontSize: 12 },
  resultBox: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#F9FAFB",
    gap: 8,
  },
  resultTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  resultJson: { fontSize: 12, fontFamily: "monospace", color: "#374151" },
});

export default SubmissionReviewScreen;
