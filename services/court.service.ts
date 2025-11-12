import http from "./http/interceptor";

class CourtService {
  async getCourtsByLocation(provinceId?: number, districtId?: number) {
    try {
      const res = await http.get(
        `/v1/courts?size=100&filter=${
          provinceId ? "province.id_eq_" + provinceId : ""
        }${districtId ? `,district.id_eq_${districtId}` : ""}`
      );
      return res.data.items;
    } catch (error) {
      throw error;
    }
  }
}

export default new CourtService();
