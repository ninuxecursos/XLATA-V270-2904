import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Eye, Package, User, Mail, Phone, FileText, MapPin, Clock, CreditCard, Copy, MessageCircle, Truck, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useShopOrders, useUpdateOrderStatus, ShopOrder } from '@/hooks/useShopOrders';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mapeamento de status do banco para labels amigáveis
const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; filterKey: string }> = {
  // Status em inglês (novos pedidos do checkout)
  'pending': { label: 'Aguardando Pagamento', badgeClass: 'bg-amber-100 text-amber-700', filterKey: 'pending' },
  'paid': { label: 'Pago', badgeClass: 'bg-emerald-100 text-emerald-700', filterKey: 'confirmed' },
  'cancelled': { label: 'Cancelado', badgeClass: 'bg-red-100 text-red-700', filterKey: 'cancelled' },
  // Status em português (legado)
  'rascunho': { label: 'Rascunho', badgeClass: 'bg-gray-100 text-gray-700', filterKey: 'draft' },
  'aguardando_pagamento': { label: 'Aguardando Pagamento', badgeClass: 'bg-amber-100 text-amber-700', filterKey: 'pending' },
  'pago': { label: 'Pago', badgeClass: 'bg-emerald-100 text-emerald-700', filterKey: 'confirmed' },
  'pendente': { label: 'Pendente', badgeClass: 'bg-amber-100 text-amber-700', filterKey: 'pending' },
  'confirmado': { label: 'Confirmado', badgeClass: 'bg-emerald-100 text-emerald-700', filterKey: 'confirmed' },
  'em_preparacao': { label: 'Em Preparação', badgeClass: 'bg-blue-100 text-blue-700', filterKey: 'confirmed' },
  'enviado': { label: 'Enviado', badgeClass: 'bg-purple-100 text-purple-700', filterKey: 'confirmed' },
  'entregue': { label: 'Entregue', badgeClass: 'bg-green-100 text-green-700', filterKey: 'confirmed' },
  'cancelado': { label: 'Cancelado', badgeClass: 'bg-red-100 text-red-700', filterKey: 'cancelled' },
};

// Funções auxiliares
const formatWhatsAppLink = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  const number = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  return `https://wa.me/${number}`;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success('Copiado para a área de transferência!');
};

const formatFullDate = (dateString: string) => {
  return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
};

const getAddressString = (address: Record<string, unknown> | null) => {
  if (!address) return null;
  const parts = [address.street, address.number, address.complement, address.neighborhood, address.city, address.state, address.zipcode].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
};

interface ShopOrdersManagerProps {
  initialOrderId?: string | null;
  onOrderViewed?: () => void;
}

