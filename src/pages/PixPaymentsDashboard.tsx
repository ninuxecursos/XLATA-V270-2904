import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  CreditCard,
  Ban
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
}

interface PixPayment {
  id: string;
  payment_id: string;
  payer_email: string;
  transaction_amount: number;
  status: string;
  status_detail: string | null;
  created_at: string;
  updated_at: string;
  external_reference: string | null;
  payment_method_id: string | null;
  qr_code: string | null;
  user_profile: UserProfile | null;
}

interface UserSubscription {
  user_id: string;
  payment_reference: string;
  plan_type: string;
  is_active: boolean;
  expires_at: string;
  activated_at: string | null;
  user_profile: UserProfile | null;
}

interface PaymentStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  totalRevenue: number;
}

const PixPaymentsDashboard = () => {
  const [payments, setPayments] = useState<PixPayment[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current session for auth header
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[PixPayments] Session error:', sessionError);
        setError("Erro ao verificar sessão: " + sessionError.message);
        return;
      }
      
      if (!session) {
        setError("Você precisa estar logado para acessar esta página.");
        toast({
          title: "Erro",
          description: "Você precisa estar logado.",
          variant: "destructive"
        });
        return;
      }

      console.log('[PixPayments] Calling get-admin-payments function...');

      // Call edge function to get all payments (admin only)
      const { data, error: funcError } = await supabase.functions.invoke('get-admin-payments', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (funcError) {
        console.error('[PixPayments] Edge function error:', funcError);
        setError("Erro ao carregar dados: " + (funcError.message || "Falha na comunicação com o servidor"));
        toast({
          title: "Erro",
          description: funcError.message || "Erro ao carregar dados de pagamentos.",
          variant: "destructive"
        });
        return;
      }

      if (data?.error) {
        console.error('[PixPayments] API error:', data.error);
        setError(data.error);
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      console.log('[PixPayments] Data loaded successfully:', {
        payments: data?.payments?.length || 0,
        subscriptions: data?.subscriptions?.length || 0
      });

      setPayments(data?.payments || []);
      setSubscriptions(data?.subscriptions || []);
      setStats(data?.stats || {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        totalRevenue: 0
      });

    } catch (err: any) {
      console.error('[PixPayments] Unexpected error:', err);
      const errorMessage = err?.message || "Erro desconhecido ao carregar dados.";
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({
      title: "Atualizado",
      description: "Dados atualizados com sucesso!",
    });
  };

  const getPaymentStatus = (payment: PixPayment) => {
    const subscription = subscriptions.find(s => s.payment_reference === payment.payment_id);
    
    if (payment.status === 'approved' && subscription && subscription.is_active) {
      return { label: 'Pago e Ativado', color: 'bg-emerald-600', textColor: 'text-emerald-400', icon: CheckCircle };
    } else if (payment.status === 'approved' && !subscription) {
      return { label: 'Pago sem Ativação', color: 'bg-amber-500', textColor: 'text-amber-400', icon: AlertTriangle };
    } else if (payment.status === 'pending') {
      return { label: 'Pendente', color: 'bg-amber-500', textColor: 'text-amber-400', icon: Clock };
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      return { label: 'Rejeitado/Cancelado', color: 'bg-destructive', textColor: 'text-destructive', icon: XCircle };
    }
    
    return { label: payment.status, color: 'bg-muted', textColor: 'text-muted-foreground', icon: Clock };
  };

  const computedStats = {
    ...stats,
    activated: payments.filter(p => {
      const sub = subscriptions.find(s => s.payment_reference === p.payment_id);
      return p.status === 'approved' && sub && sub.is_active;
    }).length,
    notActivated: payments.filter(p => {
      const sub = subscriptions.find(s => s.payment_reference === p.payment_id);
      return p.status === 'approved' && !sub;
    }).length,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getPlanTypeName = (planType: string | null) => {
    if (!planType) return 'N/A';
    const names: Record<string, string> = {
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      biannual: 'Semestral',
      annual: 'Anual',
      triennial: 'Trienal',
      trial: 'Teste'
    };
    return names[planType] || planType;
  };

  const extractPlanFromReference = (reference: string | null) => {
    if (!reference) return null;
    // Format: user_{userId}_plan_{planType}
    const match = reference.match(/plan_(\w+)$/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground text-lg">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error && payments.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard de Pagamentos PIX</h1>
            <p className="text-muted-foreground mt-1">Gerencie todos os pagamentos via PIX do sistema</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-primary hover:bg-primary/90"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Tentar Novamente
          </Button>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-8">
            <div className="text-center py-8">
              <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Erro ao carregar dados</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Pagamentos PIX</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os pagamentos via PIX do sistema</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-primary hover:bg-primary/90"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Total</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{computedStats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Aprovados</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">{computedStats.approved}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Pendentes</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">{computedStats.pending}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Ativados</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">{computedStats.activated}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Não Ativados</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">{computedStats.notActivated}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Receita</span>
            </div>
            <div className="text-xl font-bold text-emerald-400">{formatCurrency(computedStats.totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Lista de Pagamentos ({payments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Ban className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum pagamento encontrado</p>
              </div>
            ) : (
              payments.map((payment) => {
                const status = getPaymentStatus(payment);
                const StatusIcon = status.icon;
                const subscription = subscriptions.find(s => s.payment_reference === payment.payment_id);
                const planType = subscription?.plan_type || extractPlanFromReference(payment.external_reference);

                return (
                  <div
                    key={payment.id || payment.payment_id}
                    className="bg-muted/30 p-4 rounded-xl border border-border hover:border-primary/30 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Left side - Payment & User Info */}
                      <div className="flex-1 space-y-3">
                        {/* Header with status */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-5 w-5 ${status.textColor}`} />
                            <span className="text-foreground font-semibold">
                              #{payment.payment_id}
                            </span>
                          </div>
                          <Badge className={`${status.color} text-white`}>
                            {status.label}
                          </Badge>
                        </div>

                        {/* User Info Section */}
                        <div className="bg-background/50 rounded-lg p-3 space-y-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                            Dados do Solicitante
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-foreground text-sm truncate">
                                {payment.user_profile?.name || 'Nome não disponível'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-foreground text-sm truncate">
                                {payment.payer_email || payment.user_profile?.email || 'N/A'}
                              </span>
                            </div>
                            {(payment.user_profile?.whatsapp || payment.user_profile?.phone) && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-foreground text-sm">
                                  {payment.user_profile?.whatsapp || payment.user_profile?.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Payment Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide">Valor</p>
                            <p className="text-primary font-bold text-lg">{formatCurrency(payment.transaction_amount || 0)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide">Plano</p>
                            <p className="text-foreground font-medium">{getPlanTypeName(planType)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide">Criado em</p>
                            <p className="text-foreground text-sm">{formatDate(payment.created_at)}</p>
                          </div>
                          {subscription && (
                            <div>
                              <p className="text-muted-foreground text-xs uppercase tracking-wide">Expira em</p>
                              <p className="text-foreground text-sm">
                                {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Status Detail */}
                        {payment.status_detail && (
                          <div className="text-xs text-muted-foreground">
                            Detalhe: {payment.status_detail}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PixPaymentsDashboard;
