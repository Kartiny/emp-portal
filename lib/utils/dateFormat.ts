import { format, parse, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Asia/Kuala_Lumpur';
const LOCALE = 'en-MY';

// Helper function to parse various date formats and convert to Malaysia timezone
const parseDateString = (dateStr: string): Date => {
  if (!dateStr) {
    throw new Error('Invalid date string provided: ' + dateStr);
  }

  // Odoo provides datetime in UTC, typically as 'YYYY-MM-DD HH:mm:ss'.
  // To parse this correctly as UTC, we convert it to ISO 8601 format
  // by replacing the space with 'T' and appending 'Z'.
  if (dateStr.includes(' ') && dateStr.includes(':')) {
    const isoStr = dateStr.replace(' ', 'T') + 'Z';
    const date = parseISO(isoStr);
    if (!isNaN(date.getTime())) {
      return date; // Returns a Date object representing the correct UTC time
    }
  }

  // Fallback for ISO strings or date-only strings (e.g., 'YYYY-MM-DD')
  // which parseISO handles correctly. For date-only, it assumes UTC midnight.
  const date = parseISO(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }

  throw new Error(`Unable to parse date: ${dateStr}`);
};

export const formatDate = (date: Date | string): string => {
  try {
    console.log('🕒 Formatting date:', date);
    const dateObj = typeof date === 'string' ? parseDateString(date) : toZonedTime(date, TIMEZONE);
    return dateObj.toLocaleDateString(LOCALE, {
      timeZone: TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('❌ Date parsing error:', error);
    return 'Invalid Date';
  }
};

export const formatDateTime = (date: Date | string): string => {
  try {
    console.log('🕒 Formatting datetime:', date);
    const dateObj = typeof date === 'string' ? parseDateString(date) : toZonedTime(date, TIMEZONE);
    return dateObj.toLocaleString(LOCALE, {
      timeZone: TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('❌ Date parsing error:', error);
    return 'Invalid Date';
  }
};

export const formatDateLong = (date: Date | string): string => {
  try {
    console.log('🕒 Formatting long date:', date);
    const dateObj = typeof date === 'string' ? parseDateString(date) : toZonedTime(date, TIMEZONE);
    return dateObj.toLocaleDateString(LOCALE, {
      timeZone: TIMEZONE,
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error('❌ Date parsing error:', error);
    return 'Invalid Date';
  }
};

export const formatMonthYear = (date: Date | string): string => {
  try {
    console.log('🕒 Formatting month/year:', date);
    const dateObj = typeof date === 'string' ? parseDateString(date) : toZonedTime(date, TIMEZONE);
    return dateObj.toLocaleDateString(LOCALE, {
      timeZone: TIMEZONE,
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error('❌ Date parsing error:', error);
    return 'Invalid Date';
  }
};

export const formatTime = (date: Date | string): string => {
  try {
    console.log('🕒 Formatting time:', date);
    const dateObj = typeof date === 'string' ? parseDateString(date) : toZonedTime(date, TIMEZONE);
    return dateObj.toLocaleTimeString(LOCALE, {
      timeZone: TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('❌ Date parsing error:', error);
    return 'Invalid Time';
  }
}; 