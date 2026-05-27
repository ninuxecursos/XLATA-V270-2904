import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  images: string[] | null;
  category_id: string | null;
  tags: string[] | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  condition: string | null;
  sale_type: string;
}

interface RecommendationContext {
  currentProductId: string;
  categoryId?: string | null;
  tags?: string[] | null;
  priceRange?: { min: number; max: number };
}

/**
 * Algoritmo de recomendação inteligente que:
 * 1. Prioriza produtos da mesma categoria
 * 2. Considera tags similares
 * 3. Mantém faixa de preço próxima
 * 4. Intercala produtos de outras categorias para variedade
 * 5. Destaca produtos em promoção e featured
 * 6. Usa seed baseada em timestamp para variar a cada sessão
 */
function createSmartRecommendations(
  allProducts: Product[],
  context: RecommendationContext,
  maxItems: number = 12
): Product[] {
  const { currentProductId, categoryId, tags, priceRange } = context;
  
  // Filtrar produto atual e inativos
  const availableProducts = allProducts.filter(
    p => p.id !== currentProductId && p.is_active && p.stock_quantity > 0
  );

  if (availableProducts.length === 0) return [];

  // Sistema de pontuação para cada produto
  const scoredProducts = availableProducts.map(product => {
    let score = 0;
    let reasons: string[] = [];

    // 1. Mesma categoria (alta relevância)
    if (categoryId && product.category_id === categoryId) {
      score += 50;
      reasons.push('same_category');
    }

    // 2. Tags similares (média-alta relevância)
    if (tags && tags.length > 0 && product.tags && product.tags.length > 0) {
      const matchingTags = tags.filter(tag => 
        product.tags?.some(pTag => 
          pTag.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(pTag.toLowerCase())
        )
      );
      score += matchingTags.length * 15;
      if (matchingTags.length > 0) reasons.push('matching_tags');
    }

    // 3. Faixa de preço similar (±50%)
    if (priceRange) {
      const productPrice = product.sale_price || product.price;
      const targetPrice = (priceRange.min + priceRange.max) / 2;
      const priceRatio = productPrice / targetPrice;
      
      if (priceRatio >= 0.5 && priceRatio <= 1.5) {
        score += 20;
        reasons.push('similar_price');
      } else if (priceRatio >= 0.3 && priceRatio <= 2) {
        score += 10;
        reasons.push('close_price');
      }
    }

    // 4. Produto em destaque
    if (product.is_featured) {
      score += 25;
      reasons.push('featured');
    }

    // 5. Produto em promoção
    if (product.sale_price && product.sale_price < product.price) {
      score += 20;
      reasons.push('on_sale');
    }

    // 6. Mesma condição (novo/usado)
    // Usuários interessados em usados geralmente preferem usados (economia)
    // Pequeno boost se for a mesma condição

    // 7. Boost aleatório para variedade (evita monotonia)
    const randomBoost = Math.random() * 15;
    score += randomBoost;

    return { product, score, reasons };
  });

  // Ordenar por score decrescente
  scoredProducts.sort((a, b) => b.score - a.score);

  // Estratégia anti-monotonia: intercalar categorias
  const selectedProducts: Product[] = [];
  const usedCategories = new Set<string>();
  let categoryStreak = 0;
  const maxCategoryStreak = 2; // Máximo 2 produtos seguidos da mesma categoria

  // Primeira passada: pegar os melhores, respeitando limite de categoria
  for (const { product } of scoredProducts) {
    if (selectedProducts.length >= maxItems) break;

    const prodCategory = product.category_id || 'uncategorized';
    
    // Verificar streak de categoria
    if (selectedProducts.length > 0) {
      const lastProduct = selectedProducts[selectedProducts.length - 1];
      const lastCategory = lastProduct.category_id || 'uncategorized';
      
      if (lastCategory === prodCategory) {
        categoryStreak++;
        if (categoryStreak >= maxCategoryStreak) {
          continue; // Pular para evitar monotonia
        }
      } else {
        categoryStreak = 0;
      }
    }

    selectedProducts.push(product);
    usedCategories.add(prodCategory);
  }

  // Segunda passada: preencher slots restantes se necessário
  if (selectedProducts.length < maxItems) {
    for (const { product } of scoredProducts) {
      if (selectedProducts.length >= maxItems) break;
      if (selectedProducts.some(p => p.id === product.id)) continue;
      selectedProducts.push(product);
    }
  }

  // Shuffle final leve baseado em timestamp para variar entre sessões
  const sessionSeed = Math.floor(Date.now() / (1000 * 60 * 5)); // Muda a cada 5 minutos
  const shuffled = selectedProducts.map((product, index) => ({
    product,
    sortKey: Math.sin(sessionSeed + index) * 10000
  }));
  
  // Aplicar apenas um leve shuffle (mantém relevância mas adiciona variedade)
  shuffled.sort((a, b) => {
    // Manter os 3 primeiros mais ou menos fixos (mais relevantes)
    const aIndex = selectedProducts.indexOf(a.product);
    const bIndex = selectedProducts.indexOf(b.product);
    if (aIndex < 3 && bIndex >= 3) return -1;
    if (bIndex < 3 && aIndex >= 3) return 1;
    return a.sortKey - b.sortKey;
  });

  return shuffled.map(s => s.product);
}

export function useProductRecommendations(
  currentProductId: string | undefined,
  categoryId?: string | null,
  tags?: string[] | null,
  price?: number
) {
  return useQuery({
    queryKey: ['product-recommendations', currentProductId, categoryId],
    queryFn: async () => {
      if (!currentProductId) return [];

      // Buscar todos os produtos ativos
      const { data: products, error } = await supabase
        .from('shop_products')
        .select('id, name, slug, price, sale_price, images, category_id, tags, stock_quantity, is_active, is_featured, condition, sale_type')
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('is_featured', { ascending: false });

      if (error) throw error;

      // Cast para o tipo correto
      const typedProducts = (products || []) as unknown as Product[];

      const context: RecommendationContext = {
        currentProductId,
        categoryId,
        tags,
        priceRange: price ? { min: price * 0.5, max: price * 2 } : undefined
      };

      return createSmartRecommendations(typedProducts, context, 12);
    },
    enabled: !!currentProductId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
