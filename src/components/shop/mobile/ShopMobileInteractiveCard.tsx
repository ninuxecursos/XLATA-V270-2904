import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Zap, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { InteractiveEvent, useCreateOffer, useInteractiveConfig } from '@/hooks/useInteractiveEvents';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { useShopConfig } from '@/hooks/useShopConfig';

interface ShopMobileInteractiveCardProps {
  event: InteractiveEvent;
  onAuthRequired: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function ShopMobileInteractiveCard({ event, onAuthRequired }: ShopMobileInteractiveCardProps) {
  const { shopUser: user } = useShopAuth();
  const { data: config } = useInteractiveConfig();
  const { data: shopConfig } = useShopConfig();
  const createOffer = useCreateOffer();
  
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerValue, setOfferValue] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  // Get theme colors
  const colors = shopConfig?.colors;
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const minOfferValue = event.current_value + event.minimum_increment;

  const handleOpenOfferModal = () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    setOfferValue(minOfferValue.toFixed(2));
    setIsOfferModalOpen(true);
  };

  const handleSubmitOffer = async () => {
    if (!user) return;
    
    const value = parseFloat(offerValue);
    if (isNaN(value) || value < minOfferValue) {
      return;
    }

    await createOffer.mutateAsync({
      eventId: event.id,
      userId: user.id,
      offerValue: value
    });

    setIsOfferModalOpen(false);
  };

  const isEventActive = event.status === 'active' && timeRemaining !== null;
  const isEventEnded = event.status === 'finished' || (event.status === 'active' && timeRemaining === null);

  const imageUrl = event.product?.images?.[0] || '/placeholder.svg';
  
  // Use slug from database or fallback to generated slug
  const productSlug = event.product?.slug || (
    (event.product?.name || 'produto')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  );

  return (
    <>
      <div 
        className={`rounded-lg shadow-sm overflow-hidden ${enableBorderAnimation && isEventActive ? 'shop-glow-pulse' : ''}`}
        style={{
          backgroundColor: cardBg,
          border: `2px solid ${cardBorder}`,
          boxShadow: enableBorderAnimation && isEventActive 
            ? `0 0 15px ${glowColor}40`
            : undefined
        }}
      >
        {/* Imagem - Clicável para detalhes */}
        <Link to={`/shop/${productSlug}`}>
          <div className="aspect-[4/5] bg-gray-100 relative">
            <img
              src={imageUrl}
              alt={event.product?.name || 'Produto'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* Badge Evento Ativo */}
            <Badge 
              className="absolute top-2 left-2 text-white text-[10px] px-1.5 py-0.5 animate-pulse flex items-center gap-1"
              style={{ backgroundColor: cardBorder }}
            >
              <Zap className="w-3 h-3" />
              Evento
            </Badge>

            {/* Ended Overlay */}
            {isEventEnded && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-sm">ENCERRADO</span>
              </div>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="p-2.5 space-y-2">
          <h3 
            className="text-sm font-medium line-clamp-2 leading-tight min-h-[2.5rem]"
            style={{ color: textPrimary }}
          >
            {event.product?.name || 'Produto'}
          </h3>

          {/* Tempo Restante */}
          {isEventActive && timeRemaining && (
            <div 
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded"
              style={{ 
                backgroundColor: `${cardBorder}15`,
                color: cardBorder
              }}
            >
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="font-medium">
                {timeRemaining.days > 0 && `${timeRemaining.days}d `}
                {String(timeRemaining.hours).padStart(2, '0')}h {String(timeRemaining.minutes).padStart(2, '0')}m {String(timeRemaining.seconds).padStart(2, '0')}s
              </span>
            </div>
          )}

          {/* Valores: Inicial e Atual */}
          <div className="flex justify-between items-end text-xs">
            <div className="flex flex-col">
              <span className="text-gray-400">Inicial:</span>
              <span className="text-gray-600">{formatCurrency(event.initial_value)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px]" style={{ color: cardBorder }}>Atual:</span>
              <span className="font-bold text-base" style={{ color: cardBorder }}>
                {formatCurrency(event.current_value)}
              </span>
            </div>
          </div>

          {/* Oferta Mínima */}
          <div 
            className="text-[10px] flex items-center gap-1 px-2 py-1 rounded"
            style={{ 
              backgroundColor: `${cardBorder}15`,
              color: cardBorder
            }}
          >
            <TrendingUp className="w-3 h-3" />
            Oferta Mínima: {formatCurrency(minOfferValue)}
          </div>

          {/* Botão Participar */}
          {isEventActive ? (
            <Button 
              onClick={handleOpenOfferModal}
              className="w-full text-white text-sm py-2.5"
              style={{ 
                backgroundColor: cardBorder,
                boxShadow: `0 4px 12px ${cardBorder}35`
              }}
            >
              <Zap className="w-4 h-4 mr-1" />
              {config?.participate_button_text || 'Participar'}
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

      {/* Modal de Oferta */}
      <Dialog open={isOfferModalOpen} onOpenChange={setIsOfferModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[400px] bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <Zap className="w-5 h-5" style={{ color: cardBorder }} />
              Fazer Oferta
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Valor Atual */}
            <div 
              className="p-4 rounded-lg text-center"
              style={{ backgroundColor: `${cardBorder}15` }}
            >
              <p className="text-sm mb-1" style={{ color: cardBorder }}>Valor Atual</p>
              <p className="text-2xl font-bold" style={{ color: cardBorder }}>
                {formatCurrency(event.current_value)}
              </p>
            </div>

            {/* Input de Oferta */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Sua Oferta (R$)
              </label>
              <Input
                type="number"
                step="0.01"
                min={minOfferValue}
                value={offerValue}
                onChange={(e) => setOfferValue(e.target.value)}
                className="text-xl font-bold text-center h-14 bg-white text-gray-900 border-gray-300"
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Oferta Mínima: {formatCurrency(minOfferValue)} (incremento +{formatCurrency(event.minimum_increment)})
              </p>
            </div>

            {/* Botões Rápidos */}
            <div className="grid grid-cols-3 gap-2">
              {[0, event.minimum_increment, event.minimum_increment * 2].map((extra) => (
                <Button
                  key={extra}
                  variant="outline"
                  size="sm"
                  onClick={() => setOfferValue((minOfferValue + extra).toFixed(2))}
                  className="text-gray-700 border-gray-300"
                >
                  {extra === 0 ? 'Mínimo' : `+${formatCurrency(extra)}`}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOfferModalOpen(false)}
              className="flex-1 text-gray-700 border-gray-300"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitOffer}
              disabled={createOffer.isPending || parseFloat(offerValue) < minOfferValue}
              className="flex-1 text-white"
              style={{ backgroundColor: cardBorder }}
            >
              {createOffer.isPending ? 'Enviando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
