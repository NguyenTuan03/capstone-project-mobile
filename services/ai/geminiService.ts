import storageService from "@/services/storageService";
import { VideoComparisonResult } from "@/types/ai";

export const compareVideosWithBackend = async (
  coachVideoPath: string,
  learnerVideoPath: string,
  coachTimestamps: number[],
  learnerTimestamps: number[]
): Promise<VideoComparisonResult> => {
  try {
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
    
    // Get token for authorization
    const token = await storageService.getToken();
    if (!token) {
      throw new Error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
    }

    const formData = new FormData();

    // Add coach video
    const coachVideoFile = {
      uri: coachVideoPath,
      name: "coach.mp4",
      type: "video/mp4",
    } as any;
    formData.append("videos", coachVideoFile);

    // Add learner video
    const learnerVideoFile = {
      uri: learnerVideoPath,
      name: "learner.mp4",
      type: "video/mp4",
    } as any;
    formData.append("videos", learnerVideoFile);

    // Add timestamps
    const coachTimestampsStr = JSON.stringify(coachTimestamps);
    const learnerTimestampsStr = JSON.stringify(learnerTimestamps);
    formData.append("coachTimestamps", coachTimestampsStr);
    formData.append("learnerTimestamps", learnerTimestampsStr);

    const requestUrl = `${API_BASE_URL}/v1/ai-video-compare-results/compare-videos`;
    const requestHeaders = {
      Authorization: `Bearer ${token}`,
    };
    
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: requestHeaders,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    // Log detailed breakdown
    console.log("📊 Result breakdown:");
    console.log("  - summary:", result.summary);
    console.log("  - overallScoreForPlayer2:", result.overallScoreForPlayer2);
    console.log("  - keyDifferences:", JSON.stringify(result.keyDifferences, null, 2));
    console.log("  - recommendationsForPlayer2:", JSON.stringify(result.recommendationsForPlayer2, null, 2));
    console.log("  - comparison:", JSON.stringify(result.comparison, null, 2));
    console.log("  - coachPoses count:", result.coachPoses?.length || 0);
    console.log("  - learnerPoses count:", result.learnerPoses?.length || 0);
    
    // Log coachPoses details (first timestamp only to avoid too much output)
    if (result.coachPoses && result.coachPoses.length > 0) {
      console.log("  - coachPoses[0] (first timestamp):", JSON.stringify(result.coachPoses[0], null, 2));
    }
    
    // Log learnerPoses details (first timestamp only)
    if (result.learnerPoses && result.learnerPoses.length > 0) {
      console.log("  - learnerPoses[0] (first timestamp):", JSON.stringify(result.learnerPoses[0], null, 2));
    }
    
    return result;
  } catch (error: any) {
    console.error("Có một chút rắc rối từ AI, hãy thử lại nhé 🫶🏻");
    throw new Error(
      error.message || "Đã xảy ra lỗi không xác định."
    );
  }
};
