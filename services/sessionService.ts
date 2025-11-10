import {
  CalendarSession,
  GetSessionForWeeklyCalendarRequestDto,
} from "../types/session";
import http from "./http/interceptor";

class SessionService {
  async getSessionsForWeeklyCalendar(
    request: GetSessionForWeeklyCalendarRequestDto
  ): Promise<CalendarSession[]> {
    try {
      console.log("Session Service - API Request:", {
        url: `/v1/sessions/calendar/weekly?startDate=${request.startDate}&endDate=${request.endDate}`,
        method: "GET",
      });

      const response = await http.get(
        `/v1/sessions/calendar/weekly?startDate=${request.startDate}&endDate=${request.endDate}`
      );

      console.log("Session Service - API Response:", response.data);

      // Transform the response data to match CalendarSession interface
      const sessions = response.data.metadata || [];
      console.log("Sessions found:", sessions.length);

      if (sessions.length > 0) {
        console.log("Raw session data:", sessions[0]); // Log first session for debugging

        sessions.forEach((session: any) => {
          console.log(`🔍 Raw session ${session.id}:`, {
            name: session.name,
            scheduleDate: session.scheduleDate,
            startTime: session.startTime,
            endTime: session.endTime,
            courseName: session.course?.name,
            courseId: session.course?.id,
            courseEnrollments: session.course?.enrollments?.length || 0,
            courseAddress: session.course?.address,
          });
        });
      }

      return sessions.map((session: any) => {
        const transformedSession = {
          id: session.id,
          name: session.name || `Buổi ${session.sessionNumber}`,
          description: session.description,
          startTime: session.startTime ? session.startTime.substring(0, 5) : "", // Extract HH:mm from HH:mm:ss
          endTime: session.endTime ? session.endTime.substring(0, 5) : "", // Extract HH:mm from HH:mm:ss
          status: session.status,
          courseName: session.course?.name || "Khóa học không xác định",
          courseId: session.course?.id,
          scheduleDate: session.scheduleDate,
          course: session.course, // Keep full course object for future use
          quizzes: session.quizzes || [],
          videos: session.videos || [],
        };

        console.log(
          `✅ Transformed session ${session.id}:`,
          transformedSession
        );

        return transformedSession;
      });
    } catch (error) {
      console.error("Error fetching weekly sessions:", error);
      throw error;
    }
  }

  async getSessionById(sessionId: number) {
    try {
      const response = await http.get(`/v1/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching session by ID:", error);
      throw error;
    }
  }

  async updateSessionStatus(sessionId: number, status: string) {
    try {
      const response = await http.patch(`/v1/sessions/${sessionId}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating session status:", error);
      throw error;
    }
  }

  async completeAndCheckAttendance(
    sessionId: number,
    attendances: { userId: number; status: string }[]
  ) {
    try {
      if (!Array.isArray(attendances)) {
        throw new Error("attendances must be an array");
      }

      console.log("Session Service - Complete & Check Attendance Request:", {
        url: `/v1/sessions/${sessionId}/complete`,
        method: "POST",
        body: { attendances },
      });

      const response = await http.patch(`/v1/sessions/${sessionId}/complete`, {
        attendances,
      });

      console.log(
        "Session Service - Complete & Check Attendance Response:",
        response.data
      );

      return response.data;
    } catch (error) {
      console.error("Error completing session and checking attendance:", error);
      throw error;
    }
  }
}

export default new SessionService();
