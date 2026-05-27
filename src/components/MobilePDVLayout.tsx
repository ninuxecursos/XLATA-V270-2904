import React, { useState, useEffect, memo, startTransition } from 'react';
import { PackagePlus, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Printer, MessageSquare, DollarSign, Receipt, X, Clock, Wifi, Server, ChevronRight, Settings, WifiOff, ServerOff, Eye, EyeOff, LayoutDashboard, HelpCircle, Search } from 'lucide-react';
import MobileBottomNav, { MobileTab } from './MobileBottomNav';
import { Customer, Order, Material, MaterialCategory } from '@/types/pdv';
import CategoryBar from './CategoryBar';
import { useNavigate } from 'react-router-dom';
const VendaAvulsaModal = React.lazy(() => import('./VendaAvulsaModal'));
import PasswordPromptModal from './PasswordPromptModal';
import { useTime } from '@/contexts/TimeContext';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FEATURE_KEYS } from '@/constants/featureAccess';

// Componentes críticos com import direto
import OrderList from './OrderList';
import OrderDetails from './OrderDetails';
import MaterialGrid from './MaterialGrid';
import NumberPadOptimized, { type NumberPadAutomaticMode } from './NumberPadOptimized';
import Footer from './Footer';

// Memoized versions
const MemoizedOrderList = memo(OrderList);
const MemoizedOrderDetails = memo(OrderDetails);
const MemoizedMaterialGrid = memo(MaterialGrid);
const MemoizedNumberPad = memo(NumberPadOptimized);

interface MobilePDVLayoutProps {
  // Data
  customers: Customer[];
  currentCustomer: Customer | null;
  activeOrder: Order | null;
  materials: Material[];
  pesoInput: string;
  currentBalance: number;
  isSaleMode: boolean;
  unreadCount: number;
  
  // Categories
  useCategoriesEnabled?: boolean;
  categories?: MaterialCategory[];
  selectedCategoryId?: string | null;
  onSelectCategory?: (categoryId: string | null) => void;
  
  // Venda Avulsa
  showVendaAvulsaModal?: boolean;
  setShowVendaAvulsaModal?: (show: boolean) => void;
  onVendaAvulsa?: (name: string, quantity: number, price: number, costPrice: number, linkedMaterialId?: string, linkedStockQuantity?: number, linkedMaterialName?: string) => void;
  vendaAvulsaStockMap?: Record<string, number>;
  
  // Handlers
  handleSelectCustomer: (customer: Customer | null) => void;
  setCurrentOrder: (order: Order | null) => void;
  handleCustomerDeleted: () => void;
  handleOrderDeleted: (customerId: string, orderId: string) => void;
  handleNumberPadSubmit: (value: number) => void;
  setPesoInput: (value: string) => void;
  handleSelectMaterial: (material: Material) => void;
  handleNewOrderRequest: () => void;
  handleInitiateCompleteOrder: () => void;
  formatPeso: (value: string | number) => string;
  handleDeleteOrderItem: (index: number) => void;
  handleSaleModeToggle: (checked: boolean) => void;
  setShowNotificationsModal: (show: boolean) => void;
  setShowErrorReportModal: (show: boolean) => void;
  updateCashRegisterBalance: () => Promise<void>;
  handleMenuClick: () => void;
  
  // Menu Actions
  setShowAddFundsModal?: (show: boolean) => void;
  setShowMaterialsPrintModal?: (show: boolean) => void;
  setShowExpenseModal?: (show: boolean) => void;
  setShowClosingModal?: (show: boolean) => void;
  
  // Callback para quando precisar navegar para a balança
  onNavigateToScale?: () => void;
  // Referência para permitir navegação externa à aba
  setActiveTabRef?: (setter: (tab: MobileTab) => void) => void;
  // Para forçar refresh da lista de pedidos
  orderListRefreshKey?: number;
  scaleAutoMode?: NumberPadAutomaticMode | null;
}

