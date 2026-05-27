/**
 * Date manipulation utilities
 * Centralized date/time helper functions
 */

export const dateHelpers = {
  /**
   * Checks if a date is within a range
   * @param date - Date to check
   * @param start - Start of range
   * @param end - End of range
   * @returns true if date is within range (inclusive)
   */
  isInRange: (date: Date, start: Date, end: Date): boolean => {
    return date >= start && date <= end;
  },

  /**
   * Returns start of day (00:00:00.000)
   * @param date - Input date
   * @returns New Date object at start of day
   */
  startOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  /**
   * Returns end of day (23:59:59.999)
   * @param date - Input date
   * @returns New Date object at end of day
   */
  endOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  },

  /**
   * Adds days to a date
   * @param date - Base date
   * @param days - Number of days to add (can be negative)
   * @returns New Date object
   */
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * Adds months to a date
   * @param date - Base date
   * @param months - Number of months to add (can be negative)
   * @returns New Date object
   */
  addMonths: (date: Date, months: number): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  },

  /**
   * Calculates difference in days between two dates
   * @param date1 - First date
   * @param date2 - Second date
   * @returns Absolute number of days between dates
   */
  differenceInDays: (date1: Date, date2: Date): number => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Checks if date is today
   * @param date - Date to check
   * @returns true if date is today
   */
  isToday: (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  },

  /**
   * Checks if date is in the past
   * @param date - Date to check
   * @returns true if date is before now
   */
  isPast: (date: Date): boolean => {
    return date < new Date();
  },

  /**
   * Checks if date is in the future
   * @param date - Date to check
   * @returns true if date is after now
   */
  isFuture: (date: Date): boolean => {
    return date > new Date();
  },

  /**
   * Formats date as YYYY-MM-DD
   * @param date - Date to format
   * @returns Date string in ISO format
   */
  toISODate: (date: Date): string => {
    return date.toISOString().split('T')[0];
  },

  /**
   * Parses YYYY-MM-DD string to Date
   * @param dateString - Date string to parse
   * @returns Date object or null if invalid
   */
  fromISODate: (dateString: string): Date | null => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }
};
