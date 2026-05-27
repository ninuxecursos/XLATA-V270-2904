import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, Edit, Plus, Calendar, Sparkles, Crown, Shield, Star, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TIER_FEATURES, FEATURE_LABELS, type TierName, type FeatureKey } from '@/constants/featureAccess';
import { EmployeeSlotPriceCard } from './EmployeeSlotPriceCard';

const TIER_OPTIONS: { value: TierName; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'essencial', label: 'Essencial', color: 'bg-blue-500', icon: <Shield className="h-3 w-3" /> },
  { value: 'pro', label: 'Pro', color: 'bg-amber-500', icon: <Crown className="h-3 w-3" /> },
];

interface SubscriptionPlan {
  id: string;
  plan_id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  amount: number;
  is_popular: boolean;
  is_promotional: boolean;
  promotional_price?: number;
  promotional_period?: string;
  promotional_description?: string;
  savings?: string;
  is_active: boolean;
  display_order: number;
  tier: TierName;
}

export const PlansManagement = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    plan_id: '',
    name: '',
    price: 0,
    period: '',
    description: '',
    amount: 0,
    is_popular: false,
    is_promotional: false,
    promotional_price: 0,
    promotional_period: '',
    promotional_description: '',
    savings: '',
    is_active: true,
    display_order: 0,
    tier: 'pro' as TierName,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPlans((data || []) as SubscriptionPlan[]);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({ title: "Erro", description: "Não foi possível carregar os planos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    try {
      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(formData)
          .eq('id', editingPlan.id);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Plano atualizado com sucesso" });
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert([formData]);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Plano criado com sucesso" });
      }
      setIsDialogOpen(false);
      resetForm();
      loadPlans();
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      toast({ title: "Erro", description: "Não foi possível salvar o plano", variant: "destructive" });
    }
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      plan_id: plan.plan_id,
      name: plan.name,
      price: plan.price,
      period: plan.period,
      description: plan.description,
      amount: plan.amount,
      is_popular: plan.is_popular,
      is_promotional: plan.is_promotional,
      promotional_price: plan.promotional_price || 0,
      promotional_period: plan.promotional_period || '',
      promotional_description: plan.promotional_description || '',
      savings: plan.savings || '',
      is_active: plan.is_active,
      display_order: plan.display_order,
      tier: plan.tier || 'pro',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      plan_id: '',
      name: '',
      price: 0,
      period: '',
      description: '',
      amount: 0,
      is_popular: false,
      is_promotional: false,
      promotional_price: 0,
      promotional_period: '',
      promotional_description: '',
      savings: '',
      is_active: true,
      display_order: 0,
      tier: 'pro',
    });
    setEditingPlan(null);
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id);
      if (error) throw error;
      toast({ title: "Sucesso", description: `Plano ${!plan.is_active ? 'ativado' : 'desativado'} com sucesso` });
      loadPlans();
    } catch (error) {
      console.error('Erro ao alterar status do plano:', error);
      toast({ title: "Erro", description: "Não foi possível alterar o status do plano", variant: "destructive" });
    }
  };

  const getTierOption = (tierName: TierName) => TIER_OPTIONS.find(t => t.value === tierName);

  const getPlanIcon = (plan: SubscriptionPlan) => {
    const tierOpt = getTierOption(plan.tier);
    if (tierOpt) return <span className={`p-1.5 rounded-lg ${plan.tier === 'essencial' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>{tierOpt.icon}</span>;
    if (plan.is_promotional) return <Sparkles className="h-5 w-5 text-green-400" />;
    if (plan.is_popular) return <Crown className="h-5 w-5 text-yellow-400" />;
    return <Calendar className="h-5 w-5 text-blue-400" />;
  };

  const tierFeatures = TIER_FEATURES[formData.tier] || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EmployeeSlotPriceCard />
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Gerenciamento de Planos
          </CardTitle>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card border-border text-foreground">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
                {/* Tier selector - PROMINENT */}
                <div className="p-4 rounded-xl bg-muted/50 border border-primary/30 space-y-3">
                  <Label className="text-sm font-semibold text-primary">Tier de Acesso (Permissões)</Label>
                  <Select
                    value={formData.tier}
                    onValueChange={(value: TierName) => setFormData({ ...formData, tier: value })}
                  >
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder="Selecionar tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            {opt.icon}
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Show features for selected tier */}
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {tierFeatures.map((f: FeatureKey) => (
                      <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                        {FEATURE_LABELS[f]}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan_id">ID do Plano</Label>
                    <Input
                      id="plan_id"
                      value={formData.plan_id}
                      onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                      className="bg-muted border-border text-foreground"
                      placeholder="ex: mensal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Nome do Plano</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-muted border-border text-foreground"
                      placeholder="ex: Plano Mensal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value), amount: Number(e.target.value) })}
                      className="bg-muted border-border text-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="period">Período</Label>
                    <Input
                      id="period"
                      value={formData.period}
                      onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                      className="bg-muted border-border text-foreground"
                      placeholder="ex: /mês"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-muted border-border text-foreground"
                    placeholder="ex: Ideal para começar"
                  />
                </div>

                <div>
                  <Label htmlFor="savings">Economia (opcional)</Label>
                  <Input
                    id="savings"
                    value={formData.savings}
                    onChange={(e) => setFormData({ ...formData, savings: e.target.value })}
                    className="bg-muted border-border text-foreground"
                    placeholder="ex: Economize R$ 50,00"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_popular"
                      checked={formData.is_popular}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                    />
                    <Label htmlFor="is_popular">Mais Popular</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_promotional"
                      checked={formData.is_promotional}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_promotional: checked })}
                    />
                    <Label htmlFor="is_promotional">Promocional</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Ativo</Label>
                  </div>
                </div>

                {formData.is_promotional && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-primary/30">
                    <h4 className="text-sm font-medium text-emerald-400">Configurações Promocionais</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="promotional_price">Preço Promocional (R$)</Label>
                        <Input
                          id="promotional_price"
                          type="number"
                          step="0.01"
                          value={formData.promotional_price}
                          onChange={(e) => setFormData({ ...formData, promotional_price: Number(e.target.value) })}
                          className="bg-muted border-border text-foreground"
                        />
                      </div>
                      <div>
                        <Label htmlFor="promotional_period">Período Promocional</Label>
                        <Input
                          id="promotional_period"
                          value={formData.promotional_period}
                          onChange={(e) => setFormData({ ...formData, promotional_period: e.target.value })}
                          className="bg-muted border-border text-foreground"
                          placeholder="ex: /mês nos 3 primeiros meses"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="promotional_description">Descrição Promocional</Label>
                      <Input
                        id="promotional_description"
                        value={formData.promotional_description}
                        onChange={(e) => setFormData({ ...formData, promotional_description: e.target.value })}
                        className="bg-muted border-border text-foreground"
                        placeholder="ex: Depois R$ 147,90/mês"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="display_order">Ordem de Exibição</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                    className="bg-muted border-border text-foreground"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSavePlan} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {editingPlan ? 'Atualizar' : 'Criar'} Plano
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          {/* Tier legend */}
          <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-muted/30 border border-border">
            <span className="text-xs text-muted-foreground font-medium">Tiers:</span>
            {TIER_OPTIONS.map(t => (
              <div key={t.value} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${t.color}`} />
                <span className="text-xs text-muted-foreground">{t.label} ({TIER_FEATURES[t.value].length} features)</span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {plans.map((plan) => {
              const tierOpt = getTierOption(plan.tier);
              return (
                <div
                  key={plan.id}
                  className={`p-4 rounded-lg border ${
                    plan.is_active ? 'bg-muted/50 border-border' : 'bg-muted/20 border-border opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getPlanIcon(plan)}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground">{plan.name}</h3>
                          {tierOpt && (
                            <Badge className={`${tierOpt.color} text-white text-[10px] px-2 py-0.5`}>
                              {tierOpt.icon}
                              <span className="ml-1">{tierOpt.label}</span>
                            </Badge>
                          )}
                          {plan.is_promotional && (
                            <Badge className="bg-green-600 text-white text-[10px]">Promocional</Badge>
                          )}
                          {plan.is_popular && (
                            <Badge className="bg-yellow-600 text-white text-[10px]">Mais Popular</Badge>
                          )}
                          {!plan.is_active && (
                            <Badge variant="destructive" className="text-[10px]">Inativo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-lg font-bold text-emerald-400">
                            R$ {plan.price.toFixed(2)}{plan.period}
                          </span>
                          {plan.is_promotional && plan.promotional_description && (
                            <span className="text-sm text-amber-400">
                              {plan.promotional_description}
                            </span>
                          )}
                          {plan.savings && (
                            <span className="text-sm text-primary">{plan.savings}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPlan(plan)}
                        className="bg-transparent border-border text-muted-foreground hover:bg-muted"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={plan.is_active ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => handleToggleActive(plan)}
                        className={plan.is_active ? '' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
                      >
                        {plan.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {plans.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum plano encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};