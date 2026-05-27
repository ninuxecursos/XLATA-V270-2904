import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const PUBLIC_PATHS = ['/blog', '/solucoes', '/glossario', '/ajuda', '/reciclagem', '/sistema-para-'];

export function FloatingCTA() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Only show on public content pages and not for logged-in users
  const isPublicContent = PUBLIC_PATHS.some(p => location.pathname.startsWith(p));
  if (!isPublicContent || user) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
      <button
        onClick={() => navigate('/register')}
        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg shadow-emerald-500/30 font-semibold text-sm hover:scale-105 transition-all"
      >
        Teste Grátis — 7 Dias
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
