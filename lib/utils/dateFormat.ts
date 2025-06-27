import { format, parse, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Asia/Kuala_Lumpur';
const LOCALE = 'en-MY';

// Helper function to parse various date formats and convert to Malaysia timezone
const parseDateString = (dateStr: string): Date => {
  console.log('🕒 Parsing date string:', dateStr);
  
  // Try parsing as ISO format 
  try {
    if (dateStr.includes('T') || dateStr.includes('Z')) {
      const utcDate = new Date(dateStr);
      if (!isNaN(utcDate.getTime())) {
        console.log('✅ Parsed as ISO format with time');
        const malaysiaDate = toZonedTime(utcDate, TIMEZONE);
        console.log('🕒 Converted to Malaysia time:', malaysiaDate);
        return malaysiaDate;
      }
    }
  } catch (error) {
    console.warn('Failed to parse as ISO format with time:', error);
  }

  // Try parsing as date-only format (YYYY-MM-DD)
  try {
    if (dateStr.includes('-') && !dateStr.includes(':')) {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        console.log('✅ Parsed as YYYY-MM-DD format');
        return date;
      }
    }
  } catch (error) {
    console.warn('Failed to parse as YYYY-MM-DD format:', error);
  }

  // Try parsing as format (YYYY-MM-DD HH:mm:ss)
  try {
    if (dateStr.includes('-') && dateStr.includes(':')) {
      const [datePart, timePart] = dateStr.split(' ');
      const [year, month, day] = datePart.split('-');
      const [hours, minutes, seconds] = timePart.split(':');
      
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      );
      
      if (!isNaN(date.getTime())) {
        console.log('✅ Parsed as YYYY-MM-DD HH:mm:ss format');
        return date;
      }
    }
  } catch (error) {
    console.warn('Failed to parse as YYYY-MM-DD HH:mm:ss format:', error);
  }

  // Try parsing as format (DD/MM/YYYY HH:mm:ss)
  try {
    if (dateStr.includes('/') && dateStr.includes(':')) {
      const [datePart, timePart] = dateStr.split(' ');
      const [day, month, year] = datePart.split('/');
      const [hours, minutes, seconds] = timePart.split(':');
      
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      );
      
      if (!isNaN(date.getTime())) {
        console.log('✅ Parsed as DD/MM/YYYY HH:mm:ss format');
        return date;
      }
    }
  } catch (error) {
    console.warn('Failed to parse as DD/MM/YYYY HH:mm:ss format:', error);
  }

  // Try parsing as format (DD/MM/YYYY)
  try {
    if (dateStr.includes('/') && !dateStr.includes(':')) {
      const [day, month, year] = dateStr.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        console.log('✅ Parsed as DD/MM/YYYY format');
        return date;
      }
    }
  } catch (error) {
    console.warn('Failed to parse as DD/MM/YYYY format:', error);
  }

  // Try parsing as a general date string
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      console.log('✅ Parsed as general date format');
      return toZonedTime(date, TIMEZONE);
    }
  } catch (error) {
    console.warn('Failed to parse as general date format:', error);
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