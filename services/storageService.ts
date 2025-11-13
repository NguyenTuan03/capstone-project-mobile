import { User } from "@/types/user";
import AsyncStorage from "@react-native-async-storage/async-storage";

class StorageService {
  // Token management
  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem("token", token);
    } catch (error) {
      console.error("Error setting token:", error);
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem("token");
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem("token");
    } catch (error) {
      console.error("Error removing token:", error);
    }
  }

  // Refresh token management
  async setRefreshToken(refreshToken: string): Promise<void> {
    try {
      await AsyncStorage.setItem("refreshToken", refreshToken);
    } catch (error) {
      console.error("Error setting refresh token:", error);
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem("refreshToken");
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  }

  async removeRefreshToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem("refreshToken");
    } catch (error) {
      console.error("Error removing refresh token:", error);
    }
  }

  // User management
  async setUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(user));
    } catch (error) {
      console.error("Error setting user:", error);
    }
  }

  async getUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem("user");
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem("user");
    } catch (error) {
      console.error("Error removing user:", error);
    }
  }

  // Clear all storage
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(["token", "refreshToken", "user"]);
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  }
}

export default new StorageService();
