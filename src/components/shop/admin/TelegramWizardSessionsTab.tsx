import { RefreshCw, Trash2, Clock, MessageSquare, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  useTelegramWizardSessions, 
  useDeleteWizardSession,
  useCleanupExpiredSessions 
} from '@/hooks/useTelegramWizardSessions';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STEP_LABELS: Record<string, { label: string; color: string }> = {
  idle: { label: 'Inativo', color: 'bg-gray-100 text-gray-700' },
  ask_new_product: { label: 'Novo Produto?', color: 'bg-blue-100 text-blue-700' },
  ask_sale_type: { label: 'Tipo de Venda', color: 'bg-blue-100 text-blue-700' },
  normal_photos: { label: 'Fotos (Normal)', color: 'bg-purple-100 text-purple-700' },
  normal_name: { label: 'Nome (Normal)', color: 'bg-purple-100 text-purple-700' },
  normal_description: { label: 'Descrição (Normal)', color: 'bg-purple-100 text-purple-700' },
  normal_cost: { label: 'Custo (Normal)', color: 'bg-purple-100 text-purple-700' },
  normal_price: { label: 'Preço (Normal)', color: 'bg-purple-100 text-purple-700' },
  normal_category: { label: 'Categoria (Normal)', color: 'bg-purple-100 text-purple-700' },
  normal_confirm: { label: 'Confirmar (Normal)', color: 'bg-amber-100 text-amber-700' },
  inter_name: { label: 'Nome (Interativa)', color: 'bg-orange-100 text-orange-700' },
  inter_description: { label: 'Descrição (Interativa)', color: 'bg-orange-100 text-orange-700' },
  inter_photos: { label: 'Fotos (Interativa)', color: 'bg-orange-100 text-orange-700' },
  inter_category: { label: 'Categoria (Interativa)', color: 'bg-orange-100 text-orange-700' },
  inter_initial_value: { label: 'Valor Inicial', color: 'bg-orange-100 text-orange-700' },
  inter_increment: { label: 'Incremento', color: 'bg-orange-100 text-orange-700' },
  inter_duration: { label: 'Duração', color: 'bg-orange-100 text-orange-700' },
  inter_auto_renew: { label: 'Auto-Renovar', color: 'bg-orange-100 text-orange-700' },
  inter_confirm: { label: 'Confirmar (Interativa)', color: 'bg-amber-100 text-amber-700' },
  processing: { label: 'Processando...', color: 'bg-green-100 text-green-700' },
};

export function TelegramWizardSessionsTab() {
  const { data: sessions, isLoading, refetch } = useTelegramWizardSessions();
  const deleteSession = useDeleteWizardSession();
  const cleanupSessions = useCleanupExpiredSessions();

  const getStepBadge = (step: string) => {
    const config = STEP_LABELS[step] || { label: step, color: 'bg-gray-100 text-gray-700' };
    return (
      <Badge variant="outline" className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Sessões ativas de cadastro via Telegram
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => cleanupSessions.mutate()}
            disabled={cleanupSessions.isPending}
          >
            <Trash2 className={`w-4 h-4 mr-2 ${cleanupSessions.isPending ? 'animate-spin' : ''}`} />
            Limpar Expiradas
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : sessions && sessions.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Chat ID</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Step</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Tipo</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Dados</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Atualizado</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Expira</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((session) => {
                  const expired = isExpired(session.expires_at);
                  const data = session.data || {};
                  
                  return (
                    <tr key={session.id} className={`hover:bg-gray-50 ${expired ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <code className="text-sm font-mono text-gray-700">{session.chat_id}</code>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStepBadge(session.step)}
                      </td>
                      <td className="px-4 py-3">
                        {session.sale_type ? (
                          <Badge variant="outline" className={
                            session.sale_type === 'interactive' 
                              ? 'bg-orange-50 text-orange-700 border-orange-200' 
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }>
                            {session.sale_type === 'interactive' ? '🔥 Interativa' : '📦 Normal'}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs text-xs text-gray-600 space-y-0.5">
                          {data.name && (
                            <p className="truncate"><b>Nome:</b> {data.name}</p>
                          )}
                          {data.photos && data.photos.length > 0 && (
                            <p><b>Fotos:</b> {data.photos.length}</p>
                          )}
                          {typeof data.sale_price === 'number' && (
                            <p><b>Preço:</b> R$ {data.sale_price.toFixed(2)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDistanceToNow(new Date(session.updated_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {expired ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Expirada
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500">
                            {format(new Date(session.expires_at), "HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSession.mutate(session.id)}
                          disabled={deleteSession.isPending}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma sessão ativa</p>
          <p className="text-sm text-gray-400 mt-1">
            Inicie uma conversa enviando "Oi" no Telegram
          </p>
        </div>
      )}

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-sm text-emerald-700">
          💬 <b>Novo sistema de cadastro!</b> Envie "Oi" no Telegram para iniciar o wizard conversacional de cadastro de produtos.
        </p>
      </div>
    </div>
  );
}
