import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Sparkles, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  title: string;
  headline: string;
  description: string;
  benefit_text: string | null;
  cta_text: string;
  base_plan_id: string;
  original_price: number;
  promo_price: number;
  promo_period_days: number;
  promo_period_label: string;
  starts_at: string;
  ends_at: string;
  target_audience: string;
  is_active: boolean;
  max_displays_per_user: number;
  created_at: string;
}

interface Plan {
  plan_id: string;
  name: string;
  price: number;
  plan_type: string;
}

const PERIOD_PRESETS = [
  { days: 30, label: '1 mês' },
  { days: 90, label: '3 meses' },
  { days: 180, label: '6 meses' },
  { days: 210, label: '6m + 1 grátis' },
  { days: 365, label: '12 meses' },
  { days: 455, label: '12m + 3 grátis' },
];

function formatPeriodLabel(days: number): string {
  if (!days || days <= 0) return `${days} dias`;
  const months = Math.floor(days / 30);
  const remDays = days % 30;
  if (months === 0) return `${days} dias`;
  if (remDays === 0) return months === 1 ? '1 mês' : `${months} meses`;
  return `${months} ${months === 1 ? 'mês' : 'meses'} e ${remDays} dias`;
}

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Todos os usuários' },
  { value: 'expired', label: 'Assinatura expirada' },
  { value: 'trial', label: 'Em período de teste' },
  { value: 'essencial', label: 'Plano Essencial' },
  { value: 'no_subscription', label: 'Sem assinatura' },
];

const emptyForm = {
  title: '',
  headline: '',
  description: '',
  benefit_text: '',
  cta_text: 'Pagar com PIX agora',
  base_plan_id: '',
  original_price: 0,
  promo_price: 0,
  promo_period_days: 180,
  promo_period_label: '6 meses',
  starts_at: '',
  ends_at: '',
  target_audience: 'all',
  is_active: true,
  max_displays_per_user: 3,
};

