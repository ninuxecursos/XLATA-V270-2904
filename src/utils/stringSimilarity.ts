// String similarity utilities for fuzzy material matching

/**
 * Calculates Levenshtein distance between two strings
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  if (!str1 || !str2) return Math.max(str1?.length || 0, str2?.length || 0);
  
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Calculates similarity ratio between two strings (0-1, 1 being identical)
 */
export const stringSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return (maxLength - distance) / maxLength;
};

/**
 * Finds the most similar string from a list
 */
export const findMostSimilar = (
  target: string,
  candidates: string[],
  minSimilarity: number = 0.7
): { match: string; similarity: number } | null => {
  if (!target || !candidates.length) return null;
  
  let bestMatch = '';
  let bestSimilarity = 0;
  
  for (const candidate of candidates) {
    const similarity = stringSimilarity(target, candidate);
    if (similarity > bestSimilarity && similarity >= minSimilarity) {
      bestSimilarity = similarity;
      bestMatch = candidate;
    }
  }
  
  return bestSimilarity >= minSimilarity 
    ? { match: bestMatch, similarity: bestSimilarity }
    : null;
};

/**
 * Gets all candidates above similarity threshold
 */
export const getSimilarStrings = (
  target: string,
  candidates: string[],
  minSimilarity: number = 0.6
): Array<{ match: string; similarity: number }> => {
  if (!target || !candidates.length) return [];
  
  return candidates
    .map(candidate => ({
      match: candidate,
      similarity: stringSimilarity(target, candidate)
    }))
    .filter(result => result.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity);
};