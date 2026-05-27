import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, Star } from 'lucide-react';
import { useProductRecommendations } from '@/hooks/useProductRecommendations';
import { useProductRatingStats } from '@/hooks/useProductReviews';
import { cn } from '@/lib/utils';

interface ProductSuggestionsProps {
  currentProductId: string;
  categoryId?: string | null;
  tags?: string[] | null;
  price?: number;
  primaryColor?: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Mini card de produto para sugestões
function SuggestionCard({ 
  product, 
  primaryColor 
}: { 
  product: any; 
  primaryColor: string;
}) {
  const { data: stats } = useProductRatingStats(product.id);
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : 0;

  const imageUrl = product.images?.[0] || '/placeholder.svg';

  return (
    <Link 
      to={`/shop/${product.slug}`}
      className="flex-shrink-0 w-[160px] sm:w-[180px] group"
    >
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <img 
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          
          {/* Badge de desconto */}
          {hasDiscount && (
            <div 
              className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              -{discountPercent}%
            </div>
          )}

          {/* Badge featured */}
          {product.is_featured && !hasDiscount && (
            <div 
              className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white flex items-center gap-1"
              style={{ backgroundColor: primaryColor }}
            >
              <Sparkles className="w-3 h-3" />
              Destaque
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-gray-700">
            {product.name}
          </h3>

          {/* Rating */}
          {stats && stats.review_count > 0 && (
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-600">
                {stats.average_rating} ({stats.review_count})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mt-auto">
            {hasDiscount ? (
              <>
                <span className="text-xs text-gray-400 line-through block">
                  {formatCurrency(product.price)}
                </span>
                <span 
                  className="text-sm font-bold"
                  style={{ color: primaryColor }}
                >
                  {formatCurrency(product.sale_price)}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProductSuggestions({ 
  currentProductId, 
  categoryId, 
  tags, 
  price,
  primaryColor = '#10B981' 
}: ProductSuggestionsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  const { data: products = [], isLoading } = useProductRecommendations(
    currentProductId,
    categoryId,
    tags,
    price
  );

  // Verificar scroll buttons
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [products]);

  // Auto-scroll suave
  useEffect(() => {
    if (isPaused || products.length <= 3) return;

    const container = scrollRef.current;
    if (!container) return;

    const scrollSpeed = 0.5; // pixels por frame
    let animationId: number;
    let direction = 1; // 1 = direita, -1 = esquerda

    const autoScroll = () => {
      if (!container || isPaused) return;

      const { scrollLeft, scrollWidth, clientWidth } = container;
      const maxScroll = scrollWidth - clientWidth;

      // Inverter direção nos limites
      if (scrollLeft >= maxScroll - 1) {
        direction = -1;
      } else if (scrollLeft <= 1) {
        direction = 1;
      }

      container.scrollLeft += scrollSpeed * direction;
      animationId = requestAnimationFrame(autoScroll);
    };

    // Iniciar após delay
    const timeoutId = setTimeout(() => {
      animationId = requestAnimationFrame(autoScroll);
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isPaused, products.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-[160px] flex-shrink-0">
              <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 bg-gray-200 rounded mt-2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded mt-1 w-2/3 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div 
        className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between"
        style={{ backgroundColor: `${primaryColor}08` }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
          <h3 className="font-bold text-gray-900">Você também pode gostar</h3>
        </div>

        {/* Navigation buttons - desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              canScrollLeft 
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700" 
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              canScrollRight 
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700" 
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Products carousel */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto p-4 sm:p-6 scrollbar-hide scroll-smooth"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 2000)}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map(product => (
          <SuggestionCard 
            key={product.id} 
            product={product} 
            primaryColor={primaryColor}
          />
        ))}
      </div>
    </div>
  );
}
