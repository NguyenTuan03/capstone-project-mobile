export enum ScheduleDayOfWeek {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
}

export interface Schedule {
  id: number;
  dayOfWeek: ScheduleDayOfWeek;
  startTime: string;
  endTime: string;
  totalSessions: number;
}

export interface ScheduleDto {
  dayOfWeek: ScheduleDayOfWeek;
  startTime: string;
  endTime: string;
}

export interface ChangeScheduleDto {
  course: number;
  replaceScheduleId: number;
  newSchedule: ScheduleDto;
}

export interface SessionNewScheduleDto {
  scheduledDate: Date;
  startTime: string;
  endTime: string;
}
