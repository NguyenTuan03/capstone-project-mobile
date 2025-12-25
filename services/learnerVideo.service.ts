import http from "./http/interceptor";

export class LearnerVideoService {
  /**
   * Get learner videos by user and coach video
   * @param userId - The ID of the user
   * @param coachVideoId - The ID of the coach video
   * @returns Promise with array of learner videos
   */
  async getLearnerVideosByUserAndCoachVideo(
    userId: number,
    coachVideoId: number
  ) {
    try {
      const response = await http.get(
        `/v1/learner-videos/user/${userId}/coach-video/${coachVideoId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit AI feedback with coach note
   * @param learnerVideoId - The ID of the learner video
   * @param videoId - The ID of the video (optional)
   * @param aiData - The AI analysis result data
   * @param coachNote - Coach's note (required)
   * @returns Promise with the response data
   */
  async submitAiFeedback(id: number, coachNote: string) {
    try {
      const response = await http.post(
        `/v1/ai-video-compare-results/${id}/save`,
        {
          coachNote,
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update AI feedback result
   * @param id - The ID of the comparison result
   * @param data - The data to update
   * @returns Promise with the response data
   */
  async updateAiFeedback(
    id: number,
    data: {
      summary?: string;
      overallScoreForPlayer2?: number;
      keyDifferents?: {
        aspect: string;
        learnerTechnique: string;
        impact: string;
      }[];
      details?: {
        type: string;
        advanced: string;
        strengths: string[];
        weaknesses: string[];
      }[];
      recommendationDrills?: {
        name: string;
        description: string;
        practiceSets: string;
      }[];
    }
  ) {
    try {
      const response = await http.put(
        `/v1/ai-video-compare-results/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new LearnerVideoService();
