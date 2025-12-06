import http from "./http/interceptor";

class AttendanceService {
  async getLearnerAttendance(sessionId: number, learnerId: number) {
    try {
      console.error("Attendance Service - API Request:", {
        url: `/v1/attendances/sessions/${sessionId}/learners/${learnerId}`,
        method: "GET",
      });

      const response = await http.get(
        `/v1/attendances/sessions/${sessionId}/learners/${learnerId}`
      );

      

      // return the full API response so callers can inspect statusCode/message/metadata
      return response.data;
    } catch (error) {
       
      throw error;
    }
  }
}

export default new AttendanceService();
