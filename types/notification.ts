export enum NotificationType {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  SUCCESS = "SUCCESS",
}

export interface Notification {
  id: number;
  title: string;
  body: string;
  navigateTo?: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
  user?: any; // We might not need the full user object here
}
