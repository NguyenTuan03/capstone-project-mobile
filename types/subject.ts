export interface Subject {
  id: number;
  name: string;
  description: string;
  level: string;
  status: string;
  publicUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: number;
    fullName: string;
    email: string;
    phoneNumber?: string;
    profilePicture?: string | null;
  };
  lessons?: any[];
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
  video: any[];
  quizzes: any[];
}
