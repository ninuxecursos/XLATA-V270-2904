import { useEffect, useState } from 'react';
import { Package, Users, ShoppingCart, TrendingUp, Store, AlertCircle, ArrowUpRight, ArrowDownRight, Camera, Sparkles, WifiOff } from 'lucide-react';
import { useShopProducts } from '@/hooks/useShopProducts';
import { useShopUsers } from '@/hooks/useShopUsers';
import { useShopOrders } from '@/hooks/useShopOrders';
import { useShopConfig } from '@/hooks/useShopConfig';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProductImageScanner, type ScanResult } from './ProductImageScanner';
import { ShopScannerDraft, DRAFT_KEY, type ScannerDraft } from './ShopScannerDraft';
import { toast } from 'sonner';

interface ShopDashboardProps {
  onViewOrder?: (orderId: string) => void;
  onSectionChange?: (section: string) => void;
}

export function ShopDashboard({ onViewOrder, onSectionChange }: ShopDashboardProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [draft, setDraft] = useState<ScannerDraft | null>(null);
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        setDraft(raw ? (JSON.parse(raw) as ScannerDraft) : null);
      } catch { setDraft(null); }
    };
    load();
    const onConsumed = () => load();
    window.addEventListener('scanner-draft-consumed', onConsumed);
    window.addEventListener('storage', onConsumed);
    return () => {
      window.removeEventListener('scanner-draft-consumed', onConsumed);
      window.removeEventListener('storage', onConsumed);
    };
  }, []);

  const persistDraft = (next: ScannerDraft | null) => {
    setDraft(next);
    try {
      if (next) localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      else localStorage.removeItem(DRAFT_KEY);
    } catch (e) { console.error('Failed to persist draft', e); }
  };

  const handleScanApply = (data: ScanResult) => {
    const next: ScannerDraft = {
      ...data,
      sale_type: data.sale_type || 'normal',
      interactive_settings: data.interactive_settings || {
        durationMinutes: 60, minimumIncrement: 5, autoRepost: true,
        repostDelayDays: 3, maxRepostCount: 5, startImmediately: true,
      },
      savedAt: Date.now(),
    };
    persistDraft(next);
    setScannerOpen(false);
    toast.success('Rascunho salvo! Configure o tipo de venda abaixo.');
  };

  const handleDiscardDraft = () => {
    if (!confirm('Descartar este rascunho? Os dados gerados serão perdidos.')) return;
    persistDraft(null);
    toast.info('Rascunho descartado.');
  };

  const handleUseDraft = (finalDraft: ScannerDraft) => {
    try {
      sessionStorage.setItem('pending_product_scan', JSON.stringify({ ...finalDraft, ts: Date.now() }));
    } catch (e) { console.error('Failed to forward draft', e); }
    onSectionChange?.('products');
  };

  const { data: products = [], isLoading: loadingProducts } = useShopProducts();
  const { data: users = [], isLoading: loadingUsers } = useShopUsers();
  const { data: orders = [], isLoading: loadingOrders } = useShopOrders();
  const { data: config } = useShopConfig();

  const activeProducts = products.filter(p => p.is_active).length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const pendingOrders = orders.filter(o => o.status === 'rascunho').length;
  const totalRevenue = orders
    .filter(o => o.status === 'confirmado')
    .reduce((sum, o) => sum + o.total, 0);

  const recentOrders = orders.slice(0, 5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const baseClass = "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium";
    switch (status) {
      case 'rascunho':
        return <span className={`${baseClass} bg-amber-100 text-amber-700`}>Rascunho</span>;
      case 'confirmado':
        return <span className={`${baseClass} bg-emerald-100 text-emerald-700`}>Confirmado</span>;
      case 'cancelado':
        return <span className={`${baseClass} bg-red-100 text-red-700`}>Cancelado</span>;
      default:
        return <span className={`${baseClass} bg-gray-100 text-gray-700`}>{status}</span>;
    }
  };

  const metrics = [
    {
      title: 'Produtos Ativos',
      value: loadingProducts ? '...' : activeProducts,
      icon: Package,
      color: 'text-blue-600',
      lightColor: 'bg-blue-100',
      trend: '+12%',
      trendUp: true,
      section: 'products'
    },
    {
      title: 'Usuários Ativos',
      value: loadingUsers ? '...' : activeUsers,
      icon: Users,
      color: 'text-purple-600',
      lightColor: 'bg-purple-100',
      trend: '+8%',
      trendUp: true,
      section: 'users'
    },
    {
      title: 'Pedidos Pendentes',
      value: loadingOrders ? '...' : pendingOrders,
      icon: ShoppingCart,
      color: 'text-amber-600',
      lightColor: 'bg-amber-100',
      trend: '-3%',
      trendUp: false,
      section: 'orders'
    },
    {
      title: 'Receita Total',
      value: loadingOrders ? '...' : formatCurrency(totalRevenue),
      icon: TrendingUp,
      color: 'text-emerald-600',
      lightColor: 'bg-emerald-100',
      trend: '+25%',
      trendUp: true,
      section: 'orders'
    }
  ];

  return (
     <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
           <h1 className="shop-cms-page-title">Dashboard</h1>
           <p className="shop-cms-page-subtitle">Visão geral do seu e-commerce</p>
        </div>
        
         <div className="flex items-center gap-2">
           <span className="text-sm text-gray-500 hidden sm:inline">Status:</span>
          {config?.is_open ? (
             <span className="shop-badge-success flex items-center gap-1.5 px-3 py-1 rounded-full">
              <Store className="w-3 h-3 mr-1" />
              Aberta
             </span>
          ) : (
             <span className="shop-badge-error flex items-center gap-1.5 px-3 py-1 rounded-full">
              <AlertCircle className="w-3 h-3 mr-1" />
              Fechada
             </span>
          )}
        </div>
      </div>

      {/* Quick Action — Smart Scan */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-white p-5 sm:p-6">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                Cadastro Rápido com IA
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Tire uma foto e a IA preenche o produto pra você.
              </p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex-shrink-0">
                  <Button
                    onClick={() => setScannerOpen(true)}
                    disabled={!isOnline}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11 px-5 shadow-sm w-full sm:w-auto"
                  >
                    {isOnline ? <Camera className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    Escanear Produto
                  </Button>
                </span>
              </TooltipTrigger>
              {!isOnline && (
                <TooltipContent>
                  <p>Requer internet</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Persisted scanner draft */}
      {draft && (
        <ShopScannerDraft
          draft={draft}
          onChange={persistDraft}
          onDiscard={handleDiscardDraft}
          onUse={handleUseDraft}
        />
      )}

      {/* Metrics Grid */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
              <div 
                key={index} 
                className="shop-card p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => onSectionChange?.(metric.section)}
              >
                <div className="flex items-start justify-between">
                   <div className={`w-10 h-10 sm:w-11 sm:h-11 ${metric.lightColor} rounded-xl flex items-center justify-center`}>
                     <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                   <div className={`flex items-center gap-0.5 text-xs font-semibold ${metric.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                    {metric.trendUp ? (
                       <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                       <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {metric.trend}
                  </div>
                </div>
                 <div className="mt-3">
                   <p className="shop-stat-value text-xl sm:text-2xl truncate">{metric.value}</p>
                   <p className="shop-stat-label mt-0.5 truncate">{metric.title}</p>
                </div>
             </div>
          );
        })}
      </div>

      {/* Recent Orders */}
       <div className="shop-card overflow-hidden">
         <div className="px-4 py-4 sm:px-5 border-b border-gray-100">
           <h2 className="text-base sm:text-lg font-semibold text-gray-900">Pedidos Recentes</h2>
         </div>
         <div className="p-4 sm:p-5">
          {recentOrders.length === 0 ? (
             <div className="shop-empty-state py-8">
               <ShoppingCart className="shop-empty-state-icon" />
               <p className="shop-empty-state-title">Nenhum pedido ainda</p>
               <p className="shop-empty-state-description">Quando clientes fizerem pedidos, eles aparecerão aqui.</p>
            </div>
          ) : (
             <div className="space-y-2">
              {recentOrders.map((order) => (
                 <div 
                   key={order.id} 
                    className="shop-list-item p-3 sm:p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onViewOrder?.(order.id)}
                 >
                   <div className="flex items-center gap-3 min-w-0 flex-1">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200 flex-shrink-0">
                       <ShoppingCart className="w-4 h-4 text-gray-500" />
                    </div>
                     <div className="min-w-0 flex-1">
                       <p className="font-medium text-gray-900 text-sm truncate">{order.customer_name}</p>
                       <p className="text-xs text-gray-500 truncate">{order.customer_email}</p>
                    </div>
                  </div>
                   <div className="flex items-center gap-3 flex-shrink-0">
                     <p className="font-bold text-gray-900 text-sm sm:text-base">{formatCurrency(order.total)}</p>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
         </div>
       </div>

      <ProductImageScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onApply={handleScanApply}
      />
    </div>
  );
}

