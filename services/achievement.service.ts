import http from "@/services/http/interceptor";
import type { PaginatedEarnedAchievements } from "@/types/achievement";

class AchievementService {
  async getMyEarnedAchievements(
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedEarnedAchievements> {
    try {
      const response = await http.get("/v1/achievements/my-earned", {
        params: {
          page,
          pageSize,
        },
      });

      const data = response.data?.data;

      // If data is an array, it means the API returns a flat array
      // Calculate pagination info based on the array
      const items = Array.isArray(data) ? data : data?.items || [];
      const total = Array.isArray(data) ? data.length : data?.total || 0;

      return {
        items: items,
        page: page,
        pageSize: pageSize,
        total: total,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new AchievementService();
