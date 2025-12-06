import { notificationService } from "@/services/notification.service";
import storageService from "@/services/storageService";
import { Notification } from "@/types/notification";
import { Ionicons } from "@expo/vector-icons";
import { Href, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (pageNum: number, shouldRefresh = false) => {
    try {
      const user = await storageService.getUser();
      if (!user?.id) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await notificationService.getNotifications(
        user.id,
        pageNum,
        10
      );
      
      if (res?.data) {
        const newNotifications = res.data.items;
        if (shouldRefresh) {
          setNotifications(newNotifications);
        } else {
          setNotifications((prev) => [...prev, ...newNotifications]);
        }
        setHasMore(newNotifications.length === 10);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải thông báo",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications(1, true);
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchNotifications(1, true);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  const handlePressNotification = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    if (notification.navigateTo) {
      router.replace(notification.navigateTo as Href);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã đánh dấu tất cả là đã đọc",
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể thực hiện thao tác",
      });
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
      onPress={() => handlePressNotification(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={
            item.type === "INFO"
              ? "information-circle"
              : item.type === "SUCCESS"
              ? "checkmark-circle"
              : item.type === "WARNING"
              ? "warning"
              : "alert-circle"
          }
          size={24}
          color={
            item.type === "INFO"
              ? "#3B82F6"
              : item.type === "SUCCESS"
              ? "#10B981"
              : item.type === "WARNING"
              ? "#F59E0B"
              : "#EF4444"
          }
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, !item.isRead && styles.unreadText]}>
          {item.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.time}>
          {new Date(item.createdAt).toLocaleDateString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderSkeletonItem = () => (
    <View style={[styles.notificationItem, styles.skeletonItem]}>
      <View style={styles.iconContainer}>
        <View style={styles.skeletonIcon} />
      </View>
      <View style={styles.contentContainer}>
        <View style={[styles.skeletonLine, { width: "60%", height: 16 }]} />
        <View
          style={[
            styles.skeletonLine,
            { width: "90%", height: 14, marginTop: 8 },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            { width: "70%", height: 14, marginTop: 4 },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            { width: "30%", height: 12, marginTop: 8 },
          ]}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <TouchableOpacity onPress={handleMarkAllAsRead}>
          <Text style={styles.markAllReadText}>Đọc tất cả</Text>
        </TouchableOpacity>
      </View>

      {loading && page === 1 ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((index) => (
            <View key={index}>{renderSkeletonItem()}</View>
          ))}
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons
                name="notifications-off-outline"
                size={48}
                color="#9CA3AF"
              />
              <Text style={styles.emptyText}>Không có thông báo nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  markAllReadText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "flex-start",
    gap: 12,
  },
  unreadItem: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  iconContainer: {
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  unreadText: {
    color: "#111827",
    fontWeight: "700",
  },
  body: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#059669",
    marginTop: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  skeletonItem: {
    backgroundColor: "#F9FAFB",
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  skeletonLine: {
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
  },
});
