import React, { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home,
  Settings, 
  BarChart3, 
  Archive, 
  ShoppingCart, 
  FileText, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  BookOpen,
  LogOut,
  Shield,
  Wallet,
  ClipboardList,
  Users,
  AlertCircle,
  Crown,
  UserCog,
  Lock
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FEATURE_KEYS, type FeatureKey } from '@/constants/featureAccess';
import { toast } from '@/hooks/use-toast';

import SystemLogo from './SystemLogo';
import { useEmployee } from '@/contexts/EmployeeContext';

interface SidebarItem {
  title: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  isAction?: boolean;
  feature?: FeatureKey;
}

interface AppSidebarProps {
  isAdmin?: boolean;
  subscription?: any;
  onOpenCashRegister?: () => void;
}

export function AppSidebar({ 
  isAdmin = false, 
  subscription, 
  onOpenCashRegister
}: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { isEmployee, ownerSubscription } = useEmployee();
  const { hasFeature } = useFeatureAccess();

  const effectiveSubscription = isEmployee ? ownerSubscription : subscription;
  const handleCashRegisterAction = () => {
    navigate('/pdv');
  };

  // All items — never filtered, always shown
  const principalItems: SidebarItem[] = useMemo(() => [
    { title: "Início", icon: Home, href: "/pdv" },
    { title: "PDV / Caixa", icon: ShoppingCart, action: handleCashRegisterAction, isAction: true },
    { title: "Dashboard", icon: BarChart3, href: "/dashboard" },
    { title: "Estoque", icon: Archive, href: "/current-stock", feature: FEATURE_KEYS.STOCK_CONTROL },
  ], []);

  const operacoesItems: SidebarItem[] = useMemo(() => [
    { title: "Compras", icon: ShoppingCart, href: "/purchase-orders", feature: FEATURE_KEYS.BASIC_HISTORY },
    { title: "Vendas", icon: TrendingUp, href: "/sales-orders", feature: FEATURE_KEYS.BASIC_HISTORY },
    { title: "Transações", icon: FileText, href: "/transactions", feature: FEATURE_KEYS.BASIC_HISTORY },
    { title: "Despesas", icon: DollarSign, href: "/expenses" },
    { title: "Adições de Caixa", icon: Wallet, href: "/cash-additions" },
    { title: "Fluxo de Caixa", icon: Calendar, href: "/daily-flow", feature: FEATURE_KEYS.BASIC_REPORTS },
  ], []);

  const allConfiguracoesItems: SidebarItem[] = useMemo(() => [
    { title: "Materiais", icon: ClipboardList, href: "/materiais" },
    { title: "Clientes", icon: Users, href: "/clientes", feature: FEATURE_KEYS.CLIENT_MANAGEMENT },
    { title: "Funcionários", icon: UserCog, href: "/funcionarios", feature: FEATURE_KEYS.EMPLOYEE_MANAGEMENT },
    { title: "Configurações", icon: Settings, href: "/configuracoes" },
    { title: "Ajuda & Guia", icon: BookOpen, href: "/ajuda" },
    { title: "Planos", icon: Crown, href: "/planos" },
  ], []);

  const configuracoesItems = isEmployee 
    ? allConfiguracoesItems.filter(item => item.href !== '/planos' && item.href !== '/funcionarios')
    : allConfiguracoesItems;

  const extraItems: SidebarItem[] = [
    { title: "Indicações", icon: Users, href: "/sistema-indicacoes" },
    { title: "Relatar Erro", icon: AlertCircle, href: "/relatar-erro" },
  ];

  const adminItems = [
    { title: "Painel Admin", icon: Shield, href: "/covildomal" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isLocked = (item: SidebarItem): boolean => {
    if (isAdmin) return false;
    if (!item.feature) return false;
    return !hasFeature(item.feature);
  };

  const renderMenuItem = (item: SidebarItem) => {
    const locked = isLocked(item);
    const baseClass = "flex items-center gap-2 px-2 py-1.5 w-full text-left rounded-sm transition-all duration-200";
    const normalClass = `${baseClass} text-slate-400 hover:text-white hover:bg-slate-700/60`;
    const lockedClass = `${baseClass} text-slate-600 hover:text-slate-500 hover:bg-slate-800/40 cursor-pointer`;
    const activeClass = "bg-slate-800 text-white border-l-2 border-emerald-500 rounded-l-none";

    if (locked) {
      return (
        <button
          key={item.title}
          type="button"
          onClick={() => {
            toast({
              title: "🔒 Recurso PRO",
              description: `"${item.title}" requer o plano Pro. Faça upgrade para desbloquear.`,
            });
            navigate('/planos');
          }}
          className={lockedClass}
        >
          <item.icon className="h-4 w-4 flex-shrink-0 opacity-50" />
          {!collapsed && (
            <>
              <span className="text-xs flex-1 opacity-60">{item.title}</span>
              <Lock className="h-3 w-3 text-amber-500/70 flex-shrink-0" />
            </>
          )}
        </button>
      );
    }

    if (item.isAction) {
      return (
        <button
          key={item.title}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            item.action?.();
          }}
          className={`${normalClass} relative z-10 cursor-pointer`}
        >
          <item.icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-xs">{item.title}</span>}
        </button>
      );
    }

    return (
      <NavLink
        key={item.title}
        to={item.href!}
        className={({ isActive }) => 
          `${normalClass} ${isActive ? activeClass : ''}`
        }
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span className="text-xs">{item.title}</span>}
      </NavLink>
    );
  };

  return (
    <Sidebar className="bg-slate-900 border-r border-slate-700">
      <SidebarContent className="bg-slate-900 flex flex-col h-full">
        {/* Logo Header */}
        <div className="p-2 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <SystemLogo size="sm" />
            {!collapsed && (
              <div>
                <span className="text-white font-semibold text-xs">XLATA</span>
                <span className="text-slate-500 text-[10px] block">Gestor PDV</span>
              </div>
            )}
          </div>
        </div>

        {/* Principal */}
        <SidebarGroup className="pt-2 pb-1">
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
            {!collapsed && "Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-0.5">
              {principalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {renderMenuItem(item)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operações */}
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
            {!collapsed && "Operações"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-0.5">
              {operacoesItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {renderMenuItem(item)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sistema */}
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
            {!collapsed && "Sistema"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-0.5">
              {configuracoesItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {renderMenuItem(item)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Extras */}
        {!collapsed && (
          <SidebarGroup className="py-1">
            <SidebarGroupContent className="px-2">
              <SidebarMenu className="space-y-0.5">
                {extraItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderMenuItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin */}
        {isAdmin && (
          <SidebarGroup className="py-1">
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
              {!collapsed && "Admin"}
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <SidebarMenu className="space-y-0.5">
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) => 
                        `flex items-center gap-2 px-2 py-1.5 w-full rounded-sm transition-all duration-200 ${
                          isActive 
                            ? 'bg-emerald-900/30 text-emerald-400 border-l-2 border-emerald-500 rounded-l-none' 
                            : 'text-emerald-500 hover:text-emerald-400 hover:bg-emerald-900/20'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="text-xs">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Status da Assinatura */}
        {effectiveSubscription && !collapsed && (
          <div className="px-2 py-1.5 mt-auto">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Plano</span>
              <span className="text-emerald-500 font-medium">
                {isEmployee ? 'Funcionário' : (effectiveSubscription.plan_type === 'trial' ? 'Teste' : 'Ativo')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-0.5">
              <span className="text-slate-500">{isEmployee ? 'Dono' : 'Expira'}</span>
              <span className="text-slate-400">
                {isEmployee ? 'Assinatura do dono' : new Date(effectiveSubscription.expires_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="mt-auto p-1.5 border-t border-slate-700">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 justify-start h-7 text-xs"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}