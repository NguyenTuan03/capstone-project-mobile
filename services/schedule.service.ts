import {
  ChangeScheduleDto,
  Schedule,
  SessionNewScheduleDto,
} from "@/types/schedule";
import jwtAxios from "./jwt-auth";

class ScheduleService {
  async getScheduleByCourse(courseId: number): Promise<Schedule[]> {
    // Assuming the endpoint is /schedules/courses/:courseId based on standard REST patterns
    // and the user's description. The user provided @Get('courses/:courseId') inside a controller
    // that likely has a prefix 'schedules'.
    const response = await jwtAxios.get(`/schedules/courses/${courseId}`);
    return response.data;
  }

  async changeSchedule(data: ChangeScheduleDto): Promise<void> {
    await jwtAxios.put("/schedules/change", data);
  }

  async changeSessionSchedule(
    sessionId: number,
    data: SessionNewScheduleDto
  ): Promise<void> {
    await jwtAxios.put(`/schedules/sessions/${sessionId}/new-schedule`, data);
  }
}

export default new ScheduleService();
