import { Check, X, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Plan {
  id: string;
  name: string;
  price: number;
  period_days: number;
  description: string | null;
  is_popular: boolean;
  is_active: boolean;
  tier?: string;
  features?: string[];
}

interface LandingPlansProps {
  plans: Plan[];
  onSelectPlan: (plan: Plan) => void;
}

const TIER_FEATURES: Record<string, { included: string[]; excluded: string[] }> = {
  essencial: {
    included: [
      'PDV completo (compra e venda)',
      'Venda avulsa com valor livre',
      'Abertura e fechamento de caixa',
      'Registro de despesas',
      'Impressão de comprovantes',
      'Resumo de saldos no fechamento',
      'Pesagens ilimitadas',
      'Suporte via WhatsApp',
    ],
    excluded: [
      'Histórico de compras e vendas',
      'Controle de estoque automático',
      'Rastreamento de custos',
      'Relatórios detalhados',
      'Lucro por venda',
      'Cadastro de clientes',
      'Gestão de funcionários',
      'Dashboard avançado',
      'Projeções de lucro',
      'Analytics avançado',
      'Exportar CSV/Excel',
    ],
  },
  pro: {
    included: [
      'Tudo do plano Essencial',
      'Histórico de compras e vendas',
      'Controle de estoque automático',
      'Rastreamento de custos',
      'Relatórios detalhados',
      'Lucro por venda',
      'Cadastro de clientes',
      'Gestão de funcionários',
      'Dashboard avançado',
      'Projeções de lucro',
      'Analytics avançado',
      'Exportar CSV/Excel',
      'Pesagens ilimitadas',
      'Suporte prioritário',
    ],
    excluded: [],
  },
};

function getTierFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('pro')) return 'pro';
  return 'essencial';
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  essencial: <Zap className="w-5 h-5 text-blue-400" />,
  pro: <Crown className="w-5 h-5 text-amber-400" />,
};

export function LandingPlans({ plans, onSelectPlan }: LandingPlansProps) {
  if (!plans.length) return null;

  const formatPrice = (price: number) => `R$ ${price.toFixed(2).replace('.', ',')}`;

  const formatPeriod = (days: number) => {
    if (days === 30) return '/mês';
    if (days === 90) return '/trimestre';
    if (days === 180) return '/semestre';
    if (days === 365) return '/ano';
    return `/${days} dias`;
  };

  // Show only one plan per tier (prefer monthly/30-day plans)
  const activePlans = plans.filter(p => p.is_active);
  const tierMap = new Map<string, Plan>();
  for (const plan of activePlans) {
    const tier = plan.tier || getTierFromName(plan.name);
    const existing = tierMap.get(tier);
    // Prefer 30-day (monthly) plan, otherwise keep cheapest
    if (!existing || (plan.period_days === 30 && existing.period_days !== 30) || (plan.period_days === existing.period_days && plan.price < existing.price)) {
      tierMap.set(tier, plan);
    }
  }
  const sortedPlans = Array.from(tierMap.values()).sort((a, b) => a.price - b.price);

  return (
    <section className="py-24 bg-slate-800/50 min-h-[600px]" id="planos" aria-labelledby="planos-heading">
      <div className="container mx-auto px-4">
        <header className="text-center mb-16">
          <h2 id="planos-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">Planos simples e justos</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Comece de graça, evolua quando precisar.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {sortedPlans.map((plan) => {
            const tier = plan.tier || getTierFromName(plan.name);
            const features = TIER_FEATURES[tier] || TIER_FEATURES.essencial;

            return (
              <div key={plan.id} className={`relative bg-slate-800 border rounded-2xl p-8 transition-all duration-300 hover:shadow-lg flex flex-col ${
                plan.is_popular ? 'border-amber-500 shadow-lg shadow-amber-500/20 scale-105' : 'border-slate-700 hover:border-emerald-500/50 hover:shadow-emerald-500/10'
              }`}>
                {plan.is_popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-4 py-1 text-xs">Mais Completo</Badge>
                )}
                <div className="flex items-center gap-2 mb-1">
                  {TIER_ICONS[tier]}
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                </div>
                {plan.description && <p className="text-slate-500 text-sm mb-4">{plan.description}</p>}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">{formatPrice(plan.price)}</span>
                  <span className="text-slate-400 text-sm">{formatPeriod(plan.period_days)}</span>
                </div>
                <Button onClick={() => onSelectPlan(plan)} className={`w-full py-5 text-base font-semibold rounded-lg mb-6 ${
                  plan.is_popular ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25' : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}>
                  {plan.is_popular ? 'Assinar Agora' : 'Começar Grátis'}
                </Button>
                <ul className="space-y-2.5 flex-1">
                  {features.included.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />{f}
                    </li>
                  ))}
                  {features.excluded.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-slate-500 text-sm line-through">
                      <X className="w-4 h-4 text-slate-600 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
