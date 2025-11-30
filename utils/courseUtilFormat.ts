import { DAYS_OF_WEEK_VI } from "@/components/common/AppEnum";
import { Course } from "@/types/course";

export const formatPrice = (price: string) => {
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) return price;
  return new Intl.NumberFormat("vi-VN").format(numPrice) + "đ";
};

export const formatSchedule = (schedules: Course["schedules"]) => {
  if (!schedules || schedules.length === 0) return "Chưa có lịch";

  return schedules
    .map((schedule) => {
      const dayIndex = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ].indexOf(schedule.dayOfWeek);
      const dayName =
        dayIndex >= 0 ? DAYS_OF_WEEK_VI[dayIndex] : schedule.dayOfWeek;
      const startTime = schedule.startTime.substring(0, 5);
      const endTime = schedule.endTime.substring(0, 5);
      return `${dayName}: ${startTime}-${endTime}`;
    })
    .join(", ");
};

export const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    APPROVED: "Đã duyệt",
    PENDING_APPROVAL: "Chờ duyệt",
    REJECTED: "Đã từ chối",
    COMPLETED: "Đã hoàn thành",
    ON_GOING: "Đang diễn ra",
    CANCELLED: "Đã hủy",
    FULL: "Đủ học viên",
    READY_OPENED: "Sắp khai giảng",
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    APPROVED: { bg: "#D1FAE5", text: "#059669" },
    PENDING_APPROVAL: { bg: "#FEF3C7", text: "#D97706" },
    READY_OPENED: { bg: "#DBEAFE", text: "#1E40AF" },
    REJECTED: { bg: "#FEE2E2", text: "#DC2626" },
    COMPLETED: { bg: "#E0F2FE", text: "#0284C7" },
  };
  return colorMap[status] || { bg: "#F3F4F6", text: "#6B7280" };
};

export const getLevelLabel = (level?: string) => {
  const levelMap: Record<string, string> = {
    BEGINNER: "Cơ bản",
    INTERMEDIATE: "Trung bình",
    ADVANCED: "Nâng cao",
  };
  return levelMap[level ?? ""] ?? level ?? "";
};

export const getLevelColor = (level?: string) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    BEGINNER: { bg: "#DBEAFE", text: "#0284C7" },
    INTERMEDIATE: { bg: "#FCD34D", text: "#92400E" },
    ADVANCED: { bg: "#DDD6FE", text: "#4F46E5" },
  };
  return colorMap[level ?? ""] || { bg: "#F3F4F6", text: "#6B7280" };
};
