/**
 * Utility functions for formatting data
 * Centralized to avoid code duplication
 */

export const formatters = {
  /**
   * Format currency value to Brazilian Real
   */
  currency: (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  /**
   * Format weight in kilograms
   */
  weight: (value: number, decimals: number = 3): string => {
    return `${value.toFixed(decimals)} kg`;
  },

  /**
   * Format date to Brazilian format
   */
  date: (timestamp: number | string | Date): string => {
    const date = typeof timestamp === 'number' 
      ? new Date(timestamp) 
      : new Date(timestamp);
    return date.toLocaleDateString('pt-BR');
  },

  /**
   * Format datetime to Brazilian format with time
   */
  datetime: (timestamp: number | string | Date): string => {
    const date = typeof timestamp === 'number' 
      ? new Date(timestamp) 
      : new Date(timestamp);
    return date.toLocaleString('pt-BR');
  },

  /**
   * Generate a new UUID v4
   */
  uuid: (): string => {
    return crypto.randomUUID();
  },

  /**
   * Validate UUID format
   */
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  /**
   * Format phone number to Brazilian format
   */
  phone: (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
    }
    return value;
  },

  /**
   * Format percentage
   */
  percentage: (value: number, decimals: number = 2): string => {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  /**
   * Truncate text with ellipsis
   */
  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
};
