import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Store, Search, ChevronDown, Menu, X, Home, Grid3X3, LogIn, UserPlus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { HeaderTemplate } from '../templates/headerTemplates';
import { ShopConfigData } from '@/hooks/useShopConfig';
import { useShopCategories } from '@/hooks/useShopCategories';
import { ShopProfileModal } from './ShopProfileModal';
interface ProfessionalHeaderLayoutProps {
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

export function ProfessionalHeaderLayout({
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
}: ProfessionalHeaderLayoutProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debounceRef = useRef<NodeJS.Timeout>();
  const { data: categories = [] } = useShopCategories();

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
  
  // Cores do header principal (escuro) - agora customizáveis
  const primaryHeaderBg = templateColors.headerBg || template.secondaryHeaderBg || '#1e3a5f';
  const primaryHeaderText = templateColors.headerText || template.secondaryHeaderText || '#FFFFFF';
  const accentColor = templateColors.accentColor || templateColors.loginButtonBg || '#C9A86C';
  
  // Cores do header secundário (navegação) - agora customizáveis
  const navBg = templateColors.navBg || colors?.header_bg || '#2d4a6f';
  const navText = templateColors.navText || primaryHeaderText;

  // Cores do campo de busca - agora customizáveis
  const searchInputBg = templateColors.searchInputBg || '#FFFFFF';
  const searchInputText = templateColors.searchInputText || '#111827';

  const textPrimary = colors?.text_primary || '#111827';

  // Usar configuração global de show_store_name se definida, senão usar do template
  const showStoreName = config?.show_store_name ?? template.showStoreName;

  const Logo = () => (
    <Link to="/shop" className="flex items-center gap-3 flex-shrink-0">
      {config?.store_logo ? (
        <img 
          src={config.store_logo} 
          alt={config.store_name} 
          className="h-10 lg:h-12 w-auto"
        />
      ) : (
        <div 
          className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: accentColor }}
        >
          <Store className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryHeaderBg }} />
        </div>
      )}
      {showStoreName && (
        <span 
          className="font-bold text-lg lg:text-xl hidden sm:block"
          style={{ color: primaryHeaderText }}
        >
          {config?.store_name || 'Loja XLata'}
        </span>
      )}
    </Link>
  );

  // Componentes de busca inline para evitar re-render
  const searchInputElement = (
    <div className="relative flex-1 max-w-xl">
      <input
        type="text"
        placeholder="Buscar produtos..."
        value={localSearchQuery}
        onChange={(e) => handleLocalSearchChange(e.target.value)}
        className="w-full h-10 lg:h-11 pl-4 pr-12 rounded-full focus:outline-none focus:ring-2"
        style={{ 
          backgroundColor: searchInputBg,
          color: searchInputText,
        }}
      />
      <button 
        type="button"
        onClick={() => onSearchChange(localSearchQuery)}
        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 lg:h-9 lg:w-9 flex items-center justify-center rounded-full transition-colors"
        style={{ 
          backgroundColor: templateColors.searchButtonBg || accentColor,
          color: templateColors.searchButtonText || primaryHeaderBg
        }}
      >
        <Search className="w-4 h-4" />
      </button>
    </div>
  );

  const CartButton = () => (
    <button 
      className="relative h-10 w-10 lg:h-11 lg:w-11 rounded-full flex items-center justify-center transition-all hover:scale-105"
      style={{ 
        backgroundColor: templateColors.cartButtonBg === 'transparent' ? 'transparent' : (templateColors.cartButtonBg || 'transparent'),
        color: templateColors.cartButtonText || accentColor,
        border: templateColors.cartButtonBorder ? `2px solid ${templateColors.cartButtonBorder}` : `2px solid ${accentColor}`,
      }}
      onClick={onCartClick}
    >
      <ShoppingCart className="w-5 h-5" />
      {totalItems > 0 && (
        <Badge 
          className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-[10px] font-bold border-2"
          style={{ 
            backgroundColor: accentColor,
            color: primaryHeaderBg,
            borderColor: primaryHeaderBg
          }}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </Badge>
      )}
    </button>
  );

  // Botão do usuário para Mobile (abre modal)
  const MobileUserButton = () => (
    <button 
      className="h-10 w-10 lg:h-11 lg:w-11 rounded-full flex items-center justify-center transition-all hover:scale-105 md:hidden"
      style={{ 
        backgroundColor: templateColors.loginButtonBg === 'transparent' ? 'transparent' : (templateColors.loginButtonBg || 'transparent'),
        color: templateColors.loginButtonText || accentColor,
        border: templateColors.loginButtonBorder ? `2px solid ${templateColors.loginButtonBorder}` : `2px solid ${accentColor}`,
      }}
      onClick={() => setMobileProfileOpen(true)}
    >
      <User className="w-5 h-5" />
    </button>
  );

  // Dropdown para Desktop - Versão Profissional
  const DesktopUserDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="h-10 w-10 lg:h-11 lg:w-11 rounded-full hidden md:flex items-center justify-center transition-all hover:scale-105"
          style={{ 
            backgroundColor: templateColors.loginButtonBg === 'transparent' ? 'transparent' : (templateColors.loginButtonBg || 'transparent'),
            color: templateColors.loginButtonText || accentColor,
            border: templateColors.loginButtonBorder ? `2px solid ${templateColors.loginButtonBorder}` : `2px solid ${accentColor}`,
          }}
        >
          <User className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 border-0 shadow-2xl rounded-xl overflow-hidden p-0"
        style={{ 
          backgroundColor: primaryHeaderBg,
          color: primaryHeaderText,
        }}
      >
        {isAuthenticated ? (
          <>
            {/* Header com avatar e saudação */}
            <div 
              className="px-5 py-5"
              style={{ 
                background: `linear-gradient(135deg, ${primaryHeaderBg} 0%, ${accentColor}20 100%)`,
                borderBottom: `1px solid ${accentColor}30`
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg"
                  style={{ 
                    backgroundColor: accentColor,
                    color: primaryHeaderBg
                  }}
                >
                  {shopUserName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold" style={{ color: primaryHeaderText }}>
                    Olá, {shopUserName}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: `${primaryHeaderText}80` }}>
                    Bem-vindo(a) de volta!
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-3 space-y-1">
              <DropdownMenuItem 
                className="cursor-pointer rounded-lg px-4 py-3 focus:bg-white/10 transition-colors"
                style={{ color: primaryHeaderText }}
                onClick={() => navigate('/shop/account')}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <User className="w-4 h-4" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Minha Conta</p>
                    <p className="text-xs mt-0.5" style={{ color: `${primaryHeaderText}60` }}>
                      Dados pessoais e preferências
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="cursor-pointer rounded-lg px-4 py-3 focus:bg-white/10 transition-colors"
                style={{ color: primaryHeaderText }}
                onClick={() => navigate('/shop/orders')}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Package className="w-4 h-4" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Meus Pedidos</p>
                    <p className="text-xs mt-0.5" style={{ color: `${primaryHeaderText}60` }}>
                      Acompanhe suas compras
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            </div>

            {/* Logout separado */}
            <div 
              className="p-3 border-t"
              style={{ borderColor: `${accentColor}20` }}
            >
              <DropdownMenuItem 
                className="cursor-pointer rounded-lg px-4 py-3 transition-colors hover:bg-red-500/10 focus:bg-red-500/10"
                onClick={onLogout}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/20">
                    <LogIn className="w-4 h-4 text-red-400 rotate-180" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-red-400">Sair da conta</p>
                    <p className="text-xs mt-0.5 text-red-400/60">
                      Encerrar sessão
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            </div>
          </>
        ) : (
          <>
            {/* Header convidado */}
            <div 
              className="px-5 py-5"
              style={{ 
                background: `linear-gradient(135deg, ${primaryHeaderBg} 0%, ${accentColor}20 100%)`,
                borderBottom: `1px solid ${accentColor}30`
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <User className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold" style={{ color: primaryHeaderText }}>
                    Olá, visitante
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: `${primaryHeaderText}80` }}>
                    Entre ou cadastre-se
                  </p>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="p-4 space-y-3">
              <button
                onClick={() => onAuthClick('login')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all hover:opacity-90"
                style={{ 
                  backgroundColor: accentColor,
                  color: primaryHeaderBg
                }}
              >
                <LogIn className="w-4 h-4" />
                Entrar na minha conta
              </button>
              
              <button
                onClick={() => onAuthClick('register')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all hover:bg-white/10"
                style={{ 
                  backgroundColor: 'transparent',
                  color: primaryHeaderText,
                  border: `2px solid ${accentColor}`
                }}
              >
                <UserPlus className="w-4 h-4" />
                Criar uma conta
              </button>
            </div>

            {/* Benefícios */}
            <div 
              className="px-4 py-4 border-t"
              style={{ 
                borderColor: `${accentColor}20`,
                backgroundColor: `${accentColor}05`
              }}
            >
              <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: `${primaryHeaderText}60` }}>
                Vantagens de ter uma conta
              </p>
              <div className="space-y-2">
                {[
                  { icon: ShoppingCart, text: 'Acompanhe seus pedidos' },
                  { icon: User, text: 'Compras mais rápidas' },
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <benefit.icon className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    <span className="text-xs" style={{ color: `${primaryHeaderText}80` }}>{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const parentCategories = categories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  const CategoriesDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all hover:bg-white/10"
          style={{ color: navText }}
        >
          <Grid3X3 className="w-4 h-4" />
          Categorias
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-white border border-gray-200 shadow-lg">
        <DropdownMenuItem asChild className="cursor-pointer text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
          <Link to="/shop" className="flex items-center text-gray-900">
            <Grid3X3 className="w-4 h-4 mr-2 text-gray-600" />
            Todas as Categorias
          </Link>
        </DropdownMenuItem>
        {parentCategories.length > 0 && <DropdownMenuSeparator className="bg-gray-200" />}
        {parentCategories.map((category) => {
          const children = getChildren(category.id);
          if (children.length > 0) {
            return (
              <DropdownMenuSub key={category.id}>
                <DropdownMenuSubTrigger className="cursor-pointer text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
                  {category.name}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-white border border-gray-200 shadow-lg">
                  <DropdownMenuItem asChild className="cursor-pointer text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
                    <Link to={`/shop?category=${category.slug}`} className="text-gray-900 font-medium">
                      Ver tudo em {category.name}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  {children.map((sub) => (
                    <DropdownMenuItem key={sub.id} asChild className="cursor-pointer text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
                      <Link to={`/shop?category=${sub.slug}`} className="text-gray-900">
                        {sub.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          }
          return (
            <DropdownMenuItem key={category.id} asChild className="cursor-pointer text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
              <Link to={`/shop?category=${category.slug}`} className="text-gray-900">
                {category.name}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="w-full">
      {/* Header Principal (Topo Escuro) */}
      <div style={{ backgroundColor: primaryHeaderBg }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
            {/* Logo */}
            <Logo />

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl mx-6">
              {searchInputElement}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 lg:gap-3">
              <MobileUserButton />
              <DesktopUserDropdown />
              <CartButton />
              
              {/* Mobile Menu Toggle */}
              <button 
                className="lg:hidden h-10 w-10 rounded-full flex items-center justify-center"
                style={{ color: accentColor }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            {searchInputElement}
          </div>
        </div>
      </div>

      {/* Header Secundário (Navegação) */}
      <div 
        className="hidden lg:block border-t"
        style={{ 
          backgroundColor: navBg,
          borderColor: `${accentColor}30`
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            {/* Navigation Links */}
            <nav className="flex items-center gap-1">
              <Link 
                to="/shop" 
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all hover:bg-white/10"
                style={{ color: navText }}
              >
                <Home className="w-4 h-4" />
                Início
              </Link>
              
              <CategoriesDropdown />

              {/* Links extras podem ser adicionados aqui */}
            </nav>

            {/* Info de Contato - opcional, só exibe se existir no config */}
            <div className="flex items-center gap-4 text-xs" style={{ color: `${navText}90` }}>
              {/* Pode ser expandido no futuro para incluir contatos */}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden border-t"
          style={{ 
            backgroundColor: navBg,
            borderColor: `${accentColor}30`
          }}
        >
          <div className="px-4 py-3 space-y-1">
            <Link 
              to="/shop" 
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
              style={{ color: navText }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="w-4 h-4" />
              Início
            </Link>
            
            <div className="px-3 py-2">
              <p className="text-xs font-semibold mb-2" style={{ color: `${navText}70` }}>
                CATEGORIAS
              </p>
              <Link 
                to="/shop" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/10"
                style={{ color: navText }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Todas as Categorias
              </Link>
              {categories.map((category) => (
                <Link 
                  key={category.id}
                  to={`/shop?category=${category.slug}`} 
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/10"
                  style={{ color: navText }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>

            {!isAuthenticated && (
              <div className="pt-2 border-t" style={{ borderColor: `${navText}20` }}>
                <button
                  onClick={() => {
                    onAuthClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ 
                    backgroundColor: accentColor,
                    color: primaryHeaderBg
                  }}
                >
                  <LogIn className="w-4 h-4" />
                  Entrar / Cadastrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Profile Modal */}
      <ShopProfileModal
        isOpen={mobileProfileOpen}
        onClose={() => setMobileProfileOpen(false)}
        isAuthenticated={isAuthenticated}
        shopUserName={shopUserName}
        onAuthClick={onAuthClick}
        onLogout={onLogout}
        onOrdersClick={onCartClick}
      />
    </div>
  );
}
