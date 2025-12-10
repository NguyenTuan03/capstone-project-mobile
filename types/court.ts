export type Court = {
  id?: number;
  name: string;
  phoneNumber?: string;
  pricePerHour: number;
  publicUrl?: string;
  address: string;
  province: Province;
  district: District;
  latitude?: number;
  longitude?: number;
};

export type Province = {
  id?: number;
  name: string;
};

export type District = {
  id?: number;
  name: string;
};
