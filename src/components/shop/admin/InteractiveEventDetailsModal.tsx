import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, 
  Clock, 
  User, 
  TrendingUp,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { 
  useInteractiveEvent, 
  useEventOffers,
  useInteractiveEventRealtime 
} from '@/hooks/useInteractiveEvents';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InteractiveEventDetailsModalProps {
  eventId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusConfig = {
  scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
  finished: { label: 'Finalizado', color: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export function InteractiveEventDetailsModal({ 
  eventId, 
  isOpen, 
  onClose 
}: InteractiveEventDetailsModalProps) {
  const { data: event, isLoading } = useInteractiveEvent(eventId);
  const { data: offers = [] } = useEventOffers(eventId);
  
  // Subscribe to realtime updates
  useInteractiveEventRealtime(eventId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (!eventId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Zap className="w-5 h-5 text-emerald-600" />
            Detalhes do Evento
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : event ? (
          <div className="space-y-6">
            {/* Product Info */}
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {event.product?.images?.[0] ? (
                  <img 
                    src={event.product.images[0]} 
                    alt={event.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Zap className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {event.product?.name || 'Produto'}
                  </h3>
                  <Badge className={statusConfig[event.status].color}>
                    {statusConfig[event.status].label}
                  </Badge>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2">
                  {event.product?.description}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Valor Inicial</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(event.initial_value)}
                </p>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-emerald-600 mb-1">Valor Atual</p>
                <p className="text-lg font-bold text-emerald-700">
                  {formatCurrency(event.current_value)}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Incremento</p>
                <p className="text-lg font-bold text-blue-700">
                  +{formatCurrency(event.minimum_increment)}
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Início: {formatDate(event.start_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Término: {formatDate(event.end_at)}</span>
              </div>
            </div>

            {/* Winner (if finished) */}
            {event.status === 'finished' && event.winner && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-700">Vencedor</span>
                </div>
                <p className="text-green-800">
                  {event.winner.name} ({event.winner.email})
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Valor final: {formatCurrency(event.current_value)}
                </p>
              </div>
            )}

            {/* Offers History */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Histórico de Ofertas ({offers.length})
              </h4>
              
              <ScrollArea className="h-[200px]">
                {offers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Nenhuma oferta registrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {offers.map((offer, index) => (
                      <div 
                        key={offer.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          offer.is_winning 
                            ? 'bg-emerald-50 border border-emerald-200' 
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            offer.is_winning ? 'bg-emerald-500' : 'bg-gray-300'
                          }`}>
                            {offer.is_winning ? (
                              <CheckCircle className="w-4 h-4 text-white" />
                            ) : (
                              <span className="text-white text-xs font-bold">
                                {offers.length - index}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {offer.user?.name || 'Usuário'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(offer.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                            </p>
                          </div>
                        </div>

                        <div className={`font-bold ${
                          offer.is_winning ? 'text-emerald-600' : 'text-gray-700'
                        }`}>
                          {formatCurrency(offer.offer_value)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Evento não encontrado
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
