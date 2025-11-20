import type { Lesson, Session } from "./session";
import { User } from "./user";

export interface VideoType {
  id: number;
  title: string;
  description?: string;
  duration: number;
  drillName: string;
  drillDescription?: string;
  drillPracticeSets?: string;
  publicUrl?: string;
  thumbnailUrl?: string;
  status: CoachVideoStatus;
  uploadedBy: User;
  lesson: Lesson;
  session: Session;
}

export enum CoachVideoStatus {
  UPLOADING = "UPLOADING",
  READY = "READY",
  ERROR = "ERROR",
  ANALYZING = "ANALYZING",
}

export type LearnerVideo = {
  id: number;
  duration: number | null;
  publicUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
  createdAt: string;
  user: User;
  session: Session;
  overlayVideoUrl: string | null;
};
