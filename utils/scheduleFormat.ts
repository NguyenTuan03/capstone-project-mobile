import { DAYS_OF_WEEK_VI } from "@/components/common/AppEnum";
import { Course } from "@/types/course";

export const formatSchedule = (schedules: Course["schedules"]) => {
    if (!schedules || schedules.length === 0) return "Chưa có lịch";

    return schedules
      .map((schedule) => {
        const dayIndex = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ].indexOf(schedule.dayOfWeek);
        const dayName =
          dayIndex >= 0 ? DAYS_OF_WEEK_VI[dayIndex] : schedule.dayOfWeek;
        const startTime = schedule.startTime.substring(0, 5);
        const endTime = schedule.endTime.substring(0, 5);
        return `${dayName}: ${startTime}-${endTime}`;
      })
      .join("\n ");
  };