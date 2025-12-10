import { QuizType } from "./quiz";
import { VideoType } from "./video";

export interface Subject {
  id: number;
  name: string;
  description: string;
  level: string;
  status: string;
  publicUrl?: string | null;
  isAIGenerated?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: number;
    fullName: string;
    email: string;
    phoneNumber?: string;
    profilePicture?: string | null;
  };
  lessons?: Lesson[];
}

export interface CreatedBy {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePicture: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
export interface Lesson {
  id: number;
  name: string;
  description: string;
  lessonNumber: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  video: VideoType;
  quiz: QuizType;
}
