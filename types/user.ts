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
  bio: string;
  specialties: string[];
  teachingMethods: string[];
  yearOfExperience: number;
  verificationReason?: string;
  verificationStatus: CoachVerificationStatus;
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
  skillLevel: PickleballLevel;
  learningGoal: PickleballLevel;
  province: Province;
  district: District;
};

export type Credential = {
  name: string;
  description?: string;
  type: CourseCredentialType;
  publicUrl?: string;
  issuedAt?: Date;
  expiresAt?: Date;
};

export type User = {
  id: number;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
  createdAt: Date;
  role: Role;
  coach?: Coach[] | null;
  learner?: Learner[] | null;
};
