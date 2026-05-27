import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Store, Sparkles, User, ClipboardList } from 'lucide-react';
import { useShopConfig } from '@/hooks/useShopConfig';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { ShopAuthModal } from '../public/ShopAuthModal';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function ShopBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: config } = useShopConfig();
  const { isAuthenticated } = useShopAuth();

  const [showAuth, setShowAuth] = useState(false);
  const [searchParams] = useSearchParams();

  const primaryColor = config?.primary_color || '#10B981';

  // Ordem: Loja, Novos, Perfil, Pedidos
  const navItems: NavItem[] = [
    { id: 'shop', label: 'Loja', icon: Store },
    { id: 'new', label: 'Novos', icon: Sparkles },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'orders', label: 'Pedidos', icon: ClipboardList },
  ];

  // Verificar se o filtro "novos" está ativo
  const isNewFilterActive = searchParams.get('filter') === 'new';

  const isActive = (id: string) => {
    if (id === 'shop') {
      return location.pathname === '/shop' && !isNewFilterActive;
    }
    if (id === 'new') {
      return location.pathname === '/shop' && isNewFilterActive;
    }
    if (id === 'orders') {
      return location.pathname === '/shop/orders' || location.pathname.startsWith('/shop/orders/');
    }
    if (id === 'profile') {
      return location.pathname === '/shop/account';
    }
    return false;
  };

  const handleNavClick = (item: NavItem) => {
    switch (item.id) {
      case 'shop':
        navigate('/shop');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'new':
        // Navegar para shop com filtro de novos (últimos 5 dias)
        navigate('/shop?filter=new&sort=newest');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'profile':
        if (isAuthenticated) {
          navigate('/shop/account');
        } else {
          setShowAuth(true);
        }
        break;
      case 'orders':
        if (isAuthenticated) {
          navigate('/shop/orders');
        } else {
          setShowAuth(true);
        }
        break;
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-100 safe-area-bottom shadow-lg shadow-black/5">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className="relative flex flex-col items-center justify-center flex-1 h-full transition-colors touch-manipulation"
              >
                {/* Active indicator */}
                {active && (
                  <div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full shop-nav-active-indicator"
                    style={{ background: primaryColor }}
                  />
                )}
                
                <div className="relative">
                  <div style={active ? { color: primaryColor } : undefined}>
                    <Icon className={`w-5 h-5 transition-colors ${active ? '' : 'text-gray-400'}`} />
                  </div>
                </div>
                <span 
                  className={`text-[10px] mt-0.5 font-medium transition-colors ${active ? '' : 'text-gray-400'}`}
                  style={active ? { color: primaryColor } : undefined}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Auth Modal */}
      <ShopAuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
      />
    </>
  );
}
