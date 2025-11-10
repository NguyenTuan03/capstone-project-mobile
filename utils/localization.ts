export const VIETNAMESE_DAYS = {
  Sunday: 'Chủ Nhật',
  Monday: 'Thứ Hai',
  Tuesday: 'Thứ Ba',
  Wednesday: 'Thứ Tư',
  Thursday: 'Thứ Năm',
  Friday: 'Thứ Sáu',
  Saturday: 'Thứ Bảy',
  Sun: 'CN',
  Mon: 'T2',
  Tue: 'T3',
  Wed: 'T4',
  Thu: 'T5',
  Fri: 'T6',
  Sat: 'T7'
};

export const VIETNAMESE_MONTHS = {
  January: 'Tháng Một',
  February: 'Tháng Hai',
  March: 'Tháng Ba',
  April: 'Tháng Tư',
  May: 'Tháng Năm',
  June: 'Tháng Sáu',
  July: 'Tháng Bảy',
  August: 'Tháng Tám',
  September: 'Tháng Chín',
  October: 'Tháng Mười',
  November: 'Tháng Mười Một',
  December: 'Tháng Mười Hai',
  Jan: 'T1',
  Feb: 'T2',
  Mar: 'T3',
  Apr: 'T4',
  May: 'T5',
  Jun: 'T6',
  Jul: 'T7',
  Aug: 'T8',
  Sep: 'T9',
  Oct: 'T10',
  Nov: 'T11',
  Dec: 'T12'
};

export const toVietnameseDay = (dayName: string): string => {
  return VIETNAMESE_DAYS[dayName as keyof typeof VIETNAMESE_DAYS] || dayName;
};

export const toVietnameseMonth = (monthName: string): string => {
  return VIETNAMESE_MONTHS[monthName as keyof typeof VIETNAMESE_MONTHS] || monthName;
};

export const formatVietnameseDate = (date: Date, formatStr: string): string => {
  // This function will handle Vietnamese date formatting
  // You can expand this as needed for different formats
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = date.toLocaleDateString('en-US', { month: 'long' });

  let result = formatStr;
  result = result.replace('EEEE', toVietnameseDay(dayName));
  result = result.replace('MMMM', toVietnameseMonth(monthName));
  result = result.replace('EEE', toVietnameseDay(date.toLocaleDateString('en-US', { weekday: 'short' })));

  return result;
};