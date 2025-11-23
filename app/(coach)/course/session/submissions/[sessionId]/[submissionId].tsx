import { formatAnalysisResult } from "@/helper/FormatAnalysisResult";
import * as geminiService from "@/services/ai/geminiService";
import { get, post } from "@/services/http/httpService";
import type { AiVideoCompareResult, VideoComparisonResult } from "@/types/ai";
import type { Session } from "@/types/session";
import type { LearnerVideo } from "@/types/video";
import { extractSessionPayload, extractVideosFromPayload } from "@/utils/SessionFormat";
import { Ionicons } from "@expo/vector-icons";
import { useEvent } from "expo";
import * as FileSystem from "expo-file-system";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// Helper function to translate comparison type to Vietnamese
const translateComparisonType = (type: string): string => {
  const typeMap: Record<string, string> = {
    preparation: "Chuẩn bị",
    PREPARATION: "Chuẩn bị",
    swingAndContact: "Vung vợt & Tiếp xúc",
    SWING_AND_CONTACT: "Vung vợt & Tiếp xúc",
    "swing and contact": "Vung vợt & Tiếp xúc",
    followThrough: "Kết thúc theo đà",
    FOLLOW_THROUGH: "Kết thúc theo đà",
    "follow through": "Kết thúc theo đà",
  };
  return typeMap[type] || type;
};

// Helper function to map timestamp from comparison object to details array
const mapTimestampsToDetails = (
  result: AiVideoCompareResult & { comparison?: any }
): AiVideoCompareResult => {
  // If no comparison object or no details, return as is
  if (!result.comparison || !result.details || !Array.isArray(result.details)) {
    console.log("⚠️ Cannot map timestamps - missing comparison or details:", {
      hasComparison: !!result.comparison,
      hasDetails: !!result.details,
      detailsIsArray: Array.isArray(result.details),
    });
    return result;
  }

  // Map timestamps from comparison to details
  const updatedDetails = result.details.map((detail: any) => {
    const type = (detail.type || "").toLowerCase().replace(/_/g, "").replace(/\s+/g, "");
    let coachTimestamp: number | undefined;
    let learnerTimestamp: number | undefined;

    // Extract timestamps from comparison object based on type
    // Match various type formats: "preparation", "PREPARATION", "swingAndContact", "SWING_AND_CONTACT", etc.
    if (type === "preparation") {
      coachTimestamp = result.comparison.preparation?.player1?.timestamp;
      learnerTimestamp = result.comparison.preparation?.player2?.timestamp;
    } else if (type === "swingandcontact" || type === "swingandcontact") {
      coachTimestamp = result.comparison.swingAndContact?.player1?.timestamp;
      learnerTimestamp = result.comparison.swingAndContact?.player2?.timestamp;
    } else if (type === "followthrough") {
      coachTimestamp = result.comparison.followThrough?.player1?.timestamp;
      learnerTimestamp = result.comparison.followThrough?.player2?.timestamp;
    }

    // Convert to number if needed
    const ensureNumber = (val: any): number | undefined => {
      if (val === null || val === undefined) return undefined;
      const num = typeof val === "number" ? val : parseFloat(val);
      return isNaN(num) ? undefined : num;
    };

    const mappedTimestamp = {
      coachTimestamp: ensureNumber(coachTimestamp),
      learnerTimestamp: ensureNumber(learnerTimestamp),
    };

    // Log if timestamp was found
    if (coachTimestamp !== undefined || learnerTimestamp !== undefined) {
      console.log(`✅ Mapped timestamps for type "${detail.type}":`, mappedTimestamp);
    } else {
      console.log(`⚠️ No timestamps found for type "${detail.type}" (normalized: "${type}")`);
    }

    return {
      ...detail,
      ...mappedTimestamp,
    };
  });

  return {
    ...result,
    details: updatedDetails,
  };
};

// Helper function to calculate valid timestamps based on video duration
const calculateTimestamps = (duration: number, count: number = 3): number[] => {
  if (!duration || duration <= 0) {
    duration = 10;
  }
  
  // Calculate timestamps at 25%, 50%, 75% of video
  const percentages = [0.25, 0.5, 0.75];
  const timestamps = percentages.map(p => duration * p);
  
  // Validate and clamp timestamps to not exceed duration
  const validTimestamps = timestamps
    .map((t: number) => Math.min(t, duration - 0.1)) // Ensure timestamps are less than duration
    .filter((t: number) => t > 0) // Remove invalid timestamps
    .map((t: number) => parseFloat(t.toFixed(2))); // Round to 2 decimal places
  
  // If we have less than 3 valid timestamps, use fewer points
  if (validTimestamps.length === 0) {
    // Fallback: use single timestamp at 50% if duration is very short
    return [Math.max(0.1, Math.min(duration / 2, duration - 0.1))];
  }
  
  return validTimestamps;
};

