
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MercadoPagoCheckout from './MercadoPagoCheckout';
import { PlanData } from '@/types/mercadopago';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ActionButtonsProps {
  onFreeTrialClick?: () => void;
  onProClick?: () => void;
  onMonthlyPlanClick?: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onFreeTrialClick, 
  onProClick,
  onMonthlyPlanClick 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [plans, setPlans] = useState<PlanData[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) {
        console.error('Erro ao buscar planos:', error);
        return;
      }

      const formattedPlans = data.map(plan => ({
        id: plan.plan_id,
        name: plan.name,
        price: `R$ ${plan.price.toFixed(2).replace('.', ',')}`,
        amount: plan.price,
        plan_type: plan.plan_type || plan.plan_id
      }));

      setPlans(formattedPlans);
    };

    fetchPlans();
  }, []);

  const handlePlanClick = (planId: string) => {
    // Verificar se o usuário está logado
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para assinar um plano. Redirecionando...",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
      setCheckoutOpen(true);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <Button 
        onClick={onFreeTrialClick}
        className="no-yellow-border bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 border-transparent"
      >
        <Zap className="h-5 w-5" />
        COMEÇAR TESTE GRÁTIS AGORA
      </Button>
      
      <Button 
        onClick={() => handlePlanClick('mensal')}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
      >
        <Crown className="h-5 w-5" />
        ASSINAR PLANO MENSAL
      </Button>
      
      <Button 
        onClick={() => handlePlanClick('pro')}
        className="pro-button flex items-center gap-2"
      >
        <Crown className="h-5 w-5" />
        ASSINAR PRO
      </Button>

      {selectedPlan && (
        <MercadoPagoCheckout
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          selectedPlan={selectedPlan}
        />
      )}
    </div>
  );
};

export default ActionButtons;
