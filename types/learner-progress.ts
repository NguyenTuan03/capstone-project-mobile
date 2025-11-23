import { Course } from "./course";
import { Session } from "./session";
import { User } from "./user";

export enum LearnerProgressStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  DROPPED = "DROPPED",
}

export interface LearnerProgress {
  id: number;
  sessionsCompleted: number;
  totalSessions: number;
  avgAiAnalysisScore: number;
  avgQuizScore: number;
  status: LearnerProgressStatus;
  createdAt: string;
  updatedAt: string;
  user: User;
  course: Course;
}

export interface LearnerProgressDetails extends LearnerProgress {
  user: User & {
    quizAttempts: any[];
  };
  course: Course & {
    sessions: Session[];
  };
}
