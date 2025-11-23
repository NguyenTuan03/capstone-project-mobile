import { VideoComparisonResult } from "@/types/ai";

export const compareVideosWithBackend = async (
  coachVideoPath: string,
  learnerVideoPath: string,
  coachTimestamps: number[],
  learnerTimestamps: number[]
): Promise<VideoComparisonResult> => {
  try {
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
    console.log("📤 Uploading videos to backend for processing...");

    const formData = new FormData();

    // Add coach video
    formData.append("videos", {
      uri: coachVideoPath,
      name: "coach.mp4",
      type: "video/mp4",
    } as any);

    // Add learner video
    formData.append("videos", {
      uri: learnerVideoPath,
      name: "learner.mp4",
      type: "video/mp4",
    } as any);

    // Add timestamps
    formData.append("coachTimestamps", JSON.stringify(coachTimestamps));
    formData.append("learnerTimestamps", JSON.stringify(learnerTimestamps));

    const response = await fetch(
      `${API_BASE_URL}/ai-video-compare-results/compare-videos`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Received comparison result from backend");

    return result;
  } catch (error) {
    console.error("Backend API call failed:", error);
    throw new Error(
      "Không thể kết nối với máy chủ AI. Vui lòng đảm bảo backend đang chạy."
    );
  }
};
