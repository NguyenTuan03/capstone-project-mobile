import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";

const http = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
});

http.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Detect FormData
  const isFormData =
    config.data &&
    typeof config.data === "object" &&
    typeof config.data._parts !== "undefined";

  if (isFormData) {
    // ⭐ Android requires Content-Type: multipart/form-data
    config.headers["Content-Type"] = "multipart/form-data";

    // Prevent Axios from transforming formData
    config.transformRequest = (data) => data;

    // Cleanup inherited headers so Android doesn’t override Content-Type
    if (config.headers.common) delete config.headers.common["Content-Type"];
    if (config.headers.post) delete config.headers.post["Content-Type"];
    if (config.headers.put) delete config.headers.put["Content-Type"];
  }

  // Allow ngrok tunneling
  if (config.baseURL?.includes("ngrok")) {
    config.headers["ngrok-skip-browser-warning"] = "true";
  }

  console.log("📤 Request:", {
    method: config.method?.toUpperCase(),
    url: config.url,
    isFormData,
    headers: config.headers,
  });

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
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error details
    console.error("❌ Response Error:", {
      status: error.response?.status,
      message: error.message,
      url: originalRequest?.url,
      response: error.request?._response,
    });

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
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/v1/auth/refresh`,
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
