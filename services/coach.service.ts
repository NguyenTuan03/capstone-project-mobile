import { MonthlyResponseDto } from "../types/coach";
import http from "./http/interceptor";

class CoachService {
  async getMonthlyRevenue(
    userId: number,
    month: number,
    year: number
  ): Promise<MonthlyResponseDto> {
    try {
      const response = await http.get(
        `/v1/student-analysis/${userId}/revenue/monthly?month=${month}&year=${year}`
      );
      return response.data.metadata;
    } catch (error) {
      console.error("Error fetching monthly revenue:", error);
      throw error;
    }
  }
  async getMonthlyLearnerCount(
    userId: number,
    month: number,
    year: number
  ): Promise<MonthlyResponseDto> {
    try {
      const response = await http.get(
        `/v1/student-analysis/${userId}/learners/monthly?month=${month}&year=${year}`
      );
      return response.data.metadata;
    } catch (error) {
      console.error("Error fetching monthly learner count:", error);
      throw error;
    }
  }
}

export default new CoachService();
