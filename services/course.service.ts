import http from "@/services/http/interceptor";
import { Course } from "@/types/course";

class CourseService {
  async getCourseById(courseId: number): Promise<Course> {
    try {
      const response = await http.get(`/v1/courses/${courseId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching course by ID:", error);
      throw error;
    }
  }
}

export default new CourseService();
