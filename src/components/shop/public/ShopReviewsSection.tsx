import { useState, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShopReview, ShopColors } from '@/hooks/useShopConfig';

interface ShopReviewsSectionProps {
  reviews: ShopReview[];
  colors?: ShopColors;
}

function ReviewCard({ review, colors }: { review: ShopReview; colors?: ShopColors }) {
  const initials = review.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div 
      className="flex-shrink-0 w-[280px] md:w-auto md:flex-1 p-4 rounded-xl shadow-sm shop-review-card"
      style={{ 
        backgroundColor: colors?.surface || '#FFFFFF',
        border: `1px solid ${colors?.border || '#E5E7EB'}`
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {review.avatar ? (
          <img 
            src={review.avatar} 
            alt={review.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: colors?.primary || '#10B981' }}
          >
            {initials || <User className="w-5 h-5" />}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p 
            className="font-medium text-sm truncate"
            style={{ color: colors?.text_primary || '#111827' }}
          >
            {review.name}
          </p>
          <p 
            className="text-xs"
            style={{ color: colors?.text_muted || '#9CA3AF' }}
          >
            {review.date}
          </p>
        </div>
      </div>

      {/* Stars */}
      <div className="flex gap-0.5 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= review.rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Comment */}
      <p 
        className="text-sm leading-relaxed line-clamp-3"
        style={{ color: colors?.text_secondary || '#4B5563' }}
      >
        "{review.comment}"
      </p>
    </div>
  );
}

export function ShopReviewsSection({ reviews, colors }: ShopReviewsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!reviews || reviews.length === 0) return null;

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <section className="py-8 lg:py-12" style={{ backgroundColor: colors?.background_alt || '#F3F4F6' }}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6 lg:mb-8">
          <h2 
            className="text-xl lg:text-2xl font-bold mb-2"
            style={{ color: colors?.text_primary || '#111827' }}
          >
            ⭐ Avaliações de Clientes
          </h2>
          <p 
            className="text-sm lg:text-base"
            style={{ color: colors?.text_secondary || '#4B5563' }}
          >
            Opiniões reais de quem já comprou conosco
          </p>
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative">
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
          >
            {reviews.map((review) => (
              <div key={review.id} className="snap-start">
                <ReviewCard review={review} colors={colors} />
              </div>
            ))}
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {reviews.slice(0, 5).map((_, idx) => (
              <div 
                key={idx}
                className="w-2 h-2 rounded-full transition-colors"
                style={{ 
                  backgroundColor: idx === 0 
                    ? colors?.primary || '#10B981'
                    : colors?.border || '#E5E7EB'
                }}
              />
            ))}
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:block relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {reviews.slice(0, 4).map((review) => (
              <ReviewCard key={review.id} review={review} colors={colors} />
            ))}
          </div>

          {/* Navigation Arrows (if more than 4) */}
          {reviews.length > 4 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                style={{ 
                  borderColor: colors?.border || '#E5E7EB',
                  color: colors?.text_secondary || '#4B5563'
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                style={{ 
                  borderColor: colors?.border || '#E5E7EB',
                  color: colors?.text_secondary || '#4B5563'
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
