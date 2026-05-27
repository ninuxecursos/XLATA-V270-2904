import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FeatureGuard } from '@/components/FeatureGuard';
import { FEATURE_KEYS } from '@/constants/featureAccess';
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, ShoppingCart, DollarSign, Printer, CreditCard, Banknote, RefreshCw, XCircle, Trash2, TrendingDown, PlusCircle } from 'lucide-react';
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { getOrders, getCustomerById, getActiveCashRegister } from '@/utils/supabaseStorage';
import { getOrdersForUser } from '@/utils/adminDataAccess';
import { Order, OrderItem } from '@/types/pdv';
import { useAuth } from '@/hooks/useAuth';
import { useReceiptFormatSettings } from '@/hooks/useReceiptFormatSettings';
import { supabase } from '@/integrations/supabase/client';
import { getRandomMotivationalQuote } from '@/utils/motivationalQuotes';
import PasswordPromptModal from '@/components/PasswordPromptModal';
import TransactionDetailsModal from '@/components/TransactionDetailsModal';
import CancellationModal, { CancellationData } from '@/components/CancellationModal';
import ClearTransactionsModal from '@/components/ClearTransactionsModal';
import ReceiptPrintModal from '@/components/ReceiptPrintModal';
import { Customer } from '@/types/pdv';
import { toast } from '@/hooks/use-toast';
import { StandardFilter, FilterPeriod } from '@/components/StandardFilter';
import { MetricCard } from '@/components/MetricCard';
import { cleanMaterialName } from '@/utils/materialNameCleaner';
import { ReportPrintButton } from '@/components/ReportPrintButton';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfiniteScroll, useScrollLoadMore } from '@/hooks/useInfiniteScroll';
import { AdminViewBanner } from '@/components/admin/AdminViewBanner';

// Unified transaction interface to combine orders and cash_transactions
interface UnifiedTransaction {
  id: string;
  type: 'venda' | 'compra' | 'expense' | 'addition';
  total: number;
  timestamp: number;
  items: OrderItem[];
  description?: string;
  cancelled?: boolean;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  customerId?: string;
  status?: 'open' | 'completed';
  source: 'order' | 'cash_transaction';
}

