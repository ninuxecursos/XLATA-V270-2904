// Enhanced material name normalization with intelligent matching
export const MATERIAL_SYNONYMS: Record<string, string[]> = {
  'ferro': ['ferro', 'fe', 'iron'],
  'aluminio': ['aluminio', 'alumínio', 'al', 'aluminum'],
  'cobre': ['cobre', 'cu', 'copper'],
  'lata': ['lata', 'latinhas', 'alumínio lata'],
  'papel': ['papel', 'papelao', 'papelão', 'cardboard'],
  'plastico': ['plastico', 'plástico', 'plastic'],
  'vidro': ['vidro', 'glass'],
  'miudo': ['miudo', 'miúdo', 'miuda', 'miúda', 'pequeno', 'fino'],
  'grosso': ['grosso', 'pesado', 'grande', 'espesso'],
  'chapa': ['chapa', 'folha', 'lamina', 'lâmina'],
  'fio': ['fio', 'cabo', 'wire'],
  'sucata': ['sucata', 'scrap', 'resto']
};

/**
 * Normalizes a material name for consistent comparison
 */
export const normalizeMaterialName = (name: string): string => {
  if (!name || typeof name !== 'string') {
    return '';
  }

  let normalized = name.toLowerCase().trim();
  
  // Remove extra spaces and replace multiple spaces with single space
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Remove special characters and accents
  normalized = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ') // Clean up multiple spaces
    .trim();
  
  // Remove ONLY isolated trailing zeros (e.g., " 0" at end), NOT zeros that are part of numbers
  // This preserves names like "Inox 304", "Cobre 10", "Cobre 1" while removing "Material 0"
  if (normalized.match(/\s0$/)) {
    normalized = normalized.replace(/\s0$/, '').trim();
  }
  
  return normalized;
};

/**
 * Applies synonym mapping to find canonical form
 */
export const applySynonyms = (normalizedName: string): string => {
  const words = normalizedName.split(' ');
  
  const mappedWords = words.map(word => {
    for (const [canonical, synonyms] of Object.entries(MATERIAL_SYNONYMS)) {
      if (synonyms.includes(word)) {
        return canonical;
      }
    }
    return word;
  });
  
  return mappedWords.join(' ').trim();
};

/**
 * Gets the canonical key for a material name
 * NOTE: We do NOT sort words alphabetically as this breaks matching
 * for names like "Cobre 1", "Ferro pesado", etc.
 */
export const getCanonicalKey = (materialName: string): string => {
  const normalized = normalizeMaterialName(materialName);
  const withSynonyms = applySynonyms(normalized);
  
  // Keep original word order - DO NOT sort alphabetically
  return withSynonyms;
};

/**
 * Checks if two material names are equivalent
 */
export const areMaterialsEquivalent = (name1: string, name2: string): boolean => {
  if (!name1 || !name2) return false;
  
  // 1. First try exact match (case-insensitive, normalized spaces)
  const clean1 = name1.toLowerCase().trim().replace(/\s+/g, ' ');
  const clean2 = name2.toLowerCase().trim().replace(/\s+/g, ' ');
  if (clean1 === clean2) return true;
  
  // 2. Fall back to canonical key comparison (for synonyms)
  const key1 = getCanonicalKey(name1);
  const key2 = getCanonicalKey(name2);
  
  return key1 === key2;
};

/**
 * Gets display name for a material (keeps original formatting but cleaned)
 */
export const getDisplayName = (materialName: string): string => {
  if (!materialName || typeof materialName !== 'string') {
    return materialName;
  }
  
  // Clean but preserve original case and formatting
  let cleaned = materialName.trim().replace(/\s+/g, ' ');
  
  // Remove ONLY isolated trailing zero (e.g., " 0"), NOT zeros that are part of numbers
  if (cleaned.match(/\s0$/)) {
    cleaned = cleaned.replace(/\s0$/, '').trim();
  }
  
  return cleaned;
};