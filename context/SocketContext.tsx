import { useJWTAuth } from "@/services/jwt-auth/JWTAuthProvider";
import storageService from "@/services/storageService";
import { Href, router } from "expo-router";
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
  const { isAuthenticated } = useJWTAuth();

  useEffect(() => {
    let newSocket: Socket | null = null;

    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const initSocket = async () => {
      const token = await storageService.getToken();
      if (!token) return;

      const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

      // Connect to the /ws namespace as defined in the backend
      newSocket = io(`${API_URL}/ws`, {
        query: {
          accessToken: token,
        },
        transports: ["websocket"],
        autoConnect: true,
      });

      newSocket.on("connect", () => {
        console.log("Socket connected");
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });

      newSocket.on("connect_error", (err) => {
        console.log("Socket connection error:", err);
      });

      newSocket.on("notification.send", (notification: Notification) => {
        console.log("Received notification:", notification);
        Toast.show({
          type: notification.type.toLowerCase(),
          text1: notification.title,
          text2: notification.body,
          onPress: () => {
            if (notification.navigateTo) {
              newSocket?.emit("notification.read", notification.id);
              router.push(notification.navigateTo as Href);
            }
          },
        });
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