const Transactions = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<{
    logo: string | null;
    whatsapp1: string;
    whatsapp2: string;
    address: string;
    company: string;
  }>({ logo: null, whatsapp1: "", whatsapp2: "", address: "", company: "" });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [orderToReprint, setOrderToReprint] = useState<Order | null>(null);
  const [reprintCustomer, setReprintCustomer] = useState<Customer | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [orderPayments, setOrderPayments] = useState<{[orderId: string]: any}>({});
  
  const { getCurrentFormat, getCurrentFormatSettings } = useReceiptFormatSettings();
  
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactionType, setTransactionType] = useState('todas');

  const [selectedTransaction, setSelectedTransaction] = useState<Order | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Clear transactions states
  const [showClearPasswordModal, setShowClearPasswordModal] = useState(false);
  const [showClearTransactionsModal, setShowClearTransactionsModal] = useState(false);
  
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  // Admin view state from navigation
  const adminViewingUser = location.state?.adminViewingUser;
  const adminViewingUserName = location.state?.adminViewingUserName;
  const isAdminView = !!adminViewingUser;

  // Refs for virtualization
  const mobileParentRef = useRef<HTMLDivElement>(null);
  const desktopParentRef = useRef<HTMLDivElement>(null);

  const handleExitAdminView = () => {
    navigate(location.pathname + location.search, { replace: true, state: {} });
  };

  const loadSystemSettings = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setSettings({
          logo: data.logo,
          whatsapp1: data.whatsapp1 || "",
          whatsapp2: data.whatsapp2 || "",
          address: data.address || "",
          company: data.company || ""
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const loadOrderPayments = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('order_payments')
        .select('*')
        .eq('user_id', user.id);
      if (data) {
        const paymentsMap = data.reduce((acc, payment) => {
          acc[payment.order_id] = payment;
          return acc;
        }, {});
        setOrderPayments(paymentsMap);
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    }
  };

  const loadData = async (showRefreshLoader = false) => {
    if (showRefreshLoader) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const effectiveUserId = isAdminView && adminViewingUser ? adminViewingUser : user?.id;
      
      // Load orders (compras/vendas)
      let ordersData;
      if (isAdminView && adminViewingUser) {
        ordersData = await getOrdersForUser(adminViewingUser);
      } else {
        ordersData = await getOrders();
      }
      
      // Load cash transactions (expenses/additions)
      const { data: cashTxData } = await supabase
        .from('cash_transactions')
        .select('*')
        .eq('user_id', effectiveUserId)
        .in('type', ['expense', 'addition'])
        .order('created_at', { ascending: false });
      
      await Promise.all([
        loadSystemSettings(),
        loadOrderPayments()
      ]);
      
      // Convert orders to unified format
      const unifiedOrders: UnifiedTransaction[] = ordersData.map(order => ({
        id: order.id,
        type: order.type,
        total: order.total,
        timestamp: order.timestamp,
        items: order.items,
        cancelled: order.cancelled,
        cancelled_at: order.cancelled_at,
        cancelled_by: order.cancelled_by,
        cancellation_reason: order.cancellation_reason,
        customerId: order.customerId,
        status: order.status,
        source: 'order' as const
      }));
      
      // Convert cash transactions to unified format
      const unifiedCashTx: UnifiedTransaction[] = (cashTxData || []).map(tx => ({
        id: tx.id,
        type: tx.type as 'expense' | 'addition',
        total: tx.amount,
        timestamp: new Date(tx.created_at).getTime(),
        items: [],
        description: tx.description || undefined,
        source: 'cash_transaction' as const
      }));
      
      // Combine and sort by timestamp (newest first)
      const allTransactions = [...unifiedOrders, ...unifiedCashTx].sort((a, b) => b.timestamp - a.timestamp);
      
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, isAdminView, adminViewingUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [user, isAdminView, adminViewingUser]);

  const handleRefresh = () => {
    loadData(true);
  };

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let filterStart: Date;
    let filterEnd: Date = new Date(now);
    filterEnd.setHours(23, 59, 59, 999);

    if (selectedPeriod === 'custom' && startDate && endDate) {
      filterStart = new Date(startDate + 'T00:00:00');
      filterEnd = new Date(endDate + 'T23:59:59');
    } else {
      switch (selectedPeriod) {
        case 'daily':
          filterStart = new Date(now);
          filterStart.setHours(0, 0, 0, 0);
          filterEnd = new Date(now);
          filterEnd.setHours(23, 59, 59, 999);
          break;
        case 'last30':
          filterStart = new Date(now);
          filterStart.setDate(now.getDate() - 30);
          filterStart.setHours(0, 0, 0, 0);
          break;
        case 'last60':
          filterStart = new Date(now);
          filterStart.setDate(now.getDate() - 60);
          filterStart.setHours(0, 0, 0, 0);
          break;
        case 'last90':
          filterStart = new Date(now);
          filterStart.setDate(now.getDate() - 90);
          filterStart.setHours(0, 0, 0, 0);
          break;
        case 'last365':
          filterStart = new Date(now);
          filterStart.setDate(now.getDate() - 365);
          filterStart.setHours(0, 0, 0, 0);
          break;
        default:
          filterStart = new Date(now);
          filterStart.setHours(0, 0, 0, 0);
          filterEnd = new Date(now);
          filterEnd.setHours(23, 59, 59, 999);
      }
    }

    return transactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      const isInDateRange = txDate >= filterStart && txDate <= filterEnd;
      
      // For orders, check if completed
      if (tx.source === 'order' && tx.status !== 'completed') return false;
      if (!isInDateRange) return false;
      
      // Filter by type
      if (transactionType === 'vendas' && tx.type !== 'venda') return false;
      if (transactionType === 'compras' && tx.type !== 'compra') return false;
      if (transactionType === 'despesas' && tx.type !== 'expense') return false;
      if (transactionType === 'adicoes' && tx.type !== 'addition') return false;
      
      return true;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, selectedPeriod, startDate, endDate, transactionType]);

  // Infinite scroll - exibe 20 itens por vez
  const { visibleItems, loadMore, hasMore, loadedCount, totalCount } = useInfiniteScroll({
    items: filteredTransactions,
    pageSize: 20
  });

  // Virtualizers - agora usam visibleItems
  const mobileVirtualizer = useVirtualizer({
    count: visibleItems.length,
    getScrollElement: () => mobileParentRef.current,
    estimateSize: () => 56,
    overscan: 5,
  });

  const desktopVirtualizer = useVirtualizer({
    count: visibleItems.length,
    getScrollElement: () => desktopParentRef.current,
    estimateSize: () => 52,
    overscan: 5,
  });

  // Scroll load more triggers
  useScrollLoadMore(mobileParentRef, loadMore, hasMore);
  useScrollLoadMore(desktopParentRef, loadMore, hasMore);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'compra': return 'text-blue-400';
      case 'venda': return 'text-emerald-400';
      case 'expense': return 'text-rose-400';
      case 'addition': return 'text-cyan-400';
      default: return 'text-slate-400';
    }
  };

  const getTypeLabel = (type: string, short = false) => {
    switch (type) {
      case 'compra': return short ? 'C' : 'Compra';
      case 'venda': return short ? 'V' : 'Venda';
      case 'expense': return short ? 'D' : 'Despesa';
      case 'addition': return short ? 'A' : 'Adição';
      default: return type;
    }
  };

  const getPaymentMethodIcon = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'pix':
      case 'debito':
      case 'credito':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  const getPaymentMethodText = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'pix': return 'PIX';
      case 'dinheiro': return 'Dinheiro';
      case 'debito': return 'Débito';
      case 'credito': return 'Crédito';
      default: return 'Dinheiro';
    }
  };

  const totalTransactions = filteredTransactions.filter(t => !t.cancelled).length;
  const cancelledTransactions = filteredTransactions.filter(t => t.cancelled).length;
  const totalSales = filteredTransactions.filter(t => t.type === 'venda' && !t.cancelled).reduce((sum, t) => sum + t.total, 0);
  const totalPurchases = filteredTransactions.filter(t => t.type === 'compra' && !t.cancelled).reduce((sum, t) => sum + t.total, 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.total, 0);
  const totalAdditions = filteredTransactions.filter(t => t.type === 'addition').reduce((sum, t) => sum + t.total, 0);

  const handleReprintClick = (transaction: UnifiedTransaction) => {
    // Only allow reprint for orders
    if (transaction.source !== 'order') {
      toast({ title: "Ação indisponível", description: "Reimprimir só está disponível para compras e vendas.", variant: "destructive" });
      return;
    }
    setOrderToReprint(transaction as unknown as Order);
    setShowPasswordModal(true);
  };

  const handlePasswordAuthenticated = () => {
    if (orderToReprint) {
      handleReprint(orderToReprint);
    }
  };

  const handleTransactionClick = (transaction: UnifiedTransaction) => {
    // Only open details for orders
    if (transaction.source !== 'order') {
      // For cash transactions, just show a toast with the description
      toast({ 
        title: transaction.type === 'expense' ? 'Despesa' : 'Adição de Caixa',
        description: transaction.description || 'Sem descrição'
      });
      return;
    }
    setSelectedTransaction(transaction as unknown as Order);
    setShowTransactionDetails(true);
  };

  const handleCancelClick = (transaction: UnifiedTransaction) => {
    // Only allow cancel for orders
    if (transaction.source !== 'order') {
      toast({ title: "Ação indisponível", description: "Cancelar só está disponível para compras e vendas.", variant: "destructive" });
      return;
    }
    setOrderToCancel(transaction as unknown as Order);
    setShowCancellationModal(true);
  };

  const handleCancelOrder = async (cancellationData: CancellationData) => {
    if (!orderToCancel || !user?.id) return;
    setIsCancelling(true);
    try {
      // Use effective user ID for admin view mode
      const effectiveUserId = isAdminView && adminViewingUser ? adminViewingUser : user.id;
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          cancelled: true,
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: cancellationData.reason
        })
        .eq('id', orderToCancel.id)
        .eq('user_id', effectiveUserId);

      if (updateError) throw updateError;

      // SEMPRE reverter o impacto no caixa automaticamente
      const activeCashRegister = await getActiveCashRegister();
      if (activeCashRegister && activeCashRegister.status === 'open') {
        // Registrar transação de estorno automático
        const { error: refundError } = await supabase
          .from('cash_transactions')
          .insert({
            user_id: effectiveUserId,
            cash_register_id: activeCashRegister.id,
            type: 'refund',
            amount: orderToCancel.total,
            description: `Estorno automático - Cancelamento de ${orderToCancel.type === 'venda' ? 'Venda' : 'Compra'}`,
            order_id: orderToCancel.id
          });

        if (refundError) {
          console.error('Erro ao registrar estorno automático:', refundError);
        }

        // Reverter: compra cancelada = saldo volta, venda cancelada = saldo sai
        const adjustment = orderToCancel.type === 'compra' 
          ? orderToCancel.total 
          : -orderToCancel.total;
        
        await supabase
          .from('cash_registers')
          .update({ 
            current_amount: activeCashRegister.currentAmount + adjustment 
          })
          .eq('id', activeCashRegister.id)
          .eq('user_id', user.id);
      }

      toast({ 
        title: "Transação cancelada", 
        description: `${orderToCancel.type === 'venda' ? 'Venda' : 'Compra'} cancelada com sucesso.${cancellationData.hasRefund ? ` Estorno de R$ ${cancellationData.refundAmount.toFixed(2)} registrado.` : ''}` 
      });
      
      loadData();
      setShowCancellationModal(false);
      setOrderToCancel(null);
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      toast({ title: "Erro", description: "Erro ao cancelar transação.", variant: "destructive" });
    } finally {
      setIsCancelling(false);
    }
  };

  const clearFilters = () => {
    setSelectedPeriod('daily');
    setStartDate('');
    setEndDate('');
    setTransactionType('todas');
  };

  const handleReprint = async (order: Order) => {
    try {
      let customer = order.customerId ? await getCustomerById(order.customerId) : null;
      if (!customer) {
        // Fallback placeholder customer to allow receipt rendering
        customer = {
          id: order.customerId || 'unknown',
          name: 'Cliente não identificado',
          phone: '',
          document: '',
          address: '',
        } as unknown as Customer;
      }
      setReprintCustomer(customer);
      setOrderToReprint(order);
      setShowReceiptModal(true);
    } catch (error) {
      console.error('Erro ao reimprimir:', error);
      toast({ title: 'Erro', description: 'Não foi possível abrir o comprovante.', variant: 'destructive' });
    }
  };

  const formatPeso = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0,000';
    return num.toFixed(3).replace('.', ',');
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-800">
        <header className="bg-slate-900 text-white p-3 border-b border-slate-700">
          <h1 className="text-lg md:text-xl font-bold">Transações</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-white text-lg">Carregando...</div>
        </main>
      </div>
    );
  }

  return (
    <FeatureGuard feature={FEATURE_KEYS.BASIC_HISTORY}>
    <div className="flex flex-col min-h-screen bg-slate-800">
      <header className="bg-slate-900 text-white p-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline text-sm">Voltar</span>
            </Link>
            <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              Transações
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ReportPrintButton
              reportTitle="Relatório de Transações"
              period={{ label: selectedPeriod === 'daily' ? 'Hoje' : selectedPeriod === 'custom' ? `${startDate} a ${endDate}` : `Últimos ${selectedPeriod.replace('last', '')} dias` }}
              metrics={[
                { label: 'Total Transações', value: totalTransactions },
                { label: 'Total Vendas', value: formatCurrency(totalSales), color: '#10B981' },
                { label: 'Total Compras', value: formatCurrency(totalPurchases), color: '#3B82F6' },
                { label: 'Total Despesas', value: formatCurrency(totalExpenses), color: '#F43F5E' },
                { label: 'Total Adições', value: formatCurrency(totalAdditions), color: '#06B6D4' },
                { label: 'Cancelados', value: cancelledTransactions, color: '#EF4444' }
              ]}
            />
            <ContextualHelpButton module="transacoes" />
            {!isAdminView && (
              <Button
                onClick={() => setShowClearPasswordModal(true)}
                variant="outline"
                size="sm"
                className="bg-red-900/30 border-red-600 text-red-400 hover:bg-red-900/50 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Zerar</span>
              </Button>
            )}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* Admin View Banner */}
        {isAdminView && (
          <div className="mt-3">
            <AdminViewBanner 
              adminViewingUserName={adminViewingUserName}
              onExit={handleExitAdminView}
            />
          </div>
        )}
      </header>

      <main className="flex-1 p-2 md:p-4 overflow-auto">
        {/* Filtro Padronizado com Tipo de Transação */}
        <StandardFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onClear={clearFilters}
          extraFilters={
            <div className="flex items-center gap-1.5">
              {/* Tipo - Select compacto */}
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger className="h-8 px-2 text-xs bg-slate-800 border-slate-600 text-white w-auto min-w-[65px] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="todas" className="text-white text-xs">Todas</SelectItem>
                  <SelectItem value="vendas" className="text-white text-xs">Vendas</SelectItem>
                  <SelectItem value="compras" className="text-white text-xs">Compras</SelectItem>
                  <SelectItem value="despesas" className="text-white text-xs">Despesas</SelectItem>
                  <SelectItem value="adicoes" className="text-white text-xs">Adições</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />

        {/* Resumo - Cards Compactos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-3">
          <MetricCard
            icon={FileText}
            iconColor="text-purple-500"
            label="Transações"
            value={totalTransactions}
            compact
          />
          <MetricCard
            icon={DollarSign}
            iconColor="text-emerald-500"
            label="Vendas"
            value={formatCurrency(totalSales)}
            compact
          />
          <MetricCard
            icon={ShoppingCart}
            iconColor="text-blue-500"
            label="Compras"
            value={formatCurrency(totalPurchases)}
            compact
          />
          <MetricCard
            icon={TrendingDown}
            iconColor="text-rose-500"
            label="Despesas"
            value={formatCurrency(totalExpenses)}
            compact
          />
          <MetricCard
            icon={PlusCircle}
            iconColor="text-cyan-500"
            label="Adições"
            value={formatCurrency(totalAdditions)}
            compact
          />
        </div>

        {/* Lista de Transações */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="p-2">
            <CardTitle className="text-white text-sm md:text-base">
              Transações <span className="text-slate-400 text-xs font-normal">({filteredTransactions.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-1.5 md:p-3">
            {filteredTransactions.length > 0 ? (
              <>
                {/* Mobile View - Virtualized Cards */}
                <div 
                  ref={mobileParentRef}
                  className="md:hidden overflow-auto"
                  style={{ height: 'calc(100vh - 320px)', minHeight: '300px' }}
                >
                  <div
                    style={{
                      height: `${mobileVirtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {mobileVirtualizer.getVirtualItems().map((virtualRow) => {
                      const transaction = visibleItems[virtualRow.index];
                      return (
                        <div
                          key={transaction.id}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <Card 
                            className={`bg-slate-800 cursor-pointer mx-0.5 ${transaction.cancelled ? 'border-red-600/50 opacity-60' : 'border-slate-600'}`}
                            onClick={() => handleTransactionClick(transaction)}
                          >
                            <CardContent className="p-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`text-xs font-medium ${transaction.cancelled ? 'line-through text-slate-400' : getTypeColor(transaction.type)}`}>
                                    {getTypeLabel(transaction.type, true)}
                                  </span>
                                  <div className="min-w-0">
                                    <span className={`text-xs font-bold ${transaction.cancelled ? 'text-slate-400 line-through' : 'text-white'}`}>
                                      {formatCurrency(transaction.total)}
                                    </span>
                                    {transaction.cancelled && (
                                      <Badge variant="destructive" className="ml-1 text-[8px] px-1 py-0 h-3">X</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-400">{formatDate(transaction.timestamp)} {formatTime(transaction.timestamp)}</span>
                                  {transaction.source === 'order' && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReprintClick(transaction);
                                        }}
                                        className="h-6 w-6 p-0 text-slate-400 hover:text-emerald-400"
                                      >
                                        <Printer className="h-3 w-3" />
                                      </Button>
                                      {!transaction.cancelled && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCancelClick(transaction);
                                          }}
                                          className="h-6 w-6 p-0 text-slate-400 hover:text-rose-400"
                                        >
                                          <XCircle className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop View - Virtualized Div Table */}
                <div 
                  ref={desktopParentRef}
                  className="hidden md:block overflow-auto"
                  style={{ height: 'calc(100vh - 340px)', minHeight: '400px' }}
                >
                  {/* Header Row - Div based */}
                  <div className="sticky top-0 bg-slate-700 z-10 flex items-center border-b border-slate-600 text-slate-300 text-xs font-medium">
                    <div className="p-2 w-[120px]">Data/Hora</div>
                    <div className="p-2 w-[100px]">Tipo</div>
                    <div className="p-2 flex-1">Descrição</div>
                    <div className="p-2 w-[100px]">Pagamento</div>
                    <div className="p-2 w-[100px] text-right">Total</div>
                    <div className="p-2 w-[80px] text-center">Ações</div>
                  </div>
                  
                  {/* Virtual Rows */}
                  <div
                    style={{
                      height: `${desktopVirtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {desktopVirtualizer.getVirtualItems().map((virtualRow) => {
                      const transaction = visibleItems[virtualRow.index];
                      return (
                        <div
                          key={transaction.id}
                          className="absolute left-0 w-full flex items-center border-b border-slate-600 hover:bg-slate-600/30 cursor-pointer"
                          style={{
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                          onClick={() => handleTransactionClick(transaction)}
                        >
                          <div className="text-slate-300 text-sm p-2 w-[120px]">
                            <div>{formatDate(transaction.timestamp)}</div>
                            <div className="text-xs text-slate-500">{formatTime(transaction.timestamp)}</div>
                          </div>
                          <div className="text-sm p-2 w-[100px]">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${transaction.cancelled ? 'line-through text-slate-400' : getTypeColor(transaction.type)}`}>
                                {getTypeLabel(transaction.type)}
                              </span>
                              {transaction.cancelled && (
                                <Badge variant="destructive" className="text-xs">X</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-slate-300 text-sm p-2 flex-1 truncate">
                            {transaction.source === 'order' 
                              ? `${transaction.items.length} item(s)` 
                              : (transaction.description || '-')
                            }
                          </div>
                          <div className="text-slate-300 text-sm p-2 w-[100px]">
                            {transaction.source === 'order' ? (
                              <div className="flex items-center gap-1">
                                {getPaymentMethodIcon(orderPayments[transaction.id]?.payment_method || 'dinheiro')}
                                <span className="text-xs">{getPaymentMethodText(orderPayments[transaction.id]?.payment_method || 'dinheiro')}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </div>
                          <div className={`font-semibold text-sm p-2 w-[100px] text-right ${transaction.cancelled ? 'text-slate-400 line-through' : 'text-white'}`}>
                            {formatCurrency(transaction.total)}
                          </div>
                          <div className="p-2 w-[80px]">
                            <div className="flex items-center justify-center gap-1">
                              {transaction.source === 'order' ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReprintClick(transaction);
                                    }}
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-400"
                                  >
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                  {!transaction.cancelled && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancelClick(transaction);
                                      }}
                                      className="h-7 w-7 p-0 text-slate-400 hover:text-rose-400"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <span className="text-slate-500 text-xs">-</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Count indicator */}
                <div className="text-sm text-slate-400 text-center mt-3">
                  Exibindo {loadedCount} de {totalCount} transações
                  {hasMore && <span className="text-emerald-400 ml-2">(Role para carregar mais)</span>}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-500" />
                <h3 className="text-white font-semibold mb-1">Nenhuma transação encontrada</h3>
                <p className="text-slate-400 text-sm">
                  As transações registradas no PDV aparecerão aqui.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <PasswordPromptModal
        open={showPasswordModal}
        onOpenChange={(open) => {
          setShowPasswordModal(open);
          if (!open) setOrderToReprint(null);
        }}
        onAuthenticated={handlePasswordAuthenticated}
        title="Reimprimir Comprovante"
        description="Digite a senha para reimprimir este comprovante."
      />

      <TransactionDetailsModal
        isOpen={showTransactionDetails}
        onClose={() => {
          setShowTransactionDetails(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onReprint={(order) => {
          setShowTransactionDetails(false);
          handleReprintClick({ ...order, source: 'order' } as unknown as UnifiedTransaction);
        }}
        onDelete={(order) => {
          setShowTransactionDetails(false);
          handleCancelClick({ ...order, source: 'order' } as unknown as UnifiedTransaction);
        }}
      />

      {/* Cancellation Modal */}
      <CancellationModal
        isOpen={showCancellationModal}
        onClose={() => {
          setShowCancellationModal(false);
          setOrderToCancel(null);
        }}
        onConfirm={handleCancelOrder}
        order={orderToCancel}
        isLoading={isCancelling}
      />

      {/* Clear Transactions Password Modal */}
      <PasswordPromptModal
        open={showClearPasswordModal}
        onOpenChange={setShowClearPasswordModal}
        title="Zerar Transações"
        description="Digite a senha para confirmar a limpeza das transações."
        onAuthenticated={() => {
          setShowClearPasswordModal(false);
          setShowClearTransactionsModal(true);
        }}
      />

      {/* Clear Transactions Modal */}
      <ClearTransactionsModal
        open={showClearTransactionsModal}
        onOpenChange={setShowClearTransactionsModal}
        onTransactionsCleared={() => loadData()}
      />

      {/* Receipt reprint modal (canonical PDV layout) */}
      <ReceiptPrintModal
        open={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setReprintCustomer(null);
          setOrderToReprint(null);
        }}
        customer={reprintCustomer}
        order={orderToReprint}
        formatPeso={formatPeso}
        isSaleMode={orderToReprint?.type === 'venda'}
      />
    </div>
    </FeatureGuard>
  );
};

export default Transactions;
