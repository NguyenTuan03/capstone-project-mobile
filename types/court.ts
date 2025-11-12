export type Court = {
  id?: number;
  name: string;
  phoneNumber?: string;
  pricePerHour: number;
  publicUrl?: string;
  address: string;
  province: Province;
  district: District;
};

export type Province = {
  id?: number;
  name: string;
};

export type District = {
  id?: number;
  name: string;
};
