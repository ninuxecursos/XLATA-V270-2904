import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Clock, CheckCircle, Truck, XCircle, 
  ChevronRight, ArrowLeft, ShoppingBag, AlertCircle,
  CreditCard, Calendar, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { useShopConfig } from '@/hooks/useShopConfig';
import { useShopOrders, ShopOrder } from '@/hooks/useShopOrders';
import { ShopHeader } from '@/components/shop/public/ShopHeader';
import { ShopFooter } from '@/components/shop/public/ShopFooter';
import { ShopBottomNav } from '@/components/shop/mobile/ShopBottomNav';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ORDER_STATUS_CONFIG: Record<string, {
  label: string;
  shortLabel: string;
  icon: typeof Package;
  color: string;
  bgColor: string;
  step: number;
}> = {
  'rascunho': { label: 'Rascunho', shortLabel: 'Rascunho', icon: AlertCircle, color: '#6B7280', bgColor: '#F3F4F6', step: 0 },
  'pending': { label: 'Aguardando Pagamento', shortLabel: 'Pagamento', icon: CreditCard, color: '#F59E0B', bgColor: '#FEF3C7', step: 1 },
  'aguardando_pagamento': { label: 'Aguardando Pagamento', shortLabel: 'Pagamento', icon: CreditCard, color: '#F59E0B', bgColor: '#FEF3C7', step: 1 },
  'paid': { label: 'Pago', shortLabel: 'Pago', icon: CheckCircle, color: '#10B981', bgColor: '#D1FAE5', step: 2 },
  'pago': { label: 'Pago', shortLabel: 'Pago', icon: CheckCircle, color: '#10B981', bgColor: '#D1FAE5', step: 2 },
  'em_preparacao': { label: 'Preparando', shortLabel: 'Preparando', icon: Package, color: '#3B82F6', bgColor: '#DBEAFE', step: 3 },
  'enviado': { label: 'Enviado', shortLabel: 'Enviado', icon: Truck, color: '#8B5CF6', bgColor: '#EDE9FE', step: 4 },
  'entregue': { label: 'Entregue', shortLabel: 'Entregue', icon: CheckCircle, color: '#10B981', bgColor: '#D1FAE5', step: 5 },
  'cancelled': { label: 'Cancelado', shortLabel: 'Cancelado', icon: XCircle, color: '#EF4444', bgColor: '#FEE2E2', step: -1 },
  'cancelado': { label: 'Cancelado', shortLabel: 'Cancelado', icon: XCircle, color: '#EF4444', bgColor: '#FEE2E2', step: -1 },
};

const TAB_OPTIONS = [
  { value: 'all', label: 'Todos', icon: Package },
  { value: 'pending', label: 'Em andamento', icon: Clock },
  { value: 'shipped', label: 'Enviados', icon: Truck },
  { value: 'delivered', label: 'Entregues', icon: CheckCircle },
];

