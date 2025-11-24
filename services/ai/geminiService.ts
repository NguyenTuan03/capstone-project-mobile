import { VideoComparisonResult } from "@/types/ai";
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
