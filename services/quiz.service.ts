import http from "./http/interceptor";

class QuizService {
  async getQuizAttempts(quizId: number) {
    try {
      const response = await http.get(`/v1/quizzes/${quizId}/attempts`);
      const attempts = response.data;
      return attempts;
    } catch (error) {
      throw error;
    }
  }
}

export default new QuizService();
