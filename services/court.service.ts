import http from "./http/interceptor";

class CourtService {
  async getCourtsByLocation(provinceId?: number, districtId?: number) {
    try {
      const filter = [
        provinceId ? `province.id_eq_${provinceId}` : null,
        districtId ? `district.id_eq_${districtId}` : null,
      ].filter(Boolean).join(',');
      const res = await http.get(`/v1/courts?size=100${filter ? `&filter=${filter}` : ''}`);
      return res.data.items;
    } catch (error) {
      throw error;
    }
  }
}

export default new CourtService();
