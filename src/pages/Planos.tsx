import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Crown, CreditCard, RefreshCw, User, History, Clock, Zap, Shield, Star, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { useNavigate } from 'react-router-dom';
import CheckoutPage from '@/components/checkout/CheckoutPage';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PublicLayout } from '@/components/PublicLayout';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FEATURE_KEYS, FEATURE_LABELS, TIER_FEATURES, type TierName } from '@/constants/featureAccess';
import { cn } from '@/lib/utils';

interface SelectedPlan {
  id: string;
  name: string;
  price: string;
  amount: number;
  plan_type: string;
  period?: string;
  description?: string;
  period_days?: number;
}

// All feature keys in display order
const ALL_FEATURES = [
  FEATURE_KEYS.PDV_ACCESS,
  FEATURE_KEYS.REGISTER_PURCHASES,
  FEATURE_KEYS.REGISTER_EXPENSES,
  FEATURE_KEYS.CASH_SUMMARY,
  FEATURE_KEYS.PRINT_RECEIPTS,
  FEATURE_KEYS.CASH_REGISTER,
  FEATURE_KEYS.AVULSA_SALES,
  FEATURE_KEYS.BASIC_HISTORY,
  FEATURE_KEYS.STOCK_CONTROL,
  FEATURE_KEYS.COST_TRACKING,
  FEATURE_KEYS.BASIC_REPORTS,
  FEATURE_KEYS.PROFIT_PER_SALE,
  FEATURE_KEYS.CLIENT_MANAGEMENT,
  FEATURE_KEYS.EMPLOYEE_MANAGEMENT,
  FEATURE_KEYS.ADVANCED_DASHBOARD,
  FEATURE_KEYS.PROFIT_PROJECTIONS,
  FEATURE_KEYS.ADVANCED_ANALYTICS,
  FEATURE_KEYS.EXPORT_CSV_EXCEL,
] as const;

interface TierConfig {
  name: TierName;
  displayName: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  popular?: boolean;
  gradient: string;
  borderColor: string;
  iconBg: string;
}

const TIERS: TierConfig[] = [
  {
    name: 'essencial',
    displayName: 'Essencial',
    description: 'Para quem está começando e precisa do básico para operar',
    icon: <Shield className="h-6 w-6" />,
    gradient: 'from-slate-800 to-slate-900',
    borderColor: 'border-slate-600',
    iconBg: 'bg-blue-500/20 text-blue-400',
  },
  {
    name: 'pro',
    displayName: 'Pro',
    description: 'Controle total com estoque, clientes, relatórios, analytics e projeções',
    icon: <Crown className="h-6 w-6" />,
    badge: 'Mais Completo',
    badgeColor: 'bg-amber-500',
    popular: true,
    gradient: 'from-amber-900/30 to-slate-900',
    borderColor: 'border-amber-500/50',
    iconBg: 'bg-amber-500/20 text-amber-400',
  },
];

