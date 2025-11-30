import { User } from "@/types/user";
import AsyncStorage from "@react-native-async-storage/async-storage";

class StorageService {
  // Token management
  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem("token", token);
    } catch (error) {
       
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem("token");
    } catch (error) {
       
      return null;
    }
  }

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem("token");
    } catch (error) {
       
    }
  }

  // Refresh token management
  async setRefreshToken(refreshToken: string): Promise<void> {
    try {
      await AsyncStorage.setItem("refreshToken", refreshToken);
    } catch (error) {
       
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem("refreshToken");
    } catch (error) {
       
      return null;
    }
  }

  async removeRefreshToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem("refreshToken");
    } catch (error) {
       
    }
  }

  // User management
  async setUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(user));
    } catch (error) {
       
    }
  }

  async getUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem("user");
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
       
      return null;
    }
  }

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem("user");
    } catch (error) {
       
    }
  }

  // Clear all storage
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(["token", "refreshToken", "user"]);
    } catch (error) {
       
    }
  }
}

export default new StorageService();
