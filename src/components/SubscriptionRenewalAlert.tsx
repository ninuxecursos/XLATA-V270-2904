import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Crown, Calendar, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import MercadoPagoCheckout from './MercadoPagoCheckout';
import { PlanData } from '@/types/mercadopago';

const SubscriptionRenewalAlert: React.FC = () => {
  const { user } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
      loadPlans();
    }
  }, [user]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(3);

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
        icon: plan.is_popular ? Crown : plan.is_promotional ? AlertTriangle : Calendar,
        plan_type: plan.plan_type || plan.plan_id
      })) || [];

      setPlans(formattedPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('expires_at, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (subscription) {
        const expiresDate = new Date(subscription.expires_at);
        const now = new Date();
        const diffTime = expiresDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setDaysRemaining(diffDays);

        // Mostrar alerta se faltam 3 dias ou menos OU já expirou
        if (diffDays <= 3) {
          checkAndShowAlert(diffDays);
        }
      } else {
        // Sem assinatura ativa — verificar se houve uma expirada
        const { data: lastSub } = await supabase
          .from('user_subscriptions')
          .select('expires_at')
          .eq('user_id', user.id)
          .order('expires_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lastSub) {
          setDaysRemaining(0);
          checkAndShowAlert(0);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status da assinatura:', error);
    }
  };

  const checkAndShowAlert = (days: number) => {
    const lastShownKey = `renewal_alert_shown_${user.id}`;
    const lastShown = localStorage.getItem(lastShownKey);
    const now = new Date().getTime();

    // Mostrar alerta no máximo 3 vezes por dia (a cada 8 horas)
    if (!lastShown || (now - parseInt(lastShown)) > 8 * 60 * 60 * 1000) {
      setShowAlert(true);
      localStorage.setItem(lastShownKey, now.toString());
    }
  };

  const handleSelectPlan = (planId: string) => {
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
    setShowAlert(false);
    setCheckoutOpen(true);
  };

  const handleClose = () => {
    setShowAlert(false);
  };

  return (
    <>
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-center text-yellow-400 font-bold flex items-center justify-center gap-2">
              <AlertTriangle className="h-8 w-8" />
              {daysRemaining <= 0 ? 'Sua Assinatura Expirou!' : 'Sua Assinatura Está Expirando!'}
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-6">
            <div className="text-center">
              {daysRemaining <= 0 ? (
                <p className="text-xl text-white mb-2">
                  Sua assinatura <span className="text-red-400 font-bold">expirou</span>. Renove para reativar o acesso.
                </p>
              ) : (
                <p className="text-xl text-white mb-2">
                  Faltam apenas <span className="text-yellow-400 font-bold text-3xl">{daysRemaining} dia(s)</span>
                </p>
              )}
              <p className="text-gray-300">
                Renove agora e mantenha acesso total ao sistema!
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-white font-semibold text-center mb-4">Escolha um plano para renovar:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {plans.map((plan) => {
                  const IconComponent = plan.icon;
                  return (
                    <Card 
                      key={plan.id}
                      className="bg-gray-900 border-gray-700 p-4 cursor-pointer hover:border-green-400 transition-colors"
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      <div className="text-center space-y-2">
                        <div className="flex justify-center">
                          <IconComponent className="h-6 w-6 text-green-400" />
                        </div>
                        <h4 className="text-white font-semibold text-sm">{plan.name}</h4>
                        <p className="text-green-400 font-bold text-lg">{plan.price}</p>
                        <p className="text-gray-400 text-xs">{plan.period}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <Button
                onClick={handleClose}
                variant="outline"
                className="w-full mt-4 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Lembrar Mais Tarde
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Checkout Modal */}
      {selectedPlan && (
        <MercadoPagoCheckout
          isOpen={checkoutOpen}
          onClose={() => {
            setCheckoutOpen(false);
            setSelectedPlan(null);
          }}
          selectedPlan={selectedPlan}
        />
      )}
    </>
  );
};

export default SubscriptionRenewalAlert;
