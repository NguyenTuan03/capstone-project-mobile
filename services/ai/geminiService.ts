import { AiVideoCompareResult, VideoComparisonResult } from "@/types/ai";
import http from "../http/interceptor";

export const compareVideosWithBackend = async (
  coachVideoUrl: string,
  learnerVideoUrl: string
): Promise<VideoComparisonResult> => {
  try {
    const response = await http.post(
      "/v1/ai-video-compare-results/compare-videos",
      {
        coachVideoUrl,
        learnerVideoUrl,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Có một chút rắc rối từ AI, hãy thử lại nhé 🫶🏻");
    throw new Error(error.message || "Đã xảy ra lỗi không xác định.");
  }
};

export const getAiVideoComparisonResultsByUser = async (
  userId: number
): Promise<AiVideoCompareResult[]> => {
  try {
    const response = await http.get(
      `/v1/ai-video-compare-results/users/${userId}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching AI comparison results:", error);
    throw new Error(error.message || "Failed to fetch AI comparison results.");
  }
};
