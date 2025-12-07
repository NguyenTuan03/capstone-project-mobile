import { Notification } from "@/types/notification";
import { get, put } from "./http/httpService";

export const notificationService = {
  getNotifications: async (
    userId: number,
    page: number = 1,
    limit: number = 10
  ) => {
    return await get<{
      items: Notification[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(
      `/v1/notifications?page=${page}&size=${limit}&sort=createdAt_desc&filter=user.id_eq_${userId}`
    );
  },

  markAsRead: async (id: number) => {
    return await put(`/v1/notifications/${id}/read`, {});
  },

  markAllAsRead: async () => {
    return await put(`/v1/notifications/read`, {});
  },
};
