import { Course } from "./course";

export type Enrollment = {
  id: number;
  paymentAmount: string | null;
  status: "CONFIRMED" | "UNPAID" | "CANCELLED";
  enrolledAt: string;
  updatedAt: string;
  course: Course;
  user: {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    profilePicture: string | null;
  };
  payments: {
    id: number;
    amount: string;
    description: string;
    orderCode: number;
    paymentLinkId: string;
    checkoutUrl: string;
    qrCode: string;
    status: string;
    createdAt: string;
  }[];
};

export type EnrollmentsResponse = {
  items: Enrollment[];
  page: number;
  pageSize: number;
  total: number;
};
