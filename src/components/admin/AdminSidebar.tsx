import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft,
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  FileText,
  Image,
  Shield,
  Activity,
  Settings,
  Wifi,
  RefreshCw,
  Send,
  Lock,
  BarChart3,
  Flag,
  Clock,
  Eye,
  AlertTriangle,
  Database,
  Server,
  ChevronDown,
  UserCog,
  Bot,
  Store,
  Receipt,
  HardDrive,
  Sparkles,
  Cable,
  Plug
} from 'lucide-react';
import { useAdminRoles, AdminRole } from '@/hooks/useAdminRoles';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export type ActiveTab = 
  | 'dashboard' 
  | 'usuarios' 
  | 'financeiro'
  | 'pagamentos'
  | 'assinaturas' 
  | 'planos'
  | 'promocoes'
  | 'conteudo' 
  | 'landing' 
  | 'seguranca'
  | 'access-logs'
  | 'audit-logs'
  | 'bloqueios'
  | 'sistema' 
  | 'feature-flags'
  | 'manutencao'
  | 'analytics'
  | 'online'
  | 'depot-clients'
  | 'depot-employees'
  | 'ai-automation'
  | 'local-seo'
  | 'limpeza-sistema'
  | 'documentacao'
  | 'fiscal-settings'
  | 'pdv-offline'
  | 'licencas-offline'
  | 'scale-profiles';

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
  requiredRole?: AdminRole;
}

interface MenuItem {
  id: ActiveTab;
  title: string;
  icon: React.ElementType;
  badge?: string | number;
  requiredRole?: AdminRole;
}

interface AdminSidebarProps {
  activeTab: ActiveTab;
  onTabClick: (tab: ActiveTab) => void;
  onlineUsers: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  systemVersion: string;
  onBroadcastNotification?: () => void;
  unreadErrorReports?: number;
}

const menuGroups: MenuGroup[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    icon: LayoutDashboard,
    items: [
      { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
      { id: 'analytics', title: 'Analytics', icon: BarChart3 },
      { id: 'online', title: 'Online', icon: Wifi },
    ]
  },
  {
    id: 'users',
    label: 'Usuários',
    icon: Users,
    items: [
      { id: 'usuarios', title: 'Gerenciar', icon: Users },
      { id: 'depot-clients', title: 'Clientes Depósito', icon: Users },
      { id: 'depot-employees', title: 'Funcionários', icon: UserCog },
    ],
    requiredRole: 'suporte'
  },
  {
    id: 'financial',
    label: 'Financeiro',
    icon: DollarSign,
    items: [
      { id: 'financeiro', title: 'Dashboard', icon: DollarSign },
      { id: 'pagamentos', title: 'Pagamentos', icon: CreditCard },
      { id: 'planos', title: 'Planos', icon: FileText },
      { id: 'promocoes', title: 'Promoções', icon: Sparkles },
    ],
    requiredRole: 'admin_operacional'
  },
  {
    id: 'content',
    label: 'Conteúdo',
    icon: FileText,
    items: [
      { id: 'landing', title: 'Landing', icon: Image },
      { id: 'conteudo', title: 'Blog', icon: FileText },
      { id: 'local-seo', title: 'SEO Local', icon: Activity },
    ],
    requiredRole: 'admin_operacional'
  },
  {
    id: 'security',
    label: 'Segurança',
    icon: Shield,
    items: [
      { id: 'seguranca', title: 'Central', icon: Shield },
    ],
    requiredRole: 'admin_master'
  },
  {
    id: 'connectivity',
    label: 'Conectividades',
    icon: Plug,
    items: [
      { id: 'scale-profiles', title: 'Balanças (Perfis)', icon: Cable },
    ],
    requiredRole: 'admin_master'
  },
  {
    id: 'system',
    label: 'Sistema',
    icon: Server,
    items: [
      { id: 'sistema', title: 'Config', icon: Settings },
      { id: 'fiscal-settings', title: 'Fiscal', icon: Receipt },
      { id: 'feature-flags', title: 'Features', icon: Flag },
      { id: 'manutencao', title: 'Manutenção', icon: AlertTriangle },
      { id: 'limpeza-sistema', title: 'Limpeza', icon: Database },
      { id: 'ai-automation', title: 'IA & Automação', icon: Bot },
      { id: 'pdv-offline', title: 'PDV Offline', icon: HardDrive },
      { id: 'licencas-offline', title: 'Licenças Offline', icon: Lock },
      { id: 'documentacao', title: 'Documentação', icon: FileText },
    ],
    requiredRole: 'admin_master'
  },
];

