/**
 * Smart Product Distribution Algorithm
 * 
 * Este algoritmo distribui os produtos de forma aleatória mas inteligente:
 * - Garante que produtos em destaque apareçam no topo
 * - Distribui produtos por categoria para evitar clustering
 * - Usa seed baseado em timestamp para garantir aleatoriedade a cada refresh
 * - Mantém equilíbrio entre produtos novos e antigos
 */

// Gerador pseudo-aleatório com seed
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Fisher-Yates shuffle com seed
function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let currentSeed = seed;
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(currentSeed++) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// Divide produtos em chunks por categoria
function distributeByCategory<T extends { category_id?: string | null }>(
  products: T[],
  seed: number
): T[] {
  // Agrupa por categoria
  const byCategory = new Map<string, T[]>();
  const uncategorized: T[] = [];
  
  products.forEach(product => {
    if (product.category_id) {
      const existing = byCategory.get(product.category_id) || [];
      existing.push(product);
      byCategory.set(product.category_id, existing);
    } else {
      uncategorized.push(product);
    }
  });
  
  // Embaralha cada categoria
  const shuffledCategories = Array.from(byCategory.entries()).map(([catId, items]) => ({
    catId,
    items: seededShuffle(items, seed + catId.charCodeAt(0))
  }));
  
  // Intercala produtos de diferentes categorias
  const result: T[] = [];
  const shuffledCatOrder = seededShuffle(shuffledCategories, seed);
  
  let maxLen = Math.max(...shuffledCatOrder.map(c => c.items.length), uncategorized.length);
  
  for (let i = 0; i < maxLen; i++) {
    shuffledCatOrder.forEach(cat => {
      if (cat.items[i]) {
        result.push(cat.items[i]);
      }
    });
    
    if (uncategorized[i]) {
      result.push(uncategorized[i]);
    }
  }
  
  return result;
}

// Prioriza produtos com base em múltiplos fatores
function calculateProductScore<T extends { 
  is_featured?: boolean;
  created_at?: string;
  sale_price?: number | null;
  price?: number;
  stock_quantity?: number;
}>(product: T, seed: number): number {
  let score = 0;
  
  // PRIORIDADE MÁXIMA: Últimos em estoque (1-5 unidades)
  if (product.stock_quantity !== undefined && product.stock_quantity >= 1 && product.stock_quantity <= 5) {
    score += 500; // Maior prioridade
  }
  
  // PRIORIDADE ALTA: Produtos novos (últimos 3 dias)
  if (product.created_at) {
    const daysSinceCreation = (Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation <= 3) {
      score += 400; // Produtos muito novos
    } else if (daysSinceCreation <= 7) {
      score += 200; // Produtos novos
    }
  }
  
  // Boost para produtos em destaque
  if (product.is_featured) {
    score += 150;
  }
  
  // Boost para produtos em promoção
  if (product.sale_price && product.price && product.sale_price < product.price) {
    score += 50;
  }
  
  // Adiciona aleatoriedade controlada
  score += seededRandom(seed) * 30;
  
  return score;
}

export interface ShuffleOptions {
  prioritizeFeatured?: boolean;
  distributeCategories?: boolean;
  balanceNewProducts?: boolean;
}

/**
 * Função principal de distribuição aleatória inteligente
 */
export function smartShuffleProducts<T extends {
  id: string;
  category_id?: string | null;
  is_featured?: boolean;
  created_at?: string;
  sale_price?: number | null;
  price?: number;
  stock_quantity?: number;
}>(
  products: T[],
  options: ShuffleOptions = {}
): T[] {
  if (products.length === 0) return [];
  
  const {
    prioritizeFeatured = true,
    distributeCategories = true,
    balanceNewProducts = true
  } = options;
  
  // Gera seed baseado no timestamp (muda a cada refresh)
  const seed = Date.now();
  
  // Separa produtos em destaque
  let featured: T[] = [];
  let regular: T[] = [];
  
  if (prioritizeFeatured) {
    featured = products.filter(p => p.is_featured);
    regular = products.filter(p => !p.is_featured);
  } else {
    regular = [...products];
  }
  
  // Embaralha destaques
  featured = seededShuffle(featured, seed);
  
  // Distribui por categoria se habilitado
  if (distributeCategories) {
    regular = distributeByCategory(regular, seed);
  } else {
    regular = seededShuffle(regular, seed);
  }
  
  // Balanceia produtos novos se habilitado
  if (balanceNewProducts) {
    const scored = regular.map((product, index) => ({
      product,
      score: calculateProductScore(product, seed + index)
    }));
    
    // Ordena por score (maior primeiro) mas mantém aleatoriedade
    scored.sort((a, b) => b.score - a.score);
    regular = scored.map(s => s.product);
    
    // Aplica um shuffle final leve para não ficar muito previsível
    const finalShuffle: T[] = [];
    const chunkSize = 4;
    
    for (let i = 0; i < regular.length; i += chunkSize) {
      const chunk = regular.slice(i, i + chunkSize);
      finalShuffle.push(...seededShuffle(chunk, seed + i));
    }
    
    regular = finalShuffle;
  }
  
  // Combina: destaques primeiro, depois regulares
  return [...featured, ...regular];
}

/**
 * Versão simples para shuffle puro (sem lógica de negócio)
 */
export function simpleShuffleProducts<T>(products: T[]): T[] {
  const seed = Date.now();
  return seededShuffle(products, seed);
}

/**
 * Intercala produtos vendidos de forma estratégica entre os disponíveis
 * para criar prova social sem poluir a vitrine
 */
export function interleaveSoldProducts<T extends {
  id: string;
  stock_quantity?: number;
}>(
  products: T[],
  options: {
    soldRatio?: number;      // 1 vendido a cada X disponíveis (default: 5)
    maxSoldPercent?: number; // % máximo de vendidos (default: 20)
    skipFirstN?: number;     // Pular primeiras N posições (default: 6)
  } = {}
): T[] {
  const {
    soldRatio = 5,
    maxSoldPercent = 20,
    skipFirstN = 6
  } = options;
  
  // Separa disponíveis e vendidos
  const available = products.filter(p => (p.stock_quantity ?? 0) > 0);
  const sold = products.filter(p => (p.stock_quantity ?? 0) <= 0);
  
  // Se não tem vendidos ou disponíveis, retorna como está
  if (sold.length === 0) return available;
  if (available.length === 0) return sold;
  
  // Calcula limite de vendidos a incluir
  const maxSold = Math.floor(available.length * (maxSoldPercent / 100));
  const soldToInclude = seededShuffle(sold, Date.now()).slice(0, maxSold);
  
  // Monta lista final intercalando vendidos
  const result: T[] = [];
  let soldIndex = 0;
  let availableCount = 0;
  
  for (let i = 0; i < available.length; i++) {
    result.push(available[i]);
    availableCount++;
    
    // Após skipFirstN e a cada soldRatio, insere um vendido
    if (
      i >= skipFirstN - 1 &&
      availableCount >= soldRatio &&
      soldIndex < soldToInclude.length
    ) {
      result.push(soldToInclude[soldIndex]);
      soldIndex++;
      availableCount = 0;
    }
  }
  
  // Adiciona vendidos restantes ao final (se houver)
  while (soldIndex < soldToInclude.length) {
    result.push(soldToInclude[soldIndex]);
    soldIndex++;
  }
  
  return result;
}
