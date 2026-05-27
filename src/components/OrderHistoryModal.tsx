import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Clock, Package, DollarSign, Eye, Calendar, XCircle, AlertTriangle, X, Filter, ChevronDown, Printer } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";
import { Order, Customer } from '../types/pdv';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/utils/logger';
import PasswordPromptModal from '@/components/PasswordPromptModal';
import TransactionDetailsModal from '@/components/TransactionDetailsModal';
import CancellationModal, { CancellationData } from '@/components/CancellationModal';
import { cleanMaterialName } from '@/utils/materialNameCleaner';
import { useReceiptFormatSettings } from '@/hooks/useReceiptFormatSettings';
import { getCustomerById, getActiveCashRegister } from '@/utils/supabaseStorage';
import ReceiptPrintModal from '@/components/ReceiptPrintModal';
const logger = createLogger('[OrderHistory]');
interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}
interface HistoryOrder extends Order {
  customerName: string;
  formattedDate: string;
  formattedTime: string;
}
const ITEMS_PER_PAGE = 20;
const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose
}) => {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'completed'>('all');
  const [filterType, setFilterType] = useState<'all' | 'compra' | 'venda'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDeleteEmptyConfirm, setShowDeleteEmptyConfirm] = useState(false);
  const [showDeleteAllOpenConfirm, setShowDeleteAllOpenConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [reprintCustomer, setReprintCustomer] = useState<Customer | null>(null);
  const [reprintOrder, setReprintOrder] = useState<Order | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [settings, setSettings] = useState<{
    logo: string | null;
    whatsapp1: string;
    whatsapp2: string;
    address: string;
    company: string;
  }>({
    logo: null,
    whatsapp1: "",
    whatsapp2: "",
    address: "",
    company: ""
  });
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const {
    getCurrentFormatSettings
  } = useReceiptFormatSettings();

  // Carregar histórico de pedidos
  const loadOrderHistory = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // CRITICAL: PostgREST applies the 1000-row limit to embedded relations,
      // which caused "0 itens" to show on the history list. We now fetch orders
      // and items separately, both with infinite pagination via .range().
      const batchSize = 1000;

      // 1) Fetch ALL orders (paginated) without embedding order_items
      const allOrders: any[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, customer_id, total, created_at, status, type,
            cancelled, cancelled_at, cancelled_by, cancellation_reason,
            customers ( id, name )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(from, from + batchSize - 1);

        if (error) {
          logger.error('Error loading orders:', error);
          break;
        }
        if (!data || data.length === 0) break;
        allOrders.push(...data);
        if (data.length < batchSize) break;
        from += batchSize;
      }

      // 2) Fetch ALL order_items in chunks for those orders, then group by order_id
      const itemsByOrder = new Map<string, any[]>();
      const orderIds = allOrders.map(o => o.id);
      const chunkSize = 200; // safe IN(...) chunk
      for (let i = 0; i < orderIds.length; i += chunkSize) {
        const chunk = orderIds.slice(i, i + chunkSize);
        // Use .range() inside each chunk too, in case a chunk has > 1000 items
        let chunkFrom = 0;
        while (true) {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('order_id, material_id, material_name, quantity, price, total, tara')
            .in('order_id', chunk)
            .range(chunkFrom, chunkFrom + batchSize - 1);
          if (itemsError) {
            logger.error('Error loading order items:', itemsError);
            break;
          }
          if (!itemsData || itemsData.length === 0) break;
          for (const it of itemsData) {
            const arr = itemsByOrder.get(it.order_id) || [];
            arr.push(it);
            itemsByOrder.set(it.order_id, arr);
          }
          if (itemsData.length < batchSize) break;
          chunkFrom += batchSize;
        }
      }

      // 3) Build the formatted orders
      const formattedOrders: HistoryOrder[] = allOrders
        .filter(order => {
          // Esconder pedidos virtuais de entrada de estoque (auto-cadastro avulso)
          const cName = order.customers?.name || '';
          return cName !== '__auto_stock_entry__' && cName !== 'Auto-cadastro Avulso';
        })
        .map(order => {
        const orderDate = new Date(order.created_at);
        const items = (itemsByOrder.get(order.id) || []).map(item => ({
          materialId: item.material_id,
          materialName: cleanMaterialName(item.material_name),
          quantity: Number(item.quantity),
          price: Number(item.price),
          total: Number(item.total),
          tara: item.tara ? Number(item.tara) : undefined
        }));
        // Recompute total from items when divergent (defensive against legacy bad data)
        const itemsSum = items.reduce((s, i) => s + (Number(i.total) || 0), 0);
        const safeTotal = items.length > 0 && Math.abs((Number(order.total) || 0) - itemsSum) > 0.01
          ? itemsSum
          : Number(order.total) || 0;
        return {
          id: order.id,
          customerId: order.customer_id,
          customerName: order.customers?.name || 'Cliente Removido',
          items,
          total: safeTotal,
          timestamp: orderDate.getTime(),
          formattedDate: orderDate.toLocaleDateString('pt-BR'),
          formattedTime: orderDate.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: order.status as 'open' | 'completed',
          type: order.type as 'compra' | 'venda',
          cancelled: order.cancelled || false,
          cancelled_at: order.cancelled_at,
          cancelled_by: order.cancelled_by,
          cancellation_reason: order.cancellation_reason
        };
      });

      // Buscar pedidos salvos localmente que podem não estar no Supabase
      const localOrders = getLocalOrderHistory();

      // Combinar e remover duplicatas
      const allMerged = [...formattedOrders];
      localOrders.forEach(localOrder => {
        const exists = formattedOrders.some(o => o.id === localOrder.id);
        if (!exists) {
          allMerged.push(localOrder);
        }
      });

      // Ordenar por timestamp
      allMerged.sort((a, b) => b.timestamp - a.timestamp);
      setOrders(allMerged);
    } catch (error) {
      logger.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para obter pedidos salvos localmente
  const getLocalOrderHistory = (): HistoryOrder[] => {
    try {
      const localHistory = localStorage.getItem(`order_history_${user?.id}`);
      if (!localHistory) return [];
      const parsedHistory = JSON.parse(localHistory);
      return parsedHistory.map((order: any) => ({
        ...order,
        formattedDate: new Date(order.timestamp).toLocaleDateString('pt-BR'),
        formattedTime: new Date(order.timestamp).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
    } catch (error) {
      logger.error('Error loading local history:', error);
      return [];
    }
  };

  // Filtrar pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const statusMatch = filterStatus === 'all' || order.status === filterStatus;
      const typeMatch = filterType === 'all' || order.type === filterType;

      // Filtro de período - usa fuso horário LOCAL para evitar erro de UTC
      // (pedidos após ~21h estavam caindo no dia seguinte em UTC e sumindo do filtro)
      let dateMatch = true;
      if (startDate || endDate) {
        const orderDate = new Date(order.timestamp);
        // YYYY-MM-DD na timezone local do navegador
        const y = orderDate.getFullYear();
        const m = String(orderDate.getMonth() + 1).padStart(2, '0');
        const d = String(orderDate.getDate()).padStart(2, '0');
        const orderDateString = `${y}-${m}-${d}`;

        if (startDate) {
          dateMatch = dateMatch && orderDateString >= startDate;
        }
        if (endDate) {
          dateMatch = dateMatch && orderDateString <= endDate;
        }
      }
      return statusMatch && typeMatch && dateMatch;
    });
  }, [orders, filterStatus, filterType, startDate, endDate]);

  // Paginação
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Carregar configurações do sistema
  const loadSystemSettings = async () => {
    if (!user?.id) return;
    try {
      const {
        data
      } = await supabase.from('system_settings').select('*').eq('user_id', user.id).maybeSingle();
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
      logger.error('Erro ao carregar configurações:', error);
    }
  };

  // Carregar dados quando modal abrir
  useEffect(() => {
    if (isOpen) {
      loadOrderHistory();
      loadSystemSettings();
      setCurrentPage(1);
    }
  }, [isOpen, user?.id]);

  // Reset da página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterType, startDate, endDate]);

  // Função para ver detalhes do pedido
  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowPasswordModal(true);
  };

  // Função chamada após autenticação bem-sucedida
  const handlePasswordAuthenticated = () => {
    setShowPasswordModal(false);
    // Find the order and open the details modal
    const order = orders.find(o => o.id === selectedOrderId);
    if (order) {
      setSelectedOrderForDetails(order);
      setShowDetailsModal(true);
    }
    setSelectedOrderId(null);
  };

  // Função para reimprimir pedido
  const handleReprintOrder = async (order: Order) => {
    try {
      let customer = order.customerId ? await getCustomerById(order.customerId) : null;
      if (!customer) {
        customer = {
          id: order.customerId || 'unknown',
          name: 'Cliente não identificado',
          phone: '',
          document: '',
          address: '',
        } as unknown as Customer;
      }
      setReprintCustomer(customer);
      setReprintOrder(order);
      setShowReceiptModal(true);
      setShowDetailsModal(false);
      setSelectedOrderForDetails(null);
    } catch (error) {
      logger.error('Erro ao reimprimir:', error);
      toast({
        title: "Erro",
        description: "Erro ao reimprimir comprovante.",
        variant: "destructive"
      });
    }
  };

  const formatPesoReprint = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0,000';
    return num.toFixed(3).replace('.', ',');
  };

  // Função para iniciar cancelamento de pedido individual
  const handleCancelClick = (order: Order) => {
    setOrderToCancel(order);
    setShowCancellationModal(true);
  };

  // Função para cancelar pedido individual (cancelamento lógico)
  const handleCancelOrder = async (cancellationData: CancellationData) => {
    if (!orderToCancel || !user?.id) return;
    setDeleting(true);
    try {
      // 1. Marcar o pedido como cancelado (cancelamento lógico)
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          cancelled: true,
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: cancellationData.reason
        })
        .eq('id', orderToCancel.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // 2. SEMPRE reverter o impacto no caixa automaticamente
      const activeCashRegister = await getActiveCashRegister();
      if (activeCashRegister && activeCashRegister.status === 'open') {
        // Registrar transação de estorno automático
        const { error: refundError } = await supabase
          .from('cash_transactions')
          .insert({
            user_id: user.id,
            cash_register_id: activeCashRegister.id,
            type: 'refund',
            amount: orderToCancel.total,
            description: `Estorno automático - Cancelamento de ${orderToCancel.type === 'venda' ? 'Venda' : 'Compra'}`,
            order_id: orderToCancel.id
          });

        if (refundError) {
          logger.error('Erro ao registrar estorno automático:', refundError);
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
        description: `${orderToCancel.type === 'venda' ? 'Venda' : 'Compra'} cancelada com sucesso.`
      });

      // Fechar modais e recarregar dados
      setShowDetailsModal(false);
      setSelectedOrderForDetails(null);
      setShowCancellationModal(false);
      setOrderToCancel(null);
      await loadOrderHistory();
    } catch (error) {
      logger.error('Erro ao cancelar pedido:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar pedido.",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  // Função para excluir pedidos em aberto sem itens
  const handleDeleteEmptyOpenOrders = async () => {
    if (!user?.id || deleting) return;
    logger.debug('Starting empty orders cleanup...');
    setDeleting(true);
    try {
      // Buscar todos os pedidos em aberto do usuário atual
      const {
        data: openOrders,
        error: findError
      } = await supabase.from('orders').select('id, customer_id').eq('user_id', user.id).eq('status', 'open');
      if (findError) {
        logger.error('Error fetching open orders:', findError);
        toast({
          title: "Erro",
          description: "Erro ao buscar pedidos em aberto. Tente novamente.",
          variant: "destructive"
        });
        return;
      }
      logger.debug(`Found ${openOrders?.length || 0} open orders`);

      // Filtrar pedidos realmente vazios (sem itens)
      const emptyOrderIds: string[] = [];
      const customerIdsToCheck: string[] = [];
      if (openOrders && openOrders.length > 0) {
        for (const order of openOrders) {
          // Checking order (removed verbose logging)

          const {
            data: items,
            error: itemsError
          } = await supabase.from('order_items').select('id').eq('order_id', order.id).eq('user_id', user.id); // Adicionar filtro por usuário para segurança

          if (itemsError) {
            logger.error(`Error fetching items for order ${order.id}:`, itemsError);
            continue;
          }
          if (!items || items.length === 0) {
            emptyOrderIds.push(order.id);
            customerIdsToCheck.push(order.customer_id);
          }
        }
      }
      logger.debug(`Total empty orders found: ${emptyOrderIds.length}`);
      if (emptyOrderIds.length === 0) {
        toast({
          title: "Informação",
          description: "Nenhum pedido em aberto vazio encontrado.",
          variant: "default"
        });
        return;
      }

      // Excluir os pedidos vazios
      logger.debug('Deleting empty orders...');
      const {
        error: deleteError
      } = await supabase.from('orders').delete().in('id', emptyOrderIds).eq('user_id', user.id);
      if (deleteError) {
        logger.error('Error deleting empty orders:', deleteError);
        alert('Erro ao excluir pedidos vazios. Tente novamente.');
        return;
      }
      logger.success('Empty orders deleted successfully');

      // Verificar e remover clientes que ficaram sem pedidos
      const uniqueCustomerIds = [...new Set(customerIdsToCheck)];
      logger.debug(`Checking ${uniqueCustomerIds.length} customers for removal...`);
      for (const customerId of uniqueCustomerIds) {
        const {
          data: remainingOrders
        } = await supabase.from('orders').select('id').eq('customer_id', customerId).eq('user_id', user.id);
        if (!remainingOrders || remainingOrders.length === 0) {
          logger.debug(`Removing orphan customer: ${customerId}`);
          await supabase.from('customers').delete().eq('id', customerId).eq('user_id', user.id);
        }
      }

      // Limpar também do localStorage
      try {
        const historyKey = `order_history_${user.id}`;
        const existingHistory = localStorage.getItem(historyKey);
        if (existingHistory) {
          const history = JSON.parse(existingHistory);
          const filteredHistory = history.filter((order: any) => !emptyOrderIds.includes(order.id));
          localStorage.setItem(historyKey, JSON.stringify(filteredHistory));
          logger.debug('Local history cleaned');
        }
      } catch (localError) {
        logger.error('Error cleaning local history:', localError);
      }
      logger.debug('Reloading orders list...');
      await loadOrderHistory();
      toast({
        title: "Sucesso!",
        description: `${emptyOrderIds.length} pedidos vazios foram excluídos`,
        variant: "default"
      });
      logger.success('Empty orders deletion completed');
    } catch (error) {
      logger.error('Error deleting empty orders:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir pedidos vazios. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setShowDeleteEmptyConfirm(false);
    }
  };

  // Função para excluir todos os pedidos em aberto
  const handleDeleteAllOpenOrders = async () => {
    if (!user?.id || deleting) return;
    setDeleting(true);
    try {
      // Buscar todos os pedidos em aberto
      const {
        data: openOrders,
        error: findError
      } = await supabase.from('orders').select('id, customer_id').eq('user_id', user.id).eq('status', 'open');
      if (findError) {
        logger.error('Error fetching open orders:', findError);
        return;
      }
      if (!openOrders || openOrders.length === 0) {
        alert('Nenhum pedido em aberto encontrado.');
        return;
      }
      const orderIds = openOrders.map(order => order.id);
      const customerIds = [...new Set(openOrders.map(order => order.customer_id))];

      // Excluir itens dos pedidos primeiro
      const {
        error: itemsError
      } = await supabase.from('order_items').delete().in('order_id', orderIds);
      if (itemsError) {
        logger.error('Error deleting order items:', itemsError);
      }

      // Excluir os pedidos
      const {
        error: ordersError
      } = await supabase.from('orders').delete().in('id', orderIds);
      if (ordersError) {
        logger.error('Error deleting orders:', ordersError);
        return;
      }

      // Verificar e remover clientes que ficaram sem pedidos
      for (const customerId of customerIds) {
        const {
          data: remainingOrders
        } = await supabase.from('orders').select('id').eq('customer_id', customerId).eq('user_id', user.id);
        if (!remainingOrders || remainingOrders.length === 0) {
          await supabase.from('customers').delete().eq('id', customerId);
        }
      }
      await loadOrderHistory();
      alert(`${orderIds.length} pedidos em aberto foram excluídos.`);
    } catch (error) {
      logger.error('Error deleting all open orders:', error);
    } finally {
      setDeleting(false);
      setShowDeleteAllOpenConfirm(false);
    }
  };

  // Calcular estatísticas dos pedidos em aberto
  const openOrdersStats = useMemo(() => {
    const openOrders = orders.filter(order => order.status === 'open');
    const emptyOrders = openOrders.filter(order => order.items.length === 0);
    return {
      totalOpen: openOrders.length,
      emptyOpen: emptyOrders.length
    };
  }, [orders]);
  const isMobileOrTablet = isMobile || isTablet;

  // Render mobile/tablet card layout
  const renderMobileOrderCard = (order: HistoryOrder) => <div key={order.id} className={`bg-slate-800/60 rounded-lg border border-slate-700/50 p-3 mb-2 ${order.cancelled ? 'opacity-60' : ''}`}>
      {/* Header: Cliente, Data e Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm truncate ${order.cancelled ? 'text-gray-400' : 'text-white'}`}>
            # {order.customerName}
          </p>
          <p className="text-slate-500 text-[10px]">
            {order.formattedDate} • {order.formattedTime}
          </p>
        </div>
        <div className="flex items-center gap-1.5 ml-2 flex-wrap justify-end">
          {order.cancelled && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 font-medium">
              CANCELADO
            </Badge>
          )}
          <Badge className={`text-[10px] px-1.5 py-0.5 font-medium ${order.status === 'completed' ? 'bg-emerald-600/80 text-white' : 'bg-amber-600/80 text-white'}`}>
            {order.status === 'completed' ? 'Finalizado' : 'Em Aberto'}
          </Badge>
          <Badge className={`text-[10px] px-1.5 py-0.5 font-medium ${order.type === 'venda' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
            {order.type === 'venda' ? 'Venda' : 'Compra'}
          </Badge>
        </div>
      </div>

      {/* Info: Itens e Total + Ver Detalhes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-700/50 flex items-center justify-center">
            <Package className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div>
            <p className={`text-xs font-medium ${order.cancelled ? 'text-gray-400' : 'text-white'}`}>{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</p>
            <p className="text-slate-500 text-[10px] truncate max-w-[100px]">
              {order.items.slice(0, 2).map(item => item.materialName).join(', ')}
              {order.items.length > 2 && '...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className={`font-bold text-base ${order.cancelled ? 'text-gray-400 line-through' : 'text-emerald-400'}`}>
            R$ {order.total.toFixed(2)}
          </p>
          {order.status === 'completed' && !order.cancelled && <button onClick={() => handleViewOrder(order.id)} className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-colors" title="Ver Detalhes">
              <Eye className="w-4 h-4" />
            </button>}
        </div>
      </div>
    </div>;

  // Ref for filter scroll container
  const filterScrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to active filter button on mobile/tablet
  const handleFilterClick = (filterSetter: () => void, buttonIndex: number) => {
    filterSetter();

    // Auto-scroll to make the clicked button visible
    if (filterScrollRef.current && isMobileOrTablet) {
      const container = filterScrollRef.current;
      const buttons = container.querySelectorAll('button');
      const targetButton = buttons[buttonIndex];
      if (targetButton) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = targetButton.getBoundingClientRect();
        const scrollLeft = buttonRect.left - containerRect.left + container.scrollLeft - containerRect.width / 2 + buttonRect.width / 2;
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
      }
    }
  };
  return <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent hideCloseButton={isMobileOrTablet} className={`${isMobileOrTablet ? 'w-screen h-screen max-w-none max-h-none m-0 rounded-none' : '!w-[95vw] !max-w-[1200px] !h-[90vh] !max-h-[90vh]'} p-0 bg-slate-900 border-slate-700 flex flex-col`}>
        <DialogHeader className={`${isMobileOrTablet ? 'px-4 py-2' : 'p-6'} border-b border-slate-700 bg-slate-800`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={`${isMobileOrTablet ? 'h-4 w-4' : 'h-6 w-6'} text-emerald-400`} />
              <DialogTitle className={`${isMobileOrTablet ? 'text-base' : 'text-2xl'} text-white`}>
                Histórico de Pedidos
              </DialogTitle>
            </div>
            {isMobileOrTablet && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1.5 h-auto text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          <DialogDescription className={`text-slate-400 ${isMobileOrTablet ? 'text-[10px]' : 'text-sm'}`}>
            Consulte e gerencie seus pedidos anteriores
          </DialogDescription>
        </DialogHeader>

        {/* Filtros Mobile/Tablet - Compact Pills with Auto-Scroll */}
        {isMobileOrTablet ? <div className="bg-slate-800/50 border-b border-slate-700/50 px-3 py-2">
            <div ref={filterScrollRef} className="flex gap-1.5 overflow-x-auto hide-scrollbar scroll-smooth">
              <button onClick={() => handleFilterClick(() => setFilterStatus('all'), 0)} className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all duration-200 ${filterStatus === 'all' ? 'bg-emerald-600 text-white scale-105 shadow-lg shadow-emerald-600/30' : 'bg-slate-700/50 text-slate-400'}`}>
                Todos
              </button>
              <button onClick={() => handleFilterClick(() => setFilterStatus('open'), 1)} className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all duration-200 ${filterStatus === 'open' ? 'bg-amber-600 text-white scale-105 shadow-lg shadow-amber-600/30' : 'bg-slate-700/50 text-slate-400'}`}>
                Em Aberto
              </button>
              <button onClick={() => handleFilterClick(() => setFilterStatus('completed'), 2)} className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all duration-200 ${filterStatus === 'completed' ? 'bg-emerald-600 text-white scale-105 shadow-lg shadow-emerald-600/30' : 'bg-slate-700/50 text-slate-400'}`}>
                Finalizados
              </button>
              <div className="w-px bg-slate-600/50 mx-0.5 flex-shrink-0" />
              <button onClick={() => handleFilterClick(() => setFilterType('all'), 4)} className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all duration-200 ${filterType === 'all' ? 'bg-slate-600 text-white scale-105 shadow-lg shadow-slate-600/30' : 'bg-slate-700/50 text-slate-400'}`}>
                Tipos
              </button>
              <button onClick={() => handleFilterClick(() => setFilterType('venda'), 5)} className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all duration-200 ${filterType === 'venda' ? 'bg-amber-500 text-white scale-105 shadow-lg shadow-amber-500/30' : 'bg-slate-700/50 text-slate-400'}`}>
                Vendas
              </button>
              <button onClick={() => handleFilterClick(() => setFilterType('compra'), 6)} className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all duration-200 ${filterType === 'compra' ? 'bg-emerald-500 text-white scale-105 shadow-lg shadow-emerald-500/30' : 'bg-slate-700/50 text-slate-400'}`}>
                Compras
              </button>
              <div className="w-px bg-slate-600/50 mx-0.5 flex-shrink-0" />
              <button onClick={() => handleFilterClick(() => setShowFilters(!showFilters), 8)} className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1 ${showFilters ? 'bg-slate-600 text-white scale-105' : 'bg-slate-700/50 text-slate-400'}`}>
                <Filter className="w-2.5 h-2.5" />
                Filtros
              </button>
            </div>
            
            {/* Expandable Filters Panel */}
            {showFilters && <div className="px-3 pb-2 space-y-2">
                {/* Date Filters */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-slate-500 text-[10px] mb-0.5 block">De:</Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-700/50 border-slate-600/50 text-white text-[10px] h-7" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-slate-500 text-[10px] mb-0.5 block">Até:</Label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-700/50 border-slate-600/50 text-white text-[10px] h-7" />
                  </div>
                </div>

                {/* Actions */}
                {openOrdersStats.totalOpen > 0 && <div className="flex flex-wrap gap-1.5">
                    <span className="text-slate-500 text-[10px] w-full">
                      Em aberto: {openOrdersStats.totalOpen} {openOrdersStats.emptyOpen > 0 && `(${openOrdersStats.emptyOpen} vazios)`}
                    </span>
                    {openOrdersStats.emptyOpen > 0 && <button onClick={() => setShowDeleteEmptyConfirm(true)} disabled={deleting} className="flex items-center gap-1 bg-amber-600/20 border border-amber-500/30 text-amber-400 px-2 py-1 rounded text-[10px] font-medium">
                        <XCircle className="w-2.5 h-2.5" />
                        Excluir Vazios ({openOrdersStats.emptyOpen})
                      </button>}
                    <button onClick={() => setShowDeleteAllOpenConfirm(true)} disabled={deleting} className="flex items-center gap-1 bg-red-600/20 border border-red-500/30 text-red-400 px-2 py-1 rounded text-[10px] font-medium">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Excluir Todos ({openOrdersStats.totalOpen})
                    </button>
                  </div>}
              </div>}
          </div> : (/* Desktop Filters */
      <div className="flex flex-wrap gap-4 p-6 bg-slate-800 border-b border-slate-700">
            {/* Filtros de Status e Tipo */}
            <div className="flex flex-wrap gap-4">
              <div className="flex gap-2">
                <button onClick={() => setFilterStatus('all')} className={`px-3 py-1 rounded text-sm ${filterStatus === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}>
                  Todos
                </button>
                <button onClick={() => setFilterStatus('open')} className={`px-3 py-1 rounded text-sm ${filterStatus === 'open' ? 'bg-amber-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}>
                  Em Aberto
                </button>
                <button onClick={() => setFilterStatus('completed')} className={`px-3 py-1 rounded text-sm ${filterStatus === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}>
                  Finalizados
                </button>
              </div>

              <Separator orientation="vertical" className="h-8 bg-slate-600" />

              <div className="flex gap-2">
                <button onClick={() => setFilterType('all')} className={`px-3 py-1 rounded text-sm ${filterType === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}>
                  Todos Tipos
                </button>
                <button onClick={() => setFilterType('venda')} className={`px-3 py-1 rounded text-sm ${filterType === 'venda' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}>
                  Vendas
                </button>
                <button onClick={() => setFilterType('compra')} className={`px-3 py-1 rounded text-sm ${filterType === 'compra' ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}>
                  Compras
                </button>
              </div>
            </div>

            <Separator orientation="vertical" className="h-8 bg-slate-600" />

            {/* Filtro de Período */}
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <Label htmlFor="startDate" className="text-slate-300 text-sm">De:</Label>
                <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-700 border-slate-600 text-white w-40" />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="endDate" className="text-slate-300 text-sm">Até:</Label>
                <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-700 border-slate-600 text-white w-40" />
              </div>
              {(startDate || endDate) && <Button onClick={() => {
            setStartDate('');
            setEndDate('');
          }} variant="outline" size="sm" className="text-slate-400 border-slate-600 hover:bg-slate-700">
                  Limpar
                </Button>}
            </div>

            {/* Botões de Exclusão */}
            {openOrdersStats.totalOpen > 0 && <>
                <Separator orientation="vertical" className="h-8 bg-slate-600" />
                <div className="flex gap-2 items-center">
                  <div className="text-slate-400 text-sm">
                    Em aberto: {openOrdersStats.totalOpen} 
                    {openOrdersStats.emptyOpen > 0 && ` (${openOrdersStats.emptyOpen} vazios)`}
                  </div>
                  {openOrdersStats.emptyOpen > 0 && <Button onClick={() => setShowDeleteEmptyConfirm(true)} disabled={deleting} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                      <XCircle className="h-4 w-4 mr-1" />
                      Excluir Vazios ({openOrdersStats.emptyOpen})
                    </Button>}
                  <Button onClick={() => setShowDeleteAllOpenConfirm(true)} disabled={deleting} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Excluir Todos ({openOrdersStats.totalOpen})
                  </Button>
                </div>
              </>}
          </div>)}

        {/* Lista de Pedidos */}
        <ScrollArea className="flex-1">
          <div className={isMobileOrTablet ? 'p-4' : 'p-6'}>
            {loading ? <div className="flex items-center justify-center h-32">
                <div className="text-white">Carregando histórico...</div>
              </div> : paginatedOrders.length === 0 ? <div className="flex flex-col items-center justify-center h-32 text-center">
                <Package className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-400">Nenhum pedido encontrado</p>
                <p className="text-slate-500 text-sm mt-1">Tente ajustar os filtros</p>
              </div> : isMobileOrTablet ? (/* Mobile/Tablet Card Layout */
          <div>
                {paginatedOrders.map(renderMobileOrderCard)}
              </div>) : (/* Desktop Table Layout */
          <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-300">Cliente</TableHead>
                    <TableHead className="text-slate-300">Data/Hora</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Tipo</TableHead>
                    <TableHead className="text-slate-300">Itens</TableHead>
                    <TableHead className="text-slate-300">Total</TableHead>
                    <TableHead className="text-slate-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {paginatedOrders.map(order => <TableRow key={order.id} className={`border-slate-700 hover:bg-slate-800/50 ${order.cancelled ? 'opacity-60' : ''}`}>
                      <TableCell className={`font-medium ${order.cancelled ? 'text-gray-400' : 'text-white'}`}>
                        {order.customerName}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div>{order.formattedDate}</div>
                        <div className="text-sm text-slate-400">{order.formattedTime}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {order.cancelled && (
                            <Badge variant="destructive" className="text-xs">
                              CANCELADO
                            </Badge>
                          )}
                          <Badge className={order.status === 'completed' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-amber-600 text-white hover:bg-amber-700'}>
                            {order.status === 'completed' ? 'Finalizado' : 'Em Aberto'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={order.type === 'venda' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}>
                          {order.type === 'venda' ? 'Venda' : 'Compra'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {order.items.length}
                        </div>
                        <div className="text-sm text-slate-400">
                          {order.items.slice(0, 2).map(item => item.materialName).join(', ')}
                          {order.items.length > 2 && '...'}
                        </div>
                      </TableCell>
                      <TableCell className={`font-bold ${order.cancelled ? 'text-gray-400' : 'text-emerald-400'}`}>
                        <div className={`flex items-center gap-1 ${order.cancelled ? 'line-through' : ''}`}>
                          <DollarSign className="h-4 w-4" />
                          R$ {order.total.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.status === 'completed' && !order.cancelled ? <Button onClick={() => handleViewOrder(order.id)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Pedido
                          </Button> : order.cancelled ? <span className="text-gray-500 text-sm">Cancelado</span> : <span className="text-slate-500 text-sm">Em andamento</span>}
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>)}
          </div>
        </ScrollArea>

        {/* Paginação */}
        {filteredOrders.length > 0 && <div className={`flex items-center justify-between ${isMobileOrTablet ? 'px-4 py-3' : 'p-6'} border-t border-slate-700 bg-slate-800`}>
            <div className={`text-slate-400 ${isMobileOrTablet ? 'text-xs' : 'text-sm'}`}>
              {isMobileOrTablet ? `${startIndex + 1}-${Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length)} de ${filteredOrders.length}` : `Mostrando ${startIndex + 1} a ${Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length)} de ${filteredOrders.length} pedidos`}
            </div>
            {totalPages > 1 && <div className="flex items-center gap-2">
              <Button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} variant="outline" size="sm" className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600 disabled:opacity-50">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Números das páginas */}
              {!isMobileOrTablet && <div className="flex gap-1">
                  {Array.from({
              length: Math.min(totalPages, 5)
            }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return <Button key={pageNum} onClick={() => setCurrentPage(pageNum)} variant={currentPage === pageNum ? "default" : "outline"} size="sm" className={currentPage === pageNum ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600" : "bg-slate-700 text-white border-slate-600 hover:bg-slate-600"}>
                        {pageNum}
                      </Button>;
            })}
                </div>}

              {isMobileOrTablet && <span className="text-white text-sm font-medium">
                  {currentPage}/{totalPages}
                </span>}
              
              <Button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} variant="outline" size="sm" className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600 disabled:opacity-50">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>}
          </div>}
      </DialogContent>

      {/* Modal de Confirmação - Excluir Pedidos Vazios */}
      <AlertDialog open={showDeleteEmptyConfirm} onOpenChange={setShowDeleteEmptyConfirm}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg text-white flex items-center gap-2">
              <XCircle className="h-5 w-5 text-amber-500" />
              Excluir Pedidos Vazios
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 text-sm">
              Tem certeza que deseja excluir todos os {openOrdersStats.emptyOpen} pedidos em aberto que não possuem itens?
              <br /><br />
              <strong className="text-amber-400">Esta ação não pode ser desfeita.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setShowDeleteEmptyConfirm(false)} className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmptyOpenOrders} disabled={deleting} className="bg-amber-600 hover:bg-amber-700 text-white">
              {deleting ? 'Excluindo...' : `Excluir ${openOrdersStats.emptyOpen} Vazios`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação - Excluir Todos os Pedidos Em Aberto */}
      <AlertDialog open={showDeleteAllOpenConfirm} onOpenChange={setShowDeleteAllOpenConfirm}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir Todos Em Aberto
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 text-sm">
              <strong className="text-red-400">ATENÇÃO!</strong> Você está prestes a excluir TODOS os {openOrdersStats.totalOpen} pedidos em aberto.
              <br /><br />
              <span className="text-slate-400">Isso incluirá:</span>
              <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                <li>Pedidos com itens ({openOrdersStats.totalOpen - openOrdersStats.emptyOpen})</li>
                <li>Pedidos vazios ({openOrdersStats.emptyOpen})</li>
                <li>Todos os itens associados</li>
              </ul>
              <br />
              <strong className="text-red-400">Esta ação não pode ser desfeita.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setShowDeleteAllOpenConfirm(false)} className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllOpenOrders} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? 'Excluindo...' : `Excluir Todos (${openOrdersStats.totalOpen})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Senha para Ver Pedido */}
      <PasswordPromptModal open={showPasswordModal} onOpenChange={open => {
      setShowPasswordModal(open);
      if (!open) {
        setSelectedOrderId(null);
      }
    }} onAuthenticated={handlePasswordAuthenticated} title="Autenticação Necessária" description="Digite sua senha para visualizar os detalhes do pedido." />

      {/* Modal de Detalhes do Pedido */}
      <TransactionDetailsModal isOpen={showDetailsModal} onClose={() => {
      setShowDetailsModal(false);
      setSelectedOrderForDetails(null);
    }} transaction={selectedOrderForDetails} onReprint={handleReprintOrder} onDelete={handleCancelClick} />

      {/* Reimpressão usando o layout canônico do PDV */}
      <ReceiptPrintModal
        open={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setReprintCustomer(null);
          setReprintOrder(null);
        }}
        customer={reprintCustomer}
        order={reprintOrder}
        formatPeso={formatPesoReprint}
        isSaleMode={reprintOrder?.type === 'venda'}
      />
      {/* Modal de Cancelamento */}
      <CancellationModal
        isOpen={showCancellationModal}
        onClose={() => {
          setShowCancellationModal(false);
          setOrderToCancel(null);
        }}
        onConfirm={handleCancelOrder}
        order={orderToCancel}
        isLoading={deleting}
      />
    </Dialog>;
};