export function ShopOrdersManager({ initialOrderId, onOrderViewed }: ShopOrdersManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  
  const { data: orders = [], isLoading } = useShopOrders();

  useEffect(() => {
    if (initialOrderId && orders.length > 0) {
      const order = orders.find(o => o.id === initialOrderId);
      if (order) {
        setSelectedOrder(order);
        onOrderViewed?.();
      }
    }
  }, [initialOrderId, orders]);
  const updateStatus = useUpdateOrderStatus();

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const config = STATUS_CONFIG[order.status];
    const matchesStatus = config?.filterKey === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await updateStatus.mutateAsync({ orderId, status: newStatus });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status];
    if (config) {
      return <Badge className={config.badgeClass}>{config.label}</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const statusCount = {
    all: orders.length,
    draft: orders.filter(o => STATUS_CONFIG[o.status]?.filterKey === 'draft').length,
    pending: orders.filter(o => STATUS_CONFIG[o.status]?.filterKey === 'pending').length,
    confirmed: orders.filter(o => STATUS_CONFIG[o.status]?.filterKey === 'confirmed').length,
    cancelled: orders.filter(o => STATUS_CONFIG[o.status]?.filterKey === 'cancelled').length
  };

  // Inline order detail view
  if (selectedOrder) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        {/* Back button */}
        <div>
          <Button
            variant="ghost"
            onClick={() => setSelectedOrder(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para lista
          </Button>
          <h1 className="shop-cms-page-title">Detalhes do Pedido</h1>
        </div>

        <div className="space-y-5">
          {/* Cabeçalho do Pedido */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-900 text-lg">
                    #{selectedOrder.order_number || selectedOrder.id.slice(0, 8).toUpperCase()}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedOrder.order_number || selectedOrder.id)}
                    className="p-1 hover:bg-emerald-100 rounded transition-colors"
                    title="Copiar número do pedido"
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{formatFullDate(selectedOrder.created_at)}</span>
                </div>
              </div>
              {getStatusBadge(selectedOrder.status)}
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-900">{selectedOrder.customer_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <a href={`mailto:${selectedOrder.customer_email}`} className="text-sm text-blue-600 hover:underline">
                  {selectedOrder.customer_email}
                </a>
              </div>
              {selectedOrder.customer_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{selectedOrder.customer_phone}</span>
                  <a
                    href={formatWhatsAppLink(selectedOrder.customer_phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                </div>
              )}
              {selectedOrder.customer_document && (
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{selectedOrder.customer_document}</span>
                </div>
              )}
            </div>
          </div>

          {/* Endereço de Entrega */}
          {selectedOrder.shipping_address && getAddressString(selectedOrder.shipping_address) && (
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Endereço de Entrega</h4>
                <button
                  onClick={() => copyToClipboard(getAddressString(selectedOrder.shipping_address) || '')}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copiar endereço"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700 space-y-0.5">
                  {selectedOrder.shipping_address.street && (
                    <p>{selectedOrder.shipping_address.street as string}{selectedOrder.shipping_address.number ? `, ${selectedOrder.shipping_address.number}` : ''}</p>
                  )}
                  {selectedOrder.shipping_address.complement && (
                    <p className="text-gray-500">{selectedOrder.shipping_address.complement as string}</p>
                  )}
                  {(selectedOrder.shipping_address.neighborhood || selectedOrder.shipping_address.city) && (
                    <p>
                      {selectedOrder.shipping_address.neighborhood as string}
                      {selectedOrder.shipping_address.neighborhood && selectedOrder.shipping_address.city && ' - '}
                      {selectedOrder.shipping_address.city as string}
                      {selectedOrder.shipping_address.state && `/${selectedOrder.shipping_address.state}`}
                    </p>
                  )}
                  {selectedOrder.shipping_address.zipcode && (
                    <p className="text-gray-500">CEP: {selectedOrder.shipping_address.zipcode as string}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pagamento */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pagamento</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  Método: <span className="font-medium text-gray-900">{selectedOrder.payment_method || 'Não informado'}</span>
                </span>
              </div>
              {selectedOrder.payment_id && (
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-mono">{selectedOrder.payment_id}</span>
                  <button
                    onClick={() => copyToClipboard(selectedOrder.payment_id || '')}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Copiar ID do pagamento"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>
              )}
              {selectedOrder.tracking_code && (
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Rastreio: <span className="font-mono font-medium">{selectedOrder.tracking_code}</span></span>
                  <button
                    onClick={() => copyToClipboard(selectedOrder.tracking_code || '')}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Copiar código de rastreio"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Itens do Pedido</h4>
            <div className="space-y-2">
              {selectedOrder.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                      <Package className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.product_name}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity}x {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(item.total_price)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">{formatCurrency(selectedOrder.subtotal)}</span>
            </div>
            {selectedOrder.shipping_cost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Frete</span>
                <span className="text-gray-900">{formatCurrency(selectedOrder.shipping_cost)}</span>
              </div>
            )}
            {selectedOrder.discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Desconto</span>
                <span>-{formatCurrency(selectedOrder.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
              <span>Total</span>
              <span className="text-emerald-600">{formatCurrency(selectedOrder.total)}</span>
            </div>
          </div>

          {/* Observações */}
          {selectedOrder.notes && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Observações</h4>
              <p className="text-sm text-amber-900">{selectedOrder.notes}</p>
            </div>
          )}

          {/* Ações Rápidas */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {selectedOrder.customer_phone && (
              <a
                href={formatWhatsAppLink(selectedOrder.customer_phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Abrir WhatsApp
              </a>
            )}
            <Select
              value={selectedOrder.status}
              onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
            >
              <SelectTrigger className="flex-1 h-11 bg-white text-gray-900 border-gray-200 rounded-xl">
                <SelectValue>
                  Atualizar: {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-[100]">
                <SelectItem value="pending" className="text-gray-900 hover:bg-gray-100">Aguardando Pagamento</SelectItem>
                <SelectItem value="paid" className="text-gray-900 hover:bg-gray-100">Pago</SelectItem>
                <SelectItem value="em_preparacao" className="text-gray-900 hover:bg-gray-100">Em Preparação</SelectItem>
                <SelectItem value="enviado" className="text-gray-900 hover:bg-gray-100">Enviado</SelectItem>
                <SelectItem value="entregue" className="text-gray-900 hover:bg-gray-100">Entregue</SelectItem>
                <SelectItem value="cancelled" className="text-gray-900 hover:bg-gray-100">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  return (
     <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
         <h1 className="shop-cms-page-title">Pedidos</h1>
         <p className="shop-cms-page-subtitle">Gerencie os pedidos da sua loja</p>
      </div>

      {/* Stats */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
           { key: 'all', label: 'TODOS', color: 'bg-gray-100 text-gray-700', activeColor: 'ring-gray-400' },
           { key: 'pending', label: 'PENDENTES', color: 'bg-amber-50 text-amber-700', activeColor: 'ring-amber-500' },
           { key: 'confirmed', label: 'CONFIRMADOS', color: 'bg-emerald-50 text-emerald-700', activeColor: 'ring-emerald-500' },
           { key: 'cancelled', label: 'CANCELADOS', color: 'bg-red-50 text-red-700', activeColor: 'ring-red-500' }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setStatusFilter(item.key)}
             className={`p-4 rounded-xl text-left transition-all duration-150 ${item.color} ${
               statusFilter === item.key ? `ring-2 ${item.activeColor}` : 'hover:ring-1 hover:ring-gray-300'
             }`}
          >
             <p className="text-xs font-medium uppercase tracking-wide opacity-75">{item.label}</p>
             <p className="text-2xl font-bold mt-1">{statusCount[item.key as keyof typeof statusCount]}</p>
          </button>
        ))}
      </div>

      {/* Search */}
       <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar pedidos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
           className="pl-10 h-10 bg-white text-gray-900 border-gray-200 placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        />
      </div>

       {/* Orders List */}
       <div className="shop-card overflow-hidden">
         <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-100 flex items-center gap-2">
           <ShoppingCart className="w-5 h-5 text-gray-500" />
           <h2 className="font-semibold text-gray-900">Lista de Pedidos</h2>
         </div>
         
          {isLoading ? (
           <div className="p-8 text-center">
             <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
             <p className="text-gray-500 text-sm">Carregando pedidos...</p>
           </div>
          ) : filteredOrders.length === 0 ? (
           <div className="shop-empty-state py-12">
             <ShoppingCart className="shop-empty-state-icon" />
             <p className="shop-empty-state-title">Nenhum pedido encontrado</p>
             <p className="shop-empty-state-description">
               {searchTerm ? 'Tente uma busca diferente.' : 'Quando clientes fizerem pedidos, eles aparecerão aqui.'}
             </p>
            </div>
          ) : (
           <>
             {/* Desktop Table */}
             <div className="hidden lg:block overflow-x-auto">
               <table className="shop-table w-full">
                 <thead>
                   <tr>
                     <th>Pedido</th>
                     <th>Cliente</th>
                     <th>Itens</th>
                     <th>Total</th>
                     <th>Data</th>
                     <th>Status</th>
                     <th className="w-20">Ações</th>
                   </tr>
                 </thead>
                 <tbody>
                {filteredOrders.map((order) => (
                     <tr key={order.id} className="hover:bg-gray-50">
                       <td>
                      <span className="font-mono text-sm">
                        {order.order_number || order.id.slice(0, 8)}
                      </span>
                       </td>
                       <td>
                         <div className="min-w-[150px]">
                        <p className="font-medium text-gray-900">{order.customer_name}</p>
                        <p className="text-sm text-gray-500">{order.customer_email}</p>
                      </div>
                       </td>
                       <td>
                         <span className="shop-badge-default">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                         </span>
                       </td>
                       <td>
                      <span className="font-medium">{formatCurrency(order.total)}</span>
                       </td>
                       <td>
                         <span className="text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </span>
                       </td>
                       <td>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                           <SelectTrigger className="w-36 h-9 bg-white text-gray-900 border-gray-200 rounded-lg text-sm">
                          <SelectValue>
                            {STATUS_CONFIG[order.status]?.label || order.status}
                          </SelectValue>
                        </SelectTrigger>
                           <SelectContent className="bg-white border border-gray-200 shadow-lg z-[100]">
                          <SelectItem value="pending" className="text-gray-900 hover:bg-gray-100">Aguardando Pagamento</SelectItem>
                          <SelectItem value="paid" className="text-gray-900 hover:bg-gray-100">Pago</SelectItem>
                          <SelectItem value="em_preparacao" className="text-gray-900 hover:bg-gray-100">Em Preparação</SelectItem>
                          <SelectItem value="enviado" className="text-gray-900 hover:bg-gray-100">Enviado</SelectItem>
                          <SelectItem value="entregue" className="text-gray-900 hover:bg-gray-100">Entregue</SelectItem>
                          <SelectItem value="cancelled" className="text-gray-900 hover:bg-gray-100">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                       </td>
                       <td>
                      <Button
                        variant="ghost"
                           size="icon"
                        onClick={() => setSelectedOrder(order)}
                           className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                       </td>
                     </tr>
                ))}
                 </tbody>
               </table>
             </div>
             
             {/* Mobile List */}
             <div className="lg:hidden divide-y divide-gray-100">
               {filteredOrders.map((order) => (
                 <div key={order.id} className="p-4 hover:bg-gray-50">
                   <div className="flex items-start justify-between gap-3 mb-3">
                     <div className="min-w-0 flex-1">
                       <p className="font-medium text-gray-900 truncate">{order.customer_name}</p>
                       <p className="text-sm text-gray-500 truncate">{order.customer_email}</p>
                     </div>
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => setSelectedOrder(order)}
                       className="h-8 w-8 flex-shrink-0"
                     >
                       <Eye className="w-4 h-4" />
                     </Button>
                   </div>
                   <div className="flex items-center justify-between gap-2">
                     <div className="flex items-center gap-2">
                       <span className="font-mono text-xs text-gray-500">
                         #{order.order_number || order.id.slice(0, 8)}
                       </span>
                       <span className="shop-badge-default">
                         {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                       </span>
                     </div>
                     <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
                   </div>
                   <div className="flex items-center justify-between gap-2 mt-3">
                     <span className="text-xs text-gray-500">{formatDate(order.created_at)}</span>
                     <Select
                       value={order.status}
                       onValueChange={(value) => handleStatusChange(order.id, value)}
                     >
                       <SelectTrigger className="w-36 h-8 bg-white text-gray-900 border-gray-200 rounded-lg text-xs">
                         <SelectValue>
                           {STATUS_CONFIG[order.status]?.label || order.status}
                         </SelectValue>
                       </SelectTrigger>
                       <SelectContent className="bg-white border border-gray-200 shadow-lg z-[100]">
                         <SelectItem value="pending" className="text-gray-900 text-sm hover:bg-gray-100">Aguardando</SelectItem>
                         <SelectItem value="paid" className="text-gray-900 text-sm hover:bg-gray-100">Pago</SelectItem>
                         <SelectItem value="em_preparacao" className="text-gray-900 text-sm hover:bg-gray-100">Preparando</SelectItem>
                         <SelectItem value="enviado" className="text-gray-900 text-sm hover:bg-gray-100">Enviado</SelectItem>
                         <SelectItem value="entregue" className="text-gray-900 text-sm hover:bg-gray-100">Entregue</SelectItem>
                         <SelectItem value="cancelled" className="text-gray-900 text-sm hover:bg-gray-100">Cancelado</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
               ))}
             </div>
           </>
          )}
       </div>
    </div>
  );
}
