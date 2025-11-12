import type { Course } from "./course";
import { User } from "./user";

export type EnrollmentStatus =
  | "PENDING_GROUP"
  | "CONFIRMED"
  | "LEARNING"
  | "REFUNDED"
  | "UNPAID"
  | "CANCELLED";

export type EnrollmentPaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED";

export type EnrollmentRole = {
  id: number;
  name: string;
};

export type EnrollmentCourse = Course & {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  cancellingReason: string | null;
};

export type EnrollmentPayment = {
  id: number;
  amount: string;
  description: string;
  orderCode: number;
  paymentLinkId: string;
  checkoutUrl: string;
  qrCode: string;
  status: EnrollmentPaymentStatus;
  createdAt: string;
};

export type Enrollment = {
  id: number;
  paymentAmount: string | null;
  status: EnrollmentStatus;
  enrolledAt: string;
  updatedAt: string;
  user: User;
  course: EnrollmentCourse;
  payments: EnrollmentPayment[];
};

export type EnrollmentsResponse = {
  items: Enrollment[];
  page: number;
  pageSize: number;
  total: number;
};
