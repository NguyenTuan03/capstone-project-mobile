import { Court } from "./court";
import { Enrollment } from "./enrollments";

export type LearningFormat = "GROUP" | "INDIVIDUAL";

export type Schedule = {
  id?: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  totalSessions?: number;
  course?: Course;
};
export type Course = {
  id: number;
  name: string;
  description: string;
  level: string;
  learningFormat: "GROUP" | "INDIVIDUAL";
  status: string;
  minParticipants: number;
  maxParticipants: number;
  pricePerParticipant: string;
  currentParticipants: number;
  totalSessions: number;
  totalEarnings: string;
  startDate: string;
  endDate: string | null;
  progressPct: number;
  address: string;
  subject: {
    id: number;
    name: string;
    description: string;
  };
  schedules: Schedule[];
  court: Court;
  createdBy: {
    id: number;
    fullName: string;
    email: string;
  };
  enrollments: Enrollment[];
};
