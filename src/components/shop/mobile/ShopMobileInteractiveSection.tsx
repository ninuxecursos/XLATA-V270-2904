import { useState } from 'react';
import { Zap, Sparkles, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InteractiveEvent, useInteractiveConfig } from '@/hooks/useInteractiveEvents';
import { ShopMobileInteractiveCard } from './ShopMobileInteractiveCard';
import { ShopAuthModal } from '../public/ShopAuthModal';
import { useShopConfig } from '@/hooks/useShopConfig';

interface ShopMobileInteractiveSectionProps {
  events: InteractiveEvent[];
}

export function ShopMobileInteractiveSection({ events }: ShopMobileInteractiveSectionProps) {
  const { data: config } = useInteractiveConfig();
  const { data: shopConfig } = useShopConfig();
  const [visibleCount, setVisibleCount] = useState(6);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  // Limitar a 6 inicialmente, carregar +2 por vez
  const visibleEvents = events.slice(0, visibleCount);
  const hasMore = events.length > visibleCount;
  const remainingCount = events.length - visibleCount;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 2);
  };

  if (!config?.is_enabled || events.length === 0) {
    return null;
  }

  return (
    <>
      <section 
        className="px-3 py-4 mx-2 rounded-xl"
        style={{
          backgroundColor: sectionBg,
          background: gradientEnabled 
            ? `linear-gradient(180deg, ${iconBg}15 0%, ${sectionBg} 100%)`
            : sectionBg,
          border: borderEnabled ? `1px solid ${borderColor}` : undefined,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
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
                Participe e faça sua oferta!
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

        {/* Grid de Produtos - 2 colunas */}
        <div className="grid grid-cols-2 gap-2.5">
          {visibleEvents.map((event) => (
            <ShopMobileInteractiveCard 
              key={event.id} 
              event={event}
              onAuthRequired={() => setShowAuthModal(true)}
            />
          ))}
        </div>

        {/* Botão Carregar Mais */}
        {hasMore && (
          <Button
            variant="outline"
            onClick={handleLoadMore}
            className="w-full mt-4 py-3"
            style={{
              backgroundColor: `${iconBg}10`,
              borderColor: `${iconBg}40`,
              color: iconBg,
            }}
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            Carregar Mais ({remainingCount} restante{remainingCount !== 1 ? 's' : ''})
          </Button>
        )}
      </section>

      {/* Auth Modal */}
      <ShopAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
