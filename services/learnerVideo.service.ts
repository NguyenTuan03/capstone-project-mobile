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
}

export default new LearnerVideoService();
