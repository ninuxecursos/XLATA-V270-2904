import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, Gift, ArrowLeft } from 'lucide-react';
import { usePromotionalCampaign } from '@/hooks/usePromotionalCampaign';
import MercadoPagoCheckout from './MercadoPagoCheckout';
import { PlanData } from '@/types/mercadopago';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const formatBRL = (n: number) =>
  `R$ ${n.toFixed(2).replace('.', ',')}`;

interface PromoOption {
  id: 'small' | 'big';
  paidMonths: number;
  freeMonths: number;
  totalMonths: number;
  days: number;
  price: number;
  fullPrice: number;
  label: string;
  highlight?: boolean;
}

const PromotionalCampaignModal: React.FC = () => {
  const { campaign, open, close, dismiss } = usePromotionalCampaign();
  const { user } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [step, setStep] = useState<'choose' | 'details'>('choose');
  const [selectedId, setSelectedId] = useState<'small' | 'big'>('big');

  useEffect(() => {
    if (open) {
      setStep('choose');
      setSelectedId('big');
    }
  }, [open]);

  // Deriva preço mensal a partir da campanha: campanha cadastrada é "pague N, ganhe 1".
  // monthly = promo_price / paidMonths (paidMonths ≈ totalMonths - 1).
  const monthlyPrice = useMemo(() => {
    if (!campaign) return 0;
    const totalMonths = Math.max(1, Math.round(campaign.promo_period_days / 30));
    const paidMonths = Math.max(1, totalMonths - 1);
    return campaign.promo_price / paidMonths;
  }, [campaign]);

  const options: PromoOption[] = useMemo(() => {
    if (!campaign || monthlyPrice <= 0) return [];
    const build = (paid: number, free: number, id: 'small' | 'big'): PromoOption => {
      const total = paid + free;
      return {
        id,
        paidMonths: paid,
        freeMonths: free,
        totalMonths: total,
        days: total * 30,
        price: monthlyPrice * paid,
        fullPrice: monthlyPrice * total,
        label: `${total} meses pagando ${paid}`,
      };
    };
    return [
      build(3, 1, 'small'),
      { ...build(6, 1, 'big'), highlight: true },
    ];
  }, [campaign, monthlyPrice]);

  const selected = options.find(o => o.id === selectedId) || options[0];

  if (!campaign || !selected) return null;

  const discount = Math.round(((selected.fullPrice - selected.price) / selected.fullPrice) * 100);

  const handleAccept = async () => {
    if (!user) return;
    const { data: base } = await supabase
      .from('subscription_plans')
      .select('plan_type, tier, name')
      .eq('plan_id', campaign.base_plan_id)
      .maybeSingle();

    const tier = (base?.tier || 'pro').toLowerCase();
    const promoPlanType = `campaign-${campaign.id}-${selected.days}-${tier}`;

    setPlanData({
      id: campaign.id,
      name: `${campaign.title} • ${selected.label}`,
      price: formatBRL(selected.price),
      amount: selected.price,
      plan_type: promoPlanType,
    });
    setCheckoutOpen(true);
    close();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && close()}>
        <DialogContent className="w-[92vw] max-w-md p-0 mx-auto bg-[#0b1220] border-emerald-500/20 rounded-2xl overflow-hidden gap-0">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent p-6 pb-4 border-b border-emerald-500/10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
              <Sparkles className="h-3 w-3" />
              Oferta exclusiva
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">
              {step === 'choose' ? 'Escolha sua promoção' : `${selected.totalMonths} meses pagando ${selected.paidMonths} 🎁`}
            </h2>
            <p className="text-sm text-white/70 mt-2 leading-relaxed">
              {step === 'choose'
                ? 'Selecione a melhor oferta para você. Quanto mais meses, mais você economiza.'
                : `Contrate ${selected.paidMonths} meses do plano Pro e ganhe +${selected.freeMonths} mês grátis.`}
            </p>
          </div>

          {step === 'choose' ? (
            <div className="p-6 space-y-3">
              {options.map((opt) => {
                const optDiscount = Math.round(((opt.fullPrice - opt.price) / opt.fullPrice) * 100);
                const isActive = selectedId === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedId(opt.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/40'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white">
                            Pague {opt.paidMonths}, leve {opt.totalMonths}
                          </span>
                          {opt.highlight && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                              Mais vantajoso
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/60 mt-0.5 flex items-center gap-1">
                          <Gift className="h-3 w-3 text-emerald-400" />
                          +{opt.freeMonths} mês grátis incluso
                        </p>
                        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                          <span className="text-xs text-white/40 line-through">
                            {formatBRL(opt.fullPrice)}
                          </span>
                          <span className="text-lg font-bold text-emerald-400">
                            {formatBRL(opt.price)}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                            -{optDiscount}%
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 ${
                        isActive ? 'border-emerald-400 bg-emerald-500' : 'border-white/30'
                      }`}>
                        {isActive && <Check className="h-3.5 w-3.5 text-white m-auto mt-0.5" />}
                      </div>
                    </div>
                  </button>
                );
              })}

              <Button
                onClick={() => setStep('details')}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl mt-2"
              >
                Continuar
              </Button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button onClick={close} className="text-white/50 hover:text-white/80 transition-colors">
                  Lembrar mais tarde
                </button>
                <button onClick={() => dismiss(true)} className="text-white/30 hover:text-white/60 transition-colors">
                  Não mostrar mais
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm text-white/40 line-through">
                    {formatBRL(selected.fullPrice)}
                  </span>
                  <span className="text-xs text-white/50">
                    (valor de {selected.totalMonths} meses)
                  </span>
                  {discount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                      -{discount}%
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-emerald-400">
                    {formatBRL(selected.price)}
                  </span>
                  <span className="text-sm text-white/60">à vista</span>
                </div>
                <p className="text-xs text-white/60 mt-2 leading-relaxed">
                  Pague apenas <strong className="text-white/90">{selected.paidMonths} meses</strong> e use o sistema por <strong className="text-emerald-300">{selected.totalMonths} meses</strong>.
                </p>
              </div>

              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-white/80">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Acesso total ao Pro</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-white/80">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Suporte prioritário</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-white/80">
                  <Gift className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>+{selected.freeMonths} mês grátis incluso</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-white/80">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Sem reajustes no período</span>
                </li>
              </ul>

              <Button
                onClick={handleAccept}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl"
              >
                Quero {selected.totalMonths} meses por {selected.paidMonths}
              </Button>

              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={() => setStep('choose')}
                  className="text-white/60 hover:text-white/90 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Trocar oferta
                </button>
                <button
                  onClick={() => dismiss(true)}
                  className="text-white/30 hover:text-white/60 transition-colors"
                >
                  Não mostrar mais
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {planData && (
        <MercadoPagoCheckout
          isOpen={checkoutOpen}
          onClose={() => {
            setCheckoutOpen(false);
            setPlanData(null);
          }}
          selectedPlan={planData}
        />
      )}
    </>
  );
};

export default PromotionalCampaignModal;
