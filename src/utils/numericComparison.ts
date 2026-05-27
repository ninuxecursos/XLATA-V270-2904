/**
 * Utility functions for safe numeric comparisons to handle floating point precision issues
 */

// Tolerance for floating point comparisons (1 gram = 0.001 kg)
const TOLERANCE = 0.001;

/**
 * Safely compare if two numbers are equal within tolerance
 */
export const isEqual = (a: number, b: number): boolean => {
  return Math.abs(a - b) <= TOLERANCE;
};

/**
 * Safely compare if first number is greater than second within tolerance
 */
export const isGreaterThan = (a: number, b: number): boolean => {
  return a > b + TOLERANCE;
};

/**
 * Safely compare if first number is greater than or equal to second within tolerance
 */
export const isGreaterThanOrEqual = (a: number, b: number): boolean => {
  return a > b - TOLERANCE;
};

/**
 * Safely compare if first number is less than second within tolerance
 */
export const isLessThan = (a: number, b: number): boolean => {
  return a < b - TOLERANCE;
};

/**
 * Round number to 3 decimal places to avoid precision issues
 */
export const roundToThreeDecimals = (num: number): number => {
  return Math.round(num * 1000) / 1000;
};

/**
 * Format number for display with proper rounding
 */
export const formatWeight = (weight: number): string => {
  return roundToThreeDecimals(weight).toFixed(3);
};