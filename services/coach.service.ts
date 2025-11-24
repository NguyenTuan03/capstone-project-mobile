import { MonthlyResponseDto } from "../types/coach";
import http from "./http/interceptor";

class CoachService {
  async getMonthlyRevenue(
    userId: number,
    month?: number,
    year?: number
  ): Promise<MonthlyResponseDto> {
    try {
      const params = new URLSearchParams();
      if (month !== undefined) params.append("month", month.toString());
      if (year !== undefined) params.append("year", year.toString());
      const queryString = params.toString();
      const url = `/v1/student-analysis/${userId}/revenue/monthly${
        queryString ? `?${queryString}` : ""
      }`;
      const response = await http.get(url);
      return response.data.metadata;
    } catch (error) {
      console.error("Error fetching monthly revenue:", error);
      throw error;
    }
  }
  async getMonthlyLearnerCount(
    userId: number,
    month?: number,
    year?: number
  ): Promise<MonthlyResponseDto> {
    try {
      const params = new URLSearchParams();
      if (month !== undefined) params.append("month", month.toString());
      if (year !== undefined) params.append("year", year.toString());
      const queryString = params.toString();
      const url = `/v1/student-analysis/${userId}/learners/monthly${
        queryString ? `?${queryString}` : ""
      }`;
      const response = await http.get(url);
      return response.data.metadata;
    } catch (error) {
      console.error("Error fetching monthly learner count:", error);
      throw error;
    }
  }

  async getMonthlyCourseCount(
    userId: number,
    month?: number,
    year?: number
  ): Promise<MonthlyResponseDto> {
    try {
      const params = new URLSearchParams();
      if (month !== undefined) params.append("month", month.toString());
      if (year !== undefined) params.append("year", year.toString());
      const queryString = params.toString();
      const url = `/v1/student-analysis/${userId}/courses/monthly${
        queryString ? `?${queryString}` : ""
      }`;
      const response = await http.get(url);
      return response.data.metadata;
    } catch (error) {
      console.error("Error fetching monthly course count:", error);
      throw error;
    }
  }

  async loadRating(
    userId: number
  ): Promise<{ overall: number; total: number } | null> {
    try {
      const response = await http.get(`/v1/coaches/${userId}/rating/overall`);
      return response.data.metadata;
    } catch (error) {
      console.error("Error loading rating:", error);
      return null;
    }
  }
}

export default new CoachService();
