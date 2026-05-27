import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, BadgeCheck, KeyRound, ShieldCheck, Zap } from 'lucide-react';

interface FooterLink { label: string; url: string; is_visible: boolean; }
interface SecurityBadge { icon: string; label: string; is_visible: boolean; }
interface FooterSettings { copyright_text: string | null; links: FooterLink[]; show_social_links: boolean | null; is_active: boolean | null; security_badges: SecurityBadge[]; }
interface LandingFooterProps { fallbackText?: string; }

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = { Shield, Lock, BadgeCheck, KeyRound, ShieldCheck };

export function LandingFooter({ fallbackText }: LandingFooterProps) {
  const navigate = useNavigate();

  const { data: footerSettings } = useQuery({
    queryKey: ['landing-footer'],
    queryFn: async () => {
      const { data, error } = await supabase.from('landing_footer_settings').select('*').limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        copyright_text: data.copyright_text,
        links: Array.isArray(data.links) ? (data.links as unknown as FooterLink[]) : [],
        show_social_links: data.show_social_links,
        is_active: data.is_active,
        security_badges: Array.isArray(data.security_badges) ? (data.security_badges as unknown as SecurityBadge[]) : [],
      } as FooterSettings;
    },
  });

  const defaultLinks = [
    { label: 'Recursos', url: '/landing#recursos', is_visible: true },
    { label: 'Nosso Blog', url: '/blog', is_visible: true },
    { label: 'Termos de Uso', url: '/termos-de-uso', is_visible: true },
    { label: 'Privacidade', url: '/politica-de-privacidade', is_visible: true },
  ];

  const productLinks = [
    { label: 'Preços', url: '/planos' },
    { label: 'Como Funciona', url: '/landing#como-funciona' },
    { label: 'Validar Recibo', url: '/validar-recibo' },
  ];

  const links = footerSettings?.is_active && footerSettings.links.length > 0 
    ? footerSettings.links.filter(link => link.is_visible) : defaultLinks;

  const copyrightText = footerSettings?.is_active && footerSettings.copyright_text
    ? footerSettings.copyright_text : fallbackText || `© ${new Date().getFullYear()} XLata.site. Todos os direitos reservados.`;

  const handleLinkClick = (url: string) => {
    if (url.startsWith('http')) window.open(url, '_blank'); else navigate(url);
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">XLata</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">O sistema que substitui o caderno de papel. Controle pesagens, gerencie clientes e cobre pelo WhatsApp.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Produto</h4>
            <ul className="space-y-2">
              {productLinks.map((link, i) => (
                <li key={i}><button onClick={() => handleLinkClick(link.url)} className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">{link.label}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Empresa</h4>
            <ul className="space-y-2">
              {links.map((link, i) => (
                <li key={i}><button onClick={() => handleLinkClick(link.url)} className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">{link.label}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Comece gratuitamente</h4>
            <p className="text-slate-400 text-sm mb-4">Crie sua conta em menos de 1 minuto e organize seu depósito.</p>
            <Button onClick={() => navigate('/register')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg">
              Criar Conta Grátis →
            </Button>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">{copyrightText}</p>
          <p className="text-slate-600 text-xs"><p className="text-slate-600 text-xs">Desenvolvido por Riliv</p></p>
        </div>
      </div>
    </footer>
  );
}
