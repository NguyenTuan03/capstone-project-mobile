import { VideoConferenceResponseDto } from "../types/videoConference";
import http from "./http/interceptor";

class VideoConferenceService {
  async getVideoConferenceDetails(
    courseId: number
  ): Promise<VideoConferenceResponseDto> {
    try {
      const response = await http.get(
        `/v1/video-conferences/courses/${courseId}`
      );
      return response.data.metadata;
    } catch (error) {
      console.error("Error fetching video conference details:", error);
      throw error;
    }
  }
}

export default new VideoConferenceService();
