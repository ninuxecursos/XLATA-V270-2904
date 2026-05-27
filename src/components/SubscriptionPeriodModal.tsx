import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, Calendar, Check, Shield, Star, Clock, ChevronRight, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TIER_FEATURES, FEATURE_LABELS, type TierName } from '@/constants/featureAccess';
import { cn } from '@/lib/utils';

interface SubscriptionPlan {
  id: string;
  plan_id: string;
  name: string;
  price: number;
  period: string;
  is_active: boolean;
  is_popular?: boolean;
  is_promotional?: boolean;
  display_order?: number;
  period_days: number;
  tier?: string;
  badge_text?: string;
}

interface SubscriptionPeriodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (days: number, tier?: string) => void;
  userName: string;
  userId?: string;
}

const TIER_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  essencial: { icon: <Shield className="h-4 w-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/40', label: 'Essencial' },
  pro: { icon: <Crown className="h-4 w-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40', label: 'Pro' },
};

const SubscriptionPeriodModal: React.FC<SubscriptionPeriodModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  userName,
  userId
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customDays, setCustomDays] = useState<number | null>(null);
  const [customTier, setCustomTier] = useState<string>('pro');
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');

  useEffect(() => {
    if (open) {
      loadPlans();
      if (userId) loadCurrentSubscription();
      setSelectedPlanId(null);
      setShowCustomInput(false);
      setCustomDays(null);
    }
  }, [open, userId]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({ title: "Erro ao carregar planos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSubscription = async () => {
    if (!userId) return;
    try {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('tier, plan_type, is_active, expires_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setCurrentSubscription(data);
    } catch { /* ignore */ }
  };

  const remainingDays = useMemo(() => {
    if (!currentSubscription) return 0;
    const diff = new Date(currentSubscription.expires_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [currentSubscription]);

  const filteredPlans = useMemo(() => {
    if (selectedTierFilter === 'all') return plans;
    return plans.filter(p => p.tier === selectedTierFilter);
  }, [plans, selectedTierFilter]);

  // Group plans by tier
  const plansByTier = useMemo(() => {
    const grouped: Record<string, SubscriptionPlan[]> = {};
    for (const plan of filteredPlans) {
      const tier = plan.tier || 'pro';
      if (!grouped[tier]) grouped[tier] = [];
      grouped[tier].push(plan);
    }
    return grouped;
  }, [filteredPlans]);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const handleConfirm = () => {
    if (showCustomInput && customDays && customDays > 0) {
      onConfirm(customDays, customTier);
    } else if (selectedPlan) {
      onConfirm(selectedPlan.period_days, selectedPlan.tier || 'essencial');
    }
    onOpenChange(false);
    setSelectedPlanId(null);
    setCustomDays(null);
    setShowCustomInput(false);
  };

  const expirationDate = useMemo(() => {
    const days = showCustomInput ? customDays : selectedPlan?.period_days;
    if (!days || days <= 0) return null;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
  }, [selectedPlan, showCustomInput, customDays]);

  const tiers = ['all', 'essencial', 'pro'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-lg">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Crown className="h-4 w-4 text-amber-400" />
              </div>
              Ativar Plano
            </DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 text-sm mt-2">
            Ativando para <span className="text-white font-medium">{userName}</span>
          </p>

          {/* Current subscription info */}
          {currentSubscription && remainingDays > 0 && (
            <div className="mt-3 flex items-center gap-2 bg-blue-950/50 border border-blue-800/50 rounded-lg px-3 py-2">
              <Clock className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <span className="text-blue-300 text-xs">
                Plano atual: <strong className="capitalize">{currentSubscription.tier || 'pro'}</strong> — {remainingDays} dias restantes
              </span>
            </div>
          )}
        </div>

        {/* Tier filter tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 bg-slate-800/80 rounded-lg p-1">
            {tiers.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTierFilter(t)}
                className={cn(
                  'flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                  selectedTierFilter === t
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-300'
                )}
              >
                {t === 'all' ? 'Todos' : TIER_CONFIG[t]?.label || t}
              </button>
            ))}
          </div>
        </div>

        {/* Plans list */}
        <div className="px-6 py-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-400 border-t-transparent" />
            </div>
          ) : (
            <>
              {Object.entries(plansByTier).map(([tier, tierPlans]) => {
                const config = TIER_CONFIG[tier] || TIER_CONFIG.pro;
                return (
                  <div key={tier} className="space-y-1.5">
                    <div className="flex items-center gap-2 py-1">
                      <span className={cn('text-xs font-semibold uppercase tracking-wider', config.color)}>
                        {config.label}
                      </span>
                      <div className="flex-1 h-px bg-slate-800" />
                    </div>
                    {tierPlans.map(plan => {
                      const isSelected = selectedPlanId === plan.id && !showCustomInput;
                      return (
                        <button
                          key={plan.id}
                          onClick={() => { setSelectedPlanId(plan.id); setShowCustomInput(false); }}
                          className={cn(
                            'w-full text-left rounded-lg border px-4 py-3 transition-all',
                            isSelected
                              ? cn(config.border, config.bg, 'ring-1', config.border)
                              : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/70'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
                                isSelected ? cn(config.border, config.bg) : 'border-slate-600'
                              )}>
                                {isSelected && <Check className={cn('h-3 w-3', config.color)} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-sm font-medium">{plan.name}</span>
                                  {plan.badge_text && (
                                    <Badge className={cn('text-[10px] px-1.5 py-0', config.bg, config.color, 'border-0')}>
                                      {plan.badge_text}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-slate-400 text-xs">{plan.period_days} dias</span>
                                  <span className="text-slate-600 text-xs">•</span>
                                  <span className="text-slate-300 text-xs font-medium">
                                    R$ {plan.price.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className={cn('h-4 w-4 transition-all', isSelected ? config.color : 'text-slate-700')} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {/* Custom period */}
              <div className="pt-1">
                <div className="flex items-center gap-2 py-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Personalizado</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>
                <button
                  onClick={() => { setShowCustomInput(true); setSelectedPlanId(null); }}
                  className={cn(
                    'w-full text-left rounded-lg border px-4 py-3 transition-all',
                    showCustomInput
                      ? 'border-purple-500/40 bg-purple-500/10 ring-1 ring-purple-500/40'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className={cn('h-4 w-4', showCustomInput ? 'text-purple-400' : 'text-slate-500')} />
                    <span className={cn('text-sm font-medium', showCustomInput ? 'text-white' : 'text-slate-400')}>
                      Período Personalizado
                    </span>
                  </div>
                </button>

                {showCustomInput && (
                  <div className="mt-2 space-y-3 bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div>
                      <Label className="text-slate-400 text-xs mb-1.5 block">Dias</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ex: 30"
                        value={customDays || ''}
                        onChange={(e) => setCustomDays(parseInt(e.target.value) || null)}
                        className="bg-slate-900 border-slate-700 text-white h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs mb-1.5 block">Tier</Label>
                      <div className="flex gap-1.5">
                        {(['essencial', 'pro'] as const).map(t => {
                          const cfg = TIER_CONFIG[t];
                          return (
                            <button
                              key={t}
                              onClick={() => setCustomTier(t)}
                              className={cn(
                                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-all',
                                customTier === t
                                  ? cn(cfg.bg, cfg.border, cfg.color)
                                  : 'border-slate-700 text-slate-500 hover:text-slate-300'
                              )}
                            >
                              {cfg.icon}
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Summary & Actions */}
        <div className="px-6 pb-6 space-y-3 border-t border-slate-800 pt-4">
          {expirationDate && (
            <div className="flex items-start gap-2 bg-slate-800/60 rounded-lg px-3 py-2.5">
              <Info className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-slate-300">
                {showCustomInput ? (
                  <>
                    Período personalizado de <strong>{customDays} dias</strong> (tier <strong className="capitalize">{customTier}</strong>).
                    Válido até <strong>{expirationDate}</strong>.
                  </>
                ) : selectedPlan ? (
                  <>
                    <strong>{selectedPlan.name}</strong> — {selectedPlan.period_days} dias (tier <strong className="capitalize">{selectedPlan.tier || 'pro'}</strong>).
                    Válido até <strong>{expirationDate}</strong>.
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* Feature preview for selected tier */}
          {(selectedPlan?.tier || (showCustomInput && customTier)) && (
            <details className="group">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors flex items-center gap-1">
                <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                Ver funcionalidades do tier {(selectedPlan?.tier || customTier)}
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-1 pl-4">
                {TIER_FEATURES[(selectedPlan?.tier || customTier) as TierName]?.map(fk => (
                  <div key={fk} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                    {FEATURE_LABELS[fk]}
                  </div>
                ))}
              </div>
            </details>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleConfirm}
              disabled={(!selectedPlan && !(showCustomInput && customDays && customDays > 0))}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white h-10 font-semibold"
            >
              <Crown className="h-4 w-4 mr-2" />
              Confirmar Ativação
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 h-10"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPeriodModal;
