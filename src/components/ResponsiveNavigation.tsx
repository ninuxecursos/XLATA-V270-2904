import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu,
  X,
  LogIn,
  LogOut,
  Zap,
  ChevronRight,
  Home,
  CreditCard,
  ShoppingBag,
  Newspaper,
  Phone,
  HelpCircle,
  LayoutDashboard
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SystemLogo from './SystemLogo';
import { useAuth } from '@/hooks/useAuth';

interface ResponsiveNavigationProps {
  logoUrl?: string;
  companyName?: string;
  companyPhone: string;
}

const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  companyPhone
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  const navigationItems = [
    { title: "Início", href: "/landing", icon: Home },
    { title: "Preços", href: "/planos", icon: CreditCard },
    { title: "Como Funciona", href: "/landing#como-funciona", icon: ShoppingBag },
    { title: "Blog", href: "/blog", icon: Newspaper },
    { title: "Contato", href: "#contato", icon: Phone, isWhatsApp: true },
    { title: "Ajuda", href: "/ajuda", icon: HelpCircle },
  ];

  const handleNavigation = (item: typeof navigationItems[0]) => {
    if (item.isWhatsApp) {
      const message = encodeURIComponent(`Olá! Gostaria de saber mais sobre o Sistema XLata.site.`);
      window.open(`https://wa.me/5511963512105?text=${message}`, '_blank');
      setIsOpen(false);
      return;
    }
    
    if (item.href.includes('#')) {
      const [path, hash] = item.href.split('#');
      const scrollToElement = () => {
        const element = document.getElementById(hash);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      const isOnLanding = location.pathname === '/' || location.pathname === '/landing';
      if (isOnLanding) {
        scrollToElement();
      } else {
        navigate('/landing');
        setTimeout(scrollToElement, 500);
      }
    } else {
      navigate(item.href);
    }
    setIsOpen(false);
  };

  const isActive = (href: string) => {
    if (href.includes('#')) return false;
    if (href === '/landing') return location.pathname === '/' || location.pathname === '/landing';
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <header className="bg-gray-950/95 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Desktop */}
        <nav className="hidden lg:flex items-center justify-between h-16">
          <SystemLogo size="md" showCompanyName={true} />
          <div className="flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={() => handleNavigation(item)}
                  aria-label={`Navegar para ${item.title}`}
                  className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 group flex items-center gap-1.5 ${
                    isActive(item.href) ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.title}
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-green-500 transition-all duration-300 ${
                    isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} />
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button onClick={() => navigate('/dashboard')} className="relative px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-all duration-300 group flex items-center gap-1.5">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                  <span className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 w-0 group-hover:w-full transition-all duration-300" />
                </button>
                <button onClick={async () => { await signOut(); navigate('/'); }} className="relative px-3 py-2 text-sm font-medium text-gray-300 hover:text-red-400 transition-all duration-300 group flex items-center gap-1.5">
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="relative px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-1.5">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </button>
                <button onClick={() => navigate('/register')} className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-all duration-300 flex items-center gap-1.5 shadow-md shadow-emerald-500/20">
                  <Zap className="h-4 w-4" />
                  Criar Conta
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Mobile */}
        <nav className="lg:hidden flex items-center justify-between h-14">
          <SystemLogo size="sm" />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs bg-gray-950 border-gray-800 p-0">
              <div className="flex items-center p-4 border-b border-gray-800">
                <SystemLogo size="sm" />
              </div>
              <div className="flex flex-col h-[calc(100%-65px)]">
                <div className="p-4 border-b border-gray-800">
                  {user ? (
                    <Button onClick={() => { navigate('/dashboard'); setIsOpen(false); }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Ir para Dashboard
                    </Button>
                  ) : (
                    <Button onClick={() => navigate('/register')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12">
                      <Zap className="mr-2 h-4 w-4" />
                      Teste Grátis 7 Dias
                    </Button>
                  )}
                </div>
                <div className="flex-1 py-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.title}
                        onClick={() => handleNavigation(item)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 transition-all duration-200 group ${
                          isActive(item.href) ? 'bg-gray-800/50 text-white' : 'text-gray-200 hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-gray-400 group-hover:text-green-400 transition-colors" />
                          <span className="font-medium group-hover:text-white transition-colors">{item.title}</span>
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-all duration-200 ${
                          isActive(item.href) ? 'text-green-400' : 'text-gray-500 group-hover:text-green-400 group-hover:translate-x-1'
                        }`} />
                      </button>
                    );
                  })}
                </div>
                <div className="p-4 border-t border-gray-800 mt-auto">
                  {user ? (
                    <Button onClick={async () => { await signOut(); setIsOpen(false); navigate('/'); }} variant="outline" className="w-full bg-transparent border-red-700 text-red-400 hover:bg-red-900/20 hover:text-red-300 h-11">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair da conta
                    </Button>
                  ) : (
                    <Button onClick={() => navigate('/login')} variant="outline" className="w-full bg-transparent border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-white h-11">
                      <LogIn className="mr-2 h-4 w-4" />
                      Já tenho conta
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
};

export default ResponsiveNavigation;