export const PromotionalCampaignsManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [stats, setStats] = useState<Record<string, { views: number; conversions: number }>>({});

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: p }, { data: views }] = await Promise.all([
      supabase.from('promotional_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('subscription_plans').select('plan_id, name, price, plan_type').eq('is_active', true).order('display_order'),
      supabase.from('promotional_campaign_views').select('campaign_id, view_count, converted'),
    ]);
    setCampaigns((c as Campaign[]) || []);
    setPlans((p as Plan[]) || []);

    const agg: Record<string, { views: number; conversions: number }> = {};
    (views || []).forEach((v: any) => {
      if (!agg[v.campaign_id]) agg[v.campaign_id] = { views: 0, conversions: 0 };
      agg[v.campaign_id].views += 1;
      if (v.converted) agg[v.campaign_id].conversions += 1;
    });
    setStats(agg);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    const now = new Date();
    const in7 = new Date(Date.now() + 7 * 86400000);
    setForm({
      ...emptyForm,
      starts_at: now.toISOString().slice(0, 16),
      ends_at: in7.toISOString().slice(0, 16),
    });
    setDialogOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({
      title: c.title,
      headline: c.headline,
      description: c.description,
      benefit_text: c.benefit_text || '',
      cta_text: c.cta_text,
      base_plan_id: c.base_plan_id,
      original_price: Number(c.original_price),
      promo_price: Number(c.promo_price),
      promo_period_days: c.promo_period_days,
      promo_period_label: c.promo_period_label,
      starts_at: c.starts_at.slice(0, 16),
      ends_at: c.ends_at.slice(0, 16),
      target_audience: c.target_audience,
      is_active: c.is_active,
      max_displays_per_user: c.max_displays_per_user,
    });
    setDialogOpen(true);
  };

  const onPlanChange = (planId: string) => {
    const plan = plans.find(p => p.plan_id === planId);
    setForm(f => ({
      ...f,
      base_plan_id: planId,
      original_price: plan ? Number(plan.price) : f.original_price,
    }));
  };

  const onPeriodChange = (days: string) => {
    const n = Math.max(1, parseInt(days, 10) || 0);
    setForm(f => ({ ...f, promo_period_days: n, promo_period_label: formatPeriodLabel(n) }));
  };

  const applyPeriodPreset = (days: number, label: string) => {
    setForm(f => ({ ...f, promo_period_days: days, promo_period_label: label }));
  };

  const save = async () => {
    if (!form.title || !form.headline || !form.base_plan_id || form.promo_price <= 0) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha título, headline, plano e preço promocional.', variant: 'destructive' });
      return;
    }
    if (new Date(form.ends_at) <= new Date(form.starts_at)) {
      toast({ title: 'Datas inválidas', description: 'A data final deve ser após a inicial.', variant: 'destructive' });
      return;
    }

    const payload = {
      ...form,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      benefit_text: form.benefit_text.trim() || null,
    };

    const { error } = editing
      ? await supabase.from('promotional_campaigns').update(payload).eq('id', editing.id)
      : await supabase.from('promotional_campaigns').insert(payload);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editing ? 'Promoção atualizada' : 'Promoção criada' });
    setDialogOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir esta promoção?')) return;
    const { error } = await supabase.from('promotional_campaigns').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Promoção excluída' });
    load();
  };

  const toggleActive = async (c: Campaign) => {
    const { error } = await supabase.from('promotional_campaigns').update({ is_active: !c.is_active }).eq('id', c.id);
    if (!error) load();
  };

  const seedTemplates = async () => {
    const proPlan = plans.find(p => p.plan_id === 'monthly') || plans.find(p => p.plan_type === 'monthly' && p.name.toLowerCase().includes('pro'));
    if (!proPlan) {
      toast({ title: 'Plano Pro não encontrado', description: 'Cadastre o plano Pro Mensal antes de criar os modelos.', variant: 'destructive' });
      return;
    }
    const basePrice = Number(proPlan.price);
    const now = new Date();
    const ends = new Date(Date.now() + 30 * 86400000);
    const startsISO = now.toISOString();
    const endsISO = ends.toISOString();

    const templates = [
      {
        title: 'Promo 6 meses + 1 mês grátis',
        headline: 'Pague 6 meses e ganhe 1 mês GRÁTIS 🎁',
        description: `Contrate 6 meses do plano Pro por R$ ${(basePrice * 6).toFixed(2).replace('.', ',')} e libere 7 meses de acesso total. Apenas hoje.`,
        benefit_text: 'Acesso total ao Pro\nSuporte prioritário\n+1 mês grátis incluso\nSem reajustes no período',
        cta_text: 'Quero 7 meses por 6',
        base_plan_id: proPlan.plan_id,
        original_price: Number((basePrice * 6).toFixed(2)),
        promo_price: Number((basePrice * 6).toFixed(2)),
        promo_period_days: 210,
        promo_period_label: '6 meses + 1 grátis',
        starts_at: startsISO,
        ends_at: endsISO,
        target_audience: 'all',
        is_active: false,
        max_displays_per_user: 3,
      },
      {
        title: 'Promo Anual + 3 meses grátis',
        headline: 'Plano anual com 3 meses GRÁTIS 🚀',
        description: `Contrate 12 meses por R$ ${(basePrice * 12 * 0.85).toFixed(2).replace('.', ',')} e ganhe +3 meses. Total de 15 meses liberados.`,
        benefit_text: '15 meses de Pro liberados\nEconomia de mais de R$ 400\nSuporte VIP\nSem mensalidade pelos próximos 15 meses',
        cta_text: 'Garantir 15 meses agora',
        base_plan_id: proPlan.plan_id,
        original_price: Number((basePrice * 12).toFixed(2)),
        promo_price: Number((basePrice * 12 * 0.85).toFixed(2)),
        promo_period_days: 455,
        promo_period_label: '12 meses + 3 grátis',
        starts_at: startsISO,
        ends_at: endsISO,
        target_audience: 'all',
        is_active: false,
        max_displays_per_user: 3,
      },
      {
        title: 'Promo Trimestral relâmpago',
        headline: '3 meses por R$ 299 (só hoje) ⚡',
        description: `Pague 3 meses do Pro com desconto especial e libere 3 meses + 5 dias bônus.`,
        benefit_text: 'Pro completo por 95 dias\nDesconto exclusivo\n5 dias extras de cortesia\nAtivação imediata via PIX',
        cta_text: 'Aproveitar desconto',
        base_plan_id: proPlan.plan_id,
        original_price: Number((basePrice * 3).toFixed(2)),
        promo_price: 299.0,
        promo_period_days: 95,
        promo_period_label: '3 meses + 5 dias',
        starts_at: startsISO,
        ends_at: endsISO,
        target_audience: 'all',
        is_active: false,
        max_displays_per_user: 3,
      },
    ];

    const { error } = await supabase.from('promotional_campaigns').insert(templates);
    if (error) {
      toast({ title: 'Erro ao criar modelos', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '3 modelos criados', description: 'Promoções salvas como inativas. Ative quando quiser.' });
    load();
  };

  const statusOf = (c: Campaign) => {
    const now = new Date();
    if (!c.is_active) return { label: 'Inativa', cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    if (new Date(c.starts_at) > now) return { label: 'Agendada', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    if (new Date(c.ends_at) < now) return { label: 'Expirada', cls: 'bg-red-500/20 text-red-300 border-red-500/30' };
    return { label: 'Ativa', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            Campanhas Promocionais
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={seedTemplates} variant="outline" size="sm" disabled={loading || plans.length === 0}>
              <Sparkles className="h-4 w-4 mr-2" /> Criar 3 modelos prontos
            </Button>
            <Button onClick={openNew} className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="h-4 w-4 mr-2" /> Nova promoção
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : campaigns.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma campanha cadastrada.</p>
          ) : (
            <div className="space-y-3">
              {campaigns.map(c => {
                const s = statusOf(c);
                const m = stats[c.id] || { views: 0, conversions: 0 };
                return (
                  <div key={c.id} className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-foreground truncate">{c.title}</h4>
                        <Badge variant="outline" className={s.cls}>{s.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{c.headline}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                        <span>De R$ {Number(c.original_price).toFixed(2)} → <strong className="text-emerald-500">R$ {Number(c.promo_price).toFixed(2)}</strong></span>
                        <span><Calendar className="inline h-3 w-3 mr-1" />{new Date(c.starts_at).toLocaleDateString()} - {new Date(c.ends_at).toLocaleDateString()}</span>
                        <span>{c.promo_period_label}</span>
                        <span>{m.views} usuários • {m.conversions} conversões</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => remove(c.id)} className="text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar promoção' : 'Nova promoção'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Título interno</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Black Friday Pro" />
              </div>
              <div>
                <Label>Plano base</Label>
                <Select value={form.base_plan_id} onValueChange={onPlanChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {plans.map(p => (
                      <SelectItem key={p.plan_id} value={p.plan_id}>
                        {p.name} • R$ {Number(p.price).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Headline (título do modal)</Label>
              <Input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} placeholder="Promoção exclusiva pra você!" />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="6 meses de Pro por R$ 119,90 em vez de R$ 137,90." />
            </div>

            <div>
              <Label>Benefícios (uma linha por benefício, opcional)</Label>
              <Textarea value={form.benefit_text} onChange={e => setForm(f => ({ ...f, benefit_text: e.target.value }))} rows={3} placeholder={"Acesso total ao Pro\nSuporte prioritário\nSem fidelidade"} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Preço original</Label>
                <Input type="number" step="0.01" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Preço promocional</Label>
                <Input type="number" step="0.01" value={form.promo_price} onChange={e => setForm(f => ({ ...f, promo_price: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Período liberado (dias)</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={form.promo_period_days}
                  onChange={e => onPeriodChange(e.target.value)}
                  placeholder="Ex: 35"
                />
                <p className="text-[11px] text-muted-foreground mt-1">{formatPeriodLabel(form.promo_period_days)}</p>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Atalhos de período</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {PERIOD_PRESETS.map(p => (
                  <Button
                    key={p.days}
                    type="button"
                    size="sm"
                    variant={form.promo_period_days === p.days ? 'default' : 'outline'}
                    className={form.promo_period_days === p.days ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent' : ''}
                    onClick={() => applyPeriodPreset(p.days, p.label)}
                  >
                    {p.label} · {p.days}d
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Início</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
              </div>
              <div>
                <Label>Fim</Label>
                <Input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Público-alvo</Label>
                <Select value={form.target_audience} onValueChange={v => setForm(f => ({ ...f, target_audience: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Limite de exibições por usuário</Label>
                <Input type="number" min={1} max={10} value={form.max_displays_per_user} onChange={e => setForm(f => ({ ...f, max_displays_per_user: parseInt(e.target.value) || 3 }))} />
              </div>
            </div>

            <div>
              <Label>Texto do botão (CTA)</Label>
              <Input value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Ativa</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={save} className="bg-emerald-500 hover:bg-emerald-600">
                {editing ? 'Salvar alterações' : 'Criar promoção'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromotionalCampaignsManager;
