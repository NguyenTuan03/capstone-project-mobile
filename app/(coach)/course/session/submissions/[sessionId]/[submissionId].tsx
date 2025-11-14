import * as geminiService from "@/services/ai/geminiService";
import { get } from "@/services/http/httpService";
import type { VideoComparisonResult } from "@/types/ai";
import type { LearnerVideo } from "@/types/video";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
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

  const ensureLocalFile = useCallback(async (url: string, name: string) => {
    if (!url) return null;

    try {
      // Get cache directory from FileSystem (using type assertion for properties)
      const fs = FileSystem as any;
      const cacheDir = fs.cacheDirectory ?? fs.documentDirectory ?? "";

      if (!cacheDir || !FileSystem.getInfoAsync || !FileSystem.downloadAsync) {
        console.warn("FileSystem not available, using URL directly");
        return url;
      }

      const filePath = `${cacheDir}${name}`;
      const info = await FileSystem.getInfoAsync(filePath);
      if (info.exists) {
        return filePath;
      }
      const { uri } = await FileSystem.downloadAsync(url, filePath);
      return uri;
    } catch (e) {
      console.error("Failed to cache video", e);
      // Fallback to URL if caching fails
      return url;
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
        setSubmission(found ?? null);
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
    let cancelled = false;
    const prepare = async () => {
      if (!submission) {
        setLearnerLocalPath(null);
        setCoachLocalPath(null);
        return;
      }
      const learnerUrl = submission.publicUrl ?? "";
      const coachUrl = submission.session?.lesson?.videos?.[0]?.publicUrl ?? "";
      const [learnerPath, coachPath] = await Promise.all([
        ensureLocalFile(learnerUrl, `learner-${submission.id}.mp4`),
        ensureLocalFile(
          coachUrl,
          `coach-${submission.session?.id ?? "video"}.mp4`
        ),
      ]);
      if (!cancelled) {
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

  const learnerName =
    submission?.user?.fullName ??
    (submission?.user?.id ? `Learner #${submission.user.id}` : "Học viên");

  const buildTimestamps = (duration?: number | null) => {
    if (duration && duration > 0) {
      return [0.25, 0.5, 0.75].map((ratio) =>
        Number((duration * ratio).toFixed(2))
      );
    }
    return [1, 2, 3];
  };

  const extractFrames = useCallback(
    async (uri: string, timestamps: number[]) => {
      const frames: string[] = [];
      const used: number[] = [];

      // Helper function to convert image URI to base64
      const imageToBase64 = async (imageUri: string): Promise<string> => {
        try {
          const fs = FileSystem as any;
          const fsLegacy = FileSystemLegacy as any;
          
          // For file:// URIs, use FileSystemLegacy.readAsStringAsync (legacy API)
          if (imageUri.startsWith('file://') || imageUri.startsWith('/')) {
            if (fsLegacy.readAsStringAsync) {
              return await fsLegacy.readAsStringAsync(imageUri, {
                encoding: fsLegacy.EncodingType?.Base64 || 'base64',
              });
            }
            throw new Error("FileSystem.readAsStringAsync không khả dụng.");
          }
          
          // For http/https URIs, fetch and convert using React Native compatible method
          // Use expo-file-system's downloadAsync to cache, then read
          const response = await fetch(imageUri);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }
          
          // Download to temp file and read as base64
          if (fs.cacheDirectory && FileSystem.downloadAsync && fsLegacy.readAsStringAsync) {
            const tempUri = `${fs.cacheDirectory}temp_${Date.now()}.jpg`;
            const { uri } = await FileSystem.downloadAsync(imageUri, tempUri);
            const base64 = await fsLegacy.readAsStringAsync(uri, {
              encoding: fsLegacy.EncodingType?.Base64 || 'base64',
            });
            // Clean up temp file
            if (FileSystem.deleteAsync) {
              FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
            }
            return base64;
          }
          
          // Last resort: return error
          throw new Error("Không thể chuyển đổi image sang base64. FileSystem không đầy đủ.");
        } catch (err) {
          console.error("Error converting image to base64:", err);
          throw err;
        }
      };

      for (const seconds of timestamps) {
        try {
          const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(
            uri,
            {
              time: Math.max(seconds * 1000, 0),
              quality: 0.8,
            }
          );
          const base64 = await imageToBase64(thumbnailUri);
          frames.push(base64);
          used.push(Number(seconds.toFixed(2)));
        } catch (err) {
          console.warn("Failed to capture frame at", seconds, err);
        }
      }

      if (!frames.length) {
        throw new Error("Không trích xuất được frame từ video.");
      }

      return { frames, timestamps: used };
    },
    []
  );

  const extractKeyFrames = useCallback(
    async (uri: string, duration?: number | null) => {
      try {
        const primary = await extractFrames(uri, buildTimestamps(duration));
        if (primary.frames.length >= 3) return primary;
      } catch (err) {
        console.warn("Primary frame extraction failed, trying fallback", err);
      }

      try {
        return await extractFrames(uri, [1, 1.5, 2]);
      } catch (err) {
        console.warn(
          "Fallback frame extraction failed, trying early timestamps",
          err
        );
        // Last resort: try very early timestamps
        return await extractFrames(uri, [0.5, 1, 1.5]);
      }
    },
    [extractFrames]
  );

  const handleAnalyzeTechnique = useCallback(async () => {
    if (!coachLocalPath || !learnerLocalPath) return;
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const [coachData, learnerData] = await Promise.all([
        extractKeyFrames(
          coachLocalPath,
          submission?.session?.lesson?.videos?.[0]?.duration
        ),
        extractKeyFrames(learnerLocalPath, submission?.duration),
      ]);

      const result = await geminiService.compareVideos(
        coachData.frames,
        coachData.timestamps,
        learnerData.frames,
        learnerData.timestamps
      );
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đã xảy ra lỗi không xác định khi so sánh kỹ thuật.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    coachLocalPath,
    learnerLocalPath,
    extractKeyFrames,
    submission?.duration,
    submission?.session?.lesson?.videos,
  ]);

  const canAnalyze = Boolean(
    coachLocalPath && learnerLocalPath && !isAnalyzing
  );

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
              <VideoView
                style={styles.videoPlayer}
                allowsFullscreen
                allowsPictureInPicture
                player={coachPlayer}
              />
            ) : (
              <Text style={styles.emptyText}>Chưa có video mẫu</Text>
            )}
          </View>
          <View style={styles.videoCard}>
            <Text style={styles.cardTitle}>Video học viên</Text>
            {learnerSource ? (
              <VideoView
                style={styles.videoPlayer}
                allowsFullscreen
                allowsPictureInPicture
                player={learnerPlayer}
              />
            ) : (
              <Text style={styles.emptyText}>Video đang được xử lý</Text>
            )}
          </View>

          <View style={styles.actionCard}>
            <TouchableOpacity
              style={[
                styles.analyzeButton,
                !canAnalyze && styles.analyzeButtonDisabled,
              ]}
              onPress={handleAnalyzeTechnique}
              disabled={!canAnalyze}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  <Text style={styles.analyzeText}>Chấm bài bằng AI</Text>
                </>
              )}
            </TouchableOpacity>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {analysisResult ? (
              <View style={styles.analysisCard}>
                <Text style={styles.cardTitle}>Kết quả phân tích</Text>
                <Text style={styles.analysisText}>
                  {JSON.stringify(analysisResult, null, 2)}
                </Text>
              </View>
            ) : null}
          </View>
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
  videoPlayer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
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
    fontSize: 12,
    fontFamily: "monospace",
    color: "#374151",
  },
});

export default SubmissionReviewScreen;