function OrderCard({ order, primaryColor }: { order: ShopOrder; primaryColor: string }) {
  const navigate = useNavigate();
  const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG['rascunho'];
  const StatusIcon = statusConfig.icon;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div 
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform"
      onClick={() => navigate(`/shop/orders/${order.id}`)}
    >
      {/* Compact Header */}
      <div className="p-3 flex items-center gap-3">
        {/* Status Icon */}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: statusConfig.bgColor }}
        >
          <StatusIcon className="w-5 h-5" style={{ color: statusConfig.color }} />
        </div>

        {/* Order Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-sm text-gray-900 truncate">
              #{order.order_number || order.id.slice(0, 8).toUpperCase()}
            </span>
            <Badge 
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-5 shrink-0"
              style={{ 
                backgroundColor: statusConfig.bgColor, 
                color: statusConfig.color 
              }}
            >
              {statusConfig.shortLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(order.created_at), "dd MMM yyyy", { locale: ptBR })}</span>
            <span className="text-gray-300">•</span>
            <span>{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
          </div>
        </div>

        {/* Price & Arrow */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-sm" style={{ color: primaryColor }}>
            {formatCurrency(order.total)}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Tracking Badge (if available) */}
      {order.tracking_code && (
        <div className="px-3 pb-3">
          <div 
            className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg"
            style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
          >
            <Truck className="w-3.5 h-3.5" />
            <span className="font-medium">Rastreio: {order.tracking_code}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderStats({ orders, primaryColor }: { orders: ShopOrder[]; primaryColor: string }) {
  const pending = orders.filter(o => ['rascunho', 'aguardando_pagamento', 'pago', 'em_preparacao'].includes(o.status)).length;
  const shipped = orders.filter(o => o.status === 'enviado').length;
  const delivered = orders.filter(o => o.status === 'entregue').length;

  const stats = [
    { label: 'Total', value: orders.length, color: primaryColor },
    { label: 'Em andamento', value: pending, color: '#F59E0B' },
    { label: 'Enviados', value: shipped, color: '#8B5CF6' },
    { label: 'Entregues', value: delivered, color: '#10B981' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {stats.map((stat, i) => (
        <div 
          key={i} 
          className="bg-white rounded-lg p-2.5 text-center border border-gray-100"
        >
          <p 
            className="text-lg font-bold"
            style={{ color: stat.color }}
          >
            {stat.value}
          </p>
          <p className="text-[10px] text-gray-500 leading-tight">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

export default function ShopOrders() {
  const navigate = useNavigate();
  const { shopUser, isAuthenticated } = useShopAuth();
  const { data: config } = useShopConfig();
  const { data: orders = [], isLoading } = useShopOrders(shopUser?.id);
  const [activeTab, setActiveTab] = useState('all');
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const primaryColor = config?.colors?.primary || '#10B981';

  // Auto-scroll tabs when active tab changes
  useEffect(() => {
    if (!tabsContainerRef.current) return;
    
    const container = tabsContainerRef.current;
    const activeButton = container.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
    
    if (activeButton) {
      const containerWidth = container.offsetWidth;
      const buttonLeft = activeButton.offsetLeft;
      const buttonWidth = activeButton.offsetWidth;
      
      // Calculate scroll position to center the button
      const scrollPosition = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
      
      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }, [activeTab]);


  // Filter orders based on tab
  const filteredOrders = orders.filter(order => {
    switch (activeTab) {
      case 'pending':
        return ['rascunho', 'pending', 'aguardando_pagamento', 'paid', 'pago', 'em_preparacao'].includes(order.status);
      case 'shipped':
        return order.status === 'enviado';
      case 'delivered':
        return order.status === 'entregue';
      default:
        return true;
    }
  });

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 light" data-theme="light">
        <ShopHeader />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Package className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Acesse sua conta</h1>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-xs">
            Faça login para visualizar e acompanhar seus pedidos
          </p>
          <Button 
            className="text-white px-6"
            style={{ backgroundColor: primaryColor }}
            onClick={() => navigate('/shop')}
          >
            Fazer Login
          </Button>
        </div>
        <ShopBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 light" data-theme="light">
      <ShopHeader />
      
      <main className="max-w-2xl mx-auto px-3 py-4 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg shrink-0 text-gray-700 hover:bg-gray-100"
            onClick={() => navigate('/shop/account')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Meus Pedidos</h1>
          </div>
        </div>

        {/* Stats Overview */}
        {orders.length > 0 && <OrderStats orders={orders} primaryColor={primaryColor} />}

        {/* Filter Tabs - Horizontal Scroll */}
        <div 
          ref={tabsContainerRef}
          className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {TAB_OPTIONS.map(tab => {
            const isActive = activeTab === tab.value;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.value}
                data-tab={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                  isActive 
                    ? 'text-white' 
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
                style={{ 
                  backgroundColor: isActive ? primaryColor : undefined,
                }}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-100">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Package className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {activeTab === 'all' ? 'Nenhum pedido encontrado' : 'Nenhum pedido aqui'}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4 max-w-xs">
              {activeTab === 'all' 
                ? 'Você ainda não realizou nenhuma compra' 
                : 'Não há pedidos com este status'}
            </p>
            <Button 
              size="sm"
              className="text-white"
              style={{ backgroundColor: primaryColor }}
              onClick={() => navigate('/shop')}
            >
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              Explorar Produtos
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredOrders.map(order => (
              <OrderCard key={order.id} order={order} primaryColor={primaryColor} />
            ))}
          </div>
        )}

        {/* Help Link */}
        {orders.length > 0 && (
          <div className="mt-6 text-center">
            <button 
              className="text-sm text-gray-500 hover:underline"
              onClick={() => navigate('/shop/faq')}
            >
              Precisa de ajuda com um pedido?
            </button>
          </div>
        )}
      </main>

      <ShopFooter />
      <ShopBottomNav />
    </div>
  );
}
