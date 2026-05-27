/**
 * Validation utilities
 * Centralized validation functions for common data types
 */

export const validators = {
  /**
   * Validates UUID v4 format
   * @param uuid - String to validate
   * @returns true if valid UUID v4
   */
  uuid: (uuid: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
  },

  /**
   * Validates email format
   * @param email - String to validate
   * @returns true if valid email
   */
  email: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * Validates Brazilian phone number (with or without formatting)
   * @param phone - String to validate
   * @returns true if valid phone (10 or 11 digits)
   */
  phone: (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  },

  /**
   * Validates Brazilian CPF
   * @param cpf - String to validate
   * @returns true if valid CPF
   */
  cpf: (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleaned)) return false; // All same digits
    
    // Validate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    let digit = remainder >= 10 ? 0 : remainder;
    
    if (digit !== parseInt(cleaned.charAt(9))) return false;
    
    // Validate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    digit = remainder >= 10 ? 0 : remainder;
    
    return digit === parseInt(cleaned.charAt(10));
  },

  /**
   * Validates Brazilian CNPJ
   * @param cnpj - String to validate
   * @returns true if valid CNPJ
   */
  cnpj: (cnpj: string): boolean => {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleaned)) return false; // All same digits
    
    // Validate first check digit
    let size = cleaned.length - 2;
    let numbers = cleaned.substring(0, size);
    const digits = cleaned.substring(size);
    let sum = 0;
    let pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;
    
    // Validate second check digit
    size = size + 1;
    numbers = cleaned.substring(0, size);
    sum = 0;
    pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1));
  },

  /**
   * Validates currency value (must be a positive number)
   * @param value - Value to validate
   * @returns true if valid currency
   */
  currency: (value: any): boolean => {
    return typeof value === 'number' && !isNaN(value) && value >= 0;
  },

  /**
   * Validates weight (must be a positive number)
   * @param value - Value to validate
   * @returns true if valid weight
   */
  weight: (value: any): boolean => {
    return typeof value === 'number' && !isNaN(value) && value > 0;
  },

  /**
   * Validates if string is not empty
   * @param value - String to validate
   * @returns true if non-empty string
   */
  notEmpty: (value: string): boolean => {
    return typeof value === 'string' && value.trim().length > 0;
  },

  /**
   * Validates string length range
   * @param value - String to validate
   * @param min - Minimum length
   * @param max - Maximum length
   * @returns true if within range
   */
  lengthRange: (value: string, min: number, max: number): boolean => {
    return typeof value === 'string' && value.length >= min && value.length <= max;
  }
};
