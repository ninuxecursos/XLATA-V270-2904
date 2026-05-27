import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useShopConfig, DEFAULT_HEADER_CONFIG } from '@/hooks/useShopConfig';
import { useShopCart } from '@/hooks/useShopCart';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { ShopAuthModal } from './ShopAuthModal';
import { ShopCartDrawer } from './ShopCartDrawer';
import { HeaderTemplateRenderer } from './HeaderTemplateRenderer';
import { getTemplateById } from '../templates/headerTemplates';

export function ShopHeader() {
  const { data: config } = useShopConfig();
  const { totalItems } = useShopCart();
  const { isAuthenticated, shopUser, logout } = useShopAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [showCart, setShowCart] = useState(false);

  const handleAuthClick = (defaultTab?: 'login' | 'register') => {
    setAuthModalTab(defaultTab || 'login');
    setShowAuthModal(true);
  };

  // Busca controlada via URL params
  const searchQuery = searchParams.get('q') || '';

  const handleSearchChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      newParams.set('q', value);
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams, { replace: true });
  };

  const colors = config?.colors;
  const headerConfig = config?.header_config || DEFAULT_HEADER_CONFIG;
  
  // Get the selected template
  const selectedTemplate = getTemplateById(headerConfig, headerConfig.selectedTemplate) || headerConfig.templates[0];
  
  // Header styling
  const headerBg = colors?.header_bg || colors?.surface || '#FFFFFF';
  const headerBorder = colors?.header_border || colors?.border || '#E5E7EB';

  // Para o template profissional, não usamos o wrapper do header
  const isProfessional = selectedTemplate?.layout === 'professional';

  if (isProfessional) {
    return (
      <>
        <header className="sticky top-0 z-50">
          <HeaderTemplateRenderer
            template={selectedTemplate}
            config={config}
            totalItems={totalItems}
            isAuthenticated={isAuthenticated}
            shopUserName={shopUser?.name.split(' ')[0]}
            onCartClick={() => setShowCart(true)}
            onAuthClick={handleAuthClick}
            onLogout={logout}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />
        </header>

        {/* Auth Modal */}
        <ShopAuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          defaultTab={authModalTab}
        />

        {/* Cart Drawer */}
        <ShopCartDrawer 
          isOpen={showCart} 
          onClose={() => setShowCart(false)} 
        />
      </>
    );
  }

  return (
    <>
      <header 
        className="sticky top-0 z-50 shadow-sm"
        style={{ 
          backgroundColor: headerBg,
          borderBottom: selectedTemplate?.borderStyle === 'solid' 
            ? `1px solid ${headerBorder}` 
            : selectedTemplate?.borderStyle === 'none' 
              ? 'none' 
              : `1px solid ${headerBorder}`
        }}
      >
        <HeaderTemplateRenderer
          template={selectedTemplate}
          config={config}
          totalItems={totalItems}
          isAuthenticated={isAuthenticated}
          shopUserName={shopUser?.name.split(' ')[0]}
          onCartClick={() => setShowCart(true)}
          onAuthClick={handleAuthClick}
          onLogout={logout}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />
      </header>

      {/* Auth Modal */}
      <ShopAuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        defaultTab={authModalTab}
      />

      {/* Cart Drawer */}
      <ShopCartDrawer 
        isOpen={showCart} 
        onClose={() => setShowCart(false)} 
      />
    </>
  );
}
