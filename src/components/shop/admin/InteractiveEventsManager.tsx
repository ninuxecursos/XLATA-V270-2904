import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Play,
  Pause,
  Eye,
  Trash2,
  Zap,
  Users,
  TrendingUp
} from 'lucide-react';
import { 
  useInteractiveEvents, 
  useCancelInteractiveEvent,
  useActivateInteractiveEvent,
  useFinalizeInteractiveEvent
} from '@/hooks/useInteractiveEvents';
import { InteractiveEventModal } from './InteractiveEventModal';
import { InteractiveEventDetailsModal } from './InteractiveEventDetailsModal';
import { InteractiveConfigPanel } from './InteractiveConfigPanel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  active: { label: 'Ativo', color: 'bg-green-100 text-green-700', icon: Play },
  finished: { label: 'Finalizado', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export function InteractiveEventsManager() {
  const [activeTab, setActiveTab] = useState('active');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const { data: events = [], isLoading } = useInteractiveEvents({ 
    status: activeTab === 'all' ? 'all' : activeTab as 'scheduled' | 'active' | 'finished' 
  });

  const cancelEvent = useCancelInteractiveEvent();
  const activateEvent = useActivateInteractiveEvent();
  const finalizeEvent = useFinalizeInteractiveEvent();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const handleActivate = async (eventId: string) => {
    await activateEvent.mutateAsync(eventId);
  };

  const handleFinalize = async (eventId: string) => {
    if (confirm('Deseja finalizar este evento agora?')) {
      await finalizeEvent.mutateAsync(eventId);
    }
  };

  const handleCancel = async (eventId: string) => {
    if (confirm('Deseja realmente cancelar este evento?')) {
      await cancelEvent.mutateAsync(eventId);
    }
  };

  if (showConfig) {
    return <InteractiveConfigPanel onBack={() => setShowConfig(false)} />;
  }

  return (
     <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
           <h1 className="shop-cms-page-title">Vendas Interativas</h1>
           <p className="shop-cms-page-subtitle">Gerencie eventos de vendas em tempo real</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowConfig(true)}
             className="shop-btn-outline h-9 px-3"
          >
            Configurações
          </Button>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
             className="shop-btn-primary h-9"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Evento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
         <div className="shop-card p-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
               <p className="text-xs text-gray-500 uppercase tracking-wide">Ativos</p>
               <p className="text-xl font-bold text-gray-900">
                  {events.filter(e => e.status === 'active').length}
                </p>
              </div>
            </div>
         </div>

         <div className="shop-card p-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
               <p className="text-xs text-gray-500 uppercase tracking-wide">Agendados</p>
               <p className="text-xl font-bold text-gray-900">
                  {events.filter(e => e.status === 'scheduled').length}
                </p>
              </div>
            </div>
         </div>

         <div className="shop-card p-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
               <p className="text-xs text-gray-500 uppercase tracking-wide">Finalizados</p>
               <p className="text-xl font-bold text-gray-900">
                  {events.filter(e => e.status === 'finished').length}
                </p>
              </div>
            </div>
         </div>

         <div className="shop-card p-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
               <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
               <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
               <p className="text-xl font-bold text-gray-900 truncate">
                  {formatCurrency(
                    events
                      .filter(e => e.status === 'finished')
                      .reduce((sum, e) => sum + (e.current_value || 0), 0)
                  )}
                </p>
              </div>
            </div>
         </div>
      </div>

      {/* Events List */}
       <div className="shop-card overflow-hidden">
         <div className="px-4 py-3 border-b border-gray-100">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
             <TabsList className="bg-gray-100 h-9">
               <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-xs px-3">
                 <Play className="w-3.5 h-3.5 mr-1.5" />
                Ativos
              </TabsTrigger>
               <TabsTrigger value="scheduled" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-xs px-3">
                 <Calendar className="w-3.5 h-3.5 mr-1.5" />
                Agendados
              </TabsTrigger>
               <TabsTrigger value="finished" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-xs px-3">
                 <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Finalizados
              </TabsTrigger>
               <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-xs px-3">
                Todos
              </TabsTrigger>
            </TabsList>
          </Tabs>
         </div>

         <div className="p-4">
          {isLoading ? (
             <div className="text-center py-8">
               <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
               <p className="text-gray-500 text-sm">Carregando eventos...</p>
            </div>
          ) : events.length === 0 ? (
             <div className="shop-empty-state py-8">
               <Zap className="shop-empty-state-icon" />
               <p className="shop-empty-state-title">Nenhum evento encontrado</p>
               <Button 
                 variant="link" 
                 onClick={() => setIsCreateModalOpen(true)}
                 className="text-emerald-600 mt-2"
               >
                 Criar primeiro evento
               </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const StatusIcon = statusConfig[event.status].icon;
                
                return (
                  <div 
                    key={event.id}
                     className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                  >
                    {/* Product Image */}
                     <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                      {event.product?.images?.[0] ? (
                        <img 
                          src={event.product.images[0]} 
                          alt={event.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Zap className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                       <div className="flex flex-wrap items-center gap-2 mb-1">
                         <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {event.product?.name || 'Produto não encontrado'}
                        </h3>
                         <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusConfig[event.status].color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[event.status].label}
                         </span>
                      </div>
                      
                       <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-500">
                         <span>Início: {formatDate(event.start_at)}</span>
                         <span>Término: {formatDate(event.end_at)}</span>
                      </div>
                    </div>

                    {/* Values */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-gray-500">Valor Atual</p>
                       <p className="text-lg font-bold text-emerald-600">
                        {formatCurrency(event.current_value)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Inicial: {formatCurrency(event.initial_value)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedEventId(event.id)}
                         className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {event.status === 'scheduled' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleActivate(event.id)}
                           className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Ativar agora"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}

                      {event.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFinalize(event.id)}
                           className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Finalizar agora"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}

                      {(event.status === 'scheduled' || event.status === 'active') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCancel(event.id)}
                           className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Cancelar"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
         </div>
       </div>

      {/* Modals */}
      <InteractiveEventModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <InteractiveEventDetailsModal
        eventId={selectedEventId}
        isOpen={!!selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />
    </div>
  );
}
