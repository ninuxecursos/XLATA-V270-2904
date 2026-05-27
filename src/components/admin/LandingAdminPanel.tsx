import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, Settings, Video, MessageSquare, HelpCircle, Megaphone,
  Scale, AlertTriangle, TrendingUp, CheckCircle, Layers, CreditCard, FileText
} from 'lucide-react';

// Import sub-components
import { AdminLandingHero } from './landing/AdminLandingHero';
import { AdminLandingHowItWorks } from './landing/AdminLandingHowItWorks';
import { AdminLandingRequirements } from './landing/AdminLandingRequirements';
import { AdminLandingProblems } from './landing/AdminLandingProblems';
import { AdminLandingKPIs } from './landing/AdminLandingKPIs';
import { AdminLandingVideos } from './landing/AdminLandingVideos';
import { AdminLandingTestimonials } from './landing/AdminLandingTestimonials';
import { AdminLandingFAQ } from './landing/AdminLandingFAQ';
import { AdminLandingCTAFinal } from './landing/AdminLandingCTAFinal';
import { AdminLandingSections } from './landing/AdminLandingSections';
import { AdminLandingSEO } from './landing/AdminLandingSEO';
import { AdminLandingPlans } from './landing/AdminLandingPlans';
import { AdminLandingFooter } from './landing/AdminLandingFooter';

export function LandingAdminPanel() {
  const [activeTab, setActiveTab] = useState('hero');

  const handlePreview = () => {
    window.open('/landing', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciar Landing Page</h2>
          <p className="text-slate-400">Edite todas as seções da página inicial</p>
        </div>
        <Button onClick={handlePreview} variant="outline" className="gap-2">
          <Eye className="w-4 h-4" />
          Visualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap gap-2 h-auto bg-slate-800 p-2 rounded-lg">
          <TabsTrigger value="hero" className="gap-2 data-[state=active]:bg-emerald-600">
            <Megaphone className="w-4 h-4" />
            Hero
          </TabsTrigger>
          <TabsTrigger value="how_it_works" className="gap-2 data-[state=active]:bg-emerald-600">
            <Scale className="w-4 h-4" />
            Como Funciona
          </TabsTrigger>
          <TabsTrigger value="requirements" className="gap-2 data-[state=active]:bg-emerald-600">
            <CheckCircle className="w-4 h-4" />
            Requisitos
          </TabsTrigger>
          <TabsTrigger value="problems" className="gap-2 data-[state=active]:bg-emerald-600">
            <AlertTriangle className="w-4 h-4" />
            Problemas
          </TabsTrigger>
          <TabsTrigger value="kpis" className="gap-2 data-[state=active]:bg-emerald-600">
            <TrendingUp className="w-4 h-4" />
            KPIs
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-2 data-[state=active]:bg-emerald-600">
            <Video className="w-4 h-4" />
            Vídeos
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="gap-2 data-[state=active]:bg-emerald-600">
            <MessageSquare className="w-4 h-4" />
            Depoimentos
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2 data-[state=active]:bg-emerald-600">
            <CreditCard className="w-4 h-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-2 data-[state=active]:bg-emerald-600">
            <HelpCircle className="w-4 h-4" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="cta_final" className="gap-2 data-[state=active]:bg-emerald-600">
            <Megaphone className="w-4 h-4" />
            CTA Final
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-2 data-[state=active]:bg-emerald-600">
            <Layers className="w-4 h-4" />
            Seções
          </TabsTrigger>
          <TabsTrigger value="footer" className="gap-2 data-[state=active]:bg-emerald-600">
            <FileText className="w-4 h-4" />
            Footer
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2 data-[state=active]:bg-emerald-600">
            <Settings className="w-4 h-4" />
            SEO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <AdminLandingHero />
        </TabsContent>

        <TabsContent value="how_it_works">
          <AdminLandingHowItWorks />
        </TabsContent>

        <TabsContent value="requirements">
          <AdminLandingRequirements />
        </TabsContent>

        <TabsContent value="problems">
          <AdminLandingProblems />
        </TabsContent>

        <TabsContent value="kpis">
          <AdminLandingKPIs />
        </TabsContent>

        <TabsContent value="videos">
          <AdminLandingVideos />
        </TabsContent>

        <TabsContent value="testimonials">
          <AdminLandingTestimonials />
        </TabsContent>

        <TabsContent value="plans">
          <AdminLandingPlans />
        </TabsContent>

        <TabsContent value="faq">
          <AdminLandingFAQ />
        </TabsContent>

        <TabsContent value="cta_final">
          <AdminLandingCTAFinal />
        </TabsContent>

        <TabsContent value="sections">
          <AdminLandingSections />
        </TabsContent>

        <TabsContent value="footer">
          <AdminLandingFooter />
        </TabsContent>

        <TabsContent value="seo">
          <AdminLandingSEO />
        </TabsContent>
      </Tabs>
    </div>
  );
}
