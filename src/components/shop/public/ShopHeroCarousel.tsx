import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroSlide } from '@/hooks/useShopConfig';
import { cn } from '@/lib/utils';

interface ShopHeroCarouselProps {
  slides: HeroSlide[];
  autoPlayInterval?: number;
}

export function ShopHeroCarousel({ slides, autoPlayInterval = 5000 }: ShopHeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeSlides = slides.filter(s => s.is_active);

  const goToNext = useCallback(() => {
    if (activeSlides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

  const goToPrev = useCallback(() => {
    if (activeSlides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play
  useEffect(() => {
    if (isPaused || activeSlides.length <= 1) return;
    
    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isPaused, autoPlayInterval, goToNext, activeSlides.length]);

  // Fallback quando não há slides
  if (activeSlides.length === 0) {
    return (
      <div className="relative w-full aspect-[21/9] md:aspect-[21/7] bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h2 className="text-2xl md:text-4xl font-bold mb-2">Bem-vindo à nossa loja!</h2>
          <p className="text-sm md:text-lg opacity-90">Confira nossas ofertas e produtos</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full aspect-[16/7] md:aspect-[21/7] overflow-hidden bg-gray-100"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {activeSlides.map((slide, index) => {
        const isActive = index === currentIndex;
        
        const slideContent = (
          <>
            <img
              src={slide.image_url}
              alt={slide.title || `Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay com texto */}
            {(slide.title || slide.subtitle) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end">
                <div className="p-4 md:p-8 text-white max-w-2xl">
                  {slide.title && (
                    <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 drop-shadow-lg">
                      {slide.title}
                    </h2>
                  )}
                  {slide.subtitle && (
                    <p className="text-sm md:text-lg opacity-90 drop-shadow-md">
                      {slide.subtitle}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        );

        const baseClassName = cn(
          "absolute inset-0 transition-opacity duration-500 ease-in-out",
          isActive ? "opacity-100 z-10" : "opacity-0 z-0"
        );
        
        return slide.link ? (
          <Link key={slide.id} to={slide.link} className={baseClassName}>
            {slideContent}
          </Link>
        ) : (
          <div key={slide.id} className={baseClassName}>
            {slideContent}
          </div>
        );
      })}

      {/* Navigation Arrows - Desktop only */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); goToPrev(); }}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 hover:bg-white rounded-full items-center justify-center shadow-lg transition-all hover:scale-110"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          
          <button
            onClick={(e) => { e.preventDefault(); goToNext(); }}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 hover:bg-white rounded-full items-center justify-center shadow-lg transition-all hover:scale-110"
            aria-label="Próximo slide"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </>
      )}

      {/* Indicators */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "w-6 bg-white" 
                  : "w-2 bg-white/50 hover:bg-white/70"
              )}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
