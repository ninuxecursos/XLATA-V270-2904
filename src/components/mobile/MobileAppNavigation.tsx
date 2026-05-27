import React, { useState, useMemo, startTransition, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FEATURE_KEYS } from '@/constants/featureAccess';
import { toast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  BarChart3, 
  FileText, 
  Settings,
  Package,
  Users,
  UserCog,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  Boxes,
  Wallet,
  Calendar,
  X,
  Loader2,
  Home,
  BookOpen,
  Crown,
  AlertCircle,
  Lock
} from 'lucide-react';

type NavTab = 'home' | 'dashboard' | 'operations' | 'system';

interface SubMenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  route: string;
  feature?: string;
}

const MobileAppNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isEmployee } = useEmployee();
  const { hasFeature, tier } = useFeatureAccess();
  const [openMenu, setOpenMenu] = useState<NavTab | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetRoute, setTargetRoute] = useState<string | null>(null);

  useEffect(() => {
    if (targetRoute && location.pathname === targetRoute) {
      setIsNavigating(false);
      setTargetRoute(null);
    }
  }, [location.pathname, targetRoute]);

  // Operations sub-menu - matches sidebar "OPERAÇÕES"
  const operationsItems = useMemo((): SubMenuItem[] => {
    const all: SubMenuItem[] = [
      { id: 'purchases', label: 'Compras', icon: ArrowDownCircle, route: '/purchase-orders', feature: FEATURE_KEYS.BASIC_HISTORY },
      { id: 'sales', label: 'Vendas', icon: ArrowUpCircle, route: '/sales-orders', feature: FEATURE_KEYS.BASIC_HISTORY },
      { id: 'transactions', label: 'Transações', icon: FileText, route: '/transactions', feature: FEATURE_KEYS.BASIC_HISTORY },
      { id: 'expenses', label: 'Despesas', icon: Receipt, route: '/expenses' },
      { id: 'cash-additions', label: 'Adições', icon: Wallet, route: '/cash-additions' },
      { id: 'daily-flow', label: 'Fluxo', icon: Calendar, route: '/daily-flow', feature: FEATURE_KEYS.BASIC_REPORTS },
    ];
    return all;
  }, []);

  // System sub-menu - matches sidebar "SISTEMA"
  const systemItems = useMemo((): SubMenuItem[] => {
    const all: SubMenuItem[] = [
      { id: 'materials', label: 'Materiais', icon: Package, route: '/materiais' },
      { id: 'stock', label: 'Estoque', icon: Boxes, route: '/current-stock', feature: FEATURE_KEYS.STOCK_CONTROL },
      { id: 'clients', label: 'Clientes', icon: Users, route: '/clientes', feature: FEATURE_KEYS.CLIENT_MANAGEMENT },
      { id: 'employees', label: 'Funcionários', icon: UserCog, route: '/funcionarios', feature: FEATURE_KEYS.EMPLOYEE_MANAGEMENT },
      { id: 'settings', label: 'Config', icon: Settings, route: '/configuracoes' },
      { id: 'help', label: 'Ajuda', icon: BookOpen, route: '/ajuda' },
      { id: 'plans', label: 'Planos', icon: Crown, route: '/planos' },
      { id: 'referrals', label: 'Indicações', icon: Users, route: '/sistema-indicacoes' },
      { id: 'report-error', label: 'Relatar Erro', icon: AlertCircle, route: '/relatar-erro' },
    ];

    let filtered = [...all];
    
    // Employees don't see "Funcionários" or "Planos"
    if (isEmployee) {
      filtered = filtered.filter(item => item.route !== '/funcionarios' && item.route !== '/planos');
    }

    return filtered;
  }, [isEmployee]);

  const showDashboard = hasFeature(FEATURE_KEYS.BASIC_REPORTS);

  const activeTab = useMemo((): NavTab => {
    const path = location.pathname;
    
    if (path === '/pdv' || path === '/') return 'home';
    if (path === '/dashboard') return 'dashboard';
    if (['/purchase-orders', '/sales-orders', '/transactions', '/daily-flow', '/expenses', '/cash-additions'].includes(path)) return 'operations';
    if (['/materiais', '/current-stock', '/clientes', '/configuracoes', '/funcionarios', '/employees', '/ajuda', '/planos', '/sistema-indicacoes', '/relatar-erro'].includes(path)) return 'system';
    
    return 'home';
  }, [location.pathname]);

  const isItemLocked = (item: SubMenuItem): boolean => {
    if (!item.feature) return false;
    return !hasFeature(item.feature as any);
  };

  const navigateWithLoading = (route: string) => {
    if (location.pathname === route) return;
    
    setIsNavigating(true);
    setTargetRoute(route);
    setOpenMenu(null);
    
    startTransition(() => {
      navigate(route);
    });

    setTimeout(() => {
      setIsNavigating(false);
      setTargetRoute(null);
    }, 3000);
  };

  const handleTabClick = (tab: NavTab) => {
    if (tab === 'home') {
      navigateWithLoading('/pdv');
    } else if (tab === 'dashboard') {
      navigateWithLoading('/dashboard');
    } else if (tab === 'operations' || tab === 'system') {
      setOpenMenu(openMenu === tab ? null : tab);
    }
  };

  const handleSubItemClick = (item: SubMenuItem) => {
    if (isItemLocked(item)) {
      toast({
        title: "🔒 Recurso PRO",
        description: `"${item.label}" requer o plano Pro. Faça upgrade para desbloquear.`,
      });
      setOpenMenu(null);
      navigate('/planos');
      return;
    }
    navigateWithLoading(item.route);
  };

  const tabs = useMemo(() => {
    const baseTabs = [
      { id: 'home' as NavTab, label: 'Início', icon: Home },
    ];
    
    if (showDashboard) {
      baseTabs.push({ id: 'dashboard' as NavTab, label: 'Painel', icon: BarChart3 });
    }
    
    baseTabs.push(
      { id: 'operations' as NavTab, label: 'Relatórios', icon: FileText },
      { id: 'system' as NavTab, label: 'Sistema', icon: Settings },
    );
    
    return baseTabs;
  }, [showDashboard]);

  return (
    <>
      {/* Loading overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-[#0b1220]/90 backdrop-blur-sm z-[60] flex items-center justify-center animate-fade-in">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
            <span className="text-sm font-medium text-slate-400">Carregando...</span>
          </div>
        </div>
      )}

      {/* Overlay para fechar menu */}
      {openMenu && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setOpenMenu(null)}
        />
      )}

      {/* Menu expansível - bottom sheet */}
      {openMenu && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-50 px-3 pb-2 animate-slide-in-bottom">
          <div className="bg-[#111827] rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
              <span className="text-white font-semibold text-sm">
                {openMenu === 'operations' ? 'Relatórios' : 'Sistema'}
              </span>
              <button 
                onClick={() => setOpenMenu(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-700/60 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid de itens */}
            {(() => {
              const items = openMenu === 'operations' ? operationsItems : systemItems;
              const cols = items.length > 6 ? 'grid-cols-4' : items.length >= 5 ? 'grid-cols-3' : items.length === 4 ? 'grid-cols-4' : 'grid-cols-3';
              return (
                <div className={`grid p-3 gap-1.5 ${cols}`}>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.route;
                    const locked = isItemLocked(item);
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSubItemClick(item)}
                        className={`flex flex-col items-center justify-center py-3.5 px-1 rounded-xl transition-all active:scale-95 relative ${
                          isActive 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                            : locked
                              ? 'text-slate-600 hover:bg-slate-800/40'
                              : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                        }`}
                      >
                        {locked && (
                          <Lock className="absolute top-1.5 right-1.5 h-2.5 w-2.5 text-amber-500/70" />
                        )}
                        <Icon className={`w-5 h-5 mb-1.5 ${locked ? 'opacity-50' : ''} ${isActive ? '' : 'stroke-[1.5]'}`} />
                        <span className={`text-[10px] font-medium text-center leading-tight truncate w-full px-0.5 ${locked ? 'opacity-50' : ''}`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#0b1220] border-t border-slate-700/50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex justify-around items-center h-[60px]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isMenuOpen = openMenu === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 px-1 transition-all relative active:scale-95 ${
                  isActive || isMenuOpen
                    ? 'text-emerald-500' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-emerald-500 rounded-full" />
                )}
                
                <div className={`relative transition-transform duration-100 ${isActive || isMenuOpen ? 'scale-110' : ''}`}>
                  <Icon className={`w-6 h-6 ${isActive || isMenuOpen ? '' : 'stroke-[1.5]'}`} />
                </div>
                
                <span className={`text-[10px] mt-0.5 ${
                  isActive || isMenuOpen ? 'font-semibold text-emerald-500' : 'font-medium text-slate-500'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileAppNavigation;
