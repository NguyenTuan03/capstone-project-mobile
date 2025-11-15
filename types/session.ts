import type { AttendanceType } from "./attendance";
import { Course } from "./course";
import type { QuizType } from "./quiz";
import type { VideoType } from "./video";

export interface Session {
  id: number;
  name?: string | null;
  description?: string | null;
  sessionNumber: number;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  durationInMinutes?: number | null;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  course: Course;
  lesson?: Lesson | null;
  videos?: VideoType[];
  quizzes?: QuizType[];
}

export interface Lesson {
  id: number;
  name?: string | null;
  description?: string | null;
  lessonNumber?: number | null;
  duration?: number | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  videos?: VideoType[];
  quizzes?: QuizType[];
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
  course?: Course; // Full course object with address, enrollments, etc.
  quizzes: QuizType[];
  videos: VideoType[];
  attendances?: AttendanceType[];
}

export type Exercise =
  | {
      id: string;
      type: "video";
      title: string;
      subtitle?: string;
      hasSample: boolean;
      dueDate?: string;
      submittedCount: number;
      onSample?: () => void;
      onViewSubmissions?: () => void;
    }
  | {
      id: string;
      type: "quiz";
      title: string;
      subtitle?: string;
      hasSample: false;
      dueDate?: string;
      submittedCount: number;
      onStartQuiz?: () => void;
      onViewSubmissions?: () => void;
    };
