import { UserType } from "./auth";
import { Lesson, Session } from "./session";

export interface VideoType {
  id: number;
  title: string;
  description?: string;
  tags?: string[];
  duration: number;
  drillName: string;
  drillDescription?: string;
  drillPracticeSets?: string;
  publicUrl?: string;
  thumbnailUrl?: string;
  status: CoachVideoStatus;
  uploadedBy: UserType;
  lesson: Lesson;
  session: Session;
}

export enum CoachVideoStatus {
  UPLOADING = "UPLOADING",
  READY = "READY",
  ERROR = "ERROR",
  ANALYZING = "ANALYZING",
}
