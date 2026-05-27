import { useState, useEffect } from 'react';
import { Zap, Clock, TrendingUp, Users, AlertCircle, CheckCircle, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  InteractiveEvent,
  useInteractiveEventRealtime,
  useEventOffers,
  useCreateOffer,
  useInteractiveConfig
} from '@/hooks/useInteractiveEvents';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { InteractiveHelpPopover } from './InteractiveHelpPopover';
import { WhatsAppButton } from './WhatsAppButton';

interface InteractiveOfferPanelProps {
  event: InteractiveEvent;
  onAuthRequired: () => void;
  productName?: string;
}

export function InteractiveOfferPanel({ event, onAuthRequired, productName }: InteractiveOfferPanelProps) {
  const { shopUser: user } = useShopAuth();
  const { data: config } = useInteractiveConfig();
  const { data: offers = [] } = useEventOffers(event.id);
  const createOffer = useCreateOffer();
  
  // Realtime updates
  useInteractiveEventRealtime(event.id);
  
  const [offerValue, setOfferValue] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastValue, setLastValue] = useState(event.current_value);

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
    if (event.current_value !== lastValue && config?.enable_animations) {
      setIsAnimating(true);
      setLastValue(event.current_value);
      
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [event.current_value, lastValue, config?.enable_animations]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Format input value as Brazilian currency (display only)
  const formatInputDisplay = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Parse Brazilian format back to number
  const parseInputValue = (displayValue: string): number => {
    // Remove everything except digits and comma/dot
    const cleaned = displayValue.replace(/[^\d.,]/g, '');
    // Replace comma with dot for parsing
    const normalized = cleaned.replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  // Get current numeric value from input
  const getCurrentInputValue = (): number => {
    if (!offerValue) return minOfferValue;
    return parseInputValue(offerValue);
  };

  // Add value to current offer
  const addToOffer = (amount: number) => {
    const current = getCurrentInputValue();
    const newValue = current + amount;
    setOfferValue(newValue.toFixed(2));
  };

  const minOfferValue = event.current_value + event.minimum_increment;

  const handleSubmitOffer = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    
    const value = parseInputValue(offerValue);
    if (isNaN(value) || value < minOfferValue) {
      return;
    }

    await createOffer.mutateAsync({
      eventId: event.id,
      userId: user.id,
      offerValue: value
    });

    setOfferValue('');
  };

  const isEventActive = event.status === 'active' && timeRemaining !== null;
  const isEventEnded = event.status === 'finished' || (event.status === 'active' && timeRemaining === null);

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 rounded-2xl p-5 space-y-5 border-2 border-purple-200 interactive-panel-glow">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-purple-800 uppercase tracking-wide text-sm">
            {config?.event_title_label || 'Oferta Interativa'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <InteractiveHelpPopover productName={productName} />
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 border border-purple-200">
            <Users className="w-3 h-3 mr-1" />
            {offers.length} {offers.length === 1 ? 'oferta' : 'ofertas'}
          </Badge>
        </div>
      </div>

      {/* Current Value - Hero Section */}
      <div className={`relative bg-white p-5 rounded-xl border border-purple-100 text-center transition-all ${
        isAnimating ? 'scale-105 ring-2 ring-purple-400 ring-offset-2' : ''
      }`}>
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-100 to-purple-50 px-3 text-[10px] font-bold text-purple-600 uppercase tracking-wider rounded-full">
          Valor Atual
        </span>
        <p className={`text-4xl sm:text-5xl font-bold text-purple-700 mt-2 ${isAnimating ? 'animate-pulse' : ''}`}>
          {formatCurrency(event.current_value)}
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-full">
          <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
          <span className="text-sm font-medium text-purple-600">
            Incremento Mínimo: {formatCurrency(event.minimum_increment)}
          </span>
        </div>
      </div>

      {/* Countdown */}
      {isEventActive && timeRemaining && (
        <div className="relative bg-white/80 p-4 rounded-xl border border-purple-100">
          <span className="absolute -top-2.5 left-4 bg-gradient-to-r from-purple-50 to-white px-2 text-[10px] font-bold text-purple-600 uppercase tracking-wider">
            <Clock className="w-3 h-3 inline mr-1" />
            Tempo Restante
          </span>
          <div className="grid grid-cols-4 gap-2 text-center mt-2">
            <div className="bg-purple-100/80 p-3 rounded-xl">
              <span className="text-2xl sm:text-3xl font-bold text-purple-700 font-mono block">
                {String(timeRemaining.days).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-purple-600 font-medium uppercase">dias</span>
            </div>
            <div className="bg-purple-100/80 p-3 rounded-xl">
              <span className="text-2xl sm:text-3xl font-bold text-purple-700 font-mono block">
                {String(timeRemaining.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-purple-600 font-medium uppercase">horas</span>
            </div>
            <div className="bg-purple-100/80 p-3 rounded-xl">
              <span className="text-2xl sm:text-3xl font-bold text-purple-700 font-mono block">
                {String(timeRemaining.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-purple-600 font-medium uppercase">min</span>
            </div>
            <div className="countdown-seconds p-3 rounded-xl">
              <span className="text-2xl sm:text-3xl font-bold font-mono block">
                {String(timeRemaining.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-medium uppercase opacity-90">seg</span>
            </div>
          </div>
        </div>
      )}

      {/* Event Ended */}
      {isEventEnded && (
        <div className="bg-gray-50 p-5 rounded-xl text-center border border-gray-200">
          <CheckCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-700 font-bold text-lg">Evento Encerrado</p>
          {event.winner && (
            <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              Vencedor: {event.winner.name}
            </p>
          )}
        </div>
      )}

      {/* Offer Input Section */}
      {isEventActive && (
        <div className="relative bg-white/80 p-4 rounded-xl border border-purple-100">
          <span className="absolute -top-2.5 left-4 bg-gradient-to-r from-purple-50 to-white px-2 text-[10px] font-bold text-purple-600 uppercase tracking-wider">
            <Zap className="w-3 h-3 inline mr-1" />
            Faça Sua Oferta
          </span>
          
          <div className="space-y-3 mt-2">
            {/* Quick Offer Buttons - Dynamic based on event.minimum_increment */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOfferValue(minOfferValue.toFixed(2))}
                className="text-gray-700 border-purple-200 bg-white hover:bg-purple-50 text-xs h-9"
              >
                Mínimo
              </Button>
              {[1, 2, 4].map(multiplier => {
                const incrementAmount = event.minimum_increment * multiplier;
                return (
                  <Button
                    key={multiplier}
                    size="sm"
                    onClick={() => addToOffer(incrementAmount)}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-9"
                  >
                    +R${incrementAmount}
                  </Button>
                );
              })}
            </div>

            {/* Input and Submit - Stacked for mobile */}
            <div className="flex flex-col gap-3">
              {/* Offer Value Input with Brazilian mask */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={formatInputDisplay(offerValue)}
                  onChange={(e) => {
                    // Remove formatting, keep only digits and separators
                    const raw = e.target.value.replace(/[^\d.,]/g, '');
                    // Normalize: replace comma with dot for internal storage
                    const normalized = raw.replace(',', '.');
                    // Remove extra dots, keep only first
                    const parts = normalized.split('.');
                    const cleaned = parts.length > 2 
                      ? parts[0] + '.' + parts.slice(1).join('')
                      : normalized;
                    setOfferValue(cleaned);
                  }}
                  placeholder={formatInputDisplay(minOfferValue.toFixed(2))}
                  className="pl-10 text-xl font-bold h-14 bg-white text-gray-900 border-purple-200 focus:border-purple-400 text-center"
                />
              </div>
              
              {/* Submit Button - Full width below */}
              <Button 
                onClick={handleSubmitOffer}
                disabled={createOffer.isPending || offerValue === '' || parseInputValue(offerValue) < minOfferValue}
                className="h-14 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg shadow-lg shadow-purple-200"
              >
                <Zap className="w-5 h-5 mr-2" />
                {createOffer.isPending ? 'Enviando...' : 'Ofertar'}
              </Button>
            </div>

            {/* Increment Info - Clearer text */}
            <p className="text-xs text-gray-500 flex items-center gap-1.5 justify-center">
              <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
              Sua oferta deve ser no mínimo {formatCurrency(minOfferValue)}
            </p>
          </div>
        </div>
      )}

      {/* WhatsApp Contact Section */}
      <div className="relative bg-green-50/80 rounded-xl p-4 border border-green-200">
        <span className="absolute -top-2.5 left-4 bg-gradient-to-r from-green-50 to-white px-2 text-[10px] font-bold text-green-700 uppercase tracking-wider">
          💬 Dúvidas?
        </span>
        <div className="mt-1">
          <WhatsAppButton productName={productName} variant="full" />
        </div>
      </div>

      {/* Recent Offers */}
      {offers.length > 0 && (
        <div className="relative bg-white/60 rounded-xl p-4 border border-purple-100">
          <span className="absolute -top-2.5 left-4 bg-gradient-to-r from-purple-50 to-white px-2 text-[10px] font-bold text-purple-600 uppercase tracking-wider">
            Últimas Ofertas
          </span>
          <div className="space-y-1.5 max-h-32 overflow-y-auto mt-1">
            {offers.slice(0, 5).map((offer, index) => (
              <div 
                key={offer.id}
                className={`flex justify-between items-center text-sm px-3 py-2 rounded-lg transition-colors ${
                  offer.is_winning 
                    ? 'bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-gray-600 truncate max-w-[140px] flex items-center gap-1.5">
                  {offer.is_winning && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                  {offer.user?.name || 'Usuário'}
                </span>
                <span className={`font-bold ${offer.is_winning ? 'text-purple-700' : 'text-gray-700'}`}>
                  {formatCurrency(offer.offer_value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