const Planos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier: currentTier } = useFeatureAccess();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [renewalsHistory, setRenewalsHistory] = useState<any[]>([]);
  const [accountAge, setAccountAge] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const timeoutId = setTimeout(() => setLoading(false), 5000);
      try {
        if (user) {
          await Promise.all([loadPlans(), loadSubscriptionData()]);
        } else {
          await loadPlans();
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, price, period, description, is_popular, is_promotional, promotional_price, promotional_period, promotional_description, savings, plan_type, period_days, tier')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const loadSubscriptionData = async () => {
    if (!user) return;
    try {
      const [subscriptionResult, renewalsResult, profileResult] = await Promise.all([
        supabase.from('user_subscriptions')
          .select('id, plan_type, tier, is_active, expires_at, activated_at')
          .eq('user_id', user.id).eq('is_active', true)
          .order('expires_at', { ascending: false }).limit(1),
        supabase.from('user_subscriptions')
          .select('id, plan_type, tier, is_active, expires_at, activated_at, payment_method')
          .eq('user_id', user.id).order('activated_at', { ascending: false }).limit(10),
        supabase.from('profiles').select('created_at').eq('id', user.id).single()
      ]);
      setCurrentSubscription(subscriptionResult.data?.[0] || null);
      setRenewalsHistory(renewalsResult.data || []);
      if (profileResult.data?.created_at) {
        const diffDays = Math.floor((Date.now() - new Date(profileResult.data.created_at).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 30) setAccountAge(`${diffDays} dias`);
        else if (diffDays < 365) { const m = Math.floor(diffDays / 30); setAccountAge(`${m} ${m === 1 ? 'mês' : 'meses'}`); }
        else { const y = Math.floor(diffDays / 365); const m = Math.floor((diffDays % 365) / 30); setAccountAge(`${y} ${y === 1 ? 'ano' : 'anos'}${m > 0 ? ` e ${m} mês${m > 1 ? 'es' : ''}` : ''}`); }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const getDaysRemaining = () => {
    if (!currentSubscription) return 0;
    return Math.max(0, Math.ceil((new Date(currentSubscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  };

  const getPlanName = (planType: string) => {
    const names: Record<string, string> = { monthly: 'Mensal', quarterly: 'Trimestral', biannual: 'Semestral', annual: 'Anual', triennial: 'Trienal', trial: 'Teste' };
    return names[planType] || planType;
  };

  // Get plan for a specific tier and period
  const getPlanForTierAndPeriod = (tierName: TierName, period: string) => {
    return plans.find(p => p.tier === tierName && p.plan_type === period);
  };

  // Get cheapest plan across all tiers for the selected period (for header display)
  const cheapestPlanForPeriod = useMemo(() => {
    const periodPlans = plans.filter(p => p.plan_type === selectedPeriod);
    return periodPlans.sort((a: any, b: any) => a.price - b.price)[0] || null;
  }, [plans, selectedPeriod]);

  const handleSelectTier = (tierName: TierName) => {
    const plan = getPlanForTierAndPeriod(tierName, selectedPeriod);
    if (!plan) {
      toast({ title: 'Plano não disponível', description: 'Este período não está disponível para este plano.', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Login necessário', description: 'Faça login ou cadastre-se para assinar.', variant: 'destructive' });
      navigate('/login');
      return;
    }
    const price = plan.is_promotional && plan.promotional_price ? plan.promotional_price : plan.price;
    setSelectedPlan({
      id: plan.id,
      name: plan.name,
      price: `R$ ${price.toFixed(2).replace('.', ',')}`,
      amount: price,
      plan_type: plan.plan_type,
      period_days: plan.period_days,
    });
    setCheckoutOpen(true);
  };

  const daysRemaining = getDaysRemaining();
  const periods = [
    { key: 'monthly', label: 'Mensal' },
    { key: 'quarterly', label: 'Trimestral' },
    { key: 'annual', label: 'Anual' },
  ];

  const isExpired = !!currentSubscription && new Date(currentSubscription.expires_at).getTime() < Date.now();
  const expiredDateLabel = currentSubscription
    ? new Date(currentSubscription.expires_at).toLocaleDateString('pt-BR')
    : '';

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {isExpired && (
          <div className="rounded-xl border border-red-500/40 bg-gradient-to-r from-red-950/70 to-orange-950/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-red-200">Sua assinatura expirou em {expiredDateLabel}</h3>
              <p className="text-sm text-red-200/80 mt-0.5">Renove agora para reativar todas as funcionalidades do sistema.</p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">Planos & Preços</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Escolha o plano ideal para seu depósito
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Comece com o Essencial e faça upgrade quando precisar. Todos os planos incluem suporte e atualizações.
          </p>
        </div>

        {/* Period selector */}
        <div className="flex justify-center">
          <div className="inline-flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1.5 gap-2">
            {periods.map(p => {
              const savingsText = p.key === 'quarterly' ? 'Economize ~10%' : p.key === 'annual' ? 'Economize ~20%' : null;
              const isActive = selectedPeriod === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setSelectedPeriod(p.key)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-all min-w-[100px]',
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                  )}
                >
                  <span>{p.label}</span>
                  {savingsText && (
                    <span className={cn(
                      'text-[10px] font-semibold leading-none',
                      isActive ? 'text-emerald-200' : 'text-amber-400'
                    )}>
                      {savingsText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price display */}
        {cheapestPlanForPeriod && (
          <div className="text-center">
            <p className="text-slate-400 text-sm">A partir de</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-white">
                R$ {(cheapestPlanForPeriod.is_promotional && cheapestPlanForPeriod.promotional_price
                  ? cheapestPlanForPeriod.promotional_price
                  : cheapestPlanForPeriod.price
                ).toFixed(2).replace('.', ',')}
              </span>
              <span className="text-slate-400">/{getPlanName(selectedPeriod).toLowerCase()}</span>
            </div>
            {cheapestPlanForPeriod.is_promotional && cheapestPlanForPeriod.promotional_description && (
              <Badge className="mt-2 bg-amber-500/20 text-amber-400 border-amber-500/30">
                <Zap className="h-3 w-3 mr-1" />
                {cheapestPlanForPeriod.promotional_description}
              </Badge>
            )}
          </div>
        )}

        {/* Current subscription card */}
        {user && currentSubscription && (
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium flex items-center">
                      Plano {getPlanName(currentSubscription.plan_type)}
                      {currentSubscription.tier && (
                        <Badge className="ml-2 bg-emerald-600/20 text-emerald-400 text-xs capitalize">{currentSubscription.tier}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span className={daysRemaining > 7 ? 'text-emerald-400' : daysRemaining > 0 ? 'text-yellow-400' : 'text-red-400'}>
                        {daysRemaining} dias restantes
                      </span>
                      {accountAge && <span>• Membro há {accountAge}</span>}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    const plan = plans.find(p => p.plan_type === currentSubscription.plan_type);
                    if (plan) handleSelectTier(currentTier || 'pro');
                  }}
                  size="sm"
                  variant="outline"
                  className="border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Renovar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {(currentTier === 'essencial' ? [...TIERS].reverse() : TIERS).map((tier) => {
            const tierFeatures = TIER_FEATURES[tier.name];
            const isCurrentTier = currentTier === tier.name;
            const tierPlan = getPlanForTierAndPeriod(tier.name, selectedPeriod);
            const tierPrice = tierPlan ? (tierPlan.is_promotional && tierPlan.promotional_price ? tierPlan.promotional_price : tierPlan.price) : null;

            return (
              <Card
                key={tier.name}
                className={cn(
                  'relative bg-gradient-to-b border-2 transition-all duration-300 hover:scale-[1.02]',
                  tier.gradient,
                  tier.popular ? tier.borderColor : isCurrentTier ? 'border-blue-500' : tier.borderColor,
                  tier.popular && 'ring-1 ring-emerald-500/30'
                )}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className={cn('text-xs font-bold px-3 py-1 shadow-lg', tier.badgeColor)}>
                      {tier.badge}
                    </Badge>
                  </div>
                )}
                {isCurrentTier && (
                  <div className="absolute -top-3 right-4 z-10">
                    <Badge className="bg-blue-600 text-xs px-2">Seu Plano</Badge>
                  </div>
                )}

                <CardContent className="p-6 flex flex-col h-full">
                  {/* Tier header */}
                  <div className="mb-5">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3', tier.iconBg)}>
                      {tier.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white">{tier.displayName}</h3>
                    <p className="text-slate-400 text-sm mt-1">{tier.description}</p>
                    {tierPrice !== null && (
                      <div className="mt-3">
                        <span className="text-2xl font-bold text-white">R$ {tierPrice.toFixed(2).replace('.', ',')}</span>
                        <span className="text-slate-400 text-sm">/{getPlanName(selectedPeriod).toLowerCase()}</span>
                        {tierPlan?.savings && (
                          <div className="mt-1">
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">{tierPlan.savings}</Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Features list */}
                  <div className="flex-1 space-y-2.5 mb-6">
                    {ALL_FEATURES.map((featureKey) => {
                      const included = tierFeatures.includes(featureKey);
                      return (
                        <div key={featureKey} className="flex items-center gap-2.5">
                          {included ? (
                            <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                              <Check className="h-3 w-3 text-emerald-400" />
                            </div>
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                              <X className="h-3 w-3 text-slate-600" />
                            </div>
                          )}
                          <span className={cn(
                            'text-sm',
                            included ? 'text-slate-300' : 'text-slate-600 line-through'
                          )}>
                            {FEATURE_LABELS[featureKey]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={() => handleSelectTier(tier.name)}
                    className={cn(
                      'w-full h-12 text-base font-semibold transition-all',
                      tier.popular
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/25'
                        : isCurrentTier
                        ? 'bg-blue-600 hover:bg-blue-500'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    )}
                  >
                    {isCurrentTier ? (
                      <>Renovar Plano</>
                    ) : (
                      <>
                        {user ? 'Fazer Upgrade' : 'Começar Agora'}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          {[
            { icon: <Shield className="h-5 w-5 text-emerald-400" />, text: 'Pagamento Seguro' },
            { icon: <Zap className="h-5 w-5 text-amber-400" />, text: 'Ativação Imediata' },
            { icon: <RefreshCw className="h-5 w-5 text-blue-400" />, text: 'Cancele Quando Quiser' },
            { icon: <Star className="h-5 w-5 text-purple-400" />, text: 'Suporte Dedicado' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
              {item.icon}
              <span className="text-slate-400 text-xs font-medium">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Renewal history */}
        {user && renewalsHistory.length > 1 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="h-4 w-4 text-slate-400" />
                <span className="text-slate-400 text-sm font-medium">Histórico</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {renewalsHistory.slice(0, 6).map((r) => (
                  <div key={r.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-full text-xs">
                    <span className="text-white">{getPlanName(r.plan_type)}</span>
                    <span className="text-slate-500">
                      {new Date(r.activated_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                    </span>
                    <Badge variant="secondary" className={cn('text-[10px]',
                      new Date(r.expires_at) > new Date() ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-600/50 text-slate-400'
                    )}>
                      {new Date(r.expires_at) > new Date() ? 'Ativo' : 'Exp.'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Checkout modal */}
      {selectedPlan && checkoutOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          <CheckoutPage
            selectedPlan={selectedPlan}
            onClose={() => {
              setCheckoutOpen(false);
              setSelectedPlan(null);
              if (user) loadSubscriptionData();
            }}
          />
        </div>
      )}
    </PublicLayout>
  );
};

export default Planos;
