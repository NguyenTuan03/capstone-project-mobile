import { UserType } from "./auth";
import { Session } from "./session";

/**
 * Frontend type for Attendance (mirrors server-side Attendance entity)
 *
 * Note: the backend defines AttendanceStatus in a shared enum. If your backend
 * uses additional statuses, add them here to keep the client and server in sync.
 */
export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
}

export interface AttendanceType {
  id: number;
  status: AttendanceStatus;
  createdAt: Date;
  user: UserType;
  session: Session;
}

export interface CreateAttendanceDto {
  userId: string | number;
  sessionId: number;
  status?: AttendanceStatus;
}

export default AttendanceType;
