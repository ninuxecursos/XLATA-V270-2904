import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { ShopLayout } from '@/components/shop/public/ShopLayout';
import { useShopConfig } from '@/hooks/useShopConfig';
import { supabase } from '@/integrations/supabase/client';
import { Zap, AlertCircle, Loader2 } from 'lucide-react';
import { ShopMobileProductCard } from '@/components/shop/mobile/ShopMobileProductCard';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price?: number | null;
  images: string[] | null;
  stock_quantity: number;
  sale_type: string;
  is_featured?: boolean;
  condition?: 'novo' | 'usado' | 'no_estado' | null;
  view_count?: number;
}

const INITIAL_LOAD = 40;
const LOAD_MORE = 20;

export default function ShopInteractiveOffers() {
  const { data: config } = useShopConfig();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const primaryColor = config?.colors?.primary || '#10B981';

  // Fetch initial products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('shop_products')
        .select('id, name, slug, price, sale_price, images, stock_quantity, sale_type, is_featured, condition, view_count')
        .eq('is_active', true)
        .eq('sale_type', 'interactive')
        .order('created_at', { ascending: false })
        .range(0, INITIAL_LOAD - 1);

      if (!error && data) {
        setProducts(data.map(p => ({
          ...p,
          images: Array.isArray(p.images) ? p.images as string[] : null,
          condition: p.condition as 'novo' | 'usado' | 'no_estado' | null,
          view_count: p.view_count ?? 0
        })));
        setOffset(data.length);
        setHasMore(data.length === INITIAL_LOAD);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, offset]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const { data, error } = await supabase
      .from('shop_products')
      .select('id, name, slug, price, sale_price, images, stock_quantity, sale_type, is_featured, condition, view_count')
      .eq('is_active', true)
      .eq('sale_type', 'interactive')
      .order('created_at', { ascending: false })
      .range(offset, offset + LOAD_MORE - 1);

    if (!error && data) {
      setProducts(prev => [...prev, ...data.map(p => ({
        ...p,
        images: Array.isArray(p.images) ? p.images as string[] : null,
        condition: p.condition as 'novo' | 'usado' | 'no_estado' | null,
        view_count: p.view_count ?? 0
      }))]);
      setOffset(prev => prev + data.length);
      setHasMore(data.length === LOAD_MORE);
    }
    setLoadingMore(false);
  };

  return (
    <ShopLayout hideBottomNav>
      <Helmet>
        <title>Ofertas Interativas | {config?.store_name || 'Loja'}</title>
        <meta name="description" content="Participe das nossas ofertas interativas e aproveite preços especiais!" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div 
          className="py-8 md:py-12 px-4"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Zap className="w-8 h-8 text-white" />
              <h1 className="text-2xl md:text-4xl font-bold text-white">
                Ofertas Interativas
              </h1>
            </div>
            <p className="text-white/90 text-sm md:text-lg max-w-2xl mx-auto">
              Participe das nossas ofertas em tempo real e faça sua proposta!
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Nenhuma oferta interativa no momento
              </h2>
              <p className="text-gray-500 max-w-md">
                Volte em breve! Novas ofertas interativas são adicionadas frequentemente.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">
                  {products.length} produto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {products.map((product) => (
                  <ShopMobileProductCard
                    key={product.id}
                    product={product}
                    isInteractive={true}
                  />
                ))}
              </div>

              {/* Load More Trigger */}
              <div ref={loadMoreRef} className="py-8 flex justify-center">
                {loadingMore && (
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
                )}
                {!hasMore && products.length > 0 && (
                  <p className="text-sm text-gray-400">Você viu todas as ofertas interativas</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ShopLayout>
  );
}
