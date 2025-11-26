import { useJWTAuth } from "@/services/jwt-auth/JWTAuthProvider";
import storageService from "@/services/storageService";
import { Href, router, useSegments } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { io, Socket } from "socket.io-client";

import { Notification } from "@/types/notification";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  markNotificationAsRead: (notificationId: number) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  markNotificationAsRead: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notificationQueue, setNotificationQueue] = useState<Notification[]>(
    []
  );
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const { isAuthenticated } = useJWTAuth();
  const segments = useSegments();

  // Process notification queue
  useEffect(() => {
    if (notificationQueue.length === 0 || isProcessingQueue) return;

    // Don't process notifications if user is not authenticated or on auth screens
    const inAuthGroup = segments[0] === "(auth)";
    if (!isAuthenticated || inAuthGroup) {
      if (inAuthGroup && notificationQueue.length > 0) {
        // Optionally clear queue or just wait?
        // If we clear, they miss notifications. If we wait, they see them on login.
        // Let's clear for now to be safe and avoid spam on login.
        setNotificationQueue([]);
      }
      return;
    }

    const processNextNotification = async () => {
      setIsProcessingQueue(true);
      const notification = notificationQueue[0];

      Toast.show({
        type: notification.type.toLowerCase(),
        text1: notification.title,
        text2: notification.body,
        onPress: () => {
          if (notification.navigateTo) {
            socket?.emit("notification.read", notification.id);
            router.push(notification.navigateTo as Href);
          }
        },
        visibilityTime: 3000,
      });

      // Wait for toast to be visible before processing next
      await new Promise((resolve) => setTimeout(resolve, 3500));

      setNotificationQueue((prev) => prev.slice(1));
      setIsProcessingQueue(false);
    };

    processNextNotification();
  }, [notificationQueue, isProcessingQueue, socket, isAuthenticated]);

  useEffect(() => {
    let newSocket: Socket | null = null;

    const initSocket = async () => {
      if (!isAuthenticated) {
        // Clear notification queue when user logs out
        setNotificationQueue([]);
        setIsProcessingQueue(false);

        if (socket) {
          socket.disconnect();
          setSocket(null);
          setIsConnected(false);
        }
        return;
      }

      const user = await storageService.getUser();
      const token = await storageService.getToken();

      if (!user || !token) {
        return;
      }
      

      const API_URL = process.env.EXPO_PUBLIC_SOCKET_URL;
      

      // Try connecting to root namespace first
      newSocket = io(API_URL!, {
        query: {
          accessToken: token,
        },
        transports: ["websocket"],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      newSocket.on("connect", () => {
        
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        
        setIsConnected(false);
      });

      newSocket.on("connect_error", (err) => {
        
      });

      newSocket.on("notification.send", (notification: Notification) => {
        
        // Add to queue instead of showing immediately
        setNotificationQueue((prev) => [...prev, notification]);
      });

      setSocket(newSocket);
    };

    initSocket();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated]);

  const markNotificationAsRead = (notificationId: number) => {
    if (socket && isConnected) {
      socket.emit("notification.read", notificationId);
    }
  };

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, markNotificationAsRead }}
    >
      {children}
    </SocketContext.Provider>
  );
};
