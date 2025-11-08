export type LearningFormat = "GROUP" | "INDIVIDUAL";

export type Schedule = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}
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
  address: string;
  subject: {
    id: number;
    name: string;
    description: string;
  };
  schedules: {
    id: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
  province: {
    id: number;
    name: string;
  };
  district: {
    id: number;
    name: string;
  };
  createdBy: {
    id: number;
    fullName: string;
    email: string;
  };
};