import { CoachVerificationStatus } from "@/types/user";

export const getVerificationIcon = (status: CoachVerificationStatus) => {
  switch (status) {
    case CoachVerificationStatus.VERIFIED:
      return "checkmark-circle";
    case CoachVerificationStatus.PENDING:
      return "hourglass";
    case CoachVerificationStatus.REJECTED:
      return "close-circle";
    default:
      return "help-circle";
  }
};

export const getVerificationColor = (status: CoachVerificationStatus) => {
  switch (status) {
    case CoachVerificationStatus.VERIFIED:
      return "#10B981";
    case CoachVerificationStatus.PENDING:
      return "#F59E0B";
    case CoachVerificationStatus.REJECTED:
      return "#EF4444";
    default:
      return "#9CA3AF";
  }
};

export const getVerificationLabel = (status: CoachVerificationStatus) => {
  switch (status) {
    case CoachVerificationStatus.VERIFIED:
      return "Xác minh";
    case CoachVerificationStatus.PENDING:
      return "Đang xét duyệt";
    case CoachVerificationStatus.REJECTED:
      return "Từ chối";
    default:
      return "Chưa xác minh";
  }
};

export const getVerificationBadgeStyle = (status: CoachVerificationStatus) => {
  switch (status) {
    case CoachVerificationStatus.VERIFIED:
      return {
        backgroundColor: "#D1FAE5",
        borderWidth: 0,
      };
    case CoachVerificationStatus.PENDING:
      return {
        backgroundColor: "#FEF3C7",
        borderWidth: 0,
      };
    case CoachVerificationStatus.REJECTED:
      return {
        backgroundColor: "#FEE2E2",
        borderWidth: 0,
      };
    default:
      return {
        backgroundColor: "#E5E7EB",
        borderWidth: 0,
      };
  }
};
