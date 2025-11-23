import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import storageService from "../storageService";

interface QueueItem {
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}

const AUTH_ERROR_STATUS = 401;
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL + "/" + process.env.EXPO_PUBLIC_VERSION;

const jwtAxios: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const clearTokens = async (): Promise<void> => {
  await setAuthToken();
  await setRefreshToken();
};

export const setAuthToken = async (token?: string) => {
  if (!token) {
    delete jwtAxios.defaults.headers.common.Authorization;
    await storageService.removeToken();
    return;
  }
  jwtAxios.defaults.headers.common.Authorization = `Bearer ${token}`;
  await storageService.setToken(token);
};

export const setRefreshToken = async (token?: string): Promise<void> => {
  if (!token) {
    await storageService.removeRefreshToken();
    return;
  }
  await storageService.setRefreshToken(token);
};

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: any | null, token: string | null = null): void => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

const refreshAuthToken = async (): Promise<string> => {
  const refreshToken = await storageService.getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token found");
  }
  const response = await jwtAxios.post("/auth/refresh", { refreshToken });
  return response.data.accessToken;
};

let onLogout: null | (() => void) = null;

const handleLogout = (): void => {
  clearTokens();
  onLogout?.();
};

export const setLogoutHandler = (fn: () => void) => {
  onLogout = fn;
};

jwtAxios.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle 401 errors that haven't been retried
    if (
      !error.response ||
      error.response.status !== AUTH_ERROR_STATUS ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // If a token refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return jwtAxios(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Attempt to refresh the token
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const token = await refreshAuthToken();

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
      }

      processQueue(null, token);
      return jwtAxios(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      handleLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export const tokenService = {
  setAuthToken,
  setRefreshToken,
  clearTokens,
  setLogoutHandler,
};

export default jwtAxios;
export const ApiUrl = API_BASE_URL;
