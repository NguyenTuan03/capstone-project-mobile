export const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    APPROVED: "Đã duyệt",
    PENDING_APPROVAL: "Chờ duyệt",
    REJECTED: "Đã từ chối",
    FULL: "Đủ học viên",
    COMPLETED: "Đã hoàn thành",
    ON_GOING: "Đang diễn ra",
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    APPROVED: { bg: "#D1FAE5", text: "#059669" },
    PENDING_APPROVAL: { bg: "#FEF3C7", text: "#D97706" },
    REJECTED: { bg: "#FEE2E2", text: "#DC2626" },
    COMPLETED: { bg: "#E0F2FE", text: "#0284C7" },
    ON_GOING: { bg: "#E0F2FE", text: "#0284C7" },
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

export const getStatusMessage = (status: string) => {
  const messages: Record<
    string,
    {
      text: string;
      icon: string;
      bg: string;
      textColor: string;
      borderColor: string;
    }
  > = {
    FULL: {
      text: "Khóa học này đã đủ số lượng học viên. Lịch dạy sẽ được hiển thị khi khóa học diễn ra",
      icon: "information-circle",
      bg: "#EEF2FF",
      textColor: "#3B82F6",
      borderColor: "#BFDBFE",
    },
    READY_OPENED: {
      text: "Khóa học sẵn sàng để bắt đầu. Lịch dạy sẽ được hiển thị khi khóa học diễn ra",
      icon: "checkmark-circle",
      bg: "#ECFDF5",
      textColor: "#059669",
      borderColor: "#A7F3D0",
    },
  };
  return messages[status] || null;
};
