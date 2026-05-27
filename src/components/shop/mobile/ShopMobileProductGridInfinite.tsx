import { useState, useEffect, useRef, useCallback } from 'react';
import { ShopMobileProductCard } from './ShopMobileProductCard';
import { Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price?: number | null;
  images?: string[] | null;
  is_featured?: boolean;
  sale_type?: string;
  stock_quantity: number;
  condition?: 'novo' | 'usado' | 'no_estado' | null;
  sold_count?: number;
  view_count?: number;
}

interface InteractiveEvent {
  product_id: string;
  ends_at: string;
}

interface ShopMobileProductGridInfiniteProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  activeEvents?: InteractiveEvent[];
  initialLimit?: number;
  loadMoreStep?: number;
}

export function ShopMobileProductGridInfinite({ 
  products, 
  title, 
  subtitle, 
  emptyMessage = 'Nenhum produto encontrado',
  activeEvents = [],
  initialLimit = 20,
  loadMoreStep = 10
}: ShopMobileProductGridInfiniteProps) {
  const [visibleCount, setVisibleCount] = useState(initialLimit);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  // Intersection Observer para infinite scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !isLoading) {
      setIsLoading(true);
      
      // Simular pequeno delay para UX mais suave
      loadingTimeoutRef.current = setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + loadMoreStep, products.length));
        setIsLoading(false);
      }, 300);
    }
  }, [hasMore, isLoading, loadMoreStep, products.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      observer.disconnect();
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [handleObserver]);

  // Reset quando produtos mudam
  useEffect(() => {
    setVisibleCount(initialLimit);
  }, [products, initialLimit]);

  const getEventForProduct = (productId: string) => {
    return activeEvents.find(e => e.product_id === productId);
  };

  if (products.length === 0) {
    return (
      <section className="px-4 py-8">
        {title && (
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        )}
        <div className="text-center py-8 text-gray-500">
          <p>{emptyMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-3 py-4">
      {title && (
        <div className="mb-3 px-1 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <span className="text-xs text-gray-400">
            {visibleProducts.length} de {products.length}
          </span>
        </div>
      )}
      
      {/* Grid 2 colunas fixo */}
      <div className="grid grid-cols-2 gap-2.5">
        {visibleProducts.map((product) => {
          const event = getEventForProduct(product.id);
          const isInteractive = product.sale_type === 'interactive' && !!event;
          
          return (
            <ShopMobileProductCard
              key={product.id}
              product={product}
              isInteractive={isInteractive}
              eventEndsAt={event?.ends_at}
            />
          );
        })}
      </div>

      {/* Loading indicator e trigger para infinite scroll */}
      {hasMore && (
        <div 
          ref={observerRef} 
          className="flex items-center justify-center py-6"
        >
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Carregando mais produtos...</span>
            </div>
          ) : (
            <div className="h-4" /> 
          )}
        </div>
      )}

      {/* Fim da lista */}
      {!hasMore && products.length > initialLimit && (
        <div className="text-center py-4 text-xs text-gray-400">
          Você viu todos os {products.length} produtos
        </div>
      )}
    </section>
  );
}
