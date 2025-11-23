import { Court } from "./court";
import { Enrollment } from "./enrollments";
import { Session } from "./session";

export type LearningFormat = "GROUP" | "INDIVIDUAL";

export enum CourseStatus {
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  FULL = "FULL",
  READY_OPENED = "READY_OPENED",
  ON_GOING = "ON_GOING",
}

export type Schedule = {
  id?: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  totalSessions?: number;
};
export type Course = {
  id: number;
  name: string;
  description: string;
  level: string;
  learningFormat: "GROUP" | "INDIVIDUAL";
  status: CourseStatus;
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
  publicUrl?: string | null;
  createdBy: {
    id: number;
    fullName: string;
    email: string;
  };
  enrollments: Enrollment[];
  sessions?: Session[];
};

export type CourseResponse = {
  id: number;
  name: string;
  description: string;
  level: string;
  learningFormat: "GROUP" | "INDIVIDUAL";
  status: CourseStatus;
  minParticipants: number;
  maxParticipants: number;
  pricePerParticipant: string;
  currentParticipants: number;
  totalSessions: number;
  totalEarnings: string;
  startDate: string;
  endDate: string | null;
  address: string;
  subject: {
    id: number;
    name: string;
  };
  schedules: {
    id: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
  publicUrl?: string | null;
  province: {
    id: number;
    name: string;
  };
  district: {
    id: number;
    name: string;
  };
};

export type CoursesResponse = {
  items: Course[];
  page: number;
  pageSize: number;
  total: number;
};
