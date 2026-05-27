/**
 * Array manipulation utilities
 * Centralized array operation helper functions
 */

export const arrayHelpers = {
  /**
   * Groups array elements by a key
   * @param array - Array to group
   * @param key - Property to group by
   * @returns Object with grouped arrays
   */
  groupBy: <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((result, item) => {
      const keyValue = String(item[key]);
      (result[keyValue] = result[keyValue] || []).push(item);
      return result;
    }, {} as Record<string, T[]>);
  },

  /**
   * Removes duplicate primitive values
   * @param array - Array to deduplicate
   * @returns Array with unique values
   */
  unique: <T>(array: T[]): T[] => {
    return [...new Set(array)];
  },

  /**
   * Removes duplicates by a specific property
   * @param array - Array to deduplicate
   * @param key - Property to compare
   * @returns Array with unique items
   */
  uniqueBy: <T>(array: T[], key: keyof T): T[] => {
    const seen = new Set();
    return array.filter(item => {
      const keyValue = item[key];
      if (seen.has(keyValue)) {
        return false;
      }
      seen.add(keyValue);
      return true;
    });
  },

  /**
   * Sorts array by a property
   * @param array - Array to sort
   * @param key - Property to sort by
   * @param order - Sort order ('asc' or 'desc')
   * @returns New sorted array
   */
  sortBy: <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
    return [...array].sort((a, b) => {
      if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
      return 0;
    });
  },

  /**
   * Divides array into chunks of specified size
   * @param array - Array to chunk
   * @param size - Size of each chunk
   * @returns Array of chunks
   */
  chunk: <T>(array: T[], size: number): T[][] => {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  },

  /**
   * Finds the first item matching a condition
   * @param array - Array to search
   * @param predicate - Condition function
   * @returns First matching item or undefined
   */
  findFirst: <T>(array: T[], predicate: (item: T) => boolean): T | undefined => {
    return array.find(predicate);
  },

  /**
   * Finds the last item matching a condition
   * @param array - Array to search
   * @param predicate - Condition function
   * @returns Last matching item or undefined
   */
  findLast: <T>(array: T[], predicate: (item: T) => boolean): T | undefined => {
    for (let i = array.length - 1; i >= 0; i--) {
      if (predicate(array[i])) {
        return array[i];
      }
    }
    return undefined;
  },

  /**
   * Sums numeric values from array property
   * @param array - Array to sum
   * @param key - Property containing numeric values
   * @returns Sum of all values
   */
  sumBy: <T>(array: T[], key: keyof T): number => {
    return array.reduce((sum, item) => {
      const value = item[key];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  },

  /**
   * Calculates average of numeric values from array property
   * @param array - Array to average
   * @param key - Property containing numeric values
   * @returns Average value or 0 if empty
   */
  averageBy: <T>(array: T[], key: keyof T): number => {
    if (array.length === 0) return 0;
    return arrayHelpers.sumBy(array, key) / array.length;
  },

  /**
   * Checks if array is empty
   * @param array - Array to check
   * @returns true if array is empty or null/undefined
   */
  isEmpty: <T>(array: T[] | null | undefined): boolean => {
    return !array || array.length === 0;
  },

  /**
   * Takes first N items from array
   * @param array - Array to slice
   * @param n - Number of items to take
   * @returns New array with first N items
   */
  take: <T>(array: T[], n: number): T[] => {
    return array.slice(0, n);
  },

  /**
   * Skips first N items and returns rest
   * @param array - Array to slice
   * @param n - Number of items to skip
   * @returns New array without first N items
   */
  skip: <T>(array: T[], n: number): T[] => {
    return array.slice(n);
  }
};
