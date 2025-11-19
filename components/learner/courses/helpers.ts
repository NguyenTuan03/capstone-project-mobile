export const getLevelInVietnamese = (level: string): string => {
  const levelMap: Record<string, string> = {
    BEGINNER: "Cơ bản",
    INTERMEDIATE: "Trung bình",
    ADVANCED: "Nâng cao",
    PROFESSIONAL: "Chuyên nghiệp",
  };
  return levelMap[level] || level;
};

export const getStatusInVietnamese = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING_APPROVAL: "Chờ duyệt",
    APPROVED: "Đang mở",
    REJECTED: "Từ chối",
    CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn thành",
    FULL: "Đã đủ người",
    READY_OPENED: "Đang mở",
    ON_GOING: "Đang diễn ra",
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    PENDING_APPROVAL: "#F59E0B",
    APPROVED: "#10B981",
    REJECTED: "#EF4444",
    CANCELLED: "#6B7280",
    COMPLETED: "#3B82F6",
    FULL: "#8B5CF6",
    READY_OPENED: "#10B981",
    ON_GOING: "#10B981",
  };
  return colorMap[status] || "#6B7280";
};

export const formatCoursePrice = (price: string) => {
  const numPrice = parseFloat(price);
  if (Number.isNaN(numPrice)) {
    return price;
  }
  return `${new Intl.NumberFormat("vi-VN").format(numPrice)} VNĐ`;
};

