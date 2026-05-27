import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CreditCard, RefreshCw, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import MercadoPagoCheckout from './MercadoPagoCheckout';
import { PlanData } from '@/types/mercadopago';

interface SubscriptionManagementModalProps {
  open: boolean;
  onClose: () => void;
}

interface SubscriptionHistory {
  id: string;
  plan_type: string;
  activated_at: string;
  expires_at: string;
  payment_method: string;
  payment_reference: string;
}

const SubscriptionManagementModal: React.FC<SubscriptionManagementModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [history, setHistory] = useState<SubscriptionHistory[]>([]);
  const [accountAge, setAccountAge] = useState<number>(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    if (open && user) {
      loadSubscriptionData();
      loadPlans();
    }
  }, [open, user]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const formattedPlans = data?.map(plan => ({
        id: plan.plan_id,
        name: plan.name,
        price: plan.is_promotional && plan.promotional_price 
          ? `R$ ${plan.promotional_price.toFixed(2).replace('.', ',')}`
          : `R$ ${plan.price.toFixed(2).replace('.', ',')}`,
        period: plan.is_promotional && plan.promotional_period 
          ? plan.promotional_period 
          : plan.period,
        amount: plan.is_promotional && plan.promotional_price 
          ? plan.promotional_price 
          : plan.price,
        plan_type: plan.plan_type || plan.plan_id
      })) || [];

      setPlans(formattedPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);

      // Carregar assinatura atual
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) throw subError;
      setCurrentSubscription(subscription);

      // Carregar histórico de renovações (todas as assinaturas do usuário)
      const { data: historyData, error: historyError } = await supabase
        .from('user_subscriptions')
        .select('id, plan_type, activated_at, expires_at, payment_method, payment_reference')
        .eq('user_id', user.id)
        .order('activated_at', { ascending: false });

      if (historyError) throw historyError;
      setHistory(historyData || []);

      // Calcular idade da conta
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      
      if (profile) {
        const createdDate = new Date(profile.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setAccountAge(diffDays);
      }

    } catch (error) {
      console.error('Erro ao carregar dados de assinatura:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de assinatura.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = () => {
    if (!currentSubscription) return 0;
    const expiresDate = new Date(currentSubscription.expires_at);
    const now = new Date();
    const diffTime = expiresDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getPlanName = (planType: string) => {
    const names: any = {
      trial: 'Período de Teste',
      monthly: 'Plano Mensal',
      quarterly: 'Plano Trimestral',
      annual: 'Plano Anual'
    };
    return names[planType] || planType;
  };

  const handleRenew = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const planData: PlanData = {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      amount: plan.amount,
      plan_type: plan.plan_type || plan.id
    };

    setSelectedPlan(planData);
    setCheckoutOpen(true);
  };

  const daysRemaining = getDaysRemaining();

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">Gerenciar Meu Plano</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Assinatura Atual */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-400" />
                    Assinatura Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentSubscription ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">Plano</p>
                          <p className="text-white font-semibold">{getPlanName(currentSubscription.plan_type)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Status</p>
                          <Badge className={`${daysRemaining > 7 ? 'bg-green-600' : daysRemaining > 0 ? 'bg-yellow-600' : 'bg-red-600'}`}>
                            {daysRemaining > 0 ? 'Ativo' : 'Expirado'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Dias Restantes</p>
                          <p className={`font-bold text-xl ${daysRemaining > 7 ? 'text-green-400' : daysRemaining > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {daysRemaining} dias
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Expira em</p>
                          <p className="text-white">
                            {new Date(currentSubscription.expires_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleRenew(currentSubscription.plan_type)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Renovar Assinatura
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-4">Você não possui uma assinatura ativa</p>
                      <Button 
                        onClick={() => setCheckoutOpen(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Assinar Agora
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informações da Conta */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-400" />
                    Informações da Conta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Membro desde</p>
                      <p className="text-white font-semibold">{accountAge} dias</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Renovações</p>
                      <p className="text-white font-semibold">{history.length} vez(es)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Histórico de Renovações */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-400" />
                    Histórico de Renovações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {history.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {history.map((item) => (
                        <div key={item.id} className="bg-gray-800 p-3 rounded border border-gray-700">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-white font-medium">{getPlanName(item.plan_type)}</p>
                              <p className="text-gray-400 text-sm">
                                Ativado em: {new Date(item.activated_at).toLocaleDateString('pt-BR')}
                              </p>
                              <p className="text-gray-400 text-sm">
                                Expira em: {new Date(item.expires_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {item.payment_method || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">Nenhum histórico de renovação</p>
                  )}
                </CardContent>
              </Card>

              {/* Planos Disponíveis para Renovação */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-400" />
                    Planos Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.map((plan) => (
                      <div key={plan.id} className="bg-gray-800 p-4 rounded border border-gray-700 text-center">
                        <h3 className="text-white font-semibold mb-2">{plan.name}</h3>
                        <p className="text-2xl font-bold text-green-400 mb-1">{plan.price}</p>
                        <p className="text-gray-400 text-sm mb-4">{plan.period}</p>
                        <Button
                          onClick={() => handleRenew(plan.id)}
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Renovar
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      {selectedPlan && (
        <MercadoPagoCheckout
          isOpen={checkoutOpen}
          onClose={() => {
            setCheckoutOpen(false);
            setSelectedPlan(null);
            loadSubscriptionData(); // Recarregar dados após renovação
          }}
          selectedPlan={selectedPlan}
        />
      )}
    </>
  );
};

export default SubscriptionManagementModal;
