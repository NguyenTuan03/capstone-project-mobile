import { User } from "@/types/user";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

class StorageService {
  // Token management
  async setToken(token: string): Promise<void> {
    try {
      switch (Platform.OS) {
        case "web":
          localStorage.setItem("token", token);
          break;
        case "ios":
        case "android":
          await AsyncStorage.setItem("token", token);
          break;
        default:
          await AsyncStorage.setItem("token", token);
          break;
      }
    } catch (error) {}
  }

  async getToken(): Promise<string | null> {
    try {
      switch (Platform.OS) {
        case "web":
          return localStorage.getItem("token");
        case "ios":
        case "android":
          return await AsyncStorage.getItem("token");
        default:
          return await AsyncStorage.getItem("token");
      }
    } catch (error) {
      return null;
    }
  }

  async removeToken(): Promise<void> {
    try {
      switch (Platform.OS) {
        case "web":
          localStorage.removeItem("token");
          break;
        case "ios":
        case "android":
          await AsyncStorage.removeItem("token");
          break;
        default:
          await AsyncStorage.removeItem("token");
          break;
      }
    } catch (error) {}
  }

  // Refresh token management
  async setRefreshToken(refreshToken: string): Promise<void> {
    try {
      switch (Platform.OS) {
        case "web":
          localStorage.setItem("refreshToken", refreshToken);
          break;
        case "ios":
        case "android":
          await AsyncStorage.setItem("refreshToken", refreshToken);
          break;
        default:
          await AsyncStorage.setItem("refreshToken", refreshToken);
          break;
      }
    } catch (error) {}
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      switch (Platform.OS) {
        case "web":
          return localStorage.getItem("refreshToken");
        case "ios":
        case "android":
          return await AsyncStorage.getItem("refreshToken");
        default:
          return await AsyncStorage.getItem("refreshToken");
      }
    } catch (error) {
      return null;
    }
  }

  async removeRefreshToken(): Promise<void> {
    try {
      switch (Platform.OS) {
        case "web":
          localStorage.removeItem("refreshToken");
          break;
        case "ios":
        case "android":
          await AsyncStorage.removeItem("refreshToken");
          break;
        default:
          await AsyncStorage.removeItem("refreshToken");
          break;
      }
    } catch (error) {}
  }

  // User management
  async setUser(user: User): Promise<void> {
    try {
      switch (Platform.OS) {
        case "web":
          localStorage.setItem("user", JSON.stringify(user));
          break;
        case "ios":
        case "android":
          await AsyncStorage.setItem("user", JSON.stringify(user));
          break;
        default:
          await AsyncStorage.setItem("user", JSON.stringify(user));
          break;
      }
    } catch (error) {}
  }

  async getUser(): Promise<User | null> {
    try {
      switch (Platform.OS) {
        case "web":
          const userStringWeb = localStorage.getItem("user");
          return userStringWeb ? JSON.parse(userStringWeb) : null;
        case "ios":
        case "android":
          const userStringMobile = await AsyncStorage.getItem("user");
          return userStringMobile ? JSON.parse(userStringMobile) : null;
        default:
          const userStringDefault = await AsyncStorage.getItem("user");
          return userStringDefault ? JSON.parse(userStringDefault) : null;
      }
    } catch (error) {
      return null;
    }
  }

  async removeUser(): Promise<void> {
    try {
      switch (Platform.OS) {
        case "web":
          localStorage.removeItem("user");
          break;
        case "ios":
        case "android":
          await AsyncStorage.removeItem("user");
          break;
        default:
          await AsyncStorage.removeItem("user");
          break;
      }
    } catch (error) {}
  }

  // Clear all storage
  async clearAll(): Promise<void> {
    try {
      switch (Platform.OS) {
        case "web":
          localStorage.clear();
          break;
        case "ios":
        case "android":
          await AsyncStorage.clear();
          break;
        default:
          await AsyncStorage.clear();
          break;
      }
    } catch (error) {}
  }
}

export default new StorageService();
