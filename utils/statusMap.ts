export const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    APPROVED: "Đã duyệt",
    PENDING_APPROVAL: "Chờ duyệt",
    REJECTED: "Đã từ chối",
    COMPLETED: "Đã hoàn thành",
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    APPROVED: { bg: "#D1FAE5", text: "#059669" },
    PENDING_APPROVAL: { bg: "#FEF3C7", text: "#D97706" },
    REJECTED: { bg: "#FEE2E2", text: "#DC2626" },
    COMPLETED: { bg: "#E0F2FE", text: "#0284C7" },
  };
  return colorMap[status] || { bg: "#F3F4F6", text: "#6B7280" };
};
