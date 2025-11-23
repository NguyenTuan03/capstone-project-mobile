import { District, Province } from "./court";

export type Role = {
  id: number;
  name: "ADMIN" | "COACH" | "LEARNER";
};

export enum CoachVerificationStatus {
  UNVERIFIED = "UNVERIFIED",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
  VERIFIED = "VERIFIED",
}

export type Coach = {
  id: number;
  bio: string;
  specialties: string[];
  teachingMethods: string[];
  yearOfExperience: number;
  verificationReason?: string | null;
  verificationStatus: CoachVerificationStatus;
  credentials?: Credential[];
};

export enum CourseCredentialType {
  CERTIFICATE = "CERTIFICATE",
  PRIZE = "PRIZE",
  ACHIEVEMENT = "ACHIEVEMENT",
}

export enum PickleballLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
}

export type Learner = {
  id: number;
  skillLevel: PickleballLevel;
  learningGoal: PickleballLevel;
};

export type Credential = {
  id?: string | number;
  name: string;
  description?: string;
  type: CourseCredentialType;
  publicUrl?: string;
  issuedAt?: Date;
  expiresAt?: Date;
};
export type UserMetadata = {
  metadata: {
    user?: User;
    accessToken?: string;
    refreshToken?: string;
  };
};
export type User = {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePicture: string | null;
  createdAt?: string;
  updatedAt?: string;
  role: Role;
  coach?: Coach[] | null;
  learner?: Learner[] | null;
  emailVerificationToken?: string | null;
  password?: string;
  refreshToken?: string | null;
  resetPasswordToken?: string | null;
  wallet?: Record<string, unknown> | null;
  province: Province;
  district: District;
};