const SubmissionReviewScreen: React.FC = () => {
  const router = useRouter();
  const { sessionId, submissionId, sessionData } = useLocalSearchParams<{
    sessionId?: string;
    submissionId?: string;
    sessionData?: string;
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
  const scrollViewRef = useRef<ScrollView>(null);

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
      const { uri } = await FileSystem.downloadAsync(url, filePath);
      return uri;
    } catch (e) {
      console.warn("⚠️ Failed to cache video, using URL directly:", e);
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
        let enhancedSubmission = found ?? null;
        
        if (found && sessionId) {
          let sessionDataToUse: Session | null = null;
          
          // If session data is passed via params (from assignment tab or session detail), use it directly
          if (sessionData && typeof sessionData === "string") {
            try {
              const parsedSession = JSON.parse(sessionData);
              
              const normalized = extractSessionPayload(parsedSession);
              if (normalized) {
                const fallbackVideos = extractVideosFromPayload(parsedSession);
                
                const videos = normalized.videos?.length
                  ? normalized.videos
                  : fallbackVideos.length
                  ? fallbackVideos
                  : normalized.videos;
                
                sessionDataToUse = {
                  ...normalized,
                  videos,
                } as Session;
                
                // If no videos from params, fetch from API to get videos
                if (!sessionDataToUse.videos || sessionDataToUse.videos.length === 0) {
                  sessionDataToUse = null; // Reset to fetch from API
                }
              }
            } catch (e) {
              console.warn("Failed to parse session data from params:", e);
            }
          }
          
          // If no session data from params or no videos, fetch from API
          if (!sessionDataToUse) {
            try {
              const sessionRes = await get<Session>(`/v1/sessions/${sessionId}`);
              const normalized = extractSessionPayload(sessionRes.data);
              if (normalized) {
                const fallbackVideos = extractVideosFromPayload(sessionRes.data);
                sessionDataToUse = {
                  ...normalized,
                  videos: normalized.videos?.length
                    ? normalized.videos
                    : fallbackVideos.length
                    ? fallbackVideos
                    : normalized.videos,
                } as Session;
              }
            } catch (err) {
              console.warn(
                "Không thể tải session chi tiết cho coach video:",
                err
              );
            }
          }
          
          if (sessionDataToUse) {
            enhancedSubmission = {
              ...found,
              session: {
                ...sessionDataToUse,
                lesson: sessionDataToUse.lesson ?? found.session?.lesson,
              },
            } as LearnerVideo;
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
  }, [sessionId, submissionId, sessionData]);

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
          const result = results[0] as AiVideoCompareResult & { comparison?: any };
          console.log("📊 Raw compare result from API:", {
            hasComparison: !!result.comparison,
            comparisonKeys: result.comparison ? Object.keys(result.comparison) : [],
            detailsCount: result.details?.length || 0,
            firstDetail: result.details?.[0],
            fullComparison: result.comparison,
          });
          // Map timestamps from comparison object to details array
          const resultWithTimestamps = mapTimestampsToDetails(result);
          console.log("📊 Mapped compare result with timestamps:", {
            detailsCount: resultWithTimestamps.details?.length || 0,
            firstDetail: resultWithTimestamps.details?.[0],
            hasCoachTimestamp: !!(resultWithTimestamps.details?.[0] as any)?.coachTimestamp,
            hasLearnerTimestamp: !!(resultWithTimestamps.details?.[0] as any)?.learnerTimestamp,
          });
          setCompareResult(resultWithTimestamps);
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

  // Function to play both videos at specific timestamps
  const playAtTimestamp = useCallback((coachTimestamp: number, learnerTimestamp: number) => {
    // Scroll to top first
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    
    // Small delay to ensure scroll completes before playing
    setTimeout(() => {
      if (coachPlayer && coachSource) {
        coachPlayer.currentTime = coachTimestamp;
        coachPlayer.play();
      }
      if (learnerPlayer && learnerSource) {
        learnerPlayer.currentTime = learnerTimestamp;
        learnerPlayer.play();
      }
    }, 300);
  }, [coachPlayer, learnerPlayer, coachSource, learnerSource]);

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
      // Get duration from multiple sources, prioritize video player duration
      let coachDuration = 0;
      let learnerDuration = 0;
      
      // Try to get duration from video player (most accurate)
      if (coachPlayer?.duration) {
        coachDuration = coachPlayer.duration;
      } else if (submission?.session?.videos?.[0]?.duration) {
        // Duration from API (might be in minutes, convert to seconds)
        const apiDuration = submission.session.videos[0].duration;
        coachDuration = typeof apiDuration === 'number' ? apiDuration : parseFloat(apiDuration) || 0;
        // If duration seems too large (> 100), assume it's in seconds, otherwise might be minutes
        if (coachDuration < 100 && coachDuration > 0) {
          coachDuration = coachDuration * 60; // Convert minutes to seconds
        }
      } else if (submission?.session?.lesson?.videos?.[0]?.duration) {
        const apiDuration = submission.session.lesson.videos[0].duration;
        coachDuration = typeof apiDuration === 'number' ? apiDuration : parseFloat(apiDuration) || 0;
        if (coachDuration < 100 && coachDuration > 0) {
          coachDuration = coachDuration * 60;
        }
      }
      
      // Get learner video duration
      if (learnerPlayer?.duration) {
        learnerDuration = learnerPlayer.duration;
      } else if (submission?.duration != null) {
        // submission.duration is usually in seconds
        if (typeof submission.duration === 'number') {
          learnerDuration = submission.duration;
        } else {
          learnerDuration = parseFloat(String(submission.duration)) || 0;
        }
      }
      // Calculate valid timestamps
      const coachTimestamps = calculateTimestamps(coachDuration);
      const learnerTimestamps = calculateTimestamps(learnerDuration);
      
      // Validate timestamps before sending
      if (coachTimestamps.length === 0 || learnerTimestamps.length === 0) {
        throw new Error("Không thể tính toán timestamps hợp lệ từ video. Vui lòng kiểm tra độ dài video.");
      }
      
      // Check if any timestamp exceeds duration
      const invalidCoachTimestamps = coachTimestamps.filter(t => t >= coachDuration);
      const invalidLearnerTimestamps = learnerTimestamps.filter(t => t >= learnerDuration);
      
      if (invalidCoachTimestamps.length > 0 || invalidLearnerTimestamps.length > 0) {
        // Filter out invalid timestamps
        const validCoachTimestamps = coachTimestamps.filter(t => t < coachDuration);
        const validLearnerTimestamps = learnerTimestamps.filter(t => t < learnerDuration);
        
        if (validCoachTimestamps.length === 0 || validLearnerTimestamps.length === 0) {
          throw new Error("Không có timestamps hợp lệ sau khi validate. Video có thể quá ngắn.");
        }
        
        // Use filtered timestamps
        const fullResult = await geminiService.compareVideosWithBackend(
          coachLocalPath,
          learnerLocalPath,
          validCoachTimestamps,
          validLearnerTimestamps
        );
        setAnalysisResult(fullResult);
      } else {
        // All timestamps are valid, proceed normally
        const fullResult = await geminiService.compareVideosWithBackend(
          coachLocalPath,
          learnerLocalPath,
          coachTimestamps,
          learnerTimestamps
        );
        setAnalysisResult(fullResult);
      }
  
    } catch (err) {
      console.error("Analysis failed:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đã xảy ra lỗi không xác định.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [coachLocalPath, learnerLocalPath, submission, coachPlayer, learnerPlayer]);
    
  
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

    // Map comparison data to details format
    const details = analysisResult.comparison
      ? [
          {
            type: "preparation",
            advanced: analysisResult.comparison.preparation.player2.analysis,
            userRole: "learner",
            strengths: analysisResult.comparison.preparation.player2.strengths,
            weaknesses: analysisResult.comparison.preparation.player2.weaknesses,
            coachTimestamp: analysisResult.comparison.preparation.player1.timestamp,
            learnerTimestamp: analysisResult.comparison.preparation.player2.timestamp,
          },
          {
            type: "swingAndContact",
            advanced: analysisResult.comparison.swingAndContact.player2.analysis,
            userRole: "learner",
            strengths: analysisResult.comparison.swingAndContact.player2.strengths,
            weaknesses: analysisResult.comparison.swingAndContact.player2.weaknesses,
            coachTimestamp: analysisResult.comparison.swingAndContact.player1.timestamp,
            learnerTimestamp: analysisResult.comparison.swingAndContact.player2.timestamp,
          },
          {
            type: "followThrough",
            advanced: analysisResult.comparison.followThrough.player2.analysis,
            userRole: "learner",
            strengths: analysisResult.comparison.followThrough.player2.strengths,
            weaknesses: analysisResult.comparison.followThrough.player2.weaknesses,
            coachTimestamp: analysisResult.comparison.followThrough.player1.timestamp,
            learnerTimestamp: analysisResult.comparison.followThrough.player2.timestamp,
          },
        ]
      : null;

    return {
      id: -1,
      summary: analysisResult.summary,
      learnerScore: analysisResult.overallScoreForPlayer2,
      keyDifferents,
      details,
      recommendationDrills,
      coachNote: null,
      createdAt: new Date().toISOString(),
      video: null,
      learnerVideo: submission,
    };
  }, [analysisResult, submission]);

  const displayResult = derivedCompareResult ?? compareResult;
  
  // Check if result already exists in database (from API)
  const hasSavedResult = compareResult !== null;
  
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
        
        // Map comparison với timestamp - đảm bảo timestamp luôn là number
        if (analysisResult.comparison) {
          const ensureTimestamp = (ts: any): number | undefined => {
            if (ts === null || ts === undefined) return undefined;
            const num = typeof ts === 'number' ? ts : parseFloat(ts);
            return isNaN(num) ? undefined : num;
          };

          payload.comparison = {
            preparation: {
              player1: {
                analysis: analysisResult.comparison.preparation?.player1?.analysis,
                timestamp: ensureTimestamp(analysisResult.comparison.preparation?.player1?.timestamp),
              },
              player2: {
                analysis: analysisResult.comparison.preparation?.player2?.analysis,
                strengths: analysisResult.comparison.preparation?.player2?.strengths,
                weaknesses: analysisResult.comparison.preparation?.player2?.weaknesses,
                timestamp: ensureTimestamp(analysisResult.comparison.preparation?.player2?.timestamp),
              },
              advantage: analysisResult.comparison.preparation?.advantage,
            },
            swingAndContact: {
              player1: {
                analysis: analysisResult.comparison.swingAndContact?.player1?.analysis,
                timestamp: ensureTimestamp(analysisResult.comparison.swingAndContact?.player1?.timestamp),
              },
              player2: {
                analysis: analysisResult.comparison.swingAndContact?.player2?.analysis,
                strengths: analysisResult.comparison.swingAndContact?.player2?.strengths,
                weaknesses: analysisResult.comparison.swingAndContact?.player2?.weaknesses,
                timestamp: ensureTimestamp(analysisResult.comparison.swingAndContact?.player2?.timestamp),
              },
              advantage: analysisResult.comparison.swingAndContact?.advantage,
            },
            followThrough: {
              player1: {
                analysis: analysisResult.comparison.followThrough?.player1?.analysis,
                timestamp: ensureTimestamp(analysisResult.comparison.followThrough?.player1?.timestamp),
              },
              player2: {
                analysis: analysisResult.comparison.followThrough?.player2?.analysis,
                strengths: analysisResult.comparison.followThrough?.player2?.strengths,
                weaknesses: analysisResult.comparison.followThrough?.player2?.weaknesses,
                timestamp: ensureTimestamp(analysisResult.comparison.followThrough?.player2?.timestamp),
              },
              advantage: analysisResult.comparison.followThrough?.advantage,
            },
          };
        }

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

      // Thêm videoId nếu có (từ session.videos)
      if (submission?.session?.videos?.[0]?.id) {
        payload.videoId = submission.session.videos[0].id;
      }

      console.log("📤 Sending payload to save:", JSON.stringify(payload, null, 2));
      console.log("📤 Comparison timestamps:");
      if (payload.comparison) {
        console.log("  - preparation.player1.timestamp:", payload.comparison.preparation?.player1?.timestamp);
        console.log("  - preparation.player2.timestamp:", payload.comparison.preparation?.player2?.timestamp);
        console.log("  - swingAndContact.player1.timestamp:", payload.comparison.swingAndContact?.player1?.timestamp);
        console.log("  - swingAndContact.player2.timestamp:", payload.comparison.swingAndContact?.player2?.timestamp);
        console.log("  - followThrough.player1.timestamp:", payload.comparison.followThrough?.player1?.timestamp);
        console.log("  - followThrough.player2.timestamp:", payload.comparison.followThrough?.player2?.timestamp);
      }

      // Gọi API để lưu kết quả so sánh
      await post(
        `/v1/ai-video-compare-results/${submissionId}/save`,
        payload
      );

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
  }, [submissionId, analysisResult, feedback, sessionId, submission?.session?.videos]);

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
          ref={scrollViewRef}
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
              <Text style={styles.cardTitle}>Video mẫu của coach</Text>
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
                {/* Comparison sections with timestamps */}
                {displayResult.details && displayResult.details.length > 0 ? (
                  <View style={styles.compareResultSection}>
                    <Text style={styles.compareResultLabel}>
                      Phân tích chi tiết:
                    </Text>
                    {displayResult.details.map((detail, index) => {
                      const typeLabel = translateComparisonType(detail.type);
                      const coachTimestamp = (detail as any).coachTimestamp;
                      const learnerTimestamp = (detail as any).learnerTimestamp;

                      return (
                        <View key={index} style={styles.comparisonDetailItem}>
                          <View style={styles.comparisonDetailHeader}>
                            <Text style={styles.comparisonDetailType}>
                              {typeLabel}
                            </Text>
                            {coachTimestamp != null &&
                            learnerTimestamp != null ? (
                              <TouchableOpacity
                                style={styles.playTimestampButton}
                                onPress={() =>
                                  playAtTimestamp(
                                    coachTimestamp,
                                    learnerTimestamp
                                  )
                                }
                              >
                                <Ionicons
                                  name="play-circle"
                                  size={18}
                                  color="#059669"
                                />
                                <Text style={styles.playTimestampText}>
                                  Xem tại {learnerTimestamp.toFixed(1)}s
                                </Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>
                          {coachTimestamp != null &&
                          learnerTimestamp != null ? (
                            <View style={styles.timestampInfo}>
                              <Text style={styles.timestampText}>
                                Coach: {coachTimestamp.toFixed(2)}s | Học viên:{" "}
                                {learnerTimestamp.toFixed(2)}s
                              </Text>
                            </View>
                          ) : null}
                          <Text style={styles.comparisonDetailAnalysis}>
                            {detail.advanced}
                          </Text>
                          {detail.strengths && detail.strengths.length > 0 ? (
                            <View style={styles.strengthsWeaknessesContainer}>
                              <Text style={styles.strengthsLabel}>Điểm mạnh:</Text>
                              {detail.strengths.map((strength, idx) => (
                                <Text key={idx} style={styles.strengthItem}>
                                  • {strength}
                                </Text>
                              ))}
                            </View>
                          ) : null}
                          {detail.weaknesses &&
                          detail.weaknesses.length > 0 ? (
                            <View style={styles.strengthsWeaknessesContainer}>
                              <Text style={styles.weaknessesLabel}>
                                Điểm cần cải thiện:
                              </Text>
                              {detail.weaknesses.map((weakness, idx) => (
                                <Text key={idx} style={styles.weaknessItem}>
                                  • {weakness}
                                </Text>
                              ))}
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
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
                    {displayResult.recommendationDrills.map((drill, index) => (
                      <View key={index} style={styles.drillItem}>
                        <Text style={styles.drillName}>{drill.name}</Text>
                        <Text style={styles.drillDescription}>
                          {drill.description}
                        </Text>
                        <Text style={styles.drillPracticeSets}>
                          Số lần tập: {drill.practiceSets}
                        </Text>
                      </View>
                    ))}
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
            
            {/* Feedback section - only show if result exists but not saved yet */}
            {displayResult && !hasSavedResult && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackLabel}>Feedback cho học viên</Text>
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
            {/* Only show feedback section if no saved result exists */}
            {!hasSavedResult && (
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
            )}
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
  comparisonDetailItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  comparisonDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  comparisonDetailType: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  playTimestampButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#ECFDF5",
    borderRadius: 6,
  },
  playTimestampText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  timestampInfo: {
    marginBottom: 8,
  },
  timestampText: {
    fontSize: 11,
    color: "#6B7280",
    fontStyle: "italic",
  },
  comparisonDetailAnalysis: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
    marginBottom: 8,
  },
  strengthsWeaknessesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  strengthsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 4,
  },
  strengthItem: {
    fontSize: 12,
    color: "#374151",
    marginLeft: 8,
    marginBottom: 2,
  },
  weaknessesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
    marginBottom: 4,
  },
  weaknessItem: {
    fontSize: 12,
    color: "#374151",
    marginLeft: 8,
    marginBottom: 2,
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
