import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CreditCard, 
  AlertCircle, 
  DollarSign,
  AlertTriangle,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { SubscriptionManagement } from '@/components/admin/SubscriptionManagement';
import { SystemManagement } from '@/components/admin/SystemManagement';
import { AdminSidebar, ActiveTab } from '@/components/admin/AdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { LandingAdminPanel } from '@/components/admin/LandingAdminPanel';
import { ActiveUsersList } from '@/components/admin/ActiveUsersList';
import { useOnlineUsersFromDB } from '@/hooks/useOnlineUsersFromDB';
import { useUserPresence } from '@/hooks/useUserPresence';
import ErrorReportsModal from '@/components/admin/ErrorReportsModal';
import { UnifiedNotificationModal } from '@/components/admin/UnifiedNotificationModal';
import { supabase } from '@/integrations/supabase/client';
import { SecurityDashboard } from '@/components/admin/SecurityDashboard';
import { FeatureFlagsPanel } from '@/components/admin/FeatureFlagsPanel';
import { FinancialDashboard } from '@/components/admin/FinancialDashboard';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { MaintenanceDashboard } from '@/components/admin/MaintenanceDashboard';
import { PlansManagement } from '@/components/admin/PlansManagement';
import PromotionalCampaignsManager from '@/components/admin/PromotionalCampaignsManager';
import { ContentManagementPanel } from '@/components/admin/ContentManagementPanel';
import DashboardSummary from '@/components/admin/DashboardSummary';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { DepotClientsManagement } from '@/components/admin/DepotClientsManagement';
import { EmployeesManagement } from '@/components/admin/EmployeesManagement';
import { PaymentGatewayConfig } from '@/components/admin/PaymentGatewayConfig';
import { LocalSeoManagement } from '@/components/admin/LocalSeoManagement';
import { AIAutomationPanel } from '@/components/admin/AIAutomationPanel';
import { ProjectDocumentation } from '@/components/admin/ProjectDocumentation';
import { SystemDataCleanup } from '@/components/admin/SystemDataCleanup';
import { FiscalSettings } from '@/components/admin/FiscalSettings';
import { PDVOfflineGenerator } from '@/components/admin/PDVOfflineGenerator';
import { LicenseGenerator } from '@/components/admin/LicenseGenerator';
import ScaleProfilesManagement from '@/components/admin/connectivity/ScaleProfilesManagement';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const Covildomal = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isMobileOrTablet = isMobile || isTablet;
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  
  const { stats, systemStatus, loading, error, refetch } = useAdminDashboard();
  const { count: onlineUsersCount } = useOnlineUsersFromDB();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showErrorReports, setShowErrorReports] = useState(false);
  const [unreadErrorReports, setUnreadErrorReports] = useState(0);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  
  // Verificar se é admin - proteção de rota
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        console.error('❌ Tentativa de acesso ao admin sem autenticação');
        navigate('/login', { replace: true });
        return;
      }
      
      try {
        const { data, error: rpcError } = await supabase.rpc('is_admin');
        
        if (rpcError || !data) {
          console.error('❌ Acesso negado ao painel admin:', rpcError);
          toast({
            title: "⛔ Acesso Negado",
            description: "Você não tem permissão para acessar esta área.",
            variant: "destructive"
          });
          navigate('/', { replace: true });
          return;
        }
        
        setIsAdmin(true);
        console.log('✅ Admin access granted');
      } catch (err) {
        console.error('💥 Erro ao verificar admin:', err);
        navigate('/', { replace: true });
      } finally {
        setCheckingAccess(false);
      }
    };
    
    checkAdminAccess();
  }, [user, authLoading, navigate]);
  
  // Ativar rastreamento de presença para o usuário atual
  useUserPresence();

  // Fetch unread error reports count
  const fetchUnreadErrorReports = async () => {
    try {
      const { data, error } = await supabase
        .from('error_reports')
        .select('id')
        .eq('is_read', false);

      if (error) throw error;
      setUnreadErrorReports(data?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar relatórios não lidos:', error);
    }
  };

  useEffect(() => {
    fetchUnreadErrorReports();
    
    // Set up real-time subscriptions
    const errorReportsChannel = supabase
      .channel('error-reports-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'error_reports'
      }, () => {
        fetchUnreadErrorReports();
      })
      .subscribe();
    
    // Real-time para orders (transações)
    const ordersChannel = supabase
      .channel('admin-orders-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(errorReportsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value).replace(',00', '');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    await fetchUnreadErrorReports();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'usuarios':
        return <UserManagement />;
      case 'financeiro':
        return <FinancialDashboard />;
      case 'pagamentos':
        return <PaymentGatewayConfig />;
      case 'planos':
        return <PlansManagement />;
      case 'promocoes':
        return <PromotionalCampaignsManager />;
      case 'conteudo':
        return <ContentManagementPanel />;
      case 'landing':
        return <LandingAdminPanel />;
      case 'seguranca':
        return <SecurityDashboard />;
      case 'sistema':
        return <SystemManagement />;
      case 'feature-flags':
        return <FeatureFlagsPanel />;
      case 'manutencao':
        return <MaintenanceDashboard />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'online':
        return <ActiveUsersList />;
      case 'depot-clients':
        return <DepotClientsManagement />;
      case 'depot-employees':
        return <EmployeesManagement />;
      case 'local-seo':
        return <LocalSeoManagement />;
      case 'ai-automation':
        return <AIAutomationPanel />;
      case 'limpeza-sistema':
        return <SystemDataCleanup />;
      case 'documentacao':
        return <ProjectDocumentation />;
      case 'fiscal-settings':
        return <FiscalSettings />;
      case 'pdv-offline':
        return <PDVOfflineGenerator />;
      case 'licencas-offline':
        return <LicenseGenerator />;
      case 'scale-profiles':
        return <ScaleProfilesManagement />;
      default:
        return null;
    }
  };

  // Mostrar loading enquanto verifica permissões ou dados
  if (authLoading || checkingAccess) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <ShieldAlert className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-foreground text-lg">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se não é admin, não renderiza nada (já foi redirecionado)
  if (!isAdmin) {
    return null;
  }

  if (loading && !stats.totalUsers) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground text-lg">Carregando dados do sistema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-foreground text-lg mb-4">Erro ao carregar dados: {error}</p>
          <button 
            onClick={handleRefresh} 
            className="bg-destructive hover:bg-destructive/90 text-white px-4 py-2 rounded"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background dark">
        {/* Mobile Header with Hamburger */}
        {isMobileOrTablet && (
          <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-gray-900 border-b border-gray-700 flex items-center px-4 gap-3">
            <SidebarTrigger className="text-white hover:bg-gray-800" />
            <div className="flex-1 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">X</span>
              </div>
              <span className="text-white font-bold">XLata CMS</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              className="text-white hover:bg-gray-800"
            >
              <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
            </Button>
          </header>
        )}
        
        <AdminSidebar
          activeTab={activeTab}
          onTabClick={handleTabClick}
          onlineUsers={onlineUsersCount}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          systemVersion={systemStatus.systemVersion}
          onBroadcastNotification={() => setShowBroadcastModal(true)}
          unreadErrorReports={unreadErrorReports}
        />
        
        <SidebarInset className={cn("flex-1 bg-background", isMobileOrTablet && "pt-14")}>
          <main className={cn("p-6 overflow-auto bg-background min-h-screen", isMobileOrTablet && "p-4")}>
            {activeTab === 'dashboard' ? (
              <>
                {/* Error Reports Alert */}
                {unreadErrorReports > 0 && (
                  <Card className="bg-red-900/20 border-red-700/50 mb-6">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-6 w-6 text-red-400" />
                          <div>
                            <h3 className="text-white font-semibold">Novos Relatórios de Erro</h3>
                            <p className="text-red-300 text-sm">
                              Você tem {unreadErrorReports} relatório{unreadErrorReports !== 1 ? 's' : ''} não lido{unreadErrorReports !== 1 ? 's' : ''} de usuários
                            </p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => setShowErrorReports(true)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Ver Relatórios
                          <Badge variant="secondary" className="ml-2">
                            {unreadErrorReports}
                          </Badge>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Users className="h-6 w-6 text-primary" />
                        <Badge variant="outline" className="text-xs border-primary text-primary">
                          Total: {stats.totalUsers}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Registrados</span>
                          <span className="text-lg font-bold text-foreground">{stats.totalUsers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Logins (30d)</span>
                          <span className="text-sm text-primary">{stats.recentLogins}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <CreditCard className="h-6 w-6 text-emerald-400" />
                        <Badge variant="outline" className="text-xs border-emerald-400 text-emerald-400">
                          Ativas: {stats.activeSubscriptions}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Pagas</span>
                          <span className="text-lg font-bold text-emerald-400">{stats.activeSubscriptions}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Em teste</span>
                          <span className="text-sm text-primary">{stats.trialUsers}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <DollarSign className="h-6 w-6 text-emerald-400" />
                        <Badge variant="outline" className="text-xs border-emerald-400 text-emerald-400">
                          Mensal
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Receita</span>
                          <span className="text-lg font-bold text-emerald-400">{formatCurrency(stats.monthlyRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Valor médio</span>
                          <span className="text-sm text-foreground">
                            {formatCurrency(stats.activeSubscriptions > 0 ? stats.monthlyRevenue / stats.activeSubscriptions : 0)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <AlertCircle className="h-6 w-6 text-amber-400" />
                        <Badge variant="outline" className="text-xs border-amber-400 text-amber-400">
                          Alertas
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Expirados</span>
                          <span className="text-lg font-bold text-amber-400">{stats.expiredTests}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Inativos</span>
                          <span className="text-sm text-destructive">{stats.inactiveUsers}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <DashboardSummary systemStatus={systemStatus} />
              </>
            ) : (
              renderTabContent()
            )}
          </main>
        </SidebarInset>
      </div>

      {/* Error Reports Modal */}
      <ErrorReportsModal 
        open={showErrorReports} 
        onClose={() => setShowErrorReports(false)}
        unreadCount={unreadErrorReports}
        onCountUpdate={setUnreadErrorReports}
      />

      {/* Unified Notification Modal */}
      <UnifiedNotificationModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
      />
    </SidebarProvider>
  );
};

export default Covildomal;
