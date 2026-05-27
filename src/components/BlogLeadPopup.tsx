import { useState, useEffect } from 'react';
import { X, Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

export function BlogLeadPopup() {
  const [show, setShow] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isBlogPage = location.pathname.startsWith('/blog/');

  useEffect(() => {
    if (!isBlogPage) return;
    
    const dismissed = sessionStorage.getItem('lead_popup_dismissed');
    if (dismissed) return;

    const timer = setTimeout(() => setShow(true), 25000); // 25s delay
    
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 50 && !sessionStorage.getItem('lead_popup_dismissed')) {
        setShow(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isBlogPage]);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('lead_popup_dismissed', 'true');
  };

  const handleCTA = () => {
    handleDismiss();
    navigate('/register');
  };

  if (!show || !isBlogPage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in" onClick={handleDismiss}>
      <div className="bg-slate-800 border border-emerald-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={handleDismiss} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Teste Grátis por 7 Dias</h3>
          <p className="text-slate-400 mb-6">
            Pare de perder dinheiro no seu ferro velho. O XLata automatiza tudo para você.
          </p>
          <ul className="text-left space-y-2 mb-6">
            {['Controle de pesagens automático', 'Gestão de clientes e fiado', 'Relatórios de lucro em tempo real'].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                <span className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <Button onClick={handleCTA} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 text-lg font-bold rounded-lg">
            Criar Conta Grátis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-slate-500 text-xs mt-3">Sem cartão de crédito. Cancele quando quiser.</p>
        </div>
      </div>
    </div>
  );
}
