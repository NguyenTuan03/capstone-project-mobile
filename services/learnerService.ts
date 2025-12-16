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

  async generateProgressAnalysis(progressId: number): Promise<void> {
    try {
      await http.post(`/v1/learner-progresses/${progressId}/ai-analysis`);
    } catch (error) {
       
      throw error;
    }
  }

  async getProgressAnalyses(progressId: number): Promise<any[]> {
    try {
      const response = await http.get(`/v1/learner-progresses/${progressId}/ai-analysis`);
      return response.data || [];
    } catch (error) {
       
      throw error;
    }
  }
}

export default new LearnerService();
