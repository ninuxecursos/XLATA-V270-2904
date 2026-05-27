import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ShoppingBag, ArrowRight } from 'lucide-react';
import { useShopConfig } from '@/hooks/useShopConfig';
import { useAuth } from '@/hooks/useAuth';

export function WelcomeSplash() {
  const navigate = useNavigate();
  const [hoveredSide, setHoveredSide] = useState<'left' | 'right' | null>(null);
  const { data: shopConfig } = useShopConfig();
  const { user, loading } = useAuth();

  // Redirecionar automaticamente usuários autenticados para o dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/pdv', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSystemAccess = () => {
    navigate('/landing');
  };

  const handleShopAccess = () => {
    navigate('/shop');
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  // Se usuário está autenticado, não renderizar (navegação já foi acionada)
  if (user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col md:flex-row overflow-auto">
      {/* Left Side - Sistema XLata */}
      <div
        className={`
          relative flex-1 flex flex-col items-center justify-center cursor-pointer
          bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
          transition-all duration-500 overflow-hidden min-h-[50dvh] md:min-h-0 py-10 md:py-0
          ${hoveredSide === 'left' ? 'md:flex-[1.2]' : hoveredSide === 'right' ? 'md:flex-[0.8]' : 'flex-1'}
        `}
        onMouseEnter={() => setHoveredSide('left')}
        onMouseLeave={() => setHoveredSide(null)}
        onClick={handleSystemAccess}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Glow Effect */}
        <div className={`
          absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent
          transition-opacity duration-500
          ${hoveredSide === 'left' ? 'opacity-100' : 'opacity-0'}
        `} />

        {/* Content */}
        <div className="relative z-10 text-center px-6 md:px-8 max-w-lg">
          {/* Icon */}
          <div className={`
            mx-auto mb-4 md:mb-8 w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600
            flex items-center justify-center shadow-2xl shadow-emerald-500/30
            transition-transform duration-500
            ${hoveredSide === 'left' ? 'scale-110' : 'scale-100'}
          `}>
            <Scale className="w-8 h-8 md:w-12 md:h-12 text-white" />
          </div>

          {/* Logo Text */}
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 md:mb-4">
            Sistema <span className="text-emerald-400">XLata</span>
          </h2>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-gray-400 mb-4 md:mb-8">
            Gestão completa para depósitos de recicláveis
          </p>


          {/* CTA */}
          <div className={`
            inline-flex items-center gap-2 px-6 py-3 rounded-xl
            bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-semibold
            transition-all duration-300
            ${hoveredSide === 'left' ? 'bg-emerald-500 text-white border-emerald-500' : ''}
          `}>
            Acessar Sistema
            <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${hoveredSide === 'left' ? 'translate-x-1' : ''}`} />
          </div>
        </div>

        {/* Divider - Right Edge (desktop) / Bottom Edge (mobile) */}
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-600 to-transparent" />
        <div className="md:hidden absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
      </div>

      {/* Right Side - Loja XLata */}
      <div
        className={`
          relative flex-1 flex flex-col items-center justify-center cursor-pointer
          bg-gradient-to-br from-gray-50 via-white to-gray-100
          transition-all duration-500 overflow-hidden min-h-[50dvh] md:min-h-0 py-10 md:py-0 pb-14 md:pb-0
          ${hoveredSide === 'right' ? 'md:flex-[1.2]' : hoveredSide === 'left' ? 'md:flex-[0.8]' : 'flex-1'}
        `}
        onMouseEnter={() => setHoveredSide('right')}
        onMouseLeave={() => setHoveredSide(null)}
        onClick={handleShopAccess}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Glow Effect */}
        <div className={`
          absolute inset-0 bg-gradient-to-l from-emerald-500/10 to-transparent
          transition-opacity duration-500
          ${hoveredSide === 'right' ? 'opacity-100' : 'opacity-0'}
        `} />

        {/* Content */}
        <div className="relative z-10 text-center px-6 md:px-8 max-w-lg">
          {/* Icon */}
          <div className={`
            mx-auto mb-4 md:mb-8 w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600
            flex items-center justify-center shadow-2xl shadow-emerald-500/30
            transition-transform duration-500
            ${hoveredSide === 'right' ? 'scale-110' : 'scale-100'}
          `}>
            <ShoppingBag className="w-8 h-8 md:w-12 md:h-12 text-white" />
          </div>

          {/* Logo Text */}
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-2 md:mb-4">
            Loja <span className="text-emerald-600">XLata</span>
          </h2>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-gray-500 mb-4 md:mb-8">
            Compre produtos usados em excelente estado, com preços abaixo do mercado
          </p>


          {/* CTA */}
          <div className={`
            inline-flex items-center gap-2 px-6 py-3 rounded-xl
            bg-emerald-500/10 border border-emerald-500/40 text-emerald-600 font-semibold
            transition-all duration-300
            ${hoveredSide === 'right' ? 'bg-emerald-500 text-white border-emerald-500' : ''}
          `}>
            Acessar Loja
            <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${hoveredSide === 'right' ? 'translate-x-1' : ''}`} />
          </div>
        </div>
      </div>


      {/* Desktop Layout Indicator */}
      <div className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <p className="text-sm text-gray-400 animate-pulse">
          Clique para escolher
        </p>
      </div>
    </div>
  );
}