const MobilePDVLayout: React.FC<MobilePDVLayoutProps> = ({
  customers,
  currentCustomer,
  activeOrder,
  materials,
  pesoInput,
  currentBalance,
  scaleAutoMode = null,
  isSaleMode,
  unreadCount,
  handleSelectCustomer,
  setCurrentOrder,
  handleCustomerDeleted,
  handleOrderDeleted,
  handleNumberPadSubmit,
  setPesoInput,
  handleSelectMaterial,
  handleNewOrderRequest,
  handleInitiateCompleteOrder,
  formatPeso,
  handleDeleteOrderItem,
  handleSaleModeToggle,
  setShowNotificationsModal,
  setShowErrorReportModal,
  updateCashRegisterBalance,
  handleMenuClick,
  setShowAddFundsModal,
  setShowMaterialsPrintModal,
  setShowExpenseModal,
  setShowClosingModal,
  onNavigateToScale,
  setActiveTabRef,
  useCategoriesEnabled = false,
  categories = [],
  selectedCategoryId = null,
  onSelectCategory,
  orderListRefreshKey = 0,
  showVendaAvulsaModal = false,
  setShowVendaAvulsaModal,
  onVendaAvulsa,
  vendaAvulsaStockMap = {}
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('scale');
  const [avulsaLoading, setAvulsaLoading] = useState(false);
  const { hasFeature } = useFeatureAccess();

  const handleOpenAvulsa = () => {
    if (avulsaLoading || !setShowVendaAvulsaModal) return;
    setAvulsaLoading(true);
    setShowVendaAvulsaModal(true);
  };

  useEffect(() => {
    if (showVendaAvulsaModal) setAvulsaLoading(false);
  }, [showVendaAvulsaModal]);
  
  // Listener global de teclado para inserir números na balança
  useEffect(() => {
    let currentPeso = pesoInput;
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignorar se há modal aberto
      const hasOpenModal = document.querySelector('[role="dialog"]');
      if (hasOpenModal) return;
      
      // Ignorar se o foco está em um input ou textarea
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).isContentEditable
      )) {
        return;
      }
      
      // Processar apenas dígitos numéricos
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        const currentStr = (parseFloat(currentPeso || '0') * 1000).toFixed(0).padStart(6, '0');
        const newStr = (currentStr + e.key).slice(-9);
        const newValue = (parseInt(newStr) / 1000).toString();
        currentPeso = newValue;
        setPesoInput(newValue);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        const currentStr = (parseFloat(currentPeso || '0') * 1000).toFixed(0).padStart(6, '0');
        const newStr = ('0' + currentStr.slice(0, -1)).slice(-9);
        const newValue = (parseInt(newStr) / 1000).toString();
        currentPeso = newValue;
        setPesoInput(newValue);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        currentPeso = '';
        setPesoInput('');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [pesoInput, setPesoInput]);

  // Expor o setter da aba para o pai poder controlar
  useEffect(() => {
    if (setActiveTabRef) {
      setActiveTabRef(setActiveTab);
    }
  }, [setActiveTabRef]);
  
  // OTIMIZAÇÃO: Usar TimeContext ao invés de setInterval local
  const { currentTime, formatTime } = useTime();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [materialSearchOpen, setMaterialSearchOpen] = useState(false);
  const [materialSearchQuery, setMaterialSearchQuery] = useState("");
  const filteredMaterials = React.useMemo(() => {
    const q = materialSearchQuery.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter(m => m.name?.toLowerCase().includes(q));
  }, [materials, materialSearchQuery]);
  const handleSelectMaterialWithSearchClose = React.useCallback((m: Material) => {
    setMaterialSearchQuery("");
    setMaterialSearchOpen(false);
    handleSelectMaterial(m);
  }, [handleSelectMaterial]);
  const navigate = useNavigate();

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle menu action after password auth
  const handlePasswordAuthenticated = () => {
    setShowPasswordModal(false);
    if (pendingAction === 'addFunds' && setShowAddFundsModal) {
      setShowAddFundsModal(true);
    } else if (pendingAction === 'expense' && setShowExpenseModal) {
      setShowExpenseModal(true);
    } else if (pendingAction === 'closeDay' && setShowClosingModal) {
      setShowClosingModal(true);
    } else if (pendingAction === 'dashboard') {
      startTransition(() => {
        navigate('/dashboard');
      });
    } else if (pendingAction === 'settings') {
      startTransition(() => {
        navigate('/configuracoes');
      });
    }
    setPendingAction(null);
  };

  // Handle menu action with password
  const handleMenuAction = (action: string) => {
    if (action === 'addFunds' || action === 'expense' || action === 'closeDay') {
      setPendingAction(action);
      setShowPasswordModal(true);
    } else if (action === 'dashboard') {
      // MenuAuthGate solicita a senha na rota protegida; evita prompt duplicado
      startTransition(() => navigate('/dashboard'));
    } else if (action === 'settings') {
      startTransition(() => navigate('/configuracoes'));
    } else if (action === 'print' && setShowMaterialsPrintModal) {
      setShowMaterialsPrintModal(true);
    }
  };

  // Contagem de pedidos em aberto
  const openOrdersCount = customers.reduce((count, customer) => {
    return count + customer.orders.filter(o => o.status === 'open').length;
  }, 0);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'scale':
        return (
          <div className="flex flex-col h-full">
            {/* Header compacto */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={isSaleMode} 
                  onCheckedChange={handleSaleModeToggle} 
                  id="modo-venda-switch" 
                  className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-slate-500 scale-90" 
                />
                <Label 
                  htmlFor="modo-venda-switch" 
                  className={`text-xs font-semibold select-none ${isSaleMode ? 'text-amber-400' : 'text-slate-300'}`}
                >
                  {isSaleMode ? "Modo Venda Ativado" : "Ativar Venda"}
                </Label>
                {isSaleMode && setShowVendaAvulsaModal && (
                  <button
                    onClick={handleOpenAvulsa}
                    disabled={avulsaLoading}
                    className="ml-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-semibold border border-amber-500/30 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center"
                  >
                    {avulsaLoading ? (
                      <><Loader2 className="w-3 h-3 inline mr-0.5 animate-spin" />Abrindo...</>
                    ) : (
                      <><PackagePlus className="w-3 h-3 inline mr-0.5" />Avulsa</>
                    )}
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {setShowMaterialsPrintModal && (
                  <button
                    onClick={() => setShowMaterialsPrintModal(true)}
                    className="px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30 active:scale-95 transition-all inline-flex items-center gap-1"
                  >
                    <Printer className="w-3 h-3" />
                    Gerar tabela
                  </button>
                )}
                <button 
                  onClick={() => setShowNotificationsModal(true)}
                  className={`p-1.5 rounded-md transition-all ${
                    unreadCount > 0 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] rounded-full w-3 h-3 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setShowErrorReportModal(true)}
                  className="p-1.5 rounded-md text-emerald-400 hover:bg-slate-700 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Teclado Numérico - Ocupa a maior parte da tela */}
            <div className={`flex-1 min-h-0 ${activeOrder && activeOrder.items.length > 0 ? 'pb-[76px]' : ''}`}>
              <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-4 flex items-center justify-center h-full">Carregando...</div>}>
                <MemoizedNumberPad 
                  onSubmit={handleNumberPadSubmit} 
                  onClear={() => setPesoInput("")} 
                  value={pesoInput} 
                  automaticMode={scaleAutoMode}
                />
              </React.Suspense>
            </div>

            {/* Preview do pedido atual - Fixo acima da navegação inferior */}
            {activeOrder && activeOrder.items.length > 0 && (
              <div
                className="fixed inset-x-0 z-40 px-3"
                style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 16px))' }}
              >
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="w-full bg-gradient-to-r from-slate-800 to-slate-700 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center justify-between active:bg-slate-600 transition-colors shadow-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center">
                      <span className="text-emerald-400 font-bold text-sm">{activeOrder.items.length}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold text-sm">
                        R$ {activeOrder.total.toFixed(2)}
                      </p>
                      <p className="text-slate-400 text-[10px]">
                        {activeOrder.items.length === 1 ? '1 item' : `${activeOrder.items.length} itens`} no pedido
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-600 px-3 py-1.5 rounded-lg">
                    <span className="text-white text-xs font-medium">Ver Pedido</span>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                </button>
              </div>
            )}
          </div>
        );

      case 'materials':
        return (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={isSaleMode} 
                  onCheckedChange={handleSaleModeToggle} 
                  id="modo-venda-switch-materials" 
                  className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-slate-500 scale-90" 
                />
                <Label 
                  htmlFor="modo-venda-switch-materials" 
                  className={`text-xs font-semibold select-none ${isSaleMode ? 'text-amber-400' : 'text-slate-300'}`}
                >
                  {isSaleMode ? "Modo Venda Ativado" : "Modo Compra Ativado"}
                </Label>
                {isSaleMode && setShowVendaAvulsaModal && (
                  <button
                    onClick={handleOpenAvulsa}
                    disabled={avulsaLoading}
                    className="ml-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-semibold border border-amber-500/30 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center"
                  >
                    {avulsaLoading ? (
                      <><Loader2 className="w-3 h-3 inline mr-0.5 animate-spin" />Abrindo...</>
                    ) : (
                      <><PackagePlus className="w-3 h-3 inline mr-0.5" />Avulsa</>
                    )}
                  </button>
                )}
              </div>
              <span className="text-slate-400 text-xs">{materials.length} cadastrados</span>
            </div>

            {/* Category Bar - Only show when categories are enabled */}
            {useCategoriesEnabled && categories.length > 0 && onSelectCategory ? (
              <CategoryBar
                categories={categories}
                selectedCategoryId={selectedCategoryId ?? null}
                onSelectCategory={onSelectCategory}
                materialCountByCategory={materials.reduce((acc, m) => {
                  if (m.category_id) {
                    acc[m.category_id] = (acc[m.category_id] || 0) + 1;
                  }
                  return acc;
                }, {} as Record<string, number>)}
              />
            ) : null}

            {/* Grid de Materiais */}
            <ScrollArea className="flex-1">
              <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-4">Carregando...</div>}>
                <MemoizedMaterialGrid 
                  materials={filteredMaterials} 
                  onMaterialSelect={handleSelectMaterialWithSearchClose} 
                  onManualInsert={() => {}} 
                  isSaleMode={isSaleMode} 
                  hasActiveOrder={!!activeOrder} 
                  onNewOrderRequest={handleNewOrderRequest}
                  selectedCategoryId={materialSearchQuery.trim() ? null : (selectedCategoryId ?? null)}
                />
                {filteredMaterials.length === 0 && (
                  <div className="text-center text-slate-400 text-sm py-10 px-4">
                    Nenhum material encontrado para "{materialSearchQuery}".
                  </div>
                )}
              </React.Suspense>
            </ScrollArea>

            {/* Barra de Busca Profissional - Bottom Sheet */}
            {!materialSearchOpen ? (
              <button
                onClick={() => setMaterialSearchOpen(true)}
                className="mx-3 mb-2 mt-1 flex items-center gap-2 px-4 py-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 text-sm shadow-lg active:scale-[0.98] transition-all"
              >
                <Search className="w-4 h-4 text-emerald-400" />
                <span className="flex-1 text-left">Buscar material por nome...</span>
                <kbd className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">⌕</kbd>
              </button>
            ) : (
              <div className="fixed inset-x-0 bottom-0 z-[60] bg-slate-900/95 backdrop-blur-xl border-t border-slate-700 px-3 pt-3 pb-[env(safe-area-inset-bottom)] shadow-2xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 pointer-events-none" />
                  <input
                    autoFocus
                    type="text"
                    inputMode="search"
                    value={materialSearchQuery}
                    onChange={(e) => setMaterialSearchQuery(e.target.value)}
                    placeholder="Digite o nome do material..."
                    className="w-full h-12 bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none text-white placeholder:text-slate-500 rounded-xl pl-10 pr-12 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMaterialSearchQuery("");
                      setMaterialSearchOpen(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white"
                    aria-label="Fechar busca"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 mt-2 px-1">
                  {filteredMaterials.length} resultado{filteredMaterials.length === 1 ? '' : 's'} • toque em um material para selecionar
                </div>
              </div>
            )}


            {/* Info do peso atual */}
            {pesoInput && parseFloat(pesoInput) > 0 && (
              <div className="bg-emerald-900/30 border-t border-emerald-500/30 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-xs">Peso na balança:</span>
                  <span className="text-emerald-400 font-bold">
                    {parseFloat(pesoInput).toFixed(3)} kg
                  </span>
                </div>
              </div>
            )}
          </div>
        );

      case 'orders':
        return (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={isSaleMode} 
                  onCheckedChange={handleSaleModeToggle} 
                  id="modo-venda-switch-orders" 
                  className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-slate-500 scale-90" 
                />
                <Label 
                  htmlFor="modo-venda-switch-orders" 
                  className={`text-xs font-semibold select-none ${isSaleMode ? 'text-amber-400' : 'text-slate-300'}`}
                >
                  {isSaleMode ? "Modo Venda Ativado" : "Modo Compra Ativado"}
                </Label>
                {isSaleMode && setShowVendaAvulsaModal && (
                  <button
                    onClick={handleOpenAvulsa}
                    disabled={avulsaLoading}
                    className="ml-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-semibold border border-amber-500/30 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center"
                  >
                    {avulsaLoading ? (
                      <><Loader2 className="w-3 h-3 inline mr-0.5 animate-spin" />Abrindo...</>
                    ) : (
                      <><PackagePlus className="w-3 h-3 inline mr-0.5" />Avulsa</>
                    )}
                  </button>
                )}
              </div>
              <span className="text-slate-400 text-xs">{openOrdersCount} pedidos abertos</span>
            </div>
            {/* Lista de Pedidos */}
            <div className={activeOrder ? 'h-2/5' : 'flex-1'}>
              <ScrollArea className="h-full">
                <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-4">Carregando...</div>}>
                  <MemoizedOrderList 
                    customers={customers} 
                    activeCustomer={currentCustomer} 
                    setCurrentCustomer={handleSelectCustomer} 
                    setCurrentOrder={setCurrentOrder} 
                    onCustomerDeleted={handleCustomerDeleted} 
                    onOrderDeleted={handleOrderDeleted}
                    refreshKey={orderListRefreshKey}
                  />
                </React.Suspense>
              </ScrollArea>
            </div>

            {/* Detalhes do Pedido Ativo */}
            {activeOrder && (
              <div className="flex-1 border-t border-slate-700 flex flex-col">
                <ScrollArea className="flex-1">
                  <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-4">Carregando...</div>}>
                    <MemoizedOrderDetails 
                      customer={currentCustomer} 
                      activeOrder={activeOrder} 
                      onCompleteOrder={handleInitiateCompleteOrder} 
                      formatPeso={formatPeso} 
                      onDeleteItem={handleDeleteOrderItem} 
                    />
                  </React.Suspense>
                </ScrollArea>
                
                {/* Botão Finalizar Pedido */}
                {activeOrder.items.length > 0 && (
                  <div className="bg-slate-800 border-t border-slate-700 p-3">
                    <button
                      onClick={handleInitiateCompleteOrder}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-base"
                      style={{ height: 'calc(48px * 1.1)' }}
                    >
                      Finalizar Pedido
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'menu':
        return (
          <div className="flex flex-col h-full bg-slate-900">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-800 border-b border-slate-700">
              <h2 className="text-white font-semibold">Menu</h2>
            </div>

            {/* Menu Items */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {/* Saldo com proteção */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Saldo atual</p>
                        <p className="text-emerald-400 font-bold text-lg">
                          {isBalanceVisible ? `R$ ${currentBalance.toFixed(2)}` : '••••••'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                      className="p-2 rounded-full hover:bg-slate-700 transition-colors"
                    >
                      {isBalanceVisible ? (
                        <EyeOff className="w-5 h-5 text-slate-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Menu Actions */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                {hasFeature(FEATURE_KEYS.BASIC_REPORTS) && (
                  <MenuItem 
                    icon={<LayoutDashboard className="w-5 h-5" />}
                    label="Dashboard"
                    onClick={() => handleMenuAction('dashboard')}
                  />
                )}
                  <MenuItem 
                    icon={<DollarSign className="w-5 h-5" />}
                    label="Adicionar Saldo"
                    onClick={() => handleMenuAction('addFunds')}
                  />
                <MenuItem 
                  icon={<Receipt className="w-5 h-5" />}
                  label="Adicionar Despesa"
                  onClick={() => handleMenuAction('expense')}
                />
                <MenuItem 
                  icon={<Printer className="w-5 h-5" />}
                  label="Gerar Tabela"
                  onClick={() => handleMenuAction('print')}
                />
                <MenuItem 
                  icon={<Settings className="w-5 h-5" />}
                  label="Configurações"
                  onClick={() => handleMenuAction('settings')}
                />
                <MenuItem 
                  icon={<MessageSquare className="w-5 h-5" />}
                  label="Enviar Sugestão/Suporte"
                  onClick={() => setShowErrorReportModal(true)}
                />
                <MenuItem 
                  icon={<HelpCircle className="w-5 h-5" />}
                  label="Central de Ajuda"
                  onClick={() => navigate('/ajuda')}
                />
                </div>

                {/* Fechar Dia */}
                <button 
                  onClick={() => handleMenuAction('closeDay')}
                  className="w-full bg-red-600/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3 hover:bg-red-600/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
                    <X className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-red-400 font-medium">Fechar Dia</span>
                </button>

                {/* Status */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isOnline ? (
                          <Server className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ServerOff className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-xs ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isOnline ? 'Servidor Online' : 'Servidor Offline'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOnline ? (
                          <Wifi className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <WifiOff className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-xs ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isOnline ? 'Internet Conectada' : 'Internet Desconectada'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1 border-t border-slate-700">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300 text-sm font-mono">
                        {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            {/* Password Modal for menu actions */}
            <PasswordPromptModal
              open={showPasswordModal}
              onOpenChange={setShowPasswordModal}
              onAuthenticated={handlePasswordAuthenticated}
              title="Autenticação Necessária"
              description="Digite sua senha para continuar"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div data-tutorial="pdv-main" className="flex flex-col h-screen bg-slate-900">
      {/* Conteúdo principal com padding para bottom nav + safe area */}
      <div className="flex-1 pb-mobile-nav overflow-hidden">
        {renderTabContent()}
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        orderCount={openOrdersCount}
        isSaleMode={isSaleMode}
        pulseMaterials={!!pesoInput && parseFloat(pesoInput) > 0 && activeTab !== 'materials'}
      />

      {/* Venda Avulsa Modal */}
      {showVendaAvulsaModal && setShowVendaAvulsaModal && onVendaAvulsa && (
        <React.Suspense fallback={null}>
          <VendaAvulsaModal
            open={showVendaAvulsaModal}
            onOpenChange={setShowVendaAvulsaModal}
            onConfirm={onVendaAvulsa}
            materials={materials}
            stockMap={vendaAvulsaStockMap}
          />
        </React.Suspense>
      )}
    </div>
  );
};

// Componente auxiliar para itens do menu
const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon, label, onClick, danger }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-4 border-b border-slate-700 last:border-b-0 transition-colors ${
      danger ? 'hover:bg-red-600/10' : 'hover:bg-slate-700/50'
    }`}
  >
    <span className={danger ? 'text-red-400' : 'text-slate-400'}>{icon}</span>
    <span className={`font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{label}</span>
    <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
  </button>
);

export default MobilePDVLayout;
