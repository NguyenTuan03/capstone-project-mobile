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
  enrollmentId: number;
  sessionsCompleted: number;
  totalSessions: number;
  avgAiAnalysisScore: number;
  avgQuizScore: number;
  status: LearnerProgressStatus;
  createdAt: string;
  updatedAt: string;
  user: User;
  course: Course;
  aiLearnerProgressAnalyses?: AiLearnerProgressAnalysisResponse[];
  canGenerateAIAnalysis: boolean;
}

export interface LearnerProgressDetails extends LearnerProgress {
  user: User & {
    quizAttempts: any[];
  };
  course: Course & {
    sessions: Session[];
  };
}

export interface AiLearnerProgressAnalysisResponse {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  overallSummary: string;
  progressPercentage: number;
  strengthsIdentified: string[];
  areasForImprovement: string[];
  quizPerformanceAnalysis: {
    averageScore: number;
    summary: string;
    topicsMastered: string[];
    topicsNeedingReview: string[];
  };
  videoPerformanceAnalysis: {
    averageScore: number;
    summary: string;
    techniqueStrengths: string[];
    techniqueWeaknesses: string[];
  };
  recommendationsForNextSession: {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    focusAreas: string[];
  }[];
  practiceDrills: {
    name: string;
    description: string;
    targetArea: string;
    sets: string;
  }[];
  motivationalMessage: string;
}
