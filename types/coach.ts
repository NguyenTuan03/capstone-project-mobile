export interface MonthlyData {
  month: string;
  data: number;
  increaseFromLastMonth?: number;
}

export interface MonthlyResponseDto {
  data: MonthlyData[];
}

export interface MonthlyRequestDto {
  year?: number;
  month?: number;
}
