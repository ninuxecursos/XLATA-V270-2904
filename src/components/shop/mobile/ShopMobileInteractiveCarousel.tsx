import { useState, useRef } from 'react';
import { Zap, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InteractiveEvent, useInteractiveConfig } from '@/hooks/useInteractiveEvents';
import { ShopMobileInteractiveCard } from './ShopMobileInteractiveCard';
import { ShopAuthModal } from '../public/ShopAuthModal';
import { useShopConfig } from '@/hooks/useShopConfig';

interface ShopMobileInteractiveCarouselProps {
  events: InteractiveEvent[];
}

export function ShopMobileInteractiveCarousel({ events }: ShopMobileInteractiveCarouselProps) {
  const { data: config } = useInteractiveConfig();
  const { data: shopConfig } = useShopConfig();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const colors = shopConfig?.colors;
  
  // Cores configuráveis do container
  const sectionBg = colors?.interactive_section_bg || '#FAFBFC';
  const gradientEnabled = colors?.interactive_section_gradient_enabled ?? true;
  const titleColor = colors?.interactive_section_title_color || '#111827';
  const subtitleColor = colors?.interactive_section_subtitle_color || '#6B7280';
  const badgeBg = colors?.interactive_section_badge_bg || '#A855F720';
  const badgeText = colors?.interactive_section_badge_text || '#A855F7';
  const iconBg = colors?.interactive_section_icon_bg || '#A855F7';
  const iconColor = colors?.interactive_section_icon_color || '#FFFFFF';
  const borderEnabled = colors?.interactive_section_border_enabled ?? false;
  const borderColor = colors?.interactive_section_border_color || '#A855F730';

  // Calcular largura do card + gap
  const cardWidth = 192; // 180px + 12px gap
  const totalWidth = events.length * cardWidth;
  const animationDuration = events.length * 4; // 4 segundos por card

  // Pausar quando interagir
  const handleInteractionStart = () => setIsPaused(true);
  const handleInteractionEnd = () => setIsPaused(false);

  if (!config?.is_enabled || events.length === 0) {
    return null;
  }

  return (
    <>
      <section 
        className="py-4 mx-2 rounded-xl"
        style={{
          backgroundColor: sectionBg,
          background: gradientEnabled 
            ? `linear-gradient(180deg, ${iconBg}15 0%, ${sectionBg} 100%)`
            : sectionBg,
          border: borderEnabled ? `1px solid ${borderColor}` : undefined,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-3">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: iconBg }}
            >
              <Zap className="w-5 h-5" style={{ color: iconColor }} />
            </div>
            <div>
              <h2 
                className="text-base font-bold"
                style={{ color: titleColor }}
              >
                {config?.event_title_label || 'Ofertas Interativas'}
              </h2>
              <p 
                className="text-xs"
                style={{ color: subtitleColor }}
              >
                Deslize e participe!
              </p>
            </div>
          </div>
          
          <Badge 
            className="text-[10px]"
            style={{ backgroundColor: badgeBg, color: badgeText }}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            {events.length} ativo{events.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Carrossel com CSS Animation */}
        <div 
          className="overflow-hidden"
          onTouchStart={handleInteractionStart}
          onTouchEnd={handleInteractionEnd}
          onMouseEnter={handleInteractionStart}
          onMouseLeave={handleInteractionEnd}
        >
          <div
            ref={trackRef}
            className="flex gap-3 px-3"
            style={{
              width: 'max-content',
              animation: `shop-carousel-scroll ${animationDuration}s linear infinite`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {/* Duplicar eventos 2x para loop infinito */}
            {[...events, ...events].map((event, index) => (
              <div 
                key={`${event.id}-${index}`} 
                className="flex-shrink-0"
                style={{ width: '180px' }}
              >
                <ShopMobileInteractiveCard 
                  event={event}
                  onAuthRequired={() => setShowAuthModal(true)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* CSS para animação */}
        <style>{`
          @keyframes shop-carousel-scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-${totalWidth}px);
            }
          }
        `}</style>
      </section>

      {/* Auth Modal */}
      <ShopAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
