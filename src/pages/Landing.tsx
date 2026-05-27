import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSEO } from '@/hooks/useSEO';
import { useAuth } from '@/hooks/useAuth';
import { useLandingData } from '@/hooks/useLandingData';
import ResponsiveNavigation from '@/components/ResponsiveNavigation';
import { PlanData } from '@/types/mercadopago';
import { LazySection } from '@/components/landing/LazySection';
import { ProgressIndicator } from '@/components/landing/ProgressIndicator';
import ActionChoiceModal from '@/components/landing/ActionChoiceModal';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
// Lazy load MercadoPago Checkout for better performance
const MercadoPagoCheckout = lazy(() => import('@/components/MercadoPagoCheckout'));

// New modular components
import {
  LandingHero,
  LandingHowItWorks,
  LandingRequirements,
  LandingProblems,
  LandingKPIs,
  LandingVideos,
  LandingTestimonials,
  LandingPlans,
  LandingFAQ,
  LandingCTAFinal,
} from '@/components/landing';
import { NationalCoverageSection } from '@/components/landing/NationalCoverageSection';

interface LandingContentSettings {
  id?: string;
  user_id?: string;
  hero_badge_text?: string;
  hero_main_title?: string;
  hero_subtitle?: string;
  hero_description?: string;
  hero_button_text?: string;
  hero_highlight_text?: string;
  hero_secondary_button_text?: string;
  hero_social_proof_users?: string;
  hero_social_proof_users_label?: string;
  hero_social_proof_rating?: string;
  hero_social_proof_rating_label?: string;
  hero_security_label?: string;
  logo_url?: string;
  background_image_url?: string;
  company_name?: string;
  company_phone?: string;
  footer_text?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  og_image?: string;
  og_title?: string;
  og_description?: string;
  twitter_card?: string;
  canonical_url?: string;
  robots_directive?: string;
  favicon_url?: string;
  author?: string;
  json_ld_data?: string;
  video_url?: string;
}

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { updateMetaTags } = useSEO();
  const { user } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Fetch all landing data from new tables
  const { 
    sections,
    howItWorks, 
    requirements, 
    problems, 
    kpis, 
    videos, 
    testimonials, 
    faq, 
    ctaFinal,
    isSectionVisible 
  } = useLandingData();

  const [contentSettings, setContentSettings] = useState<LandingContentSettings | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const defaultSettings: LandingContentSettings = {
    hero_badge_text: '✨ 7 dias grátis • Sem cartão',
    hero_main_title: 'Pese, Calcule e Imprima em',
    hero_subtitle: 'Sem erro. Sem fila. Sem discussão.',
    hero_description: 'Sistema completo para depósitos de sucata que querem parar de perder dinheiro com conta errada e cliente desconfiado.',
    hero_button_text: 'Começar Teste Grátis',
    hero_highlight_text: '3 Minutos',
    hero_secondary_button_text: 'Ver Como Funciona',
    hero_social_proof_users: '130+',
    hero_social_proof_users_label: 'depósitos ativos',
    hero_social_proof_rating: '4.9',
    hero_social_proof_rating_label: 'de satisfação',
    hero_security_label: 'Dados **100% seguros**',
    logo_url: '/lovable-uploads/xlata.site_logotipo.png',
    background_image_url: '/lovable-uploads/capa_xlata.jpg',
    company_name: 'XLata.site',
    company_phone: '(11) 96351-2105',
    footer_text: '© 2025 XLata. Todos os direitos reservados.',
    seo_title: 'Sistema para Depósito de Reciclagem e Ferro Velho | XLata.site',
    seo_description: 'O XLata.site é o sistema que para de perder dinheiro no seu depósito. Pesagem rápida, cálculo certo, fornecedor confiando. Teste grátis 7 dias.',
    seo_keywords: 'sistema para depósito de reciclagem, pdv para ferro velho, controle de caixa sucata, software reciclagem',
  };

  const [plans, setPlans] = useState<any[]>([]);

  const loadPlansData = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const formattedPlans = data?.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.is_promotional && plan.promotional_price 
          ? plan.promotional_price 
          : plan.price,
        period_days: plan.period_days || 30,
        description: plan.description,
        is_popular: plan.is_popular,
        is_active: plan.is_active,
        plan_type: plan.plan_type || plan.plan_id
      })).filter(plan => plan.id !== 'trienal').slice(0, 3) || [];

      setPlans(formattedPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  useEffect(() => {
    loadContentSettings();
    loadPlansData();

    const handleConfigUpdate = () => {
      loadContentSettings();
      loadPlansData();
    };

    window.addEventListener('landingConfigUpdated', handleConfigUpdate);
    return () => window.removeEventListener('landingConfigUpdated', handleConfigUpdate);
  }, []);

  const activeSettings = contentSettings || defaultSettings;

  useEffect(() => {
    if (activeSettings.seo_title) {
      updateMetaTags({
        title: activeSettings.seo_title,
        description: activeSettings.seo_description,
        keywords: activeSettings.seo_keywords,
        author: activeSettings.author || 'XLata.site',
        ogTitle: activeSettings.og_title || activeSettings.seo_title,
        ogDescription: activeSettings.og_description || activeSettings.seo_description,
        ogImage: activeSettings.og_image || activeSettings.logo_url,
        twitterCard: activeSettings.twitter_card || 'summary_large_image',
        robots: activeSettings.robots_directive || 'index, follow',
        canonical: activeSettings.canonical_url || 'https://xlata.site',
        favicon: activeSettings.favicon_url,
        jsonLd: activeSettings.json_ld_data
      });
      document.title = activeSettings.seo_title;
    }
  }, [activeSettings, updateMetaTags]);

  const loadContentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        setContentSettings(defaultSettings);
      } else if (data) {
        setContentSettings({ ...defaultSettings, ...data });
      } else {
        setContentSettings(defaultSettings);
      }
    } catch {
      setContentSettings(defaultSettings);
    } finally {
      setSettingsLoaded(true);
    }
  };

  const handleCTAClick = () => {
    setIsActionModalOpen(true);
  };

  const handleWatchVideo = () => {
    // Pequeno delay para garantir que as seções lazy-loaded estejam renderizadas
    setTimeout(() => {
      const videosSection = document.getElementById('videos');
      if (videosSection) {
        videosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSelectPlan = (plan: any) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const planData: PlanData = {
      id: plan.id,
      name: plan.name,
      price: `R$ ${plan.price.toFixed(2).replace('.', ',')}`,
      amount: plan.price,
      plan_type: plan.plan_type || plan.id
    };
    setSelectedPlan(planData);
    setIsCheckoutOpen(true);
  };

  // Sort sections by display_order
  const sortedSections = [...sections].sort((a, b) => a.display_order - b.display_order);

  const renderSection = (sectionKey: string) => {
    if (!isSectionVisible(sectionKey)) return null;

    switch (sectionKey) {
      case 'hero':
        return (
          <LandingHero
            key="hero"
            settings={activeSettings}
            onStartTrial={handleCTAClick}
            onWatchVideo={handleWatchVideo}
          />
        );
      case 'how_it_works':
        return (
          <LazySection key="how_it_works" animation="fade-up">
            <LandingHowItWorks items={howItWorks} />
          </LazySection>
        );
      case 'requirements':
        return (
          <LazySection key="requirements" animation="fade-up">
            <LandingRequirements items={requirements} />
          </LazySection>
        );
      case 'problems':
        return (
          <LazySection key="problems" animation="fade-up">
            <LandingProblems items={problems} />
          </LazySection>
        );
      case 'kpis':
        return (
          <LazySection key="kpis" animation="fade-up">
            <LandingKPIs items={kpis} />
          </LazySection>
        );
      case 'videos':
        return (
          <LazySection key="videos" animation="fade-up">
            <LandingVideos items={videos} />
          </LazySection>
        );
      case 'testimonials':
        return (
          <LazySection key="testimonials" animation="fade-up">
            <LandingTestimonials items={testimonials} />
          </LazySection>
        );
      case 'plans':
        return (
          <LazySection key="plans" animation="fade-up">
            <LandingPlans plans={plans} onSelectPlan={handleSelectPlan} />
          </LazySection>
        );
      case 'faq':
        return (
          <LazySection key="faq" animation="fade-up">
            <LandingFAQ items={faq} />
          </LazySection>
        );
      case 'cta_final':
        return (
          <LazySection key="cta_final" animation="scale-in">
            <LandingCTAFinal data={ctaFinal} onStartTrial={handleCTAClick} />
          </LazySection>
        );
      default:
        return null;
    }
  };

  if (!settingsLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
        <ResponsiveNavigation
        logoUrl={activeSettings.logo_url} 
        companyName={activeSettings.company_name} 
        companyPhone={activeSettings.company_phone} 
      />
      
      {/* Banner de instalação PWA - inline, sem sobrepor */}
      <PWAInstallPrompt />
      
      
      {/* Progress Indicator removed */}

      <main role="main">
        {/* Render sections in order from database */}
        {sortedSections.length > 0 
          ? sortedSections.map(section => renderSection(section.section_key))
          : (
            // Fallback: render all sections in default order if no sections loaded yet
            <>
              <LandingHero
                settings={activeSettings}
                onStartTrial={handleCTAClick}
                onWatchVideo={handleWatchVideo}
              />
              <LazySection animation="fade-up">
                <LandingHowItWorks items={howItWorks} />
              </LazySection>
              <LazySection animation="fade-up">
                <LandingRequirements items={requirements} />
              </LazySection>
              <LazySection animation="fade-up">
                <LandingProblems items={problems} />
              </LazySection>
              <LazySection animation="fade-up">
                <LandingKPIs items={kpis} />
              </LazySection>
              <LazySection animation="fade-up">
                <LandingVideos items={videos} />
              </LazySection>
              <LazySection animation="fade-up">
                <LandingTestimonials items={testimonials} />
              </LazySection>
              <LazySection animation="fade-up">
                <LandingPlans plans={plans} onSelectPlan={handleSelectPlan} />
              </LazySection>
              <LazySection animation="fade-up">
                <LandingFAQ items={faq} />
              </LazySection>
              <LazySection animation="scale-in">
                <LandingCTAFinal data={ctaFinal} onStartTrial={handleCTAClick} />
              </LazySection>
            </>
          )
        }

        {/* National Coverage Section - SEO Local */}
        <LazySection animation="fade-up">
          <NationalCoverageSection />
        </LazySection>
      </main>

      {/* Dynamic Footer */}
      <LandingFooter fallbackText={activeSettings.footer_text} />

      {/* MercadoPago Checkout Modal - Lazy Loaded */}
      {selectedPlan && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Carregando...</div></div>}>
          <MercadoPagoCheckout 
            isOpen={isCheckoutOpen} 
            onClose={() => {
              setIsCheckoutOpen(false);
              setSelectedPlan(null);
            }} 
            selectedPlan={selectedPlan} 
          />
        </Suspense>
      )}

      {/* Action Choice Modal */}
        {/* Action Choice Modal */}
        <ActionChoiceModal 
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          whatsappNumber="5511963512105"
        />
      </div>
    </>
  );
};

export default Landing;
