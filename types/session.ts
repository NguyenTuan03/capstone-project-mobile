import { AttendanceType } from "./attendance";
import { QuizType } from "./quiz";
import { VideoType } from "./video";

export interface Session {
  id: number;
  name?: string;
  description?: string;
  sessionNumber: number;
  scheduleDate: Date;
  startTime: string;
  endTime: string;
  durationInMinutes?: number;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  course: Course;
  lesson?: Lesson;
}

export interface Course {
  id: number;
  name?: string;
}

export interface Lesson {
  id: number;
  title?: string;
}

export enum SessionStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface GetSessionForWeeklyCalendarRequestDto {
  startDate: string;
  endDate: string;
}

export interface CalendarSession {
  id: number;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  courseName: string;
  courseId: number;
  scheduleDate: string;
  course?: any; // Full course object with address, enrollments, etc.
  quizzes: QuizType[];
  videos: VideoType[];
  attendances?: AttendanceType[];
}
