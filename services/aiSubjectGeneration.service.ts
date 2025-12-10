import http from "@/services/http/interceptor";
import {
  AiSubjectGeneration,
  AiSubjectGenerationResponse,
  AiSubjectGenerationStatus,
  PaginatedAiGenerations,
} from "@/types/ai-subject-generation";

class AiSubjectGenerationService {
  /**
   * Create a new AI subject generation request
   */
  async create(prompt: string): Promise<AiSubjectGeneration> {
    try {
      const response = await http.post("/v1/ai-subject-generations", {
        prompt,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get paginated AI subject generations with filters
   * @param page - Page number
   * @param limit - Items per page
   * @param status - Filter by status (PENDING or USED)
   */
  async getAll(
    page: number = 1,
    limit: number = 10,
    status?: AiSubjectGenerationStatus
  ): Promise<PaginatedAiGenerations> {
    try {
      const params: any = { page, limit };
      if (status) {
        params.filter = `status_eq_${status}`;
      }

      const response = await http.get("/v1/ai-subject-generations", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update the generated data (subject, lessons, quizzes, videos)
   * @param id - Generation ID
   * @param generatedData - Updated subject/lesson/quiz/video data
   */
  async update(
    id: number,
    generatedData: AiSubjectGenerationResponse
  ): Promise<AiSubjectGeneration> {
    try {
      const response = await http.put(`/v1/ai-subject-generations/${id}`, {
        name: generatedData.name,
        description: generatedData.description,
        level: generatedData.level,
        lessons: generatedData.lessons,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete an AI subject generation
   * @param id - Generation ID
   */
  async delete(id: number): Promise<void> {
    try {
      await http.delete(`/v1/ai-subject-generations/${id}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a single AI subject generation by ID
   * @param id - Generation ID
   */
  async getById(id: number): Promise<AiSubjectGeneration> {
    try {
      const response = await http.get(`/v1/ai-subject-generations/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new AiSubjectGenerationService();
