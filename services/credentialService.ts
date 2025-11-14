import http from "@/services/http/interceptor";
import storageService from "@/services/storageService";
import { Credential } from "@/types/user";
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

      // Get token for authorization
      const token = await storageService.getToken();
      const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

      // Create native FormData - ensure strings are properly formatted
      const formData = new FormData();

      // Convert to strings and trim again to ensure clean data
      formData.append("name", String(name).trim());
      formData.append("type", String(type).trim());

      if (description && description.trim()) {
        formData.append("description", String(description).trim());
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

      // Add file if provided - React Native FormData object pattern
      if (file) {
        console.log("📁 Adding file to request:", file);

        // Use the ImagePickerAsset properties directly (like uploadVideo.tsx)
        // file.uri, file.type, file.fileName are already set by ImagePicker
        // Try "image" as field name since backend might expect "image" instead of "file"
        formData.append("credential_image", {
          uri: file.uri,
          type: file.mimeType || file.type || "image/jpeg",
          name: file.fileName || "credential-image.jpg",
        } as any);
      }

      console.log("📤 Credential API Request Details:");
      console.log("  URL:", `${API_URL}/v1/coaches/credentials`);
      console.log("  Token exists:", !!token);
      console.log("  File included:", !!file);
      console.log("  Name:", name);
      console.log("  Type:", type);

      // Debug FormData contents
      // console.log("📦 FormData contents:");
      // for (let [key, value] of formData.entries()) {
      //   console.log(`  ${key}:`, typeof value === 'object' ? `[File: ${(value as any).name}]` : value);
      // }

      // Send directly with axios - let axios auto-detect Content-Type with proper boundaries
      const axiosResponse = await axios.post(
        `${API_URL}/v1/coaches/credentials`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - let axios set it automatically with proper boundary
          },
        }
      );

      console.log("✅ Credential created successfully:", axiosResponse.data);

      return axiosResponse.data?.data || axiosResponse.data;
    } catch (error: any) {
      console.error("❌ Error creating credential:", error.message);

      // Log detailed error response
      if (error.response) {
        console.error("📋 Backend Error Details:");
        console.error("  Status:", error.response.status);
        console.error("  Status Text:", error.response.statusText);
        console.error("  Response Data:", error.response.data);
        console.error("  Headers:", error.response.headers);
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
    const response = await http.get("/v1/coaches/credentials");
    
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
  }

  async deleteCredential(credentialId: string): Promise<void> {
    await http.delete(`/v1/coaches/credentials/${credentialId}`);
  }

  async updateCredential(
    credentialId: string,
    credential: CreateCredentialPayload,
    file?: ImagePicker.ImagePickerAsset
  ): Promise<Credential> {
    try {
      const token = await storageService.getToken();
      const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

      const formData = new FormData();

      // Add credential fields
      if (credential.name) {
        formData.append("name", String(credential.name).trim());
      }
      if (credential.type) {
        formData.append("type", String(credential.type).trim());
      }
      if (credential.description) {
        formData.append("description", String(credential.description).trim());
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
        console.log("📁 Adding file to update request:", file);
        formData.append("credential_image", {
          uri: file.uri,
          type: file.mimeType || file.type || "image/jpeg",
          name: file.fileName || "credential-image.jpg",
        } as any);
      }

      console.log("📤 Credential Update API Request Details:");
      console.log("  URL:", `${API_URL}/v1/coaches/credentials/${credentialId}`);
      console.log("  Token exists:", !!token);
      console.log("  File included:", !!file);

      // Send update request
      const axiosResponse = await axios.put(
        `${API_URL}/v1/coaches/credentials/${credentialId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Credential updated successfully:", axiosResponse.data);

      return axiosResponse.data?.data || axiosResponse.data;
    } catch (error: any) {
      console.error("❌ Error updating credential:", error.message);

      if (error.response) {
        console.error("📋 Backend Error Details:");
        console.error("  Status:", error.response.status);
        console.error("  Response Data:", error.response.data);
      }

      throw error;
    }
  }
}

export default new CredentialService();
