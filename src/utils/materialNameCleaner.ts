// Utility function to clean material names by removing ONLY isolated trailing " 0"
// This preserves names like "Cobre 10", "Inox 304", "Cobre 1" while removing "Material 0"
export const cleanMaterialName = (materialName: string): string => {
  if (!materialName || typeof materialName !== 'string') {
    return materialName;
  }
  
  // Trim whitespace and normalize multiple spaces
  let cleanedName = materialName.trim().replace(/\s+/g, ' ');
  
  // ONLY remove pattern where name ends with space + single zero (e.g., "Material 0")
  // Do NOT remove zeros that are part of numbers like "Cobre 10", "Inox 304"
  if (cleanedName.match(/\s0$/)) {
    cleanedName = cleanedName.replace(/\s0$/, '').trim();
  }
  
  return cleanedName;
};

// Function to clean all material names in order items
export const cleanOrderItemNames = (items: any[]): any[] => {
  if (!items || !Array.isArray(items)) {
    return items;
  }
  
  return items.map(item => ({
    ...item,
    materialName: cleanMaterialName(item.materialName)
  }));
};
