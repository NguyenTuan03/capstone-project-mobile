import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";

const http = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  // headers: {
  //     "Content-Type": "application/json",
  // },
});

http.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers: any[] = [];

const subscribeTokenRefresh = (cb: any) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(http(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        const res = await axios.post(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/v1/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken } = res.data.metadata;
        await AsyncStorage.setItem("token", accessToken);

        isRefreshing = false;
        onRefreshed(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return http(originalRequest);
      } catch (err) {
        isRefreshing = false;
        await AsyncStorage.multiRemove(["token", "refreshToken", "user"]);
        router.replace("/(auth)");
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default http;
