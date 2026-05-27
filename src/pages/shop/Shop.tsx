import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { ShopLayout } from '@/components/shop/public/ShopLayout';
import { ShopProductGrid } from '@/components/shop/public/ShopProductGrid';
import { ShopMobileProductGridInfinite } from '@/components/shop/mobile/ShopMobileProductGridInfinite';
import { InteractiveProductsSection } from '@/components/shop/public/InteractiveProductsSection';
import { ShopMobileInteractiveCarousel } from '@/components/shop/mobile/ShopMobileInteractiveCarousel';
import { ShopHeroCarousel } from '@/components/shop/public/ShopHeroCarousel';
import { ShopCategoriesSection } from '@/components/shop/public/ShopCategoriesSection';
import { ShopFilterSidebar, ShopSortDropdown, ShopActiveFilters, ShopMobileFilterBar } from '@/components/shop/filters';
import { useShopProducts } from '@/hooks/useShopProducts';
import { useShopConfig } from '@/hooks/useShopConfig';
import { useShopCategories } from '@/hooks/useShopCategories';
import { useActiveInteractiveEvents } from '@/hooks/useInteractiveEvents';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMemo, useState } from 'react';
import { smartShuffleProducts, interleaveSoldProducts } from '@/lib/productShuffle';

export default function Shop() {
  const [searchParams] = useSearchParams();
  const { data: config } = useShopConfig();
  const { data: allProducts = [], isLoading } = useShopProducts({ onlyVisible: true });
  const { data: categories = [] } = useShopCategories();
  const { data: activeEvents = [] } = useActiveInteractiveEvents();
  const isMobile = useIsMobile();
  
  // Seed para garantir que a ordem muda a cada refresh
  const [shuffleSeed] = useState(() => Date.now());

  // Obter query de busca e filtros da URL
  const searchQuery = searchParams.get('q') || '';
  const selectedCategorySlug = searchParams.get('category');
  const selectedCondition = searchParams.get('condition');
  const selectedDiscount = searchParams.get('discount');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const sortBy = searchParams.get('sort') || 'relevance';
  const filterType = searchParams.get('filter'); // 'new' para novos produtos

  // Encontrar categoria selecionada
  const selectedCategory = useMemo(() => {
    if (!selectedCategorySlug) return null;
    return categories.find(c => c.slug === selectedCategorySlug) || null;
  }, [selectedCategorySlug, categories]);

  // Filtrar produtos com base em todos os filtros
  const filteredProducts = useMemo(() => {
    let products = allProducts;
    
    // Filtrar por novos (últimos 5 dias)
    if (filterType === 'new') {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      products = products.filter(product => {
        const createdAt = new Date(product.created_at);
        return createdAt >= fiveDaysAgo;
      });
    }
    
    // Filtrar por categoria
    if (selectedCategory) {
      products = products.filter(product => product.category_id === selectedCategory.id);
    }
    
    // Filtrar por condição
    if (selectedCondition) {
      products = products.filter(product => product.condition === selectedCondition);
    }
    
    // Filtrar por faixa de preço
    if (minPrice) {
      const min = parseFloat(minPrice);
      products = products.filter(product => {
        const price = product.sale_price || product.price;
        return price >= min;
      });
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      products = products.filter(product => {
        const price = product.sale_price || product.price;
        return price <= max;
      });
    }
    
    // Filtrar por desconto mínimo
    if (selectedDiscount) {
      const minDiscount = parseInt(selectedDiscount);
      products = products.filter(product => {
        if (!product.sale_price || product.sale_price >= product.price) return false;
        const discount = Math.round((1 - product.sale_price / product.price) * 100);
        return discount >= minDiscount;
      });
    }
    
    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      products = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.short_description?.toLowerCase().includes(query) ||
        product.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return products;
  }, [allProducts, searchQuery, selectedCategory, selectedCondition, minPrice, maxPrice, selectedDiscount, filterType]);

  // Ordenar produtos
  const sortedProducts = useMemo(() => {
    let products = [...filteredProducts];
    
    switch (sortBy) {
      case 'price_asc':
        products.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
        break;
      case 'price_desc':
        products.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
        break;
      case 'newest':
        products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'discount':
        products.sort((a, b) => {
          const discountA = a.sale_price ? (1 - a.sale_price / a.price) * 100 : 0;
          const discountB = b.sale_price ? (1 - b.sale_price / b.price) * 100 : 0;
          return discountB - discountA;
        });
        break;
      default:
        // relevance - prioriza featured e depois embaralha
        break;
    }
    
    return products;
  }, [filteredProducts, sortBy]);

  // Separar produtos por tipo de venda e aplicar shuffle inteligente
  const normalProducts = useMemo(() => {
    const products = sortedProducts.filter(p => p.sale_type === 'normal');
    // Aplica distribuição aleatória inteligente quando não há filtro ativo e é ordenação por relevância
    if (!searchQuery.trim() && !selectedCategory && !selectedCondition && !minPrice && !maxPrice && !selectedDiscount && sortBy === 'relevance') {
      // Primeiro aplica shuffle inteligente
      const shuffled = smartShuffleProducts(products, {
        prioritizeFeatured: false,
        distributeCategories: true,
        balanceNewProducts: true
      });
      
      // Depois intercala vendidos de forma estratégica
      return interleaveSoldProducts(shuffled, {
        soldRatio: 5,        // 1 vendido a cada 5 disponíveis
        maxSoldPercent: 20,  // Máximo 20% de vendidos
        skipFirstN: 6        // Pular primeiros 6 slots
      });
    }
    return products;
  }, [sortedProducts, searchQuery, selectedCategory, selectedCondition, minPrice, maxPrice, selectedDiscount, sortBy, shuffleSeed]);

  const featuredProducts = useMemo(() => {
    const products = sortedProducts.filter(p => p.is_featured && p.sale_type === 'normal');
    if (!searchQuery.trim() && !selectedCategory && sortBy === 'relevance') {
      return smartShuffleProducts(products, {
        prioritizeFeatured: false,
        distributeCategories: true,
        balanceNewProducts: false
      });
    }
    return products;
  }, [sortedProducts, searchQuery, selectedCategory, sortBy, shuffleSeed]);

  const primaryColor = config?.primary_color || '#10B981';

  // SEO meta tags dinâmicas
  const storeName = config?.store_name || 'Loja XLata';
  const pageTitle = selectedCategory 
    ? `${selectedCategory.name} | ${storeName}`
    : storeName;
  const metaDescription = (config as any)?.footer_config?.about_text 
    || config?.tagline 
    || 'Loja de usados com ofertas exclusivas em Vila Galvão. Móveis, eletrodomésticos, ferramentas e muito mais com os melhores preços.';
  const canonicalUrl = 'https://xlata.shop/shop';
  const ogImage = config?.store_logo 
    || (config?.hero_slides?.[0] as any)?.image_url 
    || 'https://xlata.shop/lovable-uploads/XLATALOGO.png';

  // Verificar se há algum filtro ativo
  const isSearchActive = searchQuery.trim().length > 0;
  const isCategoryActive = !!selectedCategory;
  const isNewFilterActive = filterType === 'new';
  const isFilterActive = isSearchActive || isCategoryActive || !!selectedCondition || !!minPrice || !!maxPrice || !!selectedDiscount || isNewFilterActive;

  // Título dinâmico baseado no contexto
  const getGridTitle = () => {
    if (isSearchActive) return "🔍 Resultados";
    if (isCategoryActive) return `📦 ${selectedCategory?.name}`;
    if (isNewFilterActive) return "✨ Novidades";
    return "🛒 Todos os Produtos";
  };

  const getGridSubtitle = () => {
    if (isSearchActive) return undefined;
    if (isCategoryActive) return `${normalProducts.length} produto${normalProducts.length !== 1 ? 's' : ''} nesta categoria`;
    if (isNewFilterActive) return `${normalProducts.length} produto${normalProducts.length !== 1 ? 's' : ''} adicionado${normalProducts.length !== 1 ? 's' : ''} nos últimos 5 dias`;
    return "Confira nossa seleção";
  };

  return (
    <ShopLayout showFooterSections={!isFilterActive}>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content={storeName} />
        <meta property="og:locale" content="pt_BR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={ogImage} />

        <link rel="manifest" href="/shop-manifest.webmanifest" />
        <meta name="theme-color" content={primaryColor} />
      </Helmet>

      {/* Hero Carousel - sempre visível */}
      <ShopHeroCarousel slides={config?.hero_slides || []} />

      {/* Categories Section - sempre visível */}
      <ShopCategoriesSection />

      {/* Seções especiais só aparecem quando não há filtro ativo */}
      {!isFilterActive && (
        <>
          {/* Produtos Interativos - Carrossel no Mobile */}
          {isMobile ? (
            <ShopMobileInteractiveCarousel events={activeEvents} />
          ) : (
            <InteractiveProductsSection />
          )}
        </>
      )}

      {/* Layout com sidebar de filtros no Desktop */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Barra de ordenação e filtros ativos */}
        {isMobile ? (
          <ShopMobileFilterBar
            categories={categories}
            products={allProducts}
            totalResults={normalProducts.length}
          />
        ) : (
          <div className="py-4 flex flex-col gap-3">
            {/* Header com resultados e ordenação */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {normalProducts.length.toLocaleString('pt-BR')} {normalProducts.length === 1 ? 'resultado' : 'resultados'}
              </span>
              <ShopSortDropdown />
            </div>

            {/* Filtros ativos */}
            <ShopActiveFilters categories={categories} />
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar de filtros - apenas desktop */}
          {!isMobile && (
            <ShopFilterSidebar
              categories={categories}
              products={allProducts}
              totalResults={normalProducts.length}
            />
          )}

          {/* Grid de produtos */}
          <div className="flex-1 min-w-0">
            {/* Resultado da busca */}
            {isSearchActive && filteredProducts.length === 0 && (
              <div className="py-8 text-center bg-gray-50 rounded-lg">
                <p className="text-gray-600">
                  Nenhum resultado encontrado para "<strong>{searchQuery}</strong>"
                </p>
              </div>
            )}

            {/* Featured Products - só quando não há filtro */}
            {!isFilterActive && featuredProducts.length > 0 && (
              isMobile ? (
                <ShopMobileProductGridInfinite
                  products={featuredProducts}
                  title="✨ Destaques"
                  subtitle="Selecionados para você"
                  initialLimit={6}
                  loadMoreStep={4}
                />
              ) : (
                <ShopProductGrid
                  products={featuredProducts}
                  title="✨ Destaques para Você"
                  subtitle="Os melhores produtos selecionados"
                />
              )
            )}

            {/* Products Grid com infinite scroll */}
            {isLoading ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">Carregando produtos...</p>
              </div>
            ) : (
              isMobile ? (
                <ShopMobileProductGridInfinite
                  products={normalProducts}
                  title={getGridTitle()}
                  subtitle={getGridSubtitle()}
                  emptyMessage={isFilterActive ? "Nenhum produto encontrado" : "Em breve novos produtos"}
                  initialLimit={20}
                  loadMoreStep={10}
                />
              ) : (
                <ShopProductGrid
                  products={normalProducts}
                  title={isSearchActive ? "🔍 Resultados da Busca" : isCategoryActive ? `📦 ${selectedCategory?.name}` : "🛒 Todos os Produtos"}
                  subtitle={getGridSubtitle()}
                  emptyMessage={isFilterActive ? "Nenhum produto encontrado" : "Em breve novos produtos"}
                />
              )
            )}
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
