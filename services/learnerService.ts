import http from "@/services/http/interceptor";

interface LearnerProgress {
  id: number;
  sessionsCompleted: number;
  totalSessions: number;
  avgAiAnalysisScore: number;
  avgQuizScore: number;
  status: string;
  course: {
    id: number;
    name: string;
  };
}

class LearnerService {
  async getTotalCourses(): Promise<number> {
    try {
      const response = await http.get("/v1/learners/total-courses");
      console.log("Total courses response:", response);
      return response.data || 0;
    } catch (error) {
      console.error("Failed to fetch total courses:", error);
      throw error;
    }
  }

  async getTotalAiFeedbacks(): Promise<number> {
    try {
      const response = await http.get("/v1/learners/total-ai-feedbacks");
      return response.data || 0;
    } catch (error) {
      console.error("Failed to fetch total AI feedbacks:", error);
      throw error;
    }
  }

  async getLearnerProgresses(): Promise<LearnerProgress[]> {
    try {
      const response = await http.get("/v1/learners/current-progresses");
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch learner progresses:", error);
      throw error;
    }
  }
}

export default new LearnerService();
