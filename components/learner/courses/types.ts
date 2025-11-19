import { Course } from "@/types/course";

export type Province = {
  id: number;
  name: string;
};

export type District = {
  id: number;
  name: string;
};

export type CoursesResponse = {
  items: Course[];
  page: number;
  pageSize: number;
  total: number;
};

export type PaymentLinkResponse = {
  statusCode: number;
  message: string;
  metadata: {
    amount: number;
    description: string;
    orderCode: number;
    paymentLinkId: string;
    checkoutUrl: string;
    qrCode: string;
    status: string;
    id: number;
    createdAt: string;
  };
};