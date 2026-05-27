import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Clock, 
  Users,
  CheckCircle
} from 'lucide-react';
import { 
  InteractiveEvent,
  useInteractiveEventRealtime,
  useEventOffers,
  useInteractiveConfig
} from '@/hooks/useInteractiveEvents';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { useShopConfig } from '@/hooks/useShopConfig';

interface InteractiveProductCardProps {
  event: InteractiveEvent;
  onAuthRequired: () => void;
}

export function InteractiveProductCard({ event, onAuthRequired }: InteractiveProductCardProps) {
  const { shopUser: user } = useShopAuth();
  const { data: interactiveConfig } = useInteractiveConfig();
  const { data: shopConfig } = useShopConfig();
  const { data: offers = [] } = useEventOffers(event.id);
  
  // Realtime updates
  useInteractiveEventRealtime(event.id);
  
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastValue, setLastValue] = useState(event.current_value);

  const colors = shopConfig?.colors;

  // Interactive card specific colors
  const cardBg = colors?.interactive_card_bg || '#FFFFFF';
  const cardBorder = colors?.interactive_card_border || '#A855F7';
  const glowColor = colors?.interactive_glow_color || '#A855F7';
  const enableBorderAnimation = colors?.enable_border_animation ?? true;
  const textPrimary = colors?.text_primary || '#111827';

  // Calculate time remaining
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const end = new Date(event.end_at);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [event.end_at]);

  // Animation on value change
  useEffect(() => {
    if (event.current_value !== lastValue && interactiveConfig?.enable_animations) {
      setIsAnimating(true);
      setLastValue(event.current_value);
      
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [event.current_value, lastValue, interactiveConfig?.enable_animations]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTime = () => {
    if (!timeRemaining) return '--:--:--';
    
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    }
    if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
    }
    return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  };

  // Use slug from database or fallback to generated slug
  const productSlug = event.product?.slug || (
    (event.product?.name || 'produto')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  );

  const handleParticipate = () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    window.location.href = `/shop/${productSlug}`;
  };

  const isEventActive = event.status === 'active' && timeRemaining !== null;
  const isEventEnded = event.status === 'finished' || (event.status === 'active' && timeRemaining === null);

  return (
    <div 
      className={`rounded-xl overflow-hidden shadow-sm shop-card-hover relative group ${
        enableBorderAnimation && isEventActive ? 'shop-glow-pulse' : ''
      }`}
      style={{
        backgroundColor: cardBg,
        border: `2px solid ${cardBorder}`,
        boxShadow: enableBorderAnimation && isEventActive 
          ? `0 0 20px ${glowColor}40`
          : undefined
      }}
    >
      {/* Product Image */}
      <Link 
        to={`/shop/${productSlug}`}
        className="block"
      >
        <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: colors?.background_alt || '#F3F4F6' }}>
          {event.product?.images?.[0] ? (
            <img
              src={event.product.images[0]}
              alt={event.product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Zap className="w-10 h-10" style={{ color: `${cardBorder}40` }} />
            </div>
          )}

          {/* Ended Overlay */}
          {isEventEnded && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge className="bg-gray-800 text-white px-3 py-1.5 lg:px-4 lg:py-2 lg:text-sm">
                <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 mr-1.5" />
                Encerrado
              </Badge>
            </div>
          )}
        </div>
      </Link>

      {/* Timer - Outside Image */}
      {isEventActive && timeRemaining && (
        <div 
          className="flex items-center justify-center gap-2 py-2 px-3"
          style={{ backgroundColor: `${cardBorder}15` }}
        >
          <Clock 
            className={`w-4 h-4 ${timeRemaining.days === 0 && timeRemaining.hours < 2 ? 'animate-pulse' : ''}`}
            style={{ color: cardBorder }} 
          />
          <span 
            className="text-sm font-mono font-bold tracking-wide"
            style={{ color: cardBorder }}
          >
            {formatTime()}
          </span>
          {timeRemaining.days === 0 && timeRemaining.hours < 2 && (
            <span 
              className="text-[10px] font-semibold uppercase animate-pulse"
              style={{ color: cardBorder }}
            >
              Acabando!
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <h3 
          className="font-medium text-sm line-clamp-2 leading-snug min-h-[2.25rem]"
          style={{ color: textPrimary }}
        >
          {event.product?.name || 'Produto'}
        </h3>

        {/* Current Value - Compact */}
        <div 
          className={`rounded-lg px-3 py-2 flex items-center justify-between transition-all ${
            isAnimating ? 'ring-2 scale-[1.01]' : ''
          }`}
          style={{ 
            backgroundColor: `${cardBorder}15`,
            borderColor: isAnimating ? cardBorder : 'transparent',
            borderWidth: isAnimating ? '2px' : '0'
          }}
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: cardBorder }}>
              Valor Atual
            </span>
            <span 
              className={`text-lg font-bold ${isAnimating ? 'animate-pulse' : ''}`}
              style={{ color: cardBorder }}
            >
              {formatCurrency(event.current_value)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[9px] block" style={{ color: `${cardBorder}90` }}>incremento</span>
            <span className="text-xs font-semibold" style={{ color: cardBorder }}>
              +{formatCurrency(event.minimum_increment)}
            </span>
          </div>
        </div>

        {/* Offers Count */}
        <div 
          className="flex items-center justify-center gap-1.5 text-xs py-1"
          style={{ color: colors?.text_muted || '#9CA3AF' }}
        >
          <Users className="w-3.5 h-3.5" />
          <span className="font-medium">
            {offers.length === 0 ? (
              <span className="text-amber-600">Seja o primeiro!</span>
            ) : (
              <>{offers.length} oferta{offers.length !== 1 ? 's' : ''}</>
            )}
          </span>
        </div>

        {/* Action Button */}
        {isEventActive ? (
          <Button 
            onClick={handleParticipate}
            className="w-full py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-shadow"
            style={{ 
              backgroundColor: cardBorder,
              boxShadow: `0 4px 12px ${cardBorder}35`
            }}
          >
            <Zap className="w-4 h-4 mr-1.5" />
            {interactiveConfig?.participate_button_text || 'Participar'}
          </Button>
        ) : (
          <Button 
            disabled
            className="w-full py-2.5 text-sm"
          >
            Encerrado
          </Button>
        )}
      </div>
    </div>
  );
}
