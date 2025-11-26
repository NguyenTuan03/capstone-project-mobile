import { Credential } from "@/types/user";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type * as ImagePicker from "expo-image-picker";

interface CreateCredentialPayload {
  name: string;
  description?: string;
  type: string;
  publicUrl?: string;
  issuedAt?: string | Date;
  expiresAt?: string | Date;
}

class CredentialService {
  async createCredential(
    credential: CreateCredentialPayload,
    file?: ImagePicker.ImagePickerAsset
  ): Promise<Credential> {
    // Validate required fields
    if (!credential.name || credential.name.trim() === "") {
      throw new Error("Tên chứng chỉ không được để trống");
    }
    if (!credential.type || credential.type.trim() === "") {
      throw new Error("Loại chứng chỉ không được để trống");
    }

    try {
      const name = credential.name?.trim();
      const type = credential.type?.trim();
      const description = credential.description?.trim();

      if (!name) throw new Error("Name is required");
      if (!type) throw new Error("Type is required");

      // Create native FormData
      const formData = new FormData();

      // Append fields
      formData.append("name", name);
      formData.append("type", type);

      if (description) {
        formData.append("description", description);
      }
      if (credential.issuedAt) {
        const formattedDate = this.formatDate(credential.issuedAt);
        if (formattedDate) {
          formData.append("issuedAt", formattedDate);
        }
      }
      if (credential.expiresAt) {
        const formattedDate = this.formatDate(credential.expiresAt);
        if (formattedDate) {
          formData.append("expiresAt", formattedDate);
        }
      }

      // Add file if provided
      if (file) {
        
        formData.append("credential_image", {
          uri: file.uri,
          type: file.mimeType || "image/jpeg",
          name: file.fileName || "credential-image.jpg",
        } as any);
      }

      
      
      
      

      // Get token and make request with axios
      const token = await AsyncStorage.getItem("token");
      const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

      const response = await axios.post(
        `${API_URL}/v1/coaches/credentials`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      

      return response.data?.data || response.data;
    } catch (error: any) {
       

      if (error.response) {
         
         
         
      }

      throw error;
    }
  }

  private formatDate(date: string | Date): string {
    if (date instanceof Date) {
      return date.toISOString().split("T")[0];
    }
    // Already a string, assume it's in correct format
    return date || "";
  }

  async getCredentials(): Promise<Credential[]> {
    try {
      const token = await AsyncStorage.getItem("token");
      const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

      const response = await axios.get(
        `${API_URL}/v1/coaches/credentials`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    
      // Handle different response shapes
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (response.data?.items && Array.isArray(response.data.items)) {
        return response.data.items;
      }
      
      return [];
    } catch (error) {
       
      throw error;
    }
  }

  async deleteCredential(credentialId: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem("token");
      const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

      await axios.delete(`${API_URL}/v1/coaches/credentials/${credentialId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
       
      throw error;
    }
  }

  async updateCredential(
    credentialId: string,
    credential: CreateCredentialPayload,
    file?: ImagePicker.ImagePickerAsset
  ): Promise<Credential> {
    try {
      const formData = new FormData();

      // Add fields
      if (credential.name) {
        formData.append("name", credential.name.trim());
      }
      if (credential.type) {
        formData.append("type", credential.type.trim());
      }
      if (credential.description) {
        formData.append("description", credential.description.trim());
      }
      if (credential.issuedAt) {
        const formattedDate = this.formatDate(credential.issuedAt);
        if (formattedDate) {
          formData.append("issuedAt", formattedDate);
        }
      }
      if (credential.expiresAt) {
        const formattedDate = this.formatDate(credential.expiresAt);
        if (formattedDate) {
          formData.append("expiresAt", formattedDate);
        }
      }

      // Add file if provided
      if (file) {
        
        formData.append("credential_image", {
          uri: file.uri,
          type: file.mimeType || "image/jpeg",
          name: file.fileName || "credential-image.jpg",
        } as any);
      }

      
      
      

      // Get token and make request with axios
      const token = await AsyncStorage.getItem("token");
      const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

      const response = await axios.put(
        `${API_URL}/v1/coaches/credentials/${credentialId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      

      return response.data?.data || response.data;
    } catch (error: any) {
       

      if (error.response) {
         
         
         
      }

      throw error;
    }
  }
}

export default new CredentialService();
