// Intelligent material matching and suggestion system
import { getCanonicalKey, areMaterialsEquivalent, normalizeMaterialName } from './materialNormalization';
import { getSimilarStrings, stringSimilarity } from './stringSimilarity';

export interface MaterialSuggestion {
  id: string;
  name: string;
  canonicalKey: string;
  similarity: number;
  isExactMatch: boolean;
}

export interface MaterialMatch {
  exactMatch?: MaterialSuggestion;
  suggestions: MaterialSuggestion[];
}

/**
 * Finds matching materials based on name input
 */
export const findMaterialMatches = (
  inputName: string,
  existingMaterials: Array<{ id: string; name: string; }>
): MaterialMatch => {
  if (!inputName || !existingMaterials.length) {
    return { suggestions: [] };
  }

  const inputCanonicalKey = getCanonicalKey(inputName);
  const inputNormalized = normalizeMaterialName(inputName);
  
  const exactMatch = existingMaterials.find(material => 
    areMaterialsEquivalent(material.name, inputName)
  );

  if (exactMatch) {
    return {
      exactMatch: {
        id: exactMatch.id,
        name: exactMatch.name,
        canonicalKey: getCanonicalKey(exactMatch.name),
        similarity: 1.0,
        isExactMatch: true
      },
      suggestions: []
    };
  }

  // Find similar materials
  const materialNames = existingMaterials.map(m => m.name);
  const similarMatches = getSimilarStrings(inputNormalized, materialNames, 0.6);
  
  const suggestions: MaterialSuggestion[] = similarMatches
    .slice(0, 5) // Limit to top 5 suggestions
    .map(match => {
      const material = existingMaterials.find(m => m.name === match.match)!;
      return {
        id: material.id,
        name: material.name,
        canonicalKey: getCanonicalKey(material.name),
        similarity: match.similarity,
        isExactMatch: false
      };
    });

  return { suggestions };
};

/**
 * Checks if a material name would create a duplicate
 */
export const wouldCreateDuplicate = (
  inputName: string,
  existingMaterials: Array<{ id: string; name: string; }>,
  excludeId?: string
): boolean => {
  const relevantMaterials = excludeId 
    ? existingMaterials.filter(m => m.id !== excludeId)
    : existingMaterials;
    
  return relevantMaterials.some(material => 
    areMaterialsEquivalent(material.name, inputName)
  );
};

/**
 * Gets canonical material from a list based on name
 */
export const getCanonicalMaterial = (
  materialName: string,
  materials: Array<{ id: string; name: string; }>
): { id: string; name: string; } | null => {
  return materials.find(material => 
    areMaterialsEquivalent(material.name, materialName)
  ) || null;
};

/**
 * Groups materials by canonical key (for duplicate detection)
 */
export const groupMaterialsByCanonicalKey = (
  materials: Array<{ id: string; name: string; }>
): Record<string, Array<{ id: string; name: string; canonicalKey: string; }>> => {
  const groups: Record<string, Array<{ id: string; name: string; canonicalKey: string; }>> = {};
  
  materials.forEach(material => {
    const canonicalKey = getCanonicalKey(material.name);
    if (!groups[canonicalKey]) {
      groups[canonicalKey] = [];
    }
    groups[canonicalKey].push({
      ...material,
      canonicalKey
    });
  });
  
  return groups;
};

/**
 * Finds duplicate material groups
 */
export const findDuplicateMaterialGroups = (
  materials: Array<{ id: string; name: string; }>
): Array<{ canonicalKey: string; materials: Array<{ id: string; name: string; }> }> => {
  const groups = groupMaterialsByCanonicalKey(materials);
  
  return Object.entries(groups)
    .filter(([_, materialList]) => materialList.length > 1)
    .map(([canonicalKey, materialList]) => ({
      canonicalKey,
      materials: materialList.map(({ id, name }) => ({ id, name }))
    }));
};