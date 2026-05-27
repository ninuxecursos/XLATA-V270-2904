import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, Mail, Calendar, CreditCard, Clock, Shield, Activity, 
  Trash2, Download, Phone, Globe, Monitor, Smartphone, Tablet,
  LogIn, MapPin, X, Power, AlertTriangle, CheckCircle, XCircle,
  History, Laptop, Key, RefreshCw, ShoppingCart, Package, Users, BarChart3,
  ChevronLeft, ChevronRight, Loader2, Settings, Edit3, Save, XCircle as CancelIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, subDays, subMonths, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import UserSettingsTab from './UserSettingsTab';
import AdminUserDataCleanup from './AdminUserDataCleanup';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  whatsapp?: string | null;
  company?: string | null;
  created_at: string;
  subscription_status: 'trial' | 'paid' | 'expired' | 'inactive';
  subscription_type: string | null;
  expires_at: string | null;
  is_active: boolean;
  remaining_days: number | null;
  plan_display_name: string | null;
  user_status: 'active' | 'inactive';
  last_login_at?: string | null;
  status?: 'admin' | 'user';
}

interface AccessLog {
  id: string;
  action: string;
  ip_address: string;
  user_agent: string;
  device_type: string;
  browser: string;
  os: string;
  country: string;
  city: string;
  success: boolean;
  created_at: string;
}

interface ActiveSession {
  id: string;
  session_token: string;
  ip_address: string;
  device_type: string;
  browser: string;
  os: string;
  country: string;
  city: string;
  last_activity: string;
  created_at: string;
  is_active: boolean;
}

interface SubscriptionHistory {
  id: string;
  plan_type: string;
  is_active: boolean;
  activated_at: string;
  expires_at: string;
  activation_method?: string | null;
  period_days?: number | null;
  payment_method?: string | null;
}

interface Order {
  id: string;
  type: string;
  total: number;
  status: string;
  customer_id: string | null;
  created_at: string;
}

interface Material {
  id: string;
  name: string;
  price: number;
  sale_price: number;
  unit: string | null;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  created_at: string;
}

interface UserStats {
  totalSales: number;
  totalPurchases: number;
  totalOrders: number;
  totalMaterials: number;
  totalCustomers: number;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

interface UserDetailsExpandedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData;
  onRefresh?: () => void;
}

const ITEMS_PER_PAGE = 20;

