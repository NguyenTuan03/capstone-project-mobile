import http from "@/services/http/interceptor";
import { LearnerProgress } from "@/types/learner-progress";

class LearnerService {
  async getTotalCourses(): Promise<number> {
    try {
      const response = await http.get("/v1/learners/total-courses");
      return response.data || 0;
    } catch (error) {
       
      throw error;
    }
  }

  async getTotalAiFeedbacks(): Promise<number> {
    try {
      const response = await http.get("/v1/learners/total-ai-feedbacks");
      return response.data || 0;
    } catch (error) {
       
      throw error;
    }
  }

  async getLearnerProgresses(): Promise<LearnerProgress[]> {
    try {
      const response = await http.get("/v1/learners/current-progresses");
      return response.data || [];
    } catch (error) {
       
      throw error;
    }
  }
}

export default new LearnerService();
