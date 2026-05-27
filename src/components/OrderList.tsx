import React, { useState, useEffect } from 'react';
import { Customer, Order } from '../types/pdv';
import { setActiveCustomer, setActiveOrder } from '../utils/supabaseStorage';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, History, Lock } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import OrderHistoryModal from './OrderHistoryModal';
import { useAuth } from '@/hooks/useAuth';
import { useDepotClients, DepotClient } from '@/hooks/useDepotClients';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { DepotClientSelect } from '@/components/DepotClientSelect';
interface OrderListProps {
  customers: Customer[];
  activeCustomer: Customer | null;
  setCurrentCustomer: (customer: Customer | null) => void;
  setCurrentOrder: (order: Order | null) => void;
  isSaleMode?: boolean;
  onCustomerDeleted?: () => void;
  onOrderDeleted?: (customerId: string, orderId: string) => void;
  onOpenOrdersLoaded?: (customers: Customer[]) => void;
  refreshKey?: number; // Incrementar para forçar recarregar pedidos
}
const OrderList: React.FC<OrderListProps> = ({
  customers,
  activeCustomer,
  setCurrentCustomer,
  setCurrentOrder,
  isSaleMode = false,
  onCustomerDeleted,
  onOrderDeleted,
  onOpenOrdersLoaded,
  refreshKey = 0
}) => {
  const {
    user
  } = useAuth();
  const { clients: depotClients, loading: loadingClients } = useDepotClients();
  const { hasFeature } = useFeatureAccess();
  const { toast } = useToast();
  const navigate = useNavigate();
  const canViewHistory = hasFeature('basic_history');
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [selectedDepotClient, setSelectedDepotClient] = useState<DepotClient | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [openOrders, setOpenOrders] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Load open orders from database
  useEffect(() => {
    const loadOpenOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      // Limpar estado imediatamente para evitar pedidos "fantasma"
      if (refreshKey > 0) {
        setOpenOrders([]);
      }
      
      try {
        // Buscar pedidos em aberto com itens
        const {
          data: orders,
          error: ordersError
        } = await supabase.from('orders').select(`
            *,
            customers!inner(id, name),
            order_items(id, material_id, material_name, quantity, price, total, tara)
          `).eq('user_id', user.id).eq('status', 'open').not('order_items', 'is', null);
        if (ordersError) {
          console.error('Error loading open orders:', ordersError);
          setLoading(false);
          return;
        }

        // Transformar dados do banco para estrutura do Customer
        const customersWithOrders: Customer[] = [];
        const customersMap = new Map<string, Customer>();
        orders?.forEach(order => {
          // VERIFICAR PRIMEIRO se o pedido tem itens - pular pedidos vazios
          if (!order.order_items || order.order_items.length === 0) {
            return; // Pular pedidos vazios
          }

          const customerId = order.customer_id;
          const customerName = order.customers.name;

          // Criar ou obter cliente (só se tiver itens)
          let customer = customersMap.get(customerId);
          if (!customer) {
            customer = {
              id: customerId,
              name: customerName,
              orders: []
            };
            customersMap.set(customerId, customer);
            customersWithOrders.push(customer);
          }

          // Adicionar pedido com itens - use exact name from database, no cleaning
          const orderData: Order = {
            id: order.id,
            customerId: order.customer_id,
            items: order.order_items.map(item => ({
              materialId: item.material_id,
              materialName: item.material_name, // Use exact name from DB
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              tara: item.tara || undefined
            })),
            total: order.total,
            timestamp: new Date(order.created_at).getTime(),
            status: 'open',
            type: order.type as 'compra' | 'venda'
          };
          customer.orders.push(orderData);
        });
        setOpenOrders(customersWithOrders);

        // Notificar parent component sobre os pedidos carregados
        if (onOpenOrdersLoaded) {
          onOpenOrdersLoaded(customersWithOrders);
        }
      } catch (error) {
        console.error('Error loading open orders:', error);
      } finally {
        setLoading(false);
      }
    };
    loadOpenOrders();
  }, [user, onOpenOrdersLoaded, refreshKey]); // refreshKey força recarregar quando pedido é finalizado

  // Handle Enter key press for order creation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isNewOrderModalOpen && e.key === 'Enter') {
        e.preventDefault();
        handleConfirmNewOrder();
      }
      if (deleteConfirmOpen && e.key === 'Enter') {
        handleDeleteOrder();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNewOrderModalOpen, deleteConfirmOpen, newCustomerName]);

  // Handle selecting a customer
  const handleSelectCustomer = (customer: Customer) => {
    setCurrentCustomer(customer);
    setActiveCustomer(customer);

    // Find open order
    const openOrder = customer.orders.find(order => order.status === 'open');
    if (openOrder) {
      setCurrentOrder(openOrder);
      setActiveOrder(openOrder);
    }
  };

  // Handle confirming order deletion
  const confirmDeleteOrder = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();

    // Find the open order for this customer
    const openOrder = customer.orders.find(order => order.status === 'open');
    if (openOrder) {
      setCustomerToDelete(customer);
      setOrderToDelete(openOrder);
      setDeleteConfirmOpen(true);
    }
  };

  // Handle delete order execution
  const handleDeleteOrder = async () => {
    if (!customerToDelete || !orderToDelete) return;
    try {
      console.log('Deleting order:', orderToDelete.id, 'from customer:', customerToDelete.name);

      // Delete order items first (foreign key constraint)
      const {
        error: itemsError
      } = await supabase.from('order_items').delete().eq('order_id', orderToDelete.id);
      if (itemsError) {
        console.error('Error deleting order items:', itemsError);
      }

      // Delete the specific order from Supabase
      const {
        error: orderError
      } = await supabase.from('orders').delete().eq('id', orderToDelete.id);
      if (orderError) {
        console.error('Error deleting order:', orderError);
        throw orderError;
      }

      // If the customer has no more open orders, delete the customer too
      const remainingOpenOrders = customerToDelete.orders.filter(order => order.id !== orderToDelete.id && order.status === 'open');
      if (remainingOpenOrders.length === 0) {
        const {
          error: customerError
        } = await supabase.from('customers').delete().eq('id', customerToDelete.id);
        if (customerError) {
          console.error('Error deleting customer:', customerError);
        }
      }

      // Update local state immediately - remove the order from openOrders
      setOpenOrders(prevOrders => {
        const updatedOrders = prevOrders.map(customer => {
          if (customer.id === customerToDelete.id) {
            const filteredOrders = customer.orders.filter(order => order.id !== orderToDelete.id);
            // If no more orders, don't include this customer
            if (filteredOrders.length === 0) {
              return null;
            }
            return { ...customer, orders: filteredOrders };
          }
          return customer;
        }).filter((customer): customer is Customer => customer !== null);
        
        return updatedOrders;
      });

      // If the deleted order was the active one, clear active states
      if (activeCustomer?.id === customerToDelete.id && orderToDelete.id) {
        setCurrentCustomer(null);
        setCurrentOrder(null);
        setActiveCustomer(null);
        setActiveOrder(null);
      }

      // Call the appropriate callback
      if (onOrderDeleted) {
        onOrderDeleted(customerToDelete.id, orderToDelete.id);
      } else if (onCustomerDeleted) {
        onCustomerDeleted();
      }
      setCustomerToDelete(null);
      setOrderToDelete(null);
      setDeleteConfirmOpen(false);
      console.log('Order deleted successfully');
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };
  const handleCreateNewOrder = () => {
    setIsNewOrderModalOpen(true);
  };
  const handleConfirmNewOrder = () => {
    // Use selected depot client name or manual input name
    const customerName = selectedDepotClient?.name || newCustomerName.trim() || "# Nome do Cliente";
    const newCustomer: Customer = {
      id: `customer-${Date.now()}`,
      name: customerName,
      orders: []
    };
    setCurrentCustomer(newCustomer);
    setActiveCustomer(newCustomer);
    setIsNewOrderModalOpen(false);
    setNewCustomerName("");
    setSelectedDepotClient(null);
    setShowManualInput(false);
  };
  const handleCancelNewOrder = () => {
    setIsNewOrderModalOpen(false);
    setNewCustomerName("");
    setSelectedDepotClient(null);
    setShowManualInput(false);
  };

  // Combine local customers with open orders from database
  const allCustomers = React.useMemo(() => {
    const customersMap = new Map<string, Customer>();

    // Add customers from props (local/new orders)
    customers.forEach(customer => {
      customersMap.set(customer.id, customer);
    });

    // Add customers from database (open orders)
    openOrders.forEach(customer => {
      if (!customersMap.has(customer.id)) {
        customersMap.set(customer.id, customer);
      }
    });
    return Array.from(customersMap.values());
  }, [customers, openOrders]);
  if (loading) {
    return <div className="h-full flex flex-col bg-slate-900">
        <div className="flex justify-between items-center p-4 bg-slate-800 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">Pedidos</h1>
        </div>
        <div className="flex items-center justify-center h-full text-slate-400">
          <p>Carregando pedidos...</p>
        </div>
      </div>;
  }
  return <div className="h-full flex flex-col bg-slate-900">
      <div className="flex justify-between items-center p-3 bg-slate-800 border-b border-slate-700">
        <h1 className="text-lg font-bold text-white">Pedidos</h1>
        <div className="flex items-center gap-2">
          {canViewHistory ? (
            <Badge variant="outline" onClick={() => setIsHistoryModalOpen(true)} className="text-slate-300 cursor-pointer py-1 text-xs px-2 rounded bg-slate-700 border-slate-600 hover:bg-slate-600 hover:text-white transition-colors">
              <History className="h-3 w-3 mr-1" />
              Histórico
            </Badge>
          ) : (
            <Badge variant="outline" onClick={() => { toast({ title: 'Recurso PRO', description: 'O histórico de pedidos está disponível no plano Pro.', variant: 'destructive' }); navigate('/planos'); }} className="text-slate-500 cursor-pointer py-1 text-xs px-2 rounded bg-slate-800 border-slate-700 opacity-60">
              <Lock className="h-3 w-3 mr-1" />
              Histórico
            </Badge>
          )}
          <button onClick={handleCreateNewOrder} className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded flex items-center text-xs font-semibold transition-colors">
            <span className="mr-1">+</span> Novo Pedido
          </button>
        </div>
      </div>
      
      <div className="overflow-auto flex-1">
        {allCustomers.length === 0 ? <div className="flex items-center justify-center h-full text-slate-400 text-center p-4">
            <div>
              <p className="text-lg font-medium mb-2">Nenhum pedido em aberto</p>
              <p className="text-sm">Clique em "Novo Pedido" para começar</p>
            </div>
          </div> : allCustomers.sort((a, b) => {
        const aOrder = a.orders.find(o => o.status === 'open');
        const bOrder = b.orders.find(o => o.status === 'open');
        if (!aOrder && !bOrder) return 0;
        if (!aOrder) return 1;
        if (!bOrder) return -1;
        return bOrder.timestamp - aOrder.timestamp;
      }).slice(0, 50).map(customer => {
        const isSelected = activeCustomer?.id === customer.id;
        const openOrder = customer.orders.find(o => o.status === 'open');
        return <div key={customer.id} onClick={() => handleSelectCustomer(customer)} className={`flex justify-between items-center p-3 border-b border-slate-700 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-900/40 border-l-4 border-l-emerald-500' : 'hover:bg-slate-800'}`}>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-medium">{customer.name}</p>
                    {openOrder && <Badge variant={openOrder.type === 'venda' ? 'default' : 'secondary'} className={`text-xs px-2 py-0.5 ${openOrder.type === 'venda' ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                        {openOrder.type === 'venda' ? 'Venda' : 'Compra'}
                      </Badge>}
                  </div>
                  <p className="text-slate-400 text-sm">
                    {openOrder ? `${openOrder.items.length} itens` : '0 itens'}
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="text-right mr-4">
                    <p className="text-emerald-400 font-bold">
                      {openOrder ? `R$ ${openOrder.total.toFixed(2)}` : 'R$ 0.00'}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {openOrder ? new Date(openOrder.timestamp).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit'
                }) + ' ' + new Date(openOrder.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '--/-- --:--'}
                    </p>
                  </div>
                  <button className="bg-red-600 hover:bg-red-700 text-white w-8 h-8 flex items-center justify-center rounded transition-colors" onClick={e => confirmDeleteOrder(e, customer)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>;
      })}
      </div>

      {/* New Order Modal */}
      <AlertDialog open={isNewOrderModalOpen} onOpenChange={open => {
        setIsNewOrderModalOpen(open);
        if (!open) {
          setNewCustomerName("");
          setSelectedDepotClient(null);
          setShowManualInput(false);
        }
      }}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 !fixed !inset-auto !left-[50%] !top-[50%] !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !max-w-[90vw] sm:!max-w-md !rounded-lg [&>div:first-child]:hidden">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-white">Novo Pedido</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-slate-300 mt-4">
                {!loadingClients && depotClients.length > 0 && !showManualInput ? (
                  <DepotClientSelect
                    clients={depotClients}
                    selectedClient={selectedDepotClient}
                    onSelect={(client) => {
                      setSelectedDepotClient(client);
                      if (client) {
                        setNewCustomerName(client.name);
                      }
                    }}
                    onAddNew={() => setShowManualInput(true)}
                  />
                ) : (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Nome do Cliente (opcional)</Label>
                    <Input
                      placeholder="# Nome do Cliente"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                      autoFocus
                    />
                    {depotClients.length > 0 && showManualInput && (
                      <button
                        type="button"
                        onClick={() => setShowManualInput(false)}
                        className="text-sm text-emerald-400 hover:text-emerald-300"
                      >
                        ← Voltar para lista de clientes
                      </button>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 mt-4">
            <AlertDialogAction onClick={handleConfirmNewOrder} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
              Criar Pedido
            </AlertDialogAction>
            <AlertDialogAction onClick={handleCancelNewOrder} className="bg-slate-700 hover:bg-slate-600 text-white w-full">
              Cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-white">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Tem certeza que deseja excluir o pedido atual de {customerToDelete?.name}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogAction onClick={() => setDeleteConfirmOpen(false)} className="bg-slate-700 hover:bg-slate-600 text-white">
              Cancelar
            </AlertDialogAction>
            <AlertDialogAction onClick={handleDeleteOrder} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order History Modal */}
      <OrderHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} />
    </div>;
};
export default OrderList;