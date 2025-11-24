import { Session } from "@/types/session";
import { VideoType } from "@/types/video";

export const formatTime = (time?: string | null) => {
  if (!time) return "—";
  return time.substring(0, 5);
};

export const formatDate = (date?: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN");
};

export const extractSessionPayload = (payload: any): Session | null => {
  if (!payload || typeof payload !== "object") return null;
  if ("id" in payload && "sessionNumber" in payload) {
    return payload as Session;
  }
  if ("data" in payload) {
    const nested = extractSessionPayload((payload as any).data);
    if (nested) return nested;
  }
  if ("metadata" in payload) {
    const nested = extractSessionPayload((payload as any).metadata);
    if (nested) return nested;
  }
  return null;
};

export const extractVideosFromPayload = (payload: any): VideoType[] => {
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray((payload as any).videos)) {
    return (payload as any).videos as VideoType[];
  }
  // Handle single video object (from /v1/sessions/courses/:id response)
  if ((payload as any).video && typeof (payload as any).video === "object") {
    return [(payload as any).video as VideoType];
  }
  if ("data" in payload) {
    const nested = extractVideosFromPayload((payload as any).data);
    if (nested.length) return nested;
  }
  if ("metadata" in payload) {
    const nested = extractVideosFromPayload((payload as any).metadata);
    if (nested.length) return nested;
  }
  return [];
};

export const extractQuizzesFromPayload = (payload: any): any[] => {
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray((payload as any).quizzes)) {
    return (payload as any).quizzes;
  }
  // Handle single quiz object (from /v1/sessions/courses/:id response)
  if ((payload as any).quiz && typeof (payload as any).quiz === "object") {
    return [(payload as any).quiz];
  }
  if ("data" in payload) {
    const nested = extractQuizzesFromPayload((payload as any).data);
    if (nested.length) return nested;
  }
  if ("metadata" in payload) {
    const nested = extractQuizzesFromPayload((payload as any).metadata);
    if (nested.length) return nested;
  }
  return [];
};

export const getStatusBadgeColors = (status?: string | null) => {
  switch (status) {
    case "READY":
      return { backgroundColor: "#ECFDF5", color: "#059669" };
    case "UPLOADING":
      return { backgroundColor: "#FEF3C7", color: "#B45309" };
    case "ERROR":
      return { backgroundColor: "#FEE2E2", color: "#B91C1C" };
    case "ANALYZING":
      return { backgroundColor: "#DBEAFE", color: "#1D4ED8" };
    case "PENDING":
      return { backgroundColor: "#E0E7FF", color: "#4338CA" };
    case "PAID":
      return { backgroundColor: "#DCFCE7", color: "#15803D" };
    default:
      return { backgroundColor: "#F3F4F6", color: "#4B5563" };
  }
};

export const formatStatus = (status: string) => {
  const map: Record<string, { text: string; color: string; bg: string }> = {
    PENDING: {
      text: "Chờ xác nhận",
      color: "#0284C7",
      bg: "#E0F2FE",
    },
    SCHEDULED: {
      text: "Sắp diễn ra",
      color: "#0284C7",
      bg: "#E0F2FE",
    },
    IN_PROGRESS: {
      text: "Đang diễn ra",
      color: "#D97706",
      bg: "#FEF3C7",
    },
    COMPLETED: {
      text: "Hoàn thành",
      color: "#059669",
      bg: "#D1FAE5",
    },
    CANCELLED: {
      text: "Đã hủy",
      color: "#DC2626",
      bg: "#FEE2E2",
    },
  };
  return (
    map[status] || {
      text: status,
      color: "#4B5563",
      bg: "#F3F4F6",
    }
  );
};