const UserDetailsExpandedModal: React.FC<UserDetailsExpandedModalProps> = ({
  open,
  onOpenChange,
  user,
  onRefresh
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isMobileOrTablet = isMobile || isTablet;
  
  const [activeTab, setActiveTab] = useState('info');
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionHistory[]>([]);
  const [uniqueIPs, setUniqueIPs] = useState<{ ip: string; country: string; city: string; lastUsed: string; count: number }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<UserStats>({ totalSales: 0, totalPurchases: 0, totalOrders: 0, totalMaterials: 0, totalCustomers: 0 });
  const [loading, setLoading] = useState(false);
  
  // Pagination states
  const [logsPagination, setLogsPagination] = useState<PaginationState>({ page: 1, pageSize: ITEMS_PER_PAGE, total: 0, hasMore: true });
  const [ordersPagination, setOrdersPagination] = useState<PaginationState>({ page: 1, pageSize: ITEMS_PER_PAGE, total: 0, hasMore: true });
  const [materialsPagination, setMaterialsPagination] = useState<PaginationState>({ page: 1, pageSize: ITEMS_PER_PAGE, total: 0, hasMore: true });
  const [customersPagination, setCustomersPagination] = useState<PaginationState>({ page: 1, pageSize: ITEMS_PER_PAGE, total: 0, hasMore: true });
  const [sessionsPagination, setSessionsPagination] = useState<PaginationState>({ page: 1, pageSize: ITEMS_PER_PAGE, total: 0, hasMore: true });
  const [ipsPagination, setIpsPagination] = useState<PaginationState>({ page: 1, pageSize: ITEMS_PER_PAGE, total: 0, hasMore: true });

  const [loadingTab, setLoadingTab] = useState<string | null>(null);

  // Estado para edição de dados pessoais
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: '',
    email: '',
    whatsapp: '',
    company: ''
  });
  const [savingInfo, setSavingInfo] = useState(false);

  // Estado para filtro de período
  type PeriodFilter = 'today' | '7days' | '30days' | '3months' | 'all';
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [filteredStats, setFilteredStats] = useState<UserStats>({ totalSales: 0, totalPurchases: 0, totalOrders: 0, totalMaterials: 0, totalCustomers: 0 });

  useEffect(() => {
    if (open && user) {
      // Reset pagination when modal opens
      setLogsPagination({ page: 1, pageSize: ITEMS_PER_PAGE, total: 0, hasMore: true });
      setOrdersPagination({ page: 1, pageSize: ITEMS_PER_PAGE, total: 0, hasMore: true });
      setMaterialsPagination({ page: 1, pageSize: ITEMS_PER_PAGE, total: 0, hasMore: true });
      setCustomersPagination({ page: 1, pageSize: ITEMS_PER_PAGE, total: 0, hasMore: true });
      setSessionsPagination({ page: 1, pageSize: ITEMS_PER_PAGE, total: 0, hasMore: true });
      setIpsPagination({ page: 1, pageSize: ITEMS_PER_PAGE, total: 0, hasMore: true });
      
      // Clear data
      setAccessLogs([]);
      setOrders([]);
      setMaterials([]);
      setCustomers([]);
      setActiveSessions([]);
      setUniqueIPs([]);
      
      // Initialize edit state
      setEditedUser({
        name: user.name || '',
        email: user.email || '',
        whatsapp: user.whatsapp || '',
        company: user.company || ''
      });
      setIsEditingInfo(false);
      setPeriodFilter('all');
      
      fetchInitialData();
    }
  }, [open, user]);

  useEffect(() => {
    if (open && user && activeTab) {
      loadTabData(activeTab, 1, true);
    }
  }, [activeTab, open, user]);

  // Recalculate stats when period filter changes
  useEffect(() => {
    if (periodFilter && open && user) {
      fetchFilteredStats();
    }
  }, [periodFilter, open, user]);

  const getDateRangeForFilter = (filter: PeriodFilter): Date | null => {
    const now = new Date();
    switch (filter) {
      case 'today': return startOfDay(now);
      case '7days': return subDays(now, 7);
      case '30days': return subDays(now, 30);
      case '3months': return subMonths(now, 3);
      case 'all': return null;
    }
  };

  const fetchFilteredStats = async () => {
    try {
      const startDate = getDateRangeForFilter(periodFilter);
      
      let query = supabase
        .from('orders')
        .select('id, type, total, status, created_at')
        .eq('user_id', user.id);
      
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      
      const { data: ordersData } = await query;
      
      if (ordersData) {
        const totalSales = ordersData.filter(o => o.type === 'venda' && o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0);
        const totalPurchases = ordersData.filter(o => o.type === 'compra' && o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0);
        
        setFilteredStats(prev => ({
          ...prev,
          totalSales,
          totalPurchases,
          totalOrders: ordersData.length
        }));
      }
    } catch (error) {
      console.error('Error fetching filtered stats:', error);
    }
  };

  const handleSaveUserInfo = async () => {
    setSavingInfo(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editedUser.name,
          email: editedUser.email,
          whatsapp: editedUser.whatsapp,
          company: editedUser.company,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Dados atualizados",
        description: "As informações do usuário foram salvas com sucesso."
      });
      
      setIsEditingInfo(false);
      onRefresh?.();
    } catch (error) {
      console.error('Error saving user info:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setSavingInfo(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedUser({
      name: user.name || '',
      email: user.email || '',
      whatsapp: user.whatsapp || '',
      company: user.company || ''
    });
    setIsEditingInfo(false);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch stats and subscriptions (lightweight data)
      const [subscriptionsResult, ordersCountResult, materialsCountResult, customersCountResult] = await Promise.all([
        supabase.from('user_subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('orders').select('id, type, total, status', { count: 'exact', head: false }).eq('user_id', user.id),
        supabase.from('materials').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      ]);

      if (subscriptionsResult.data) {
        setSubscriptionHistory(subscriptionsResult.data);
      }

      // Calculate stats
      if (ordersCountResult.data) {
        const totalSales = ordersCountResult.data.filter(o => o.type === 'venda' && o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0);
        const totalPurchases = ordersCountResult.data.filter(o => o.type === 'compra' && o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0);
        setStats(prev => ({ 
          ...prev, 
          totalSales, 
          totalPurchases, 
          totalOrders: ordersCountResult.data.length,
          totalMaterials: materialsCountResult.count || 0,
          totalCustomers: customersCountResult.count || 0
        }));
        setOrdersPagination(prev => ({ ...prev, total: ordersCountResult.data.length }));
      }

      if (materialsCountResult.count !== null) {
        setMaterialsPagination(prev => ({ ...prev, total: materialsCountResult.count || 0 }));
      }

      if (customersCountResult.count !== null) {
        setCustomersPagination(prev => ({ ...prev, total: customersCountResult.count || 0 }));
      }

    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab: string, page: number, reset: boolean = false) => {
    setLoadingTab(tab);
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      switch (tab) {
        case 'logins':
        case 'ips':
          const { data: logsData, count: logsCount } = await supabase
            .from('admin_access_logs')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(from, to);

          if (logsData) {
            const formattedLogs = logsData.map(log => ({
              ...log,
              ip_address: formatIpAddress(log.ip_address),
            }));
            
            if (reset) {
              setAccessLogs(formattedLogs);
            } else {
              setAccessLogs(prev => [...prev, ...formattedLogs]);
            }
            
            setLogsPagination(prev => ({
              ...prev,
              page,
              total: logsCount || 0,
              hasMore: (from + ITEMS_PER_PAGE) < (logsCount || 0)
            }));

            // Build unique IPs from all loaded logs
            if (tab === 'ips') {
              const allLogs = reset ? formattedLogs : [...accessLogs, ...formattedLogs];
              const ipMap = new Map<string, { country: string; city: string; lastUsed: string; count: number }>();
              allLogs.forEach(log => {
                const ip = log.ip_address;
                if (ip && ip !== 'N/A') {
                  const existing = ipMap.get(ip);
                  if (existing) {
                    existing.count++;
                    if (new Date(log.created_at) > new Date(existing.lastUsed)) {
                      existing.lastUsed = log.created_at;
                    }
                  } else {
                    ipMap.set(ip, {
                      country: log.country || 'Desconhecido',
                      city: log.city || 'Desconhecido',
                      lastUsed: log.created_at,
                      count: 1
                    });
                  }
                }
              });
              setUniqueIPs(Array.from(ipMap.entries()).map(([ip, data]) => ({ ip, ...data })));
              setIpsPagination(prev => ({
                ...prev,
                page,
                total: logsCount || 0,
                hasMore: (from + ITEMS_PER_PAGE) < (logsCount || 0)
              }));
            }
          }
          break;

        case 'sessions':
          const { data: sessionsData, count: sessionsCount } = await supabase
            .from('active_sessions')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('last_activity', { ascending: false })
            .range(from, to);

          if (sessionsData) {
            const formattedSessions = sessionsData.map(session => ({
              ...session,
              ip_address: formatIpAddress(session.ip_address),
            }));
            
            if (reset) {
              setActiveSessions(formattedSessions);
            } else {
              setActiveSessions(prev => [...prev, ...formattedSessions]);
            }
            
            setSessionsPagination(prev => ({
              ...prev,
              page,
              total: sessionsCount || 0,
              hasMore: (from + ITEMS_PER_PAGE) < (sessionsCount || 0)
            }));
          }
          break;

        case 'orders':
          const { data: ordersData, count: ordersCount } = await supabase
            .from('orders')
            .select('id, type, total, status, customer_id, created_at', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(from, to);

          if (ordersData) {
            if (reset) {
              setOrders(ordersData);
            } else {
              setOrders(prev => [...prev, ...ordersData]);
            }
            
            setOrdersPagination(prev => ({
              ...prev,
              page,
              total: ordersCount || 0,
              hasMore: (from + ITEMS_PER_PAGE) < (ordersCount || 0)
            }));
          }
          break;

        case 'materials':
          const { data: materialsData, count: materialsCount } = await supabase
            .from('materials')
            .select('id, name, price, sale_price, unit, created_at', { count: 'exact' })
            .eq('user_id', user.id)
            .order('name')
            .range(from, to);

          if (materialsData) {
            if (reset) {
              setMaterials(materialsData);
            } else {
              setMaterials(prev => [...prev, ...materialsData]);
            }
            
            setMaterialsPagination(prev => ({
              ...prev,
              page,
              total: materialsCount || 0,
              hasMore: (from + ITEMS_PER_PAGE) < (materialsCount || 0)
            }));
          }
          break;

        case 'customers':
          const { data: customersData, count: customersCount } = await supabase
            .from('customers')
            .select('id, name, created_at', { count: 'exact' })
            .eq('user_id', user.id)
            .order('name')
            .range(from, to);

          if (customersData) {
            if (reset) {
              setCustomers(customersData);
            } else {
              setCustomers(prev => [...prev, ...customersData]);
            }
            
            setCustomersPagination(prev => ({
              ...prev,
              page,
              total: customersCount || 0,
              hasMore: (from + ITEMS_PER_PAGE) < (customersCount || 0)
            }));
          }
          break;
      }
    } catch (error) {
      console.error('Error loading tab data:', error);
    } finally {
      setLoadingTab(null);
    }
  };

  const formatIpAddress = (ip: unknown): string => {
    if (!ip) return 'N/A';
    // Handle PostgreSQL inet type - can come as object or string
    if (typeof ip === 'object' && ip !== null) {
      // If it's an object with a value property
      if ('value' in ip) return String((ip as { value: unknown }).value);
      // Try to stringify
      return JSON.stringify(ip);
    }
    return String(ip);
  };

  const handleLoadMore = (tab: string) => {
    const pagination = getPaginationForTab(tab);
    if (pagination.hasMore && loadingTab !== tab) {
      loadTabData(tab, pagination.page + 1, false);
    }
  };

  const getPaginationForTab = (tab: string): PaginationState => {
    switch (tab) {
      case 'logins': return logsPagination;
      case 'ips': return ipsPagination;
      case 'sessions': return sessionsPagination;
      case 'orders': return ordersPagination;
      case 'materials': return materialsPagination;
      case 'customers': return customersPagination;
      default: return { page: 1, pageSize: ITEMS_PER_PAGE, total: 0, hasMore: false };
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase.from('active_sessions').update({ is_active: false }).eq('id', sessionId);
      if (error) throw error;
      toast({ title: "Sessão encerrada", description: "A sessão foi encerrada com sucesso." });
      loadTabData('sessions', 1, true);
    } catch (error) {
      console.error('Error terminating session:', error);
      toast({ title: "Erro", description: "Não foi possível encerrar a sessão.", variant: "destructive" });
    }
  };

  const handleTerminateAllSessions = async () => {
    try {
      const { error } = await supabase.from('active_sessions').update({ is_active: false }).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: "Sessões encerradas", description: "Todas as sessões do usuário foram encerradas." });
      loadTabData('sessions', 1, true);
    } catch (error) {
      console.error('Error terminating sessions:', error);
      toast({ title: "Erro", description: "Não foi possível encerrar as sessões.", variant: "destructive" });
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      case 'desktop': return <Laptop className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trial': return <Badge className="bg-cyan-600 text-white border-0">Teste Grátis</Badge>;
      case 'paid': return <Badge className="bg-emerald-600 text-white border-0">Assinatura Ativa</Badge>;
      case 'expired': return <Badge className="bg-red-600 text-white border-0">Expirado</Badge>;
      default: return <Badge className="bg-gray-600 text-white border-0">Inativo</Badge>;
    }
  };

  const getPlanTypeName = (planType: string) => {
    switch (planType) {
      case 'trial': return 'Teste Grátis';
      case 'monthly': return 'Mensal';
      case 'quarterly': return 'Trimestral';
      case 'annual': return 'Anual';
      default: return planType;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const renderPagination = (tab: string, data: unknown[]) => {
    const pagination = getPaginationForTab(tab);
    const totalPages = Math.ceil(pagination.total / ITEMS_PER_PAGE);
    
    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="text-sm text-muted-foreground">
          Mostrando {data.length} de {pagination.total} registros
        </div>
        <div className="flex items-center gap-2">
          {pagination.hasMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLoadMore(tab)}
              disabled={loadingTab === tab}
              className="bg-muted border-border text-foreground hover:bg-muted/80"
            >
              {loadingTab === tab ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              Carregar Mais
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton 
        className="!fixed !inset-0 !left-0 !top-0 !right-0 !bottom-0 !w-screen !h-screen !max-w-none !max-h-none !translate-x-0 !translate-y-0 !rounded-none bg-card border-0 overflow-hidden flex flex-col p-0"
      >
        <DialogHeader className={`flex flex-row items-center justify-between border-b border-border ${isMobileOrTablet ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center gap-3">
            <div className={`${isMobileOrTablet ? 'w-10 h-10' : 'w-12 h-12'} bg-muted rounded-full flex items-center justify-center`}>
              <User className={`${isMobileOrTablet ? 'h-5 w-5' : 'h-6 w-6'} text-emerald-400`} />
            </div>
            <div>
              <DialogTitle className={`flex items-center gap-2 text-foreground ${isMobileOrTablet ? 'text-sm' : ''}`}>
                {user.name || 'Usuário sem nome'}
                {!isMobileOrTablet && getStatusBadge(user.subscription_status)}
                {!isMobileOrTablet && user.status === 'admin' && (
                  <Badge className="bg-amber-500 text-white border-0">Admin</Badge>
                )}
              </DialogTitle>
              <p className={`text-muted-foreground ${isMobileOrTablet ? 'text-xs' : 'text-sm'}`}>{user.email}</p>
              {isMobileOrTablet && (
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(user.subscription_status)}
                  {user.status === 'admin' && (
                    <Badge className="bg-amber-500 text-white border-0 text-xs">Admin</Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className={`flex-1 overflow-hidden flex flex-col ${isMobileOrTablet ? 'p-2' : 'p-4'}`}>
          {/* Mobile/Tablet: Horizontal scrollable tabs */}
          {isMobileOrTablet ? (
            <ScrollArea className="w-full mb-3">
              <TabsList className="inline-flex h-10 items-center gap-1 bg-muted border border-border rounded-lg p-1 min-w-max">
                <TabsTrigger value="info" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground px-3 text-xs">
                  <User className="h-3 w-3 mr-1" />
                  Info
                </TabsTrigger>
                <TabsTrigger value="subscription" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground px-3 text-xs">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Plano
                </TabsTrigger>
                <TabsTrigger value="orders" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground px-3 text-xs">
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  Pedidos
                </TabsTrigger>
                <TabsTrigger value="materials" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground px-3 text-xs">
                  <Package className="h-3 w-3 mr-1" />
                  Materiais
                </TabsTrigger>
                <TabsTrigger value="customers" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground px-3 text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Clientes
                </TabsTrigger>
                <TabsTrigger value="logins" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground px-3 text-xs">
                  <History className="h-3 w-3 mr-1" />
                  Logins
                </TabsTrigger>
                <TabsTrigger value="ips" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground px-3 text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  IPs
                </TabsTrigger>
                <TabsTrigger value="sessions" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground px-3 text-xs">
                  <Monitor className="h-3 w-3 mr-1" />
                  Sessões
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-muted-foreground px-3 text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  Config
                </TabsTrigger>
                <TabsTrigger value="cleanup" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-muted-foreground px-3 text-xs">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Limpeza
                </TabsTrigger>
              </TabsList>
            </ScrollArea>
          ) : (
            <TabsList className="grid w-full grid-cols-10 bg-muted border border-border rounded-lg p-1 mb-4">
              <TabsTrigger value="info" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground">
                <User className="h-4 w-4 mr-2" />
                Info
              </TabsTrigger>
              <TabsTrigger value="subscription" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground">
                <CreditCard className="h-4 w-4 mr-2" />
                Plano
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Pedidos
              </TabsTrigger>
              <TabsTrigger value="materials" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground">
                <Package className="h-4 w-4 mr-2" />
                Materiais
              </TabsTrigger>
              <TabsTrigger value="customers" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                Clientes
              </TabsTrigger>
              <TabsTrigger value="logins" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground">
                <History className="h-4 w-4 mr-2" />
                Logins
              </TabsTrigger>
              <TabsTrigger value="ips" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground">
                <Globe className="h-4 w-4 mr-2" />
                IPs
              </TabsTrigger>
              <TabsTrigger value="sessions" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground">
                <Monitor className="h-4 w-4 mr-2" />
                Sessões
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-muted-foreground">
                <Settings className="h-4 w-4 mr-2" />
                Config
              </TabsTrigger>
              <TabsTrigger value="cleanup" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-muted-foreground">
                <Trash2 className="h-4 w-4 mr-2" />
                Limpeza
              </TabsTrigger>
            </TabsList>
          )}

          {/* Period Filters - Pill style for native app feel */}
          <div className="mb-3">
            <ScrollArea className="w-full pb-2">
              <div className="flex items-center gap-2 min-w-max px-1">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {[
                  { key: 'today', label: 'Hoje' },
                  { key: '7days', label: '7 dias' },
                  { key: '30days', label: '30 dias' },
                  { key: '3months', label: '3 meses' },
                  { key: 'all', label: 'Tudo' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setPeriodFilter(key as PeriodFilter)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                      "border shadow-sm active:scale-95",
                      periodFilter === key 
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/25" 
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Stats Summary - Native app style grid */}
          <div className={`grid ${isMobileOrTablet ? 'grid-cols-2 gap-2' : 'grid-cols-5 gap-3'} mb-4`}>
            <Card className="bg-emerald-950/30 border-emerald-900/50">
              <CardContent className={`${isMobileOrTablet ? 'p-3' : 'p-3'} flex items-center gap-2`}>
                <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-emerald-400/80 truncate">Vendas {periodFilter !== 'all' && `(${periodFilter === 'today' ? 'hoje' : periodFilter})`}</p>
                  <p className={`${isMobileOrTablet ? 'text-sm' : 'text-base'} font-bold text-emerald-400 truncate`}>
                    {formatCurrency(periodFilter === 'all' ? stats.totalSales : filteredStats.totalSales)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-amber-950/30 border-amber-900/50">
              <CardContent className={`${isMobileOrTablet ? 'p-3' : 'p-3'} flex items-center gap-2`}>
                <div className="w-8 h-8 rounded-full bg-amber-600/20 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="h-4 w-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-amber-400/80 truncate">Compras {periodFilter !== 'all' && `(${periodFilter === 'today' ? 'hoje' : periodFilter})`}</p>
                  <p className={`${isMobileOrTablet ? 'text-sm' : 'text-base'} font-bold text-amber-400 truncate`}>
                    {formatCurrency(periodFilter === 'all' ? stats.totalPurchases : filteredStats.totalPurchases)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-950/30 border-blue-900/50">
              <CardContent className={`${isMobileOrTablet ? 'p-3' : 'p-3'} flex items-center gap-2`}>
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-blue-400/80 truncate">Pedidos {periodFilter !== 'all' && `(${periodFilter === 'today' ? 'hoje' : periodFilter})`}</p>
                  <p className={`${isMobileOrTablet ? 'text-sm' : 'text-base'} font-bold text-blue-400`}>
                    {periodFilter === 'all' ? stats.totalOrders : filteredStats.totalOrders}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-950/30 border-purple-900/50">
              <CardContent className={`${isMobileOrTablet ? 'p-3' : 'p-3'} flex items-center gap-2`}>
                <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-purple-400/80">Materiais</p>
                  <p className={`${isMobileOrTablet ? 'text-sm' : 'text-base'} font-bold text-purple-400`}>{stats.totalMaterials}</p>
                </div>
              </CardContent>
            </Card>
            {!isMobileOrTablet && (
              <Card className="bg-cyan-950/30 border-cyan-900/50">
                <CardContent className="p-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-600/20 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-cyan-400/80">Clientes</p>
                    <p className="text-base font-bold text-cyan-400">{stats.totalCustomers}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <ScrollArea className="flex-1">
            {/* Tab: Informações */}
            <TabsContent value="info" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-muted border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4 text-emerald-400" />
                        Dados Pessoais
                      </span>
                      {!isEditingInfo ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingInfo(true)}
                          className="h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-600/10"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={savingInfo}
                            className="h-7 px-2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveUserInfo}
                            disabled={savingInfo}
                            className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {savingInfo ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Save className="h-3 w-3 mr-1" />
                            )}
                            Salvar
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isEditingInfo ? (
                      <>
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">Nome</Label>
                          <Input
                            value={editedUser.name}
                            onChange={(e) => setEditedUser(prev => ({ ...prev, name: e.target.value }))}
                            className="h-8 bg-card border-border text-sm"
                            placeholder="Nome completo"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">Email</Label>
                          <Input
                            value={editedUser.email}
                            onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                            className="h-8 bg-card border-border text-sm"
                            placeholder="email@exemplo.com"
                            type="email"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">WhatsApp</Label>
                          <Input
                            value={editedUser.whatsapp}
                            onChange={(e) => setEditedUser(prev => ({ ...prev, whatsapp: e.target.value }))}
                            className="h-8 bg-card border-border text-sm"
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">Empresa</Label>
                          <Input
                            value={editedUser.company}
                            onChange={(e) => setEditedUser(prev => ({ ...prev, company: e.target.value }))}
                            className="h-8 bg-card border-border text-sm"
                            placeholder="Nome da empresa"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Nome</span>
                          <span className="font-medium text-foreground">{user.name || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Email</span>
                          <span className="font-medium text-foreground">{user.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">WhatsApp</span>
                          <span className="font-medium text-foreground">{user.whatsapp || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Empresa</span>
                          <span className="font-medium text-foreground">{user.company || 'Não informado'}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-muted border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                      <Activity className="h-4 w-4 text-emerald-400" />
                      Atividade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Cadastro</span>
                      <span className="font-medium text-foreground">
                        {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Último Login</span>
                      <span className="font-medium text-foreground">
                        {user.last_login_at 
                          ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true, locale: ptBR })
                          : 'Nunca'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Status da Conta</span>
                      <Badge className={user.is_active ? "bg-emerald-600 text-white border-0" : "bg-red-600 text-white border-0"}>
                        {user.is_active ? 'Ativa' : 'Desativada'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Tipo</span>
                      <Badge className={user.status === 'admin' ? "bg-amber-600 text-white border-0" : "bg-gray-600 text-white border-0"}>
                        {user.status === 'admin' ? 'Administrador' : 'Usuário'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Assinatura */}
            <TabsContent value="subscription" className="space-y-4 mt-0">
              <Card className="bg-muted border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                    <CreditCard className="h-4 w-4 text-emerald-400" />
                    Plano Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Plano</span>
                    <span className="font-medium text-foreground">{user.plan_display_name || 'Sem plano'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Status</span>
                    {getStatusBadge(user.subscription_status)}
                  </div>
                  {user.expires_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Expira em</span>
                      <span className="font-medium text-foreground">
                        {format(new Date(user.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                        {user.remaining_days !== null && user.remaining_days > 0 && (
                          <span className="text-muted-foreground ml-2">({user.remaining_days} dias)</span>
                        )}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-muted border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                    <History className="h-4 w-4 text-emerald-400" />
                    Histórico de Assinaturas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subscriptionHistory.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Nenhuma assinatura encontrada</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Plano</TableHead>
                          <TableHead className="text-muted-foreground">Status</TableHead>
                          <TableHead className="text-muted-foreground">Ativação</TableHead>
                          <TableHead className="text-muted-foreground">Expiração</TableHead>
                          <TableHead className="text-muted-foreground">Método</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptionHistory.map((sub) => (
                          <TableRow key={sub.id} className="border-border hover:bg-muted/50">
                            <TableCell className="text-foreground">{getPlanTypeName(sub.plan_type)}</TableCell>
                            <TableCell>
                              <Badge className={sub.is_active ? "bg-emerald-600 text-white border-0" : "bg-gray-600 text-white border-0"}>
                                {sub.is_active ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-foreground">{format(new Date(sub.activated_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                            <TableCell className="text-foreground">{format(new Date(sub.expires_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                            <TableCell className="capitalize text-foreground">{sub.activation_method || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Pedidos */}
            <TabsContent value="orders" className="space-y-4 mt-0">
              <Card className="bg-muted border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                    <ShoppingCart className="h-4 w-4 text-emerald-400" />
                    Pedidos ({ordersPagination.total})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingTab === 'orders' && orders.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : orders.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Nenhum pedido encontrado</p>
                  ) : (
                    <>
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                              <TableHead className="text-muted-foreground">Data</TableHead>
                              <TableHead className="text-muted-foreground">Tipo</TableHead>
                              <TableHead className="text-muted-foreground">Cliente</TableHead>
                              <TableHead className="text-muted-foreground">Status</TableHead>
                              <TableHead className="text-muted-foreground text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orders.map((order) => {
                              const customer = customers.find(c => c.id === order.customer_id);
                              return (
                                <TableRow key={order.id} className="border-border hover:bg-muted/50">
                                  <TableCell className="text-foreground text-sm">{format(new Date(order.created_at), "dd/MM HH:mm", { locale: ptBR })}</TableCell>
                                  <TableCell>
                                    <Badge className={order.type === 'venda' ? "bg-emerald-600 text-white border-0" : "bg-amber-600 text-white border-0"}>
                                      {order.type === 'venda' ? 'Venda' : 'Compra'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-foreground">{customer?.name || 'N/A'}</TableCell>
                                  <TableCell>
                                    <Badge className={order.status === 'completed' ? "bg-emerald-600 text-white border-0" : "bg-gray-600 text-white border-0"}>
                                      {order.status === 'completed' ? 'Concluído' : order.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-medium text-foreground">{formatCurrency(order.total || 0)}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                      {renderPagination('orders', orders)}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Materiais */}
            <TabsContent value="materials" className="space-y-4 mt-0">
              <Card className="bg-muted border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                    <Package className="h-4 w-4 text-emerald-400" />
                    Materiais Cadastrados ({materialsPagination.total})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingTab === 'materials' && materials.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : materials.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Nenhum material cadastrado</p>
                  ) : (
                    <>
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                              <TableHead className="text-muted-foreground">Nome</TableHead>
                              <TableHead className="text-muted-foreground">Unidade</TableHead>
                              <TableHead className="text-muted-foreground text-right">Preço Compra</TableHead>
                              <TableHead className="text-muted-foreground text-right">Preço Venda</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {materials.map((material) => (
                              <TableRow key={material.id} className="border-border hover:bg-muted/50">
                                <TableCell className="text-foreground font-medium">{material.name}</TableCell>
                                <TableCell className="text-foreground">{material.unit || 'kg'}</TableCell>
                                <TableCell className="text-right text-amber-400">{formatCurrency(material.price || 0)}</TableCell>
                                <TableCell className="text-right text-emerald-400">{formatCurrency(material.sale_price || 0)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                      {renderPagination('materials', materials)}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Clientes */}
            <TabsContent value="customers" className="space-y-4 mt-0">
              <Card className="bg-muted border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                    <Users className="h-4 w-4 text-emerald-400" />
                    Clientes Cadastrados ({customersPagination.total})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingTab === 'customers' && customers.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : customers.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Nenhum cliente cadastrado</p>
                  ) : (
                    <>
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                              <TableHead className="text-muted-foreground">Nome</TableHead>
                              <TableHead className="text-muted-foreground">Cadastrado em</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customers.map((customer) => (
                              <TableRow key={customer.id} className="border-border hover:bg-muted/50">
                                <TableCell className="text-foreground font-medium">{customer.name}</TableCell>
                                <TableCell className="text-foreground">{format(new Date(customer.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                      {renderPagination('customers', customers)}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Histórico de Login */}
            <TabsContent value="logins" className="space-y-4 mt-0">
              <Card className="bg-muted border-border">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                    <LogIn className="h-4 w-4 text-emerald-400" />
                    Histórico de Logins ({logsPagination.total})
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => loadTabData('logins', 1, true)} disabled={loadingTab === 'logins'} className="bg-muted border-border text-foreground hover:bg-muted/80">
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingTab === 'logins' ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingTab === 'logins' && accessLogs.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : accessLogs.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Nenhum log de acesso encontrado</p>
                  ) : (
                    <>
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                              <TableHead className="text-muted-foreground">Data</TableHead>
                              <TableHead className="text-muted-foreground">Ação</TableHead>
                              <TableHead className="text-muted-foreground">IP</TableHead>
                              <TableHead className="text-muted-foreground">Dispositivo</TableHead>
                              <TableHead className="text-muted-foreground">Local</TableHead>
                              <TableHead className="text-muted-foreground">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {accessLogs.map((log) => (
                              <TableRow key={log.id} className="border-border hover:bg-muted/50">
                                <TableCell className="text-sm text-foreground">{format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}</TableCell>
                                <TableCell className="capitalize text-foreground">{log.action}</TableCell>
                                <TableCell className="font-mono text-xs text-foreground">{log.ip_address}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-foreground">
                                    {getDeviceIcon(log.device_type)}
                                    <span className="text-sm">{log.browser || 'N/A'}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-foreground">{log.city && log.country ? `${log.city}, ${log.country}` : 'Desconhecido'}</TableCell>
                                <TableCell>
                                  {log.success ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                      {renderPagination('logins', accessLogs)}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: IPs Utilizados */}
            <TabsContent value="ips" className="space-y-4 mt-0">
              <Card className="bg-muted border-border">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                    <Globe className="h-4 w-4 text-emerald-400" />
                    IPs Únicos ({uniqueIPs.length})
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => loadTabData('ips', 1, true)}>
                    <RefreshCw className={`h-4 w-4 ${loadingTab === 'ips' ? 'animate-spin' : ''}`} />
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingTab === 'ips' && uniqueIPs.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : uniqueIPs.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Nenhum IP registrado</p>
                  ) : (
                    <>
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                              <TableHead className="text-muted-foreground">IP</TableHead>
                              <TableHead className="text-muted-foreground">Localização</TableHead>
                              <TableHead className="text-muted-foreground">Último Uso</TableHead>
                              <TableHead className="text-muted-foreground">Acessos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {uniqueIPs.map((ip, index) => (
                              <TableRow key={index} className="border-border hover:bg-muted/50">
                                <TableCell className="font-mono text-foreground">{ip.ip}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-foreground">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    {ip.city}, {ip.country}
                                  </div>
                                </TableCell>
                                <TableCell className="text-foreground">{formatDistanceToNow(new Date(ip.lastUsed), { addSuffix: true, locale: ptBR })}</TableCell>
                                <TableCell><Badge className="bg-primary text-primary-foreground border-0">{ip.count}x</Badge></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                      {renderPagination('ips', uniqueIPs)}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Sessões Ativas */}
            <TabsContent value="sessions" className="space-y-4 mt-0">
              <Card className="bg-muted border-border">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                    <Monitor className="h-4 w-4 text-emerald-400" />
                    Sessões Ativas ({sessionsPagination.total})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => loadTabData('sessions', 1, true)}>
                      <RefreshCw className={`h-4 w-4 ${loadingTab === 'sessions' ? 'animate-spin' : ''}`} />
                    </Button>
                    {activeSessions.length > 0 && (
                      <Button variant="destructive" size="sm" onClick={handleTerminateAllSessions} className="bg-red-600 hover:bg-red-700">
                        <Power className="h-4 w-4 mr-2" />
                        Encerrar Todas
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingTab === 'sessions' && activeSessions.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : activeSessions.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Nenhuma sessão ativa</p>
                  ) : (
                    <>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {activeSessions.map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
                              <div className="flex items-center gap-4">
                                <div className="text-emerald-400">{getDeviceIcon(session.device_type)}</div>
                                <div>
                                  <p className="font-medium text-foreground">{session.browser} em {session.os}</p>
                                  <p className="text-sm text-muted-foreground">{session.ip_address} • {session.city}, {session.country}</p>
                                  <p className="text-xs text-muted-foreground">Ativo {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true, locale: ptBR })}</p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => handleTerminateSession(session.id)} className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white">
                                <X className="h-4 w-4 mr-2" />
                                Encerrar
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      {renderPagination('sessions', activeSessions)}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Configurações */}
            <TabsContent value="settings" className="space-y-4 mt-0">
              <UserSettingsTab userId={user.id} userName={user.name || 'Usuário'} />
            </TabsContent>

            {/* Tab: Limpeza de Dados */}
            <TabsContent value="cleanup" className="space-y-4 mt-0">
              <AdminUserDataCleanup userId={user.id} userName={user.name || 'Usuário'} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsExpandedModal;
