import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Store, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeaderTemplate } from '../templates/headerTemplates';
import { ShopConfigData } from '@/hooks/useShopConfig';
import { ProfessionalHeaderLayout } from './ProfessionalHeaderLayout';

interface HeaderTemplateRendererProps {
  template: HeaderTemplate;
  config: ShopConfigData | undefined;
  totalItems: number;
  isAuthenticated: boolean;
  shopUserName?: string;
  onCartClick: () => void;
  onAuthClick: (defaultTab?: 'login' | 'register') => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function HeaderTemplateRenderer({
  template,
  config,
  totalItems,
  isAuthenticated,
  shopUserName,
  onCartClick,
  onAuthClick,
  onLogout,
  searchQuery,
  onSearchChange,
}: HeaderTemplateRendererProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Sincronizar local com prop quando mudar externamente
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Debounce para a busca
  const handleLocalSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const colors = config?.colors;
  const templateColors = template.customColors;
  
  const headerBg = colors?.header_bg || '#FFFFFF';
  const headerBorder = colors?.header_border || '#E5E7EB';
  const primaryColor = colors?.primary || '#10B981';
  const textPrimary = colors?.text_primary || '#111827';
  const textSecondary = colors?.text_secondary || '#4B5563';
  const backgroundAlt = colors?.background_alt || '#f3f4f6';

  // Usar configuração global de show_store_name se definida, senão usar do template
  const showStoreName = config?.show_store_name ?? template.showStoreName;

  const Logo = () => (
    <Link to="/shop" className="flex items-center gap-2 flex-shrink-0">
      {config?.store_logo ? (
        <img 
          src={config.store_logo} 
          alt={config.store_name} 
          className="h-8 lg:h-10 w-auto"
        />
      ) : (
        <div 
          className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: primaryColor }}
        >
          <Store className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
        </div>
      )}
      {showStoreName && (
        <span 
          className="font-bold text-lg lg:text-xl hidden sm:block"
          style={{ color: textPrimary }}
        >
          {config?.store_name || 'Loja XLata'}
        </span>
      )}
    </Link>
  );

  const SearchBar = ({ className = '' }: { className?: string }) => (
    <div className={`relative w-full ${className}`}>
      <input
        type="text"
        placeholder="Buscar produtos..."
        value={localSearchQuery}
        onChange={(e) => handleLocalSearchChange(e.target.value)}
        className="w-full h-10 pl-4 pr-12 rounded-lg focus:outline-none"
        style={{ 
          backgroundColor: backgroundAlt,
          color: textPrimary
        }}
      />
      <button 
        type="button"
        onClick={() => onSearchChange(localSearchQuery)}
        className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center rounded-r-lg transition-colors"
        style={{ 
          backgroundColor: templateColors.searchButtonBg,
          color: templateColors.searchButtonText
        }}
      >
        <Search className="w-4 h-4" />
      </button>
    </div>
  );

  // Cores efetivas dos botões - prioriza CMS (config.colors), fallback para template
  const effectiveCartBg = colors?.button_cart_bg || templateColors.cartButtonBg || '#FFFFFF';
  const effectiveCartText = colors?.button_cart_text || templateColors.cartButtonText || '#111827';
  const effectiveCartBorder = colors?.button_cart_border || templateColors.cartButtonBorder || '#E5E7EB';
  const effectiveLoginBg = colors?.button_login_bg || templateColors.loginButtonBg || primaryColor;
  const effectiveLoginText = colors?.button_login_text || templateColors.loginButtonText || '#FFFFFF';
  const effectiveLoginBorder = templateColors.loginButtonBorder || undefined;

  const CartButton = () => (
    <button 
      className="relative h-9 w-9 lg:h-10 lg:w-10 rounded-md flex items-center justify-center transition-opacity hover:opacity-80"
      style={{ 
        backgroundColor: effectiveCartBg === 'transparent' ? 'transparent' : effectiveCartBg,
        color: effectiveCartText,
        border: `1px solid ${effectiveCartBorder}`,
      }}
      onClick={onCartClick}
    >
      <ShoppingCart className="w-5 h-5" />
      {totalItems > 0 && (
        <Badge 
          className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center p-0 text-[10px] font-bold text-white border-2"
          style={{ 
            backgroundColor: primaryColor,
            borderColor: headerBg
          }}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </Badge>
      )}
    </button>
  );

  const LoginButton = () => (
    <button 
      className="gap-2 h-9 px-4 rounded-md flex items-center justify-center transition-opacity hover:opacity-80"
      style={{ 
        backgroundColor: effectiveLoginBg === 'transparent' ? 'transparent' : effectiveLoginBg,
        color: effectiveLoginText,
        border: effectiveLoginBorder ? `1px solid ${effectiveLoginBorder}` : 'none',
      }}
      onClick={() => onAuthClick()}
    >
      <User className="w-4 h-4" />
      <span className="hidden xl:inline">Entrar</span>
      <ChevronDown className="w-3 h-3 hidden xl:inline" />
    </button>
  );

  const UserMenu = () => (
    <div 
      className="flex items-center gap-2 pl-2 ml-2"
      style={{ borderLeft: `1px solid ${headerBorder}` }}
    >
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: backgroundAlt }}
      >
        <User className="w-4 h-4" style={{ color: textSecondary }} />
      </div>
      <div className="flex flex-col">
        <span className="text-xs" style={{ color: colors?.text_muted || '#9CA3AF' }}>
          Olá,
        </span>
        <span 
          className="text-sm font-medium leading-tight"
          style={{ color: textPrimary }}
        >
          {shopUserName}
        </span>
      </div>
      <Button 
        variant="outline" 
        size="sm"
        onClick={onLogout}
        className="ml-1 h-8"
        style={{ 
          color: textSecondary,
          borderColor: headerBorder
        }}
      >
        Sair
      </Button>
    </div>
  );

  // Template: Classic
  if (template.layout === 'classic') {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 lg:h-16 gap-4">
          <Logo />

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 lg:gap-2">
            <CartButton />

            {/* User - Desktop */}
            <div className="hidden lg:flex items-center">
              {isAuthenticated ? <UserMenu /> : <LoginButton />}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <SearchBar className="text-sm" />
        </div>
      </div>
    );
  }

  // Template: Centered
  if (template.layout === 'centered') {
    return (
      <div className="max-w-7xl mx-auto px-4">
        {/* Top row with logo centered */}
        <div className="flex items-center justify-between h-14 lg:h-16 gap-4">
          {/* Left actions */}
          <div className="flex items-center gap-2">
            <CartButton />
          </div>

          {/* Center: Logo */}
          <div className="flex-1 flex justify-center">
            <Logo />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onLogout}
                className="h-8"
                style={{ 
                  color: textSecondary,
                  borderColor: headerBorder
                }}
              >
                Sair
              </Button>
            ) : (
              <LoginButton />
            )}
          </div>
        </div>

        {/* Search Bar below header */}
        <div className="pb-3">
          <SearchBar />
        </div>
      </div>
    );
  }

  // Template: Minimal
  if (template.layout === 'minimal') {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 lg:h-16 gap-4">
          <Logo />

          <div className="flex-1" />

          {/* Actions - Icons only */}
          <div className="flex items-center gap-1">
            {/* Search icon that expands on click */}
            <div className="hidden md:flex flex-1 max-w-xs">
              <SearchBar />
            </div>

            <CartButton />

            {isAuthenticated ? (
              <button 
                onClick={onLogout}
                className="flex items-center gap-1.5 h-9 px-3 rounded-md transition-opacity hover:opacity-80"
                style={{ 
                  backgroundColor: effectiveLoginBg === 'transparent' ? 'transparent' : effectiveLoginBg,
                  color: effectiveLoginText,
                  border: effectiveLoginBorder ? `1px solid ${effectiveLoginBorder}` : 'none',
                }}
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Minha conta</span>
              </button>
            ) : (
              <button 
                onClick={() => onAuthClick()}
                className="flex items-center gap-1.5 h-9 px-3 rounded-md transition-opacity hover:opacity-80"
                style={{ 
                  backgroundColor: effectiveLoginBg === 'transparent' ? 'transparent' : effectiveLoginBg,
                  color: effectiveLoginText,
                  border: effectiveLoginBorder ? `1px solid ${effectiveLoginBorder}` : 'none',
                }}
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Login/Cadastrar</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <SearchBar className="text-sm" />
        </div>
      </div>
    );
  }

  // Template: Modern (com gradiente)
  if (template.layout === 'modern') {
    const useGradient = templateColors.useGradient ?? false;
    const gradientStart = templateColors.loginButtonGradientStart || '#8B5CF6';
    const gradientEnd = templateColors.loginButtonGradientEnd || '#06B6D4';
    
    const gradientButtonStyle = useGradient
      ? { background: `linear-gradient(to right, ${gradientStart}, ${gradientEnd})`, color: effectiveLoginText }
      : { backgroundColor: effectiveLoginBg === 'transparent' ? 'transparent' : effectiveLoginBg, color: effectiveLoginText };

    return (
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 lg:h-16 gap-4">
          <Logo />

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search Bar - Desktop */}
            <div className="hidden md:flex max-w-xs">
              <SearchBar />
            </div>

            <CartButton />

            {isAuthenticated ? (
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 h-9 px-4 rounded-lg font-medium transition-all hover:opacity-90 hover:shadow-md"
                style={gradientButtonStyle}
              >
                <User className="w-4 h-4" />
                <span className="text-sm">Minha conta</span>
              </button>
            ) : (
              <button 
                onClick={() => onAuthClick()}
                className="flex items-center gap-2 h-9 px-4 rounded-lg font-medium transition-all hover:opacity-90 hover:shadow-md"
                style={gradientButtonStyle}
              >
                <User className="w-4 h-4" />
                <span className="text-sm">Login/Cadastrar</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <SearchBar className="text-sm" />
        </div>
      </div>
    );
  }

  // Template: Professional (header duplo)
  if (template.layout === 'professional') {
    return (
      <ProfessionalHeaderLayout
        template={template}
        config={config}
        totalItems={totalItems}
        isAuthenticated={isAuthenticated}
        shopUserName={shopUserName}
        onCartClick={onCartClick}
        onAuthClick={onAuthClick}
        onLogout={onLogout}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
    );
  }

  // Fallback to classic
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between h-14 lg:h-16 gap-4">
        <Logo />
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <SearchBar />
        </div>
        <div className="flex items-center gap-1 lg:gap-2">
          <CartButton />
          <div className="hidden lg:flex items-center">
            {isAuthenticated ? <UserMenu /> : <LoginButton />}
          </div>
        </div>
      </div>
      <div className="md:hidden pb-3">
        <SearchBar className="text-sm" />
      </div>
    </div>
  );
}
