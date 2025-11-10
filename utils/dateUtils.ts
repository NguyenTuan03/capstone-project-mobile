import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

/**
 * Get the current week date range (Monday to Sunday)
 */
export const getCurrentWeekRange = () => {
  const now = new Date();
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  const sunday = endOfWeek(now, { weekStartsOn: 1 });

  return {
    start: format(monday, 'yyyy-MM-dd'),
    end: format(sunday, 'yyyy-MM-dd'),
    monday: format(monday, 'yyyy-MM-dd'),
    sunday: format(sunday, 'yyyy-MM-dd'),
  };
};

/**
 * Get the previous week date range (Monday to Sunday)
 */
export const getPreviousWeekRange = (currentDate: Date) => {
  const previousWeekDate = subWeeks(currentDate, 1);
  const monday = startOfWeek(previousWeekDate, { weekStartsOn: 1 });
  const sunday = endOfWeek(previousWeekDate, { weekStartsOn: 1 });

  return {
    start: format(monday, 'yyyy-MM-dd'),
    end: format(sunday, 'yyyy-MM-dd'),
  };
};

/**
 * Get the next week date range (Monday to Sunday)
 */
export const getNextWeekRange = (currentDate: Date) => {
  const nextWeekDate = addWeeks(currentDate, 1);
  const monday = startOfWeek(nextWeekDate, { weekStartsOn: 1 });
  const sunday = endOfWeek(nextWeekDate, { weekStartsOn: 1 });

  return {
    start: format(monday, 'yyyy-MM-dd'),
    end: format(sunday, 'yyyy-MM-dd'),
  };
};

/**
 * Format a date string for API use
 */
export const formatDateForAPI = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
};

/**
 * Validate date string format
 */
export const isValidDateString = (dateString: string): boolean => {
  if (!dateString) return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
};