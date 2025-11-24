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
   * @param aiData - The AI analysis result data
   * @param coachNote - Coach's note (required)
   * @returns Promise with the response data
   */
  async submitAiFeedback(
    learnerVideoId: number,
    aiData: {
      summary: string;
      learnerScore: number;
      keyDifferents: Array<{
        aspect: string;
        learnerTechnique: string;
        impact: string;
      }>;
      details: Array<{
        type: string;
        advanced: string;
        strengths: string[];
        weaknesses: string[];
      }>;
      recommendationDrills: Array<{
        name: string;
        description: string;
        practiceSets: string;
      }>;
    },
    coachNote: string
  ) {
    try {
      console.log(learnerVideoId);
      const response = await http.post(
        `/v1/learner-videos/${learnerVideoId}/ai-feedback`,
        {
          ...aiData,
          coachNote,
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new LearnerVideoService();
