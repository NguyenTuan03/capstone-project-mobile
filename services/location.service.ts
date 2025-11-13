import { District, Province } from "@/types/court";
import http from "./http/interceptor";

class LocationService {
  async getProvinces() {
    try {
      const res = await http.get("/v1/provinces");
      return res.data as Province[];
    } catch (error) {
      throw error;
    }
  }

  async getDistrictsByProvince(provinceId: number) {
    try {
      const res = await http.get(`/v1/provinces/${provinceId}/districts`);
      return res.data as District[];
    } catch (error) {
      throw error;
    }
  }
}

export default new LocationService();