// Função para salvar pedidos localmente para backup
export const saveOrderToLocalHistory = (order: Order, customerName: string) => {
  try {
    // Obter ID do usuário do token de autenticação ou usar ID padrão
    let userId = 'guest';
    try {
      const authData = localStorage.getItem('sb-jqrtnhqxkwdfcjgdbzyj-auth-token');
      if (authData) {
        const parsedAuth = JSON.parse(authData);
        if (parsedAuth.user?.id) {
          userId = parsedAuth.user.id;
        }
      }
    } catch (authError) {
      console.log('Usando ID padrão para histórico local');
    }
    const historyKey = `order_history_${userId}`;
    const existingHistory = localStorage.getItem(historyKey);
    const history = existingHistory ? JSON.parse(existingHistory) : [];
    const historyOrder: HistoryOrder = {
      ...order,
      customerName,
      formattedDate: new Date(order.timestamp).toLocaleDateString('pt-BR'),
      formattedTime: new Date(order.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // Verificar se o pedido já existe
    const existingIndex = history.findIndex((h: HistoryOrder) => h.id === order.id);
    if (existingIndex >= 0) {
      history[existingIndex] = historyOrder;
    } else {
      history.unshift(historyOrder);
    }

    // Manter apenas os últimos 1000 pedidos no localStorage
    if (history.length > 1000) {
      history.splice(1000);
    }
    localStorage.setItem(historyKey, JSON.stringify(history));
    console.log('Pedido salvo no histórico local:', order.id);
  } catch (error) {
    console.error('Erro ao salvar pedido no histórico local:', error);
  }
};
export default OrderHistoryModal;