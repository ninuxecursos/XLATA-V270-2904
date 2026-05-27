import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { useActiveInteractiveEvents, useInteractiveConfig } from '@/hooks/useInteractiveEvents';
import { InteractiveProductCard } from './InteractiveProductCard';
import { ShopAuthModal } from './ShopAuthModal';
import { Link } from 'react-router-dom';
import { useShopConfig } from '@/hooks/useShopConfig';

// Floating Particles Component
function FloatingParticles({ color }: { color: string }) {
  const particles = [
    { top: '10%', left: '5%', size: 8, delay: 0, duration: 4 },
    { top: '20%', left: '15%', size: 6, delay: 0.5, duration: 3.5 },
    { top: '60%', left: '8%', size: 10, delay: 1, duration: 5 },
    { top: '80%', left: '12%', size: 5, delay: 0.3, duration: 3 },
    { top: '15%', right: '10%', size: 7, delay: 0.7, duration: 4.5 },
    { top: '40%', right: '5%', size: 9, delay: 0.2, duration: 3.8 },
    { top: '70%', right: '15%', size: 6, delay: 1.2, duration: 4.2 },
    { top: '85%', right: '8%', size: 8, delay: 0.8, duration: 3.2 },
    { top: '50%', left: '3%', size: 5, delay: 1.5, duration: 4.8 },
    { top: '30%', right: '3%', size: 7, delay: 0.4, duration: 3.6 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-40"
          style={{
            width: p.size,
            height: p.size,
            top: p.top,
            left: p.left,
            right: p.right,
            backgroundColor: color,
            animation: `shop-float-particle ${p.duration}s ease-in-out infinite ${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function InteractiveProductsSection() {
  const { data: events = [], isLoading } = useActiveInteractiveEvents();
  const { data: config } = useInteractiveConfig();
  const { data: shopConfig } = useShopConfig();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const colors = shopConfig?.colors;
  const enableParticles = colors?.enable_particles ?? false;
  const particlesColor = colors?.particles_color || '#A855F7';
  const cardBorder = colors?.interactive_card_border || '#A855F7';
  
  // Novas cores do container
  const sectionBg = colors?.interactive_section_bg || '#FAFBFC';
  const gradientEnabled = colors?.interactive_section_gradient_enabled ?? true;
  const titleColor = colors?.interactive_section_title_color || '#111827';
  const subtitleColor = colors?.interactive_section_subtitle_color || '#6B7280';
  const badgeBg = colors?.interactive_section_badge_bg || `${cardBorder}20`;
  const badgeText = colors?.interactive_section_badge_text || cardBorder;
  const iconBg = colors?.interactive_section_icon_bg || cardBorder;
  const iconColor = colors?.interactive_section_icon_color || '#FFFFFF';
  const borderEnabled = colors?.interactive_section_border_enabled ?? false;
  const borderColor = colors?.interactive_section_border_color || `${cardBorder}30`;

  // Don't show section if disabled or no events
  if (!config?.is_enabled || (events.length === 0 && !isLoading)) {
    return null;
  }

  return (
    <>
      <section 
        className="py-6 lg:py-8 shop-interactive-section relative rounded-xl mx-2 lg:mx-4" 
        id="interactive"
        style={{
          backgroundColor: sectionBg,
          background: gradientEnabled 
            ? `linear-gradient(180deg, ${iconBg}08 0%, ${sectionBg} 50%, transparent 100%)`
            : sectionBg,
          border: borderEnabled ? `1px solid ${borderColor}` : undefined,
        }}
      >
        {/* Floating Particles */}
        {enableParticles && <FloatingParticles color={particlesColor} />}

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${iconBg} 0%, ${iconBg}CC 100%)`,
                  boxShadow: `0 4px 12px ${iconBg}40`
                }}
              >
                <Zap className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: iconColor }} />
              </div>
              <div>
                <h2 
                  className="text-lg lg:text-xl font-bold"
                  style={{ color: titleColor }}
                >
                  {config?.event_title_label || 'Ofertas Interativas'}
                </h2>
                <p 
                  className="text-xs lg:text-sm hidden sm:block"
                  style={{ color: subtitleColor }}
                >
                  Participe e faça sua melhor oferta em tempo real
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                className="font-medium"
                style={{
                  backgroundColor: badgeBg,
                  color: badgeText
                }}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {events.length} ativo{events.length !== 1 ? 's' : ''}
              </Badge>
              <Link 
                to="/shop#interactive"
                className="hidden sm:flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ color: badgeText }}
              >
                Ver todos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Events Carousel */}
          {isLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex-shrink-0 w-[200px] lg:w-[220px] bg-white rounded-xl overflow-hidden shadow-sm border animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-8 bg-gray-200 rounded" />
                    <div className="h-10 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div 
              className="text-center py-12 bg-white rounded-xl border"
              style={{ borderColor: `${cardBorder}30` }}
            >
              <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: `${cardBorder}40` }} />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                Nenhum evento ativo
              </h3>
              <p className="text-gray-500 text-sm">
                Fique de olho! Novos eventos em breve.
              </p>
            </div>
          ) : (
            <div className="relative overflow-hidden">
              {/* Only use infinite carousel animation when there are enough items (3+) */}
              {events.length >= 3 ? (
                <div 
                  className="shop-carousel-infinite"
                  style={{
                    '--carousel-duration': `${Math.max(events.length * 8, 30)}s`,
                  } as React.CSSProperties}
                >
                  {/* First set of items */}
                  {events.map((event) => (
                    <div 
                      key={event.id} 
                      className="flex-shrink-0 w-[160px] sm:w-[180px] lg:w-[220px] px-1.5 lg:px-2"
                    >
                      <InteractiveProductCard 
                        event={event}
                        onAuthRequired={() => setShowAuthModal(true)}
                      />
                    </div>
                  ))}
                  {/* Duplicate set for seamless loop - only when 3+ items */}
                  {events.map((event) => (
                    <div 
                      key={`dup-${event.id}`} 
                      className="flex-shrink-0 w-[160px] sm:w-[180px] lg:w-[220px] px-1.5 lg:px-2"
                    >
                      <InteractiveProductCard 
                        event={event}
                        onAuthRequired={() => setShowAuthModal(true)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* Static grid for 1-2 items - no duplication */
                <div className="flex flex-wrap justify-center gap-4">
                  {events.map((event) => (
                    <div 
                      key={event.id} 
                      className="w-[160px] sm:w-[200px] lg:w-[240px]"
                    >
                      <InteractiveProductCard 
                        event={event}
                        onAuthRequired={() => setShowAuthModal(true)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Auth Modal */}
      <ShopAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
