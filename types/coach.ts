export interface MonthlyData {
  month: string;
  data: number;
  increaseFromLastMonth?: number;
}

export interface MonthlyResponseDto {
  data: MonthlyData[];
}

export interface MonthlyRequestDto {
  year?: number;
  month?: number;
}

export type CoachDetail = {
  id: number;
  bio: string;
  specialties: string[] | string;
  teachingMethods: string[] | string;
  yearOfExperience: number;
  verificationReason?: string | null;
  verificationStatus: "UNVERIFIED" | "PENDING" | "REJECTED" | "VERIFIED";
  credentials?: {
    id: number;
    name: string;
    description?: string;
    type: "CERTIFICATE" | "PRIZE" | "ACHIEVEMENT";
    publicUrl?: string;
    issuedAt?: string;
    expiresAt?: string;
  }[];
  user: {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    profilePicture: string | null;
  };
};
