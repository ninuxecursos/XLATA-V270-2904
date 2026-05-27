import React, { useEffect, useState } from 'react';
import { useVisitorProfile, type VisitorProfile } from '@/hooks/useVisitorProfile';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, BookOpen, AlertTriangle, Shield, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface CopySet {
  headline: string;
  ctaText: string;
  ctaSubtitle: string;
  argument: string;
  icon: React.ReactNode;
}

const defaultCopy: Record<VisitorProfile, CopySet> = {
  buyer: {
    headline: 'Pare de Perder Dinheiro — Comece a Lucrar Agora',
    ctaText: 'Começar Teste Grátis Agora',
    ctaSubtitle: 'Sem cartão de crédito. Resultado em 5 minutos.',
    argument: 'Donos de ferro velho que usam o XLata aumentam o lucro em até 40% no primeiro mês.',
    icon: <Zap className="h-5 w-5" />,
  },
  interested: {
    headline: 'Descubra Como os Melhores Ferro Velhos se Organizam',
    ctaText: 'Ver Como Funciona',
    ctaSubtitle: 'Conheça o sistema que já ajuda centenas de depósitos.',
    argument: 'O XLata automatiza tudo: compra, venda, estoque e financeiro.',
    icon: <BookOpen className="h-5 w-5" />,
  },
  curious: {
    headline: 'Guia Completo: Como Funciona um Ferro Velho Lucrativo',
    ctaText: 'Aprender Mais',
    ctaSubtitle: 'Conteúdo gratuito e completo para quem quer entender o mercado.',
    argument: 'Milhares de pessoas buscam informação sobre sucata todos os dias.',
    icon: <BookOpen className="h-5 w-5" />,
  },
  problem: {
    headline: 'Seu Ferro Velho Está Desorganizado? Resolva Hoje',
    ctaText: 'Resolver Agora',
    ctaSubtitle: 'Chega de perder vendas e controle. Organize em minutos.',
    argument: 'A falta de controle custa em média R$ 2.000/mês para donos de ferro velho.',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  owner: {
    headline: 'Sistema Profissional Para Seu Depósito de Sucata',
    ctaText: 'Testar Grátis por 7 Dias',
    ctaSubtitle: 'Feito por quem entende o dia a dia do ferro velho.',
    argument: 'PDV, estoque, financeiro e clientes — tudo em um só lugar.',
    icon: <Shield className="h-5 w-5" />,
  },
  beginner: {
    headline: 'Quer Abrir um Ferro Velho? Comece do Jeito Certo',
    ctaText: 'Ver Guia Completo',
    ctaSubtitle: 'Passo a passo para iniciar com segurança e organização.',
    argument: 'O XLata ajuda desde o primeiro dia com controle total.',
    icon: <Rocket className="h-5 w-5" />,
  },
};

interface AdaptiveCTAProps {
  articleId?: string;
  position?: 'top' | 'middle' | 'bottom';
  className?: string;
}

export const AdaptiveCTA: React.FC<AdaptiveCTAProps> = ({ articleId, position = 'middle', className }) => {
  const { profile, sessionId } = useVisitorProfile();
  const navigate = useNavigate();
  const [copy, setCopy] = useState<CopySet>(defaultCopy[profile]);
  const [variationId, setVariationId] = useState<string | null>(null);

  // Load DB copy variations if available
  useEffect(() => {
    const loadCopy = async () => {
      try {
        const { data } = await supabase
          .from('copy_variations')
          .select('id, element_type, content')
          .eq('profile_type', profile)
          .eq('is_active', true);

        if (data?.length) {
          const mapped: Partial<CopySet> = {};
          data.forEach((v: any) => {
            if (v.element_type === 'headline') mapped.headline = v.content;
            if (v.element_type === 'cta_text') mapped.ctaText = v.content;
            if (v.element_type === 'cta_subtitle') mapped.ctaSubtitle = v.content;
            if (v.element_type === 'argument') mapped.argument = v.content;
          });
          setCopy(prev => ({ ...prev, ...mapped }));
          
          // Track impression for first variation found
          const firstVar = data.find((v: any) => v.element_type === 'cta_text');
          if (firstVar) {
            setVariationId(firstVar.id);
            supabase.from('copy_ab_events').insert({
              session_id: sessionId,
              variation_id: firstVar.id,
              event_type: 'impression',
            } as any).then(() => {});
          }
        }
      } catch {}
    };
    loadCopy();
  }, [profile, sessionId]);

  const handleClick = () => {
    // Track click
    if (variationId) {
      supabase.from('copy_ab_events').insert({
        session_id: sessionId,
        variation_id: variationId,
        event_type: 'click',
      } as any).then(() => {});
    }
    navigate('/cadastro');
  };

  // Different layouts for different positions
  if (position === 'top') {
    return (
      <div className={`rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6 ${className || ''}`}>
        <div className="flex items-center gap-3">
          <div className="shrink-0 text-primary">{copy.icon}</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{copy.argument}</p>
          </div>
          <Button size="sm" onClick={handleClick} className="shrink-0">
            {copy.ctaText} <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  if (position === 'bottom') {
    return (
      <div className={`rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-8 mt-8 text-center ${className || ''}`}>
        <h3 className="text-2xl font-bold text-foreground mb-2">{copy.headline}</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">{copy.argument}</p>
        <Button size="lg" onClick={handleClick} className="mb-2">
          {copy.icon}
          <span className="ml-2">{copy.ctaText}</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <p className="text-xs text-muted-foreground">{copy.ctaSubtitle}</p>
      </div>
    );
  }

  // Middle (default)
  return (
    <div className={`rounded-xl border border-border bg-card p-6 my-6 ${className || ''}`}>
      <div className="flex items-start gap-4">
        <div className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary">{copy.icon}</div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-1">{copy.headline}</h4>
          <p className="text-sm text-muted-foreground mb-3">{copy.argument}</p>
          <Button size="sm" onClick={handleClick}>
            {copy.ctaText} <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
          <p className="text-xs text-muted-foreground mt-1">{copy.ctaSubtitle}</p>
        </div>
      </div>
    </div>
  );
};
