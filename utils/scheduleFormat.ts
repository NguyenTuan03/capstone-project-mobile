import { DAYS_OF_WEEK_VI } from "@/components/common/AppEnum";
import { Course } from "@/types/course";

const DAYS_OF_WEEK_EN = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/**
 * Convert day of week from English to Vietnamese
 * @param dayOfWeek - Day of week in English (e.g., "Monday", "Tuesday")
 * @returns Day of week in Vietnamese (e.g., "Thứ 2", "Thứ 3")
 */
export const convertDayOfWeekToVietnamese = (dayOfWeek: string): string => {
  const dayIndex = DAYS_OF_WEEK_EN.indexOf(dayOfWeek);
  return dayIndex >= 0 ? DAYS_OF_WEEK_VI[dayIndex] : dayOfWeek;
};

export const formatSchedule = (schedules: Course["schedules"]) => {
    if (!schedules || schedules.length === 0) return "Chưa có lịch";

    return schedules
      .map((schedule) => {
        const dayName = convertDayOfWeekToVietnamese(schedule.dayOfWeek);
        const startTime = schedule.startTime.substring(0, 5);
        const endTime = schedule.endTime.substring(0, 5);
        return `${dayName}: ${startTime}-${endTime}`;
      })
      .join("\n ");
  };