const getRoleBadge = (role: AdminRole | null): { label: string; className: string } => {
  switch (role) {
    case 'admin_master':
      return { label: 'Admin Master', className: 'bg-red-600 hover:bg-red-700' };
    case 'admin_operacional':
      return { label: 'Admin Operacional', className: 'bg-orange-600 hover:bg-orange-700' };
    case 'suporte':
      return { label: 'Suporte', className: 'bg-blue-600 hover:bg-blue-700' };
    case 'leitura':
      return { label: 'Leitura', className: 'bg-gray-600 hover:bg-gray-700' };
    default:
      return { label: 'Admin', className: 'bg-gray-600 hover:bg-gray-700' };
  }
};

export const AdminSidebar = ({ 
  activeTab, 
  onTabClick, 
  onlineUsers, 
  isRefreshing, 
  onRefresh,
  systemVersion,
  onBroadcastNotification,
  unreadErrorReports = 0
}: AdminSidebarProps) => {
  const { highestRole, hasMinimumRole, loading: rolesLoading } = useAdminRoles();
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    overview: true,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const canAccessGroup = (group: MenuGroup): boolean => {
    if (!group.requiredRole) return true;
    return hasMinimumRole(group.requiredRole);
  };

  const canAccessItem = (item: MenuItem): boolean => {
    if (!item.requiredRole) return true;
    return hasMinimumRole(item.requiredRole);
  };

  const roleBadge = getRoleBadge(highestRole);

  // Find which group the active tab belongs to and open it
  React.useEffect(() => {
    menuGroups.forEach(group => {
      if (group.items.some(item => item.id === activeTab)) {
        setOpenGroups(prev => ({ ...prev, [group.id]: true }));
      }
    });
  }, [activeTab]);

  return (
    <Sidebar className="bg-gray-900 border-r border-gray-700">
      <SidebarHeader className="p-4 border-b border-gray-700 bg-gray-900">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/" className="flex items-center gap-2 hover:text-gray-300 transition-colors text-white">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Voltar ao Sistema</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">X</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">XLata CMS</h1>
            <p className="text-xs text-gray-400">Painel Administrativo</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-green-600/20 px-3 py-2 rounded-lg border border-green-600/30">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <Wifi className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-green-300 text-xs font-semibold">
              {onlineUsers} online agora
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onRefresh}
              variant="ghost"
              size="sm"
              disabled={isRefreshing}
              className="flex-1 bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500"
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", isRefreshing && "animate-spin")} />
              Atualizar
            </Button>

            {onBroadcastNotification && (
              <Button
                onClick={onBroadcastNotification}
                variant="ghost"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-500"
                title="Enviar Notificação"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>

          {!rolesLoading && (
            <Badge variant="destructive" className={cn("w-full justify-center", roleBadge.className)}>
              {roleBadge.label}
            </Badge>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-gray-900 px-2">
        {menuGroups.map((group) => {
          if (!canAccessGroup(group)) return null;

          const isOpen = openGroups[group.id] ?? false;
          const hasActiveItem = group.items.some(item => item.id === activeTab);

          return (
            <SidebarGroup key={group.id} className="py-1">
              <Collapsible open={isOpen} onOpenChange={() => toggleGroup(group.id)}>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel 
                    className={cn(
                      "flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg transition-colors",
                      "text-gray-400 hover:text-white hover:bg-gray-800",
                      hasActiveItem && "text-red-400"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <group.icon className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">{group.label}</span>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      isOpen && "transform rotate-180"
                    )} />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarGroupContent className="mt-1">
                    <SidebarMenu>
                      {group.items.map((item) => {
                        if (!canAccessItem(item)) return null;

                        return (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              onClick={() => onTabClick(item.id)}
                              isActive={activeTab === item.id}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors rounded-md ml-2",
                                activeTab === item.id
                                  ? "bg-red-600 text-white"
                                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
                              )}
                            >
                              <item.icon className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm">{item.title}</span>
                              {item.badge && (
                                <Badge variant="secondary" className="ml-auto text-xs">
                                  {item.badge}
                                </Badge>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-700 bg-gray-900">
        <div className="space-y-2">
          {/* Botão CMS da Loja */}
          <Link to="/shop-cms">
            <Button 
              variant="outline" 
              className="w-full bg-emerald-600/20 border-emerald-600/50 text-emerald-400 hover:bg-emerald-600/30 hover:text-emerald-300"
            >
              <Store className="h-4 w-4 mr-2" />
              CMS da Loja
            </Button>
          </Link>
          
          {unreadErrorReports > 0 && (
            <div className="flex items-center gap-2 bg-red-600/20 px-3 py-2 rounded-lg border border-red-600/30">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-red-300 text-xs">
                {unreadErrorReports} erro{unreadErrorReports !== 1 ? 's' : ''} pendente{unreadErrorReports !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              <span>Supabase</span>
            </div>
            <span>{systemVersion}</span>
          </div>
          
          <p className="text-xs text-gray-500 text-center">© 2024 XLata.site</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
