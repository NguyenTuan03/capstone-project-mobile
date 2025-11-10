import { ConfigurationType } from "@/types/configuration";
import http from "./http/interceptor";

class ConfigurationService {
  async getConfiguration(key: string): Promise<ConfigurationType | null> {
    try {
      const response = await http.get(`/v1/configurations/${key}`);
      const data = response.data;

      // API sometimes wraps the real configuration inside `metadata` or `data`.
      // Prefer returning the inner configuration object that matches ConfigurationType.
      if (data == null) return null;
      if (data.metadata && typeof data.metadata === "object") return data.metadata as ConfigurationType;
      if (data.data && typeof data.data === "object") return data.data as ConfigurationType;

      // If the response already is the configuration object, return it.
      return data as ConfigurationType;
    } catch (error) {
      console.error("Error fetching configuration:", error);
      return null;
    }
  }
}

export default new ConfigurationService();
