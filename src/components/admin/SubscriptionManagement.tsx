
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  TestTube, 
  AlertCircle, 
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  RefreshCw,
  Trash2,
  Gift,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PlansManagement } from './PlansManagement';

interface SubscriptionData {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  plan_type: string;
  is_active: boolean;
  expires_at: string;
  activated_at: string;
  created_at: string;
  referral_info?: {
    indicador_name: string | null;
    indicador_email: string | null;
  };
}

export const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [deletingExpired, setDeletingExpired] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      
      // Buscar assinaturas com dados do usuário
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subscriptionsError) throw subscriptionsError;

      // Buscar dados dos usuários
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, name, indicador_id');

      if (profilesError) throw profilesError;

      // Mapear dados com informações do usuário e indicador
      const subscriptionsWithUser = subscriptionsData?.map(sub => {
        const user = profiles?.find(p => p.id === sub.user_id);
        const indicador = user?.indicador_id ? profiles?.find(p => p.id === user.indicador_id) : null;
        
        return {
          id: sub.id,
          user_id: sub.user_id,
          user_email: user?.email || 'N/A',
          user_name: user?.name,
          plan_type: sub.plan_type,
          is_active: sub.is_active,
          expires_at: sub.expires_at,
          activated_at: sub.activated_at,
          created_at: sub.created_at,
          referral_info: indicador ? {
            indicador_name: indicador.name,
            indicador_email: indicador.email
          } : undefined
        };
      }) || [];

      setSubscriptions(subscriptionsWithUser);
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpiredSubscriptions = async () => {
    try {
      setDeletingExpired(true);
      
      const now = new Date().toISOString();
      
      // Buscar diretamente assinaturas expiradas (is_active=false OU expires_at <= now)
      const { data: expiredSubs, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('id')
        .or(`is_active.eq.false,expires_at.lte.${now}`);

      if (fetchError) throw fetchError;

      if (!expiredSubs || expiredSubs.length === 0) {
        toast({
          title: "Nenhuma assinatura expirada",
          description: "Não foram encontradas assinaturas expiradas para excluir.",
          variant: "default",
        });
        return;
      }

      // Excluir as assinaturas expiradas
      const { error: deleteError } = await supabase
        .from('user_subscriptions')
        .delete()
        .in('id', expiredSubs.map(sub => sub.id));

      if (deleteError) throw deleteError;

      toast({
        title: "Assinaturas excluídas",
        description: `${expiredSubs.length} assinaturas expiradas foram excluídas com sucesso.`,
      });

      // Atualizar a lista
      await fetchSubscriptions();

    } catch (error) {
      console.error('Erro ao excluir assinaturas expiradas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir as assinaturas expiradas.",
        variant: "destructive",
      });
    } finally {
      setDeletingExpired(false);
    }
  };

  const getPlanBadge = (planType: string, isActive: boolean, expiresAt: string) => {
    const isExpired = new Date(expiresAt) <= new Date();
    
    if (!isActive || isExpired) {
      return <Badge variant="destructive">Expirada</Badge>;
    }
    
    switch (planType) {
      case 'trial':
        return <Badge variant="secondary" className="bg-blue-600">Teste Grátis</Badge>;
      case 'monthly':
        return <Badge variant="default" className="bg-green-600">Mensal</Badge>;
      case 'quarterly':
        return <Badge variant="default" className="bg-purple-600">Trimestral</Badge>;
      case 'annual':
        return <Badge variant="default" className="bg-yellow-600">Anual</Badge>;
      default:
        return <Badge variant="outline">{planType}</Badge>;
    }
  };

  const getPlanName = (planType: string) => {
    switch (planType) {
      case 'trial': return 'Teste Grátis (7 dias)';
      case 'monthly': return 'Plano Mensal';
      case 'quarterly': return 'Plano Trimestral';
      case 'annual': return 'Plano Anual';
      default: return planType;
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filterType === 'all') return true;
    if (filterType === 'active') return sub.is_active && new Date(sub.expires_at) > new Date();
    if (filterType === 'expired') return !sub.is_active || new Date(sub.expires_at) <= new Date();
    if (filterType === 'referral') return sub.referral_info;
    return sub.plan_type === filterType;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.is_active && new Date(s.expires_at) > new Date()).length,
    trial: subscriptions.filter(s => s.plan_type === 'trial' && s.is_active).length,
    paid: subscriptions.filter(s => s.plan_type !== 'trial' && s.is_active && new Date(s.expires_at) > new Date()).length,
    expired: subscriptions.filter(s => !s.is_active || new Date(s.expires_at) <= new Date()).length,
    referrals: subscriptions.filter(s => s.referral_info).length
  };

  const conversionRate = stats.trial > 0 ? ((stats.paid / (stats.trial + stats.paid)) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Ativas</p>
                <p className="text-2xl font-bold text-green-400">{stats.active}</p>
              </div>
              <Users className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Teste Grátis</p>
                <p className="text-2xl font-bold text-blue-400">{stats.trial}</p>
              </div>
              <TestTube className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pagas</p>
                <p className="text-2xl font-bold text-green-400">{stats.paid}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Indicações</p>
                <p className="text-2xl font-bold text-purple-400">{stats.referrals}</p>
              </div>
              <Gift className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Conversão</p>
                <p className="text-2xl font-bold text-purple-400">{conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gerenciamento de Planos */}
      <PlansManagement />

      {/* Lista de assinaturas */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Gerenciamento de Assinaturas de Usuários
            </CardTitle>
            
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleDeleteExpiredSubscriptions}
                disabled={deletingExpired}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deletingExpired ? 'Excluindo...' : 'Excluir Expiradas'}
              </Button>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
              >
                <option value="all">Todas</option>
                <option value="active">Ativas</option>
                <option value="expired">Expiradas</option>
                <option value="referral">Indicações</option>
                <option value="trial">Teste Grátis</option>
                <option value="monthly">Mensais</option>
                <option value="quarterly">Trimestrais</option>
                <option value="annual">Anuais</option>
              </select>
              
              <Button 
                onClick={fetchSubscriptions}
                variant="outline"
                size="sm"
                className="bg-transparent border border-white text-gray-300 hover:bg-gray-700 hover:border-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredSubscriptions.map(subscription => (
              <div key={subscription.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-gray-300" />
                  </div>
                  
                  <div>
                    <p className="font-medium text-white">
                      {subscription.user_name || subscription.user_email}
                    </p>
                    <p className="text-sm text-gray-400">{subscription.user_email}</p>
                    <p className="text-sm text-gray-500">{getPlanName(subscription.plan_type)}</p>
                    
                    {/* Mostrar informações de indicação */}
                    {subscription.referral_info && (
                      <div className="flex items-center gap-1 mt-1">
                        <Gift className="h-3 w-3 text-purple-400" />
                        <span className="text-xs text-purple-300">
                          Indicado por: {subscription.referral_info.indicador_name || subscription.referral_info.indicador_email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-400">
                        Ativada: {new Date(subscription.activated_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-400">
                        Expira: {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  
                  {getPlanBadge(subscription.plan_type, subscription.is_active, subscription.expires_at)}
                </div>
              </div>
            ))}
            
            {filteredSubscriptions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">Nenhuma assinatura encontrada</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
