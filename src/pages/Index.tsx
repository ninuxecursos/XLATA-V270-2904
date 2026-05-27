import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { Printer, Bell, PackagePlus } from 'lucide-react';
import { NotificationModal } from '@/components/NotificationModal';
import { useNotifications } from '@/hooks/useNotifications';
import { useStockCalculation } from '@/hooks/useStockCalculation';
import { usePdvAccessControl } from '@/hooks/usePdvAccessControl';
import { isGreaterThanOrEqual, formatWeight } from '@/utils/numericComparison';
import { cleanMaterialName } from '@/utils/materialNameCleaner';
import { saveOrderToLocalHistory } from '../components/OrderHistoryModal';
import { setupAutoCleanup, cleanupEmptyOrdersFromDatabase } from '../utils/cleanupEmptyOrders';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useEmployeeActionLog } from '@/hooks/useEmployeeActionLog';

// PDVTutorial removido — substituído pelo OnboardingGuideBanner na WelcomeScreen

// Componentes críticos com import direto para melhor performance
import OrderList from '../components/OrderList';
import OrderDetails from '../components/OrderDetails';
import MaterialGrid from '../components/MaterialGrid';
import NumberPadOptimized from '../components/NumberPadOptimized';
import Footer from '../components/Footer';

// Componentes secundários com lazy loading
const OrderCompletionModal = React.lazy(() => import('../components/OrderCompletionModal'));
const MaterialModal = React.lazy(() => import('../components/MaterialModal'));
const AlertModal = React.lazy(() => import('../components/AlertModal'));
const CashRegisterOpeningModal = React.lazy(() => import('../components/CashRegisterOpeningModal'));
const CashRegisterAddFundsModal = React.lazy(() => import('../components/CashRegisterAddFundsModal'));
const CashRegisterClosingModal = React.lazy(() => import('../components/CashRegisterClosingModal'));
const ExpenseModal = React.lazy(() => import('../components/ExpenseModal'));
const WelcomeScreen = React.lazy(() => import('../components/WelcomeScreen'));
const PasswordPromptModal = React.lazy(() => import('@/components/PasswordPromptModal'));
const ErrorReportModal = React.lazy(() => import('../components/ErrorReportModal'));
const MobilePDVLayout = React.lazy(() => import('../components/MobilePDVLayout'));
const PdvAccessBlocked = React.lazy(() => import('../components/PdvAccessBlocked'));
import { PrintConfirmationModal } from '../components/PrintConfirmationModal';
const VendaAvulsaModal = React.lazy(() => import('../components/VendaAvulsaModal'));
import { MaterialsPrintModal } from '../components/MaterialsPrintModal';
import { GenerateTableChoiceModal } from '../components/GenerateTableChoiceModal';
import { MaterialsPdfModal } from '../components/MaterialsPdfModal';
import { Customer, Order, Material, OrderItem, MaterialCategory } from '../types/pdv';
import { getCustomers, getMaterials, getActiveCustomer, getActiveOrder, setActiveCustomer, setActiveOrder, saveOrder, saveCustomer, findCustomerByName, getActiveCashRegister, hasSufficientFunds, getOrders, openCashRegister, addCashToRegister, addExpenseToCashRegister, removeCustomer, getMaterialCategories, getUserMaterialSettings, saveMaterial } from '../utils/supabaseStorage';
import { supabase } from '@/integrations/supabase/client';
import CategoryBar from '../components/CategoryBar';
import { createLogger } from '../utils/logger';
import { autoSaveSessionData, restoreSessionData } from '../utils/localStorage';
import { usePdvScaleMode } from '@/hooks/usePdvScaleMode';
const LOW_BALANCE_THRESHOLD = 50;

// Helper function to generate proper UUID
const generateUUID = () => {
  return crypto.randomUUID();
};

// **CORREÇÃO**: Função movida para fora do componente para se tornar uma função utilitária pura e estável.
// Helper para normalizar entrada de peso (vírgula para ponto)
const parseWeight = (weightInput: string): number => {
  if (!weightInput || weightInput.trim() === '') return 0;
  const normalized = weightInput.replace(',', '.');
  const weight = Number(normalized);
  return isNaN(weight) ? 0 : weight;
};

// Componentes memoizados para evitar re-renders desnecessários
const MemoizedOrderList = memo(OrderList);
const MemoizedOrderDetails = memo(OrderDetails);
const MemoizedMaterialGrid = memo(MaterialGrid);
const MemoizedNumberPad = memo(NumberPadOptimized);
const MemoizedFooter = memo(Footer);
const Index: React.FC = () => {
  const navigate = useNavigate();
  
  // Create logger for this component
  const logger = createLogger('[PDV]');

  // Stock calculation hook
  const { calculateMaterialStock, calculateMultipleMaterialsStock, isLoadingStock, clearCache } = useStockCalculation();
  const pdvAccess = usePdvAccessControl();
  const { logAction } = useEmployeeActionLog();

  // Hooks de responsividade
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // TODOS OS HOOKS DEVEM SER DECLARADOS PRIMEIRO, ANTES DE QUALQUER RETURN CONDICIONAL
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [activeOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedMaterialModal, setSelectedMaterialModal] = useState<Material | null>(null);
  // CORREÇÃO DE DUPLICAÇÃO: trava síncrona contra adições concorrentes do mesmo item ao pedido
  const isAddingItemRef = useRef<boolean>(false);
  const [pesoInput, setPesoInput] = useState("");
  const [showWeightAlert, setShowWeightAlert] = useState(false);
  const [showOrderCompletionModal, setShowOrderCompletionModal] = useState(false);
  const [isSaleMode, setIsSaleMode] = useState<boolean>(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showErrorReportModal, setShowErrorReportModal] = useState(false);
  const [showPrintConfirmModal, setShowPrintConfirmModal] = useState(false);
  const [showMaterialsPrintModal, setShowMaterialsPrintModal] = useState(false);
  const [showGenerateTableModal, setShowGenerateTableModal] = useState(false);
  const [showMaterialsPdfModal, setShowMaterialsPdfModal] = useState(false);
  const [showVendaAvulsaModal, setShowVendaAvulsaModal] = useState(false);
  const [vendaAvulsaStockMap, setVendaAvulsaStockMap] = useState<Record<string, number>>({});
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Calcular estoque ao abrir modal de venda avulsa
  useEffect(() => {
    if (showVendaAvulsaModal && materials.length > 0) {
      const loadStock = async () => {
        const materialNames = materials.map(m => m.name);
        const stockResult = await calculateMultipleMaterialsStock(materialNames);
        // Converter de {materialName: stock} para {materialId: stock}
        const stockById: Record<string, number> = {};
        materials.forEach(mat => {
          stockById[mat.id] = stockResult[mat.name] || 0;
        });
        setVendaAvulsaStockMap(stockById);
      };
      loadStock();
    }
  }, [showVendaAvulsaModal, materials, calculateMultipleMaterialsStock]);
  
  // Category states
  const [useCategoriesEnabled, setUseCategoriesEnabled] = useState(false);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [materialSearch, setMaterialSearch] = useState("");
  const filteredMaterials = useMemo(() => {
    const q = materialSearch.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter(m => m.name?.toLowerCase().includes(q));
  }, [materials, materialSearch]);
  
  const { unreadCount, notifications, isLoading: isLoadingNotifications, markAsRead, markAllAsRead } = useNotifications();

  // Cash register states
  const [showCashRegisterOpeningModal, setShowCashRegisterOpeningModal] = useState(false);
  const [showCashRegisterAddFundsModal, setShowCashRegisterAddFundsModal] = useState(false);
  const [showCashRegisterClosingModal, setShowCashRegisterClosingModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState<boolean>(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState<boolean>(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const pdvScale = usePdvScaleMode();
  const isAutoScale = pdvScale.mode === 'automatic';
  const autoModeProp = isAutoScale ? {
    connected: pdvScale.scale.connected,
    weight: pdvScale.scale.weight,
    stable: pdvScale.scale.lastReading?.stable,
    error: pdvScale.scale.error,
    nickname: pdvScale.scale.config?.nickname,
    onReconnect: () => pdvScale.scale.connect(),
    onZero: () => pdvScale.scale.requestWeight(),
    onUseManual: () => pdvScale.setOverrideManual(true),
  } : null;
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isCheckingCashRegister, setIsCheckingCashRegister] = useState(true);
  const [pendingOrderForInsufficientFunds, setPendingOrderForInsufficientFunds] = useState<Order | null>(null);
  const [orderListRefreshKey, setOrderListRefreshKey] = useState(0); // Para forçar refresh da lista de pedidos
  const [insufficientFundsDetails, setInsufficientFundsDetails] = useState<{
    required: number;
    current: number;
    missing: number;
  } | null>(null);
  const { user } = useAuth();
  
  // Hook do onboarding
  const { 
    isOnboardingActive, 
    progress, 
    completeStep, 
    skipOnboarding, 
    shouldOpenCashRegister, 
    clearOpenCashRegisterRequest 
  } = useOnboarding();
  // isPDVTutorialActive removido (banner substituiu o tutorial com spotlight)
  
  // Efeito para abrir o modal de caixa quando solicitado pelo onboarding checklist
  useEffect(() => {
    if (shouldOpenCashRegister && !isCashRegisterOpen) {
      clearOpenCashRegisterRequest();
      setShowWelcomeScreen(false);
      setShowCashRegisterOpeningModal(true);
    }
  }, [shouldOpenCashRegister, isCashRegisterOpen, clearOpenCashRegisterRequest]);
  
  // Ref para controlar a aba do mobile layout
  const mobileTabSetterRef = useRef<((tab: 'scale' | 'materials' | 'orders' | 'menu') => void) | null>(null);
  
  // Listener global de teclado para inserir números na balança
  useEffect(() => {
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
        setPesoInput(prevPeso => {
          const currentStr = (parseFloat(prevPeso || '0') * 1000).toFixed(0).padStart(6, '0');
          const newStr = (currentStr + e.key).slice(-9);
          return (parseInt(newStr) / 1000).toString();
        });
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        setPesoInput(prevPeso => {
          const currentStr = (parseFloat(prevPeso || '0') * 1000).toFixed(0).padStart(6, '0');
          const newStr = ('0' + currentStr.slice(0, -1)).slice(-9);
          return (parseInt(newStr) / 1000).toString();
        });
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setPesoInput('');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);
  
  // Callback para navegar para a aba da balança (usado pelo MaterialModal)
  const handleNavigateToScale = useCallback(() => {
    if (mobileTabSetterRef.current) {
      mobileTabSetterRef.current('scale');
    }
  }, []);
  
  // Callback para navegar para a aba de pedidos (usado pelo MaterialModal)
  const handleNavigateToOrders = useCallback(() => {
    if (mobileTabSetterRef.current) {
      mobileTabSetterRef.current('orders');
    }
  }, []);
  
  // Callback para armazenar o setter da aba mobile
  const setMobileTabSetter = useCallback((setter: (tab: 'scale' | 'materials' | 'orders' | 'menu') => void) => {
    mobileTabSetterRef.current = setter;
  }, []);

  // Memoized calculations para melhor performance
  const totalMaterial = useMemo(() => {
    if (!selectedMaterialModal || !pesoInput) return 0;
    return selectedMaterialModal.price * (Number(pesoInput) || 0);
  }, [selectedMaterialModal, pesoInput]);
  const pesoModal = useMemo(() => pesoInput || "0", [pesoInput]);

  // Helper function to validate UUID format - otimizada com useCallback
  const isValidUUID = useCallback((uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }, []);

  // Load category settings
  const loadCategorySettings = useCallback(async () => {
    try {
      const [settings, cats] = await Promise.all([
        getUserMaterialSettings(),
        getMaterialCategories()
      ]);
      setUseCategoriesEnabled(settings?.use_categories ?? false);
      setCategories(cats);
    } catch (error) {
      logger.error('Error loading category settings:', error);
    }
  }, []);

  // Otimizar carregamento de dados com Promise.all e restauração de sessão
  const loadData = useCallback(async () => {
    try {
      logger.debug('Loading data with session restoration...');
      
      // Limpar pedidos vazios do banco antes de carregar dados
      await cleanupEmptyOrdersFromDatabase();
      
      setCustomers([]);
      setCurrentCustomer(null);
      setCurrentOrder(null);

      // Paralelizar requests para melhor performance
      const [materialsFromSupabase, sessionData] = await Promise.all([getMaterials(), restoreSessionData()]);
      
      // Load category settings
      await loadCategorySettings();
      setMaterials(materialsFromSupabase);
      if (sessionData) {
        const {
          customers,
          activeCustomer,
          activeOrder
        } = sessionData;
        logger.debug('Restored session data:', {
          customersCount: customers.length,
          activeCustomer: activeCustomer?.name || 'none',
          activeOrder: activeOrder?.id || 'none',
          activeOrderItems: activeOrder?.items.length || 0
        });
        
        // Import cleanMaterialName to clean restored data
        const { cleanMaterialName } = await import('@/utils/materialNameCleaner');
        
        // Clean material names in all customer orders
        const cleanedCustomers = customers.map(customer => ({
          ...customer,
          orders: customer.orders.map(order => ({
            ...order,
            items: order.items.map(item => ({
              ...item,
              materialName: cleanMaterialName(item.materialName)
            }))
          }))
        }));
        
        // Clean activeOrder if it exists
        const cleanedActiveOrder = activeOrder ? {
          ...activeOrder,
          items: activeOrder.items.map(item => ({
            ...item,
            materialName: cleanMaterialName(item.materialName)
          }))
        } : null;
        
        setCustomers(cleanedCustomers);
        setCurrentCustomer(activeCustomer);
        setCurrentOrder(cleanedActiveOrder);

        // Set active states for UI sync
        if (activeCustomer) {
          setActiveCustomer(activeCustomer);
        }
        if (cleanedActiveOrder) {
          setActiveOrder(cleanedActiveOrder);
        }
      }
      setIsDataLoaded(true);
    } catch (error) {
      logger.error('Error loading data:', error);
      setIsDataLoaded(true);
    }
  }, [loadCategorySettings]);

  // CORRIGIDO: Verificação de caixa simplificada
  const checkCashRegister = useCallback(async () => {
    try {
      setIsCheckingCashRegister(true);
      logger.debug('Checking cash register status...');
      const activeCashRegister = await getActiveCashRegister();
      logger.debug('Active cash register:', activeCashRegister);
      if (activeCashRegister && activeCashRegister.status === 'open') {
        logger.debug('Active cash register found, opening PDV');
        setIsCashRegisterOpen(true);
        setShowWelcomeScreen(false);
        setCurrentBalance(activeCashRegister.currentAmount);
      } else {
        logger.debug('No active cash register found, showing welcome screen');
        setIsCashRegisterOpen(false);
        setShowWelcomeScreen(true);
        setCurrentBalance(0);
      }
    } catch (error) {
      logger.error('Error checking cash register:', error);
      // Em caso de erro, permitir que o usuário abra o caixa
      setIsCashRegisterOpen(false);
      setShowWelcomeScreen(true);
      setCurrentBalance(0);
    } finally {
      setIsCheckingCashRegister(false);
    }
  }, []);

  // Function to update cash register balance - otimizada
  const updateCashRegisterBalance = useCallback(async () => {
    try {
      const activeCashRegister = await getActiveCashRegister();
      if (activeCashRegister) {
        setCurrentBalance(activeCashRegister.currentAmount);
      }
    } catch (error) {
      logger.error('Error updating cash register balance:', error);
    }
  }, []);
  

  // Função para abrir o modal de novo pedido quando não há pedido ativo
  const handleNewOrderRequest = useCallback(() => {
    setShowNewOrderModal(true);
  }, []);

  // Função para criar um novo pedido a partir do modal
  const handleCreateNewOrder = useCallback(async (customerName?: string) => {
    const orderId = generateUUID();
    const name = customerName || "# Nome Cliente";
    
    // Tentar reutilizar cliente existente por nome
    let customerId: string = generateUUID();
    const existingCustomer = name && !['# Nome Cliente', '# Nome do Cliente', 'Cliente sem nome'].includes(name)
      ? await findCustomerByName(name)
      : undefined;
    if (existingCustomer) {
      customerId = existingCustomer.id as string;
    }

    const newCustomer: Customer = {
      id: customerId,
      name,
      orders: []
    };
    const newOrder: Order = {
      id: orderId,
      customerId: customerId,
      items: [],
      total: 0,
      timestamp: Date.now(),
      status: 'open',
      type: isSaleMode ? "venda" : "compra"
    };
    const updatedCustomer = {
      ...newCustomer,
      orders: [newOrder]
    };
    try {
      logger.debug('Creating new customer and order:', updatedCustomer);
      await saveCustomer(updatedCustomer);
      await saveOrder(newOrder);
      logger.success('New customer and order created successfully');
    } catch (error) {
      logger.error('Error creating new customer and order:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar novo pedido. Tente novamente.",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    setCurrentCustomer(updatedCustomer);
    setCurrentOrder(newOrder);
    setCustomers(prev => {
      const exists = prev.some(c => c.id === customerId);
      if (exists) return prev.map(c => c.id === customerId ? updatedCustomer : c);
      return [...prev, updatedCustomer];
    });

    // Auto-save session data for new order
    await autoSaveSessionData(updatedCustomer, newOrder);
    setShowNewOrderModal(false);
  }, [isSaleMode]);

  // Handlers otimizados com useCallback
  const handleOpenRegisterClick = useCallback(() => {
    logger.debug('Opening cash register...');
    setShowWelcomeScreen(false);
    setShowCashRegisterOpeningModal(true);
  }, []);
  const handleCustomerDeleted = useCallback(async () => {
    logger.debug('Customer deleted, reloading data...');
    await loadData();
  }, [loadData]);
  const handleOrderDeleted = useCallback(async (customerId: string, orderId: string) => {
    logger.debug('Order deleted, reloading data...');
    await loadData();
  }, [loadData]);
  const handleCashRegisterOpened = useCallback(async (register: any) => {
    logger.success('Cash register opened successfully:', register);
    setIsCashRegisterOpen(true);
    setShowCashRegisterOpeningModal(false);
    setShowWelcomeScreen(false);
    setCurrentBalance(register.currentAmount);
    logAction('cash_open', `Caixa aberto com R$ ${register.currentAmount?.toFixed(2) || '0.00'}`, 'cash_register', register.id, { initial_amount: register.currentAmount });
    // Concluir etapa 3 do onboarding ao abrir o caixa pela primeira vez
    if (isOnboardingActive && progress.currentStep === 3) {
      try {
        await completeStep(3);
      } catch (e) {
        console.error('Erro ao concluir etapa 3 do onboarding:', e);
      }
    }
    await loadData();
  }, [loadData, logAction, isOnboardingActive, progress.currentStep, completeStep]);
  const handleNumberPadSubmit = useCallback((value: number) => {
    setPesoInput(String(value));
  }, []);
  const handleMenuClick = useCallback(() => {
    // Handled in Footer component
  }, []);

  // Otimizar formatação de peso
  const formatPeso = useCallback((value: string | number) => {
    if (!value) return "0,000/kg";
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).replace('.', ',') + "/kg";
  }, []);
  const createNewOrder = async (customer: Customer) => {
    const orderId = generateUUID();
    const newOrder: Order = {
      id: orderId,
      customerId: customer.id,
      items: [],
      total: 0,
      timestamp: Date.now(),
      status: 'open',
      type: isSaleMode ? "venda" : "compra"
    };
    const updatedCustomer = {
      ...customer,
      orders: [...customer.orders.filter(o => o.status !== 'open'), newOrder]
    };
    try {
      console.log('Creating new order for customer:', updatedCustomer);
      await saveCustomer(updatedCustomer);
      await saveOrder(newOrder);
      console.log('New order created and saved successfully');
    } catch (error) {
      console.error('Error creating new order:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar novo pedido. Tente novamente.",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    setCurrentCustomer(updatedCustomer);
    setCurrentOrder(newOrder);
    setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));

    // Auto-save session data for new order
    await autoSaveSessionData(updatedCustomer, newOrder);
  };
  const handleSelectCustomer = async (customer: Customer | null) => {
    if (!customer) {
      setCurrentCustomer(null);
      setCurrentOrder(null);
      loadData(); // Reload the data to get the updated list of customers
      return;
    }
    let targetCustomer = customers.find(c => c.id === customer.id);
    if (!targetCustomer) {
      // Ensure the customer has a valid UUID
      const validCustomer = {
        ...customer,
        id: isValidUUID(customer.id) ? customer.id : generateUUID()
      };
      targetCustomer = validCustomer;
      try {
        console.log('Saving new customer to Supabase:', targetCustomer);
        await saveCustomer(targetCustomer);
        console.log('New customer saved successfully');
        setCustomers(prev => [...prev, targetCustomer!]);
      } catch (error) {
        console.error('Error saving new customer:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar cliente. Tente novamente.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
    }
    setCurrentCustomer(targetCustomer);
    const openOrder = targetCustomer.orders.find(o => o.status === 'open');
    if (openOrder) {
      // Import cleanMaterialName to clean material names when selecting customer
      const { cleanMaterialName } = await import('@/utils/materialNameCleaner');
      const cleanedOrder = {
        ...openOrder,
        items: openOrder.items.map(item => ({
          ...item,
          materialName: cleanMaterialName(item.materialName)
        }))
      };
      setCurrentOrder(cleanedOrder);
    } else {
      await createNewOrder(targetCustomer);
    }
  };

  // **CORREÇÃO**: Função envolvida em useCallback para evitar 'stale closures'.
  // Agora ela sempre terá acesso ao `pesoInput` mais recente.
  const handleSelectMaterial = useCallback(async (material: Material) => {
    // 1. Validação de peso unificada no início da função
    const peso = parseWeight(pesoInput);
    console.log('🔍 Validando peso no início:', { pesoInput, peso, isValid: peso > 0 });

    

    // A partir daqui, o peso é considerado válido.
    let orderToUse = activeOrder;
    let customerToUse = currentCustomer;
    
    
    // 2. Cria um pedido automaticamente se não houver um ativo
    if (!customerToUse || !orderToUse) {
      console.log('Nenhum pedido ativo. Criando um novo automaticamente...');
      try {
        const newCustomerId = generateUUID();
        const newOrderId = generateUUID();
        
        const newCustomer: Customer = {
          id: newCustomerId,
          name: "# Nome do Cliente",
          orders: []
        };

        const newOrder: Order = {
          id: newOrderId,
          customerId: newCustomerId,
          items: [],
          total: 0,
          status: 'open' as const,
          timestamp: Date.now(),
          type: isSaleMode ? 'venda' as const : 'compra' as const
        };

        newCustomer.orders = [newOrder];
        
        // Salva e atualiza o estado
        await saveCustomer(newCustomer);
        await saveOrder(newOrder);
        
        setCustomers(prev => [...prev, newCustomer]);
        setCurrentCustomer(newCustomer);
        setCurrentOrder(newOrder);
        setActiveCustomer(newCustomer);
        setActiveOrder(newOrder);
        
        // Atualiza as variáveis locais para o restante da função
        customerToUse = newCustomer;
        orderToUse = newOrder;

        await autoSaveSessionData(newCustomer, newOrder);
        console.log('Pedido automático criado com sucesso.');

      } catch (error) {
        console.error('Erro ao criar pedido automaticamente:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar o pedido automaticamente. Tente novamente.",
          variant: "destructive",
          duration: 3000
        });
        return; // Para a execução em caso de falha
      }
    }
    
    // 3. Verifica a compatibilidade do tipo de operação (compra/venda)
    if (orderToUse.items.length > 0) {
      const existingType = orderToUse.type;
      const currentType = isSaleMode ? 'venda' : 'compra';
      if (existingType && existingType !== currentType) {
        toast({
          title: "Tipo de operação incompatível",
          description: `Não é possível misturar itens de ${existingType} com ${currentType} no mesmo pedido.`,
          variant: "destructive",
          duration: 4000
        });
        return;
      }
    }
    
    // 4. Se tudo estiver certo, abre o modal do material
    console.log('Peso válido e pedido OK. Abrindo modal do material.');
    setSelectedMaterialModal(material);
  }, [activeOrder, currentCustomer, isSaleMode, pesoInput]);
  
  const handleAddMaterialToOrder = async (taraValue: number = 0, adjustedPrice?: number, netWeight?: number) => {
    // Use netWeight if provided (from MaterialModal), otherwise calculate from pesoInput
    const weight = netWeight !== undefined ? netWeight : Number(pesoInput);
    
    if (!selectedMaterialModal || !currentCustomer || !activeOrder || weight <= 0) {
      toast({
        title: "Erro",
        description: "Peso inválido ou cliente não selecionado",
        variant: "destructive",
        duration: 2000
      });
      return;
    }

    // CORREÇÃO DE DUPLICAÇÃO: trava síncrona contra disparos concorrentes
    // (clique duplo, Enter repetido ou rede lenta produziam itens duplicados no banco)
    if (isAddingItemRef.current) {
      console.warn('handleAddMaterialToOrder ignored: add already in progress');
      return;
    }
    isAddingItemRef.current = true;

    // Capture refs locais ANTES de qualquer await para evitar leitura stale
    const capturedMaterial = selectedMaterialModal;
    const capturedOrder = activeOrder;
    const capturedCustomer = currentCustomer;

    // Fechar o modal imediatamente para impedir cliques/Enter adicionais
    setSelectedMaterialModal(null);

    // Use the provided netWeight or calculate net weight (gross - tare)
    const finalNetWeight = netWeight !== undefined ? weight : Math.max(0, weight - taraValue);

    // Use the adjusted price if provided, otherwise use default price based on mode
    const price = adjustedPrice !== undefined ? adjustedPrice : isSaleMode ? capturedMaterial.salePrice : capturedMaterial.price;

    // CRITICAL: Use the EXACT material name from the selected modal without any modification
    const exactMaterialName = String(capturedMaterial.name).trim();
    // Calcular preço original baseado no modo (compra/venda)
    const originalPrice = isSaleMode ? capturedMaterial.salePrice : capturedMaterial.price;
    // Calcular ajuste de preço (diferença entre preço praticado e original)
    const priceAdjustment = price - originalPrice;
    
    const newItem: OrderItem = {
      materialId: capturedMaterial.id,
      materialName: exactMaterialName,
      quantity: finalNetWeight,
      price: price,
      total: price * finalNetWeight,
      tara: taraValue > 0 ? taraValue : undefined,
      originalPrice: originalPrice,
      priceAdjustment: priceAdjustment
    };

    const updatedOrder = {
      ...capturedOrder,
      items: [...capturedOrder.items, newItem],
      total: capturedOrder.total + newItem.total,
      type: isSaleMode ? 'venda' as const : 'compra' as const
    };
    const updatedCustomer = {
      ...capturedCustomer,
      orders: capturedCustomer.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
    };
    try {
      await saveOrder(updatedOrder);
      await saveCustomer(updatedCustomer);
      
      // Save to local history for backup
      saveOrderToLocalHistory(updatedOrder, updatedCustomer.name);
    } catch (error) {
      console.error('Error saving order with new item:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar item no pedido. Tente novamente.",
        variant: "destructive",
        duration: 3000
      });
      isAddingItemRef.current = false;
      return;
    }
    setCurrentOrder(updatedOrder);
    setCurrentCustomer(updatedCustomer);
    setActiveOrder(updatedOrder);
    setActiveCustomer(updatedCustomer);
    setCustomers(prev => prev.map(c => c.id === capturedCustomer.id ? updatedCustomer : c));

    // Auto-save session data after adding item
    await autoSaveSessionData(updatedCustomer, updatedOrder);
    setPesoInput("");
    isAddingItemRef.current = false;
  };

  // Handler para Venda Avulsa - adiciona item manual ao pedido
  const handleVendaAvulsa = async (nome: string, quantidade: number, valor: number, costPrice: number, linkedMaterialId?: string, linkedStockQuantity?: number, linkedMaterialName?: string) => {
    // CORREÇÃO DE DUPLICAÇÃO: trava síncrona contra disparos concorrentes
    if (isAddingItemRef.current) {
      console.warn('handleVendaAvulsa ignored: add already in progress');
      return;
    }
    isAddingItemRef.current = true;

    let orderToUse = activeOrder;
    let customerToUse = currentCustomer;
    let isNewCustomer = false;

    // Criar pedido automaticamente se não houver ativo
    if (!customerToUse || !orderToUse) {
      try {
        const newCustomerId = generateUUID();
        const newOrderId = generateUUID();
        const newCustomer: Customer = { id: newCustomerId, name: "# Nome do Cliente", orders: [] };
        const newOrder: Order = {
          id: newOrderId, customerId: newCustomerId, items: [], total: 0,
          status: 'open', timestamp: Date.now(), type: 'venda'
        };
        newCustomer.orders = [newOrder];
        await saveCustomer(newCustomer);
        await saveOrder(newOrder);
        customerToUse = newCustomer;
        orderToUse = newOrder;
        isNewCustomer = true;
      } catch (error) {
        console.error('Erro ao criar pedido para venda avulsa:', error);
        toast({ title: "Erro", description: "Não foi possível criar o pedido.", variant: "destructive", duration: 3000 });
        isAddingItemRef.current = false;
        return;
      }
    }

    // Verificar compatibilidade de tipo
    if (orderToUse.items.length > 0 && orderToUse.type !== 'venda') {
      toast({ title: "Tipo incompatível", description: "Este pedido é de compra. A venda avulsa só pode ser adicionada a pedidos de venda.", variant: "destructive", duration: 4000 });
      isAddingItemRef.current = false;
      return;
    }

    const newItem: OrderItem = {
      materialId: linkedMaterialId || 'avulso',
      materialName: nome,
      quantity: quantidade,
      price: valor,
      total: quantidade * valor,
      originalPrice: valor,
      priceAdjustment: 0,
      costPrice: costPrice,
      linkedStockQuantity: linkedStockQuantity,
      linkedMaterialName: linkedMaterialName,
    };

    const updatedOrder = {
      ...orderToUse,
      items: [...orderToUse.items, newItem],
      total: orderToUse.total + newItem.total,
      type: 'venda' as const
    };
    const updatedCustomer = {
      ...customerToUse!,
      orders: customerToUse!.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
    };

    try {
      await saveOrder(updatedOrder);
      await saveCustomer(updatedCustomer);
      saveOrderToLocalHistory(updatedOrder, updatedCustomer.name);
    } catch (error) {
      console.error('Erro ao salvar venda avulsa:', error);
      toast({ title: "Erro", description: "Erro ao salvar item. Tente novamente.", variant: "destructive", duration: 3000 });
      isAddingItemRef.current = false;
      return;
    }

    setCurrentOrder(updatedOrder);
    setCurrentCustomer(updatedCustomer);
    setActiveOrder(updatedOrder);
    setActiveCustomer(updatedCustomer);
    if (isNewCustomer) {
      setCustomers(prev => [...prev, updatedCustomer]);
    } else {
      setCustomers(prev => prev.map(c => c.id === customerToUse!.id ? updatedCustomer : c));
    }
    await autoSaveSessionData(updatedCustomer, updatedOrder);
    isAddingItemRef.current = false;

    // Toast de confirmação removido conforme solicitação do usuário
  };
  const handleDeleteOrderItem = async (index: number) => {
    if (!currentCustomer || !activeOrder) return;
    const itemToRemove = activeOrder.items[index];
    const updatedItems = [...activeOrder.items];
    updatedItems.splice(index, 1);
    const updatedOrder = {
      ...activeOrder,
      items: updatedItems,
      total: activeOrder.total - itemToRemove.total
    };
    const updatedCustomer = {
      ...currentCustomer,
      orders: currentCustomer.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
    };
    try {
      console.log('Saving updated order after item deletion:', updatedOrder);
      await saveOrder(updatedOrder);
      await saveCustomer(updatedCustomer);
      
      // Save to local history for backup
      saveOrderToLocalHistory(updatedOrder, updatedCustomer.name);
      
      console.log('Order updated after deletion successfully');
    } catch (error) {
      console.error('Error saving order after deletion:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover item do pedido. Tente novamente.",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    setCurrentOrder(updatedOrder);
    setCurrentCustomer(updatedCustomer);
    setActiveOrder(updatedOrder);
    setActiveCustomer(updatedCustomer);
    setCustomers(prev => prev.map(c => c.id === currentCustomer.id ? updatedCustomer : c));

    // Auto-save session data after removing item
    await autoSaveSessionData(updatedCustomer, updatedOrder);
  };

  // Function to calculate current stock for a material using unified approach
  const getCurrentStock = async (materialName: string): Promise<number> => {
    try {
      // Use the unified stock calculation from the hook
      return await calculateMaterialStock(materialName);
    } catch (error) {
      console.error('Error calculating current stock:', error);
      return 0;
    }
  };

  // Função auxiliar para auto-cadastrar itens avulsos no estoque
  const autoRegisterAvulsoItem = async (item: OrderItem): Promise<boolean> => {
    try {
      if (!user) return false;

      // 1. Verificar se material já existe (case-insensitive)
      const { data: existingMaterials } = await supabase
        .from('materials')
        .select('id, name')
        .eq('user_id', user.id)
        .ilike('name', item.materialName.trim());

      let materialId: string;

      if (existingMaterials && existingMaterials.length > 0) {
        // Material já existe, usar o ID existente
        materialId = existingMaterials[0].id;
        console.log('Auto-register: material already exists, id:', materialId);
      } else {
        // 2. Criar material novo - usar costPrice se disponível
        materialId = generateUUID();
        const costPrice = item.costPrice || item.price;
        const newMaterial: Material = {
          id: materialId,
          name: item.materialName.trim(),
          price: costPrice,
          salePrice: item.price,
          unit: 'kg',
          user_id: user.id,
        };
        await saveMaterial(newMaterial);
        console.log('Auto-register: new material created, id:', materialId);
      }

      // 3. Criar ordem de compra completa para dar entrada no estoque
      const purchaseCustomerId = generateUUID();
      const purchaseCustomer: Customer = {
        id: purchaseCustomerId,
        name: '__auto_stock_entry__',
        orders: [],
      };
      await saveCustomer(purchaseCustomer);

      // Usar costPrice para a ordem de compra (não o preço de venda)
      const costPrice = item.costPrice || item.price;
      const purchaseOrderId = generateUUID();
      const purchaseTotal = item.quantity * costPrice;

      // Salvar ordem diretamente no Supabase SEM passar por saveOrder,
      // para evitar criação de cash_transaction e alteração do saldo do caixa.
      // Esta compra é apenas virtual (entrada de estoque), não uma saída real de dinheiro.
      const { error: orderError } = await supabase
        .from('orders')
        .upsert({
          id: purchaseOrderId,
          customer_id: purchaseCustomerId,
          total: purchaseTotal,
          status: 'completed',
          type: 'compra',
          user_id: user.id,
          created_at: new Date().toISOString(),
        });

      if (orderError) {
        console.error('Error saving virtual purchase order:', orderError);
        return false;
      }

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert([{
          order_id: purchaseOrderId,
          material_id: materialId,
          material_name: item.materialName.trim(),
          quantity: item.quantity,
          price: costPrice,
          total: purchaseTotal,
          user_id: user.id,
        }]);

      if (itemsError) {
        console.error('Error saving virtual purchase order items:', itemsError);
        return false;
      }

      console.log('Auto-register: virtual purchase order created for stock entry (no cash impact)');

      // 4. Limpar cache de estoque
      clearCache();

      return true;
    } catch (error) {
      console.error('Error auto-registering avulso item:', error);
      toast({
        title: "Erro",
        description: `Falha ao cadastrar item avulso "${item.materialName}" automaticamente.`,
        variant: "destructive",
        duration: 5000
      });
      return false;
    }
  };

  // MODIFICADO: Nova lógica para verificação de saldo insuficiente
  const handleInitiateCompleteOrder = async () => {
    if (!currentCustomer || !activeOrder || activeOrder.items.length === 0) {
      return;
    }

    // Check stock for sales mode with improved validation
    if (isSaleMode) {
      // Clear cache before validation to ensure fresh data
      clearCache();
      
      for (const item of activeOrder.items) {
          // Itens avulsos sem vínculo de estoque não são validados (são off-catalog)
          const isAvulsoSemVinculo = item.materialId === 'avulso' && !item.linkedMaterialName;
          if (isAvulsoSemVinculo) continue;

          // Para itens com material vinculado via venda avulsa, usar linkedStockQuantity e linkedMaterialName
          const stockMaterialName = item.linkedMaterialName || item.materialName;
          const stockQuantityNeeded = item.linkedStockQuantity || item.quantity;
          const currentStock = await calculateMaterialStock(stockMaterialName, true);

          console.log('Stock validation:', {
            material: stockMaterialName,
            currentStock,
            requiredQuantity: stockQuantityNeeded,
            hasEnoughStock: isGreaterThanOrEqual(currentStock, stockQuantityNeeded)
          });

          if (!isGreaterThanOrEqual(currentStock, stockQuantityNeeded)) {
            toast({
              title: "Estoque insuficiente",
              description: `Material "${stockMaterialName}" não possui estoque suficiente. Estoque atual: ${formatWeight(currentStock)}kg, Necessário: ${formatWeight(stockQuantityNeeded)}kg`,
              variant: "destructive",
              duration: 5000
            });
            return;
          }
      }
    }

    // Verificar saldo apenas para pedidos de compra (não para vendas)
    if (!isSaleMode) {
      const orderType = 'compra';
      const hasFunds = await hasSufficientFunds(activeOrder.total, orderType);
      if (!hasFunds) {
        // NOVO FLUXO: Não mostrar modal de saldo insuficiente, solicitar senha imediatamente
        const activeCashRegister = await getActiveCashRegister();
        const currentAmount = activeCashRegister?.currentAmount || 0;
        const required = activeOrder.total;
        const missing = required - currentAmount;

        // Salvar detalhes do saldo insuficiente
        setPendingOrderForInsufficientFunds(activeOrder);
        setInsufficientFundsDetails({
          required: required,
          current: currentAmount,
          missing: missing
        });

        // Solicitar senha imediatamente
        setShowPasswordModal(true);
        return;
      }
    }

    // Se chegou até aqui, pode prosseguir com a finalização
    setShowOrderCompletionModal(true);
  };

  // NOVO: Função para lidar com autenticação de senha para saldo insuficiente
  const handlePasswordAuthenticatedForInsufficientFunds = () => {
    setShowPasswordModal(false);

    // Abrir modal de adicionar saldo com as informações detalhadas
    setShowCashRegisterAddFundsModal(true);
  };
  const handleCompleteOrder = async () => {
    if (!currentCustomer || !activeOrder || activeOrder.items.length === 0) {
      console.log('Cannot complete order: missing customer or order');
      return;
    }
    try {
      console.log('Starting order completion process...');

      // Final stock check for sales mode with improved validation
      if (isSaleMode) {
      for (const item of activeOrder.items) {
          // Itens avulsos sem vínculo de estoque não são validados (são off-catalog)
          const isAvulsoSemVinculo = item.materialId === 'avulso' && !item.linkedMaterialName;
          if (isAvulsoSemVinculo) continue;

          const stockMaterialName = item.linkedMaterialName || item.materialName;
          const stockQuantityNeeded = item.linkedStockQuantity || item.quantity;
          const currentStock = await calculateMaterialStock(stockMaterialName, true);

          console.log('Final stock validation:', {
            material: stockMaterialName,
            currentStock,
            requiredQuantity: stockQuantityNeeded,
            hasEnoughStock: isGreaterThanOrEqual(currentStock, stockQuantityNeeded)
          });

          if (!isGreaterThanOrEqual(currentStock, stockQuantityNeeded)) {
            toast({
              title: "Estoque insuficiente",
              description: `Material "${stockMaterialName}" não possui estoque suficiente. Estoque atual: ${formatWeight(currentStock)}kg, Necessário: ${formatWeight(stockQuantityNeeded)}kg`,
              variant: "destructive",
              duration: 5000
            });
            return;
          }
        }
      }

      // Final check for sufficient funds only for purchase orders
      const orderType = isSaleMode ? 'venda' : 'compra';
      const hasFunds = await hasSufficientFunds(activeOrder.total, orderType);
      if (!hasFunds && !isSaleMode) {
        // Se não há fundos suficientes, não deve chegar aqui, mas como segurança
        toast({
          title: "Saldo insuficiente",
          description: "Adicione saldo ao caixa antes de finalizar o pedido.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }

      // Ensure all IDs are valid UUIDs before saving
      const validatedOrder = {
        ...activeOrder,
        id: isValidUUID(activeOrder.id) ? activeOrder.id : generateUUID(),
        customerId: isValidUUID(activeOrder.customerId) ? activeOrder.customerId : currentCustomer.id,
        status: 'completed' as const,
        type: isSaleMode ? 'venda' as const : 'compra' as const
      };
      const validatedCustomer = {
        ...currentCustomer,
        id: isValidUUID(currentCustomer.id) ? currentCustomer.id : generateUUID(),
        orders: currentCustomer.orders.map(o => o.id === validatedOrder.id ? validatedOrder : o)
      };
      console.log('Attempting to save completed order to Supabase...');
      console.log('Validated Order:', validatedOrder);
      console.log('Validated Customer:', validatedCustomer);
      console.log('Step 1: Saving customer...');
      await saveCustomer(validatedCustomer);
      console.log('Customer saved successfully');
      console.log('Step 2: Saving completed order...');
      await saveOrder(validatedOrder);
      console.log('Order saved successfully');
      
      // Clear stock cache to ensure fresh data for next operations
      clearCache();
      console.log('Stock cache cleared after order completion');

      // Save to local history for backup
      saveOrderToLocalHistory(validatedOrder, validatedCustomer.name);

      // Log employee action
      const actionType = isSaleMode ? 'sale_create' : 'purchase_create';
      logAction(actionType, `${isSaleMode ? 'Venda' : 'Compra'} finalizada - ${validatedCustomer.name} - R$ ${validatedOrder.total.toFixed(2)}`, 'order', validatedOrder.id, { total: validatedOrder.total, items_count: validatedOrder.items.length, customer: validatedCustomer.name });

      // Update cash register balance after order completion
      await updateCashRegisterBalance();

      // Remove the completed customer from local state since they no longer have open orders
      const updatedCustomers = customers.filter(c => c.id !== validatedCustomer.id);
      setCustomers(updatedCustomers);

      // Clear current selection - no automatic creation of default orders
      setCurrentCustomer(null);
      setCurrentOrder(null);
      setActiveCustomer(null);
      setActiveOrder(null);
      setShowOrderCompletionModal(false);
      
      // Forçar refresh da lista de pedidos
      setOrderListRefreshKey(prev => prev + 1);
      
      // Navegar para a aba da balança em mobile/tablet após finalizar pedido
      if (mobileTabSetterRef.current) {
        mobileTabSetterRef.current('scale');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        title: "Erro ao salvar",
        description: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Tente novamente.`,
        variant: "destructive",
        duration: 5000
      });
    }
  };
  const handlePrintOrder = () => {
    // Implementa impressão direta do pedido
    if (!currentCustomer || !activeOrder) return;
    
    // Chama handleCompleteOrder primeiro para salvar
    handleCompleteOrder().then(() => {
      // Fecha o modal após salvar
      setShowOrderCompletionModal(false);
    });
  };
  const handleSaleModeToggle = async (checked: boolean) => {
    // Verificar se há pedido ativo com itens - bloquear troca se houver
    if (activeOrder && activeOrder.items.length > 0) {
      const tipoAtual = activeOrder.type === 'venda' ? 'Venda' : 'Compra';
      toast({
        title: "Não é possível alterar o modo",
        description: `Este pedido já contém itens de ${tipoAtual}. Finalize ou cancele o pedido atual para trocar de modo.`,
        variant: "destructive",
        duration: 4000
      });
      return; // Bloquear a troca
    }

    setIsSaleMode(checked);
    localStorage.setItem('pdv_sale_mode', String(checked));

    // Atualizar o tipo do pedido vazio (se existir)
    if (activeOrder && currentCustomer) {
      const updatedOrder = {
        ...activeOrder,
        type: checked ? 'venda' as const : 'compra' as const
      };
      const updatedCustomer = {
        ...currentCustomer,
        orders: currentCustomer.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
      };
      try {
        console.log('Saving order after mode toggle:', updatedOrder);
        await saveOrder(updatedOrder);
        await saveCustomer(updatedCustomer);
        console.log('Order updated after mode toggle successfully');
      } catch (error) {
        console.error('Error saving order after mode toggle:', error);
        toast({
          title: "Erro",
          description: "Erro ao alterar modo. Tente novamente.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
      setCurrentOrder(updatedOrder);
      setCurrentCustomer(updatedCustomer);
      setActiveOrder(updatedOrder);
      setActiveCustomer(updatedCustomer);
      setCustomers(prev => prev.map(c => c.id === currentCustomer.id ? updatedCustomer : c));
    }
  };
  const handlePasswordAuthenticated = () => {
    if (pendingNavigation) {
      import('@/components/MenuAuthGate').then(m => m.setMenuAuthenticated());
      navigate(pendingNavigation);
      setPendingNavigation(null);
    } else if (pendingOrderForInsufficientFunds) {
      // Se há um pedido pendente por saldo insuficiente, abrir modal de adicionar saldo
      handlePasswordAuthenticatedForInsufficientFunds();
    }
  };

  // NOVO: Função para lidar com adição de saldo após saldo insuficiente
  const handleAddFundsForInsufficientBalance = useCallback(async (addedAmount?: number) => {
    setShowCashRegisterAddFundsModal(false);

    if (addedAmount) {
      logAction('cash_add', `Adicionou R$ ${addedAmount.toFixed(2)} ao caixa`, 'cash_register', undefined, { amount: addedAmount });
    }

    // Atualizar saldo do caixa
    await updateCashRegisterBalance();

    // Limpar estados relacionados ao saldo insuficiente
    setPendingOrderForInsufficientFunds(null);
    setInsufficientFundsDetails(null);


    // Tentar finalizar o pedido novamente se ainda houver um pedido pendente
    if (pendingOrderForInsufficientFunds) {
      setShowOrderCompletionModal(true);
    }
  }, [updateCashRegisterBalance, pendingOrderForInsufficientFunds]);

  // CORRIGIDO: useEffect para verificação inicial do caixa
  useEffect(() => {
    console.log('Index component mounted, checking cash register...');
    checkCashRegister();
    const savedSaleMode = localStorage.getItem('pdv_sale_mode');
    if (savedSaleMode !== null) {
      setIsSaleMode(savedSaleMode === 'true');
    }

    // Limpar dados de sessão corrompidos
    console.log('Clearing any potentially corrupted session data on mount');
    localStorage.removeItem('pdv_temp_session');
    localStorage.removeItem('pdv_active_order');
    localStorage.removeItem('pdv_active_customer');
    setCustomers([]);
    setCurrentCustomer(null);
    setCurrentOrder(null);
    setIsDataLoaded(false);
    
    // Configurar limpeza automática de pedidos vazios
    const cleanup = setupAutoCleanup();
    
    // Cleanup function para cancelar a limpeza automática quando o componente for desmontado
    return () => {
      cleanup();
    };
  }, []);

  // CORRIGIDO: useEffect para carregar dados quando o caixa estiver aberto
  useEffect(() => {
    if (isCashRegisterOpen && !isDataLoaded && !isCheckingCashRegister) {
      console.log('Cash register is open and data not loaded yet, loading fresh data from database');
      loadData();
    }
  }, [isCashRegisterOpen, isDataLoaded, isCheckingCashRegister, loadData]);

  // CORRIGIDO: Mostrar tela de carregamento enquanto verifica o caixa ou acesso ao PDV
  if (isCheckingCashRegister || pdvAccess.loading) {
    return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-300">{pdvAccess.loading ? 'Verificando acesso ao PDV...' : 'Verificando status do caixa...'}</p>
        </div>
      </div>;
  }

  // Bloquear acesso se limite de sessões simultâneas atingido ou fora do horário
  if (!pdvAccess.allowed) {
    return <React.Suspense fallback={null}>
      <PdvAccessBlocked
        errorMessage={pdvAccess.errorMessage}
        activeSessionCount={pdvAccess.activeSessionCount}
        maxSlots={pdvAccess.maxSlots}
        workHoursBlocked={pdvAccess.workHoursBlocked}
        deviceConflict={pdvAccess.deviceConflict}
        onRetry={pdvAccess.retryAccess}
        onTakeover={pdvAccess.takeoverSession}
      />
    </React.Suspense>;
  }

  // Show welcome screen when needed - MOVED AFTER ALL HOOKS
  if (showWelcomeScreen) {
    return <React.Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-900 text-white">Carregando...</div>}>
        <WelcomeScreen onOpenCashRegister={handleOpenRegisterClick} />
        <React.Suspense fallback={null}>
          <CashRegisterOpeningModal open={showCashRegisterOpeningModal} onOpenChange={setShowCashRegisterOpeningModal} onComplete={handleCashRegisterOpened} />
        </React.Suspense>
      </React.Suspense>;
  }

  // Layout responsivo baseado no dispositivo - Mobile/Tablet usa novo componente
  const renderMobileTabletLayout = () => (
    <React.Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-900 text-slate-300">Carregando...</div>}>
      <MobilePDVLayout
        customers={customers}
        currentCustomer={currentCustomer}
        activeOrder={activeOrder}
        materials={materials}
        pesoInput={isAutoScale ? String(pdvScale.scale.weight ?? '') : pesoInput}
        currentBalance={currentBalance}
        scaleAutoMode={autoModeProp}
        isSaleMode={isSaleMode}
        unreadCount={unreadCount}
        handleSelectCustomer={handleSelectCustomer}
        setCurrentOrder={setCurrentOrder}
        handleCustomerDeleted={handleCustomerDeleted}
        handleOrderDeleted={handleOrderDeleted}
        handleNumberPadSubmit={handleNumberPadSubmit}
        setPesoInput={setPesoInput}
        handleSelectMaterial={handleSelectMaterial}
        handleNewOrderRequest={handleNewOrderRequest}
        handleInitiateCompleteOrder={handleInitiateCompleteOrder}
        formatPeso={formatPeso}
        handleDeleteOrderItem={handleDeleteOrderItem}
        handleSaleModeToggle={handleSaleModeToggle}
        setShowNotificationsModal={setShowNotificationsModal}
        setShowErrorReportModal={setShowErrorReportModal}
        updateCashRegisterBalance={updateCashRegisterBalance}
        handleMenuClick={handleMenuClick}
        setShowAddFundsModal={setShowCashRegisterAddFundsModal}
        setShowMaterialsPrintModal={() => setShowGenerateTableModal(true)}
        setShowExpenseModal={setShowExpenseModal}
        setShowClosingModal={setShowCashRegisterClosingModal}
        setActiveTabRef={setMobileTabSetter}
        useCategoriesEnabled={useCategoriesEnabled}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        orderListRefreshKey={orderListRefreshKey}
        showVendaAvulsaModal={showVendaAvulsaModal}
        setShowVendaAvulsaModal={setShowVendaAvulsaModal}
        onVendaAvulsa={handleVendaAvulsa}
        vendaAvulsaStockMap={vendaAvulsaStockMap}
      />
    </React.Suspense>
  );
  const renderDesktopLayout = () => <>
      <div className="flex items-center justify-between p-2 bg-slate-800 border-b border-slate-700 gap-3">
        <div className="flex items-center gap-3">
          <Switch checked={isSaleMode} onCheckedChange={handleSaleModeToggle} id="modo-venda-switch" className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-slate-500 border border-slate-400" />
          <Label htmlFor="modo-venda-switch" className={`font-semibold select-none ${isSaleMode ? 'text-amber-400' : 'text-slate-100'}`}>
            {isSaleMode ? "Modo Venda ATIVADO" : "Ativar Modo Venda"}
          </Label>
          {isSaleMode && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 text-amber-400 border-b-2 border-amber-400 rounded-none hover:border hover:border-amber-400 hover:rounded-md hover:bg-amber-500/10 hover:text-amber-300 transition-all duration-200"
              onClick={() => setShowVendaAvulsaModal(true)}
            >
              <PackagePlus className="w-4 h-4 mr-1" />
              Venda Avulsa
            </Button>
          )}
        </div>

        {/* Busca de materiais centralizada no header */}
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={materialSearch}
              onChange={(e) => setMaterialSearch(e.target.value)}
              placeholder="Buscar material por nome..."
              className="w-full bg-slate-900/70 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-100 placeholder:text-slate-500 rounded-lg pl-9 pr-9 py-2 text-sm transition-colors"
            />
            {materialSearch && (
              <button
                type="button"
                onClick={() => setMaterialSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded"
                aria-label="Limpar busca"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowNotificationsModal(true)}
            className={`p-1 border transition-all duration-300 text-white rounded-md relative ${
              unreadCount > 0 
                ? 'border-amber-500 hover:border-amber-400 animate-pulse bg-amber-500/20 shadow-lg shadow-amber-500/30' 
                : 'border-slate-600 hover:border-slate-500 bg-transparent'
            }`}
            title={unreadCount > 0 ? `${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}` : "Notificações"}
          >
            <Bell className={`w-4 h-4 transition-colors duration-300 ${
              unreadCount > 0 ? 'text-amber-300' : 'text-slate-400'
            }`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-fade-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setShowGenerateTableModal(true)} 
            className="flex items-center gap-1.5 px-2 py-1 border border-slate-600 hover:border-emerald-500 bg-transparent text-slate-300 hover:text-white rounded-md transition-colors duration-200 text-xs font-medium whitespace-nowrap"
            title="Gerar tabela"
          >
            <Printer className="w-4 h-4" />
            <span>Gerar Tabela</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden bg-slate-900 min-h-0">
        <div className="w-1/4 flex flex-col border-r border-slate-700 min-h-0">
          <div className="basis-[58%] shrink min-h-0 overflow-hidden">
            <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-4">Carregando...</div>}>
              <MemoizedNumberPad onSubmit={handleNumberPadSubmit} onClear={() => setPesoInput("")} value={isAutoScale ? (pdvScale.scale.weight ?? '') : pesoInput} automaticMode={autoModeProp} />
            </React.Suspense>
          </div>
          <div className="basis-[42%] shrink min-h-0 border-t border-slate-700">
            <ScrollArea className="h-full touch-auto">
              <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-4">Carregando...</div>}>
                <MemoizedOrderList customers={customers} activeCustomer={currentCustomer} setCurrentCustomer={handleSelectCustomer} setCurrentOrder={setCurrentOrder} onCustomerDeleted={handleCustomerDeleted} onOrderDeleted={handleOrderDeleted} refreshKey={orderListRefreshKey} />
              </React.Suspense>
            </ScrollArea>
          </div>
        </div>
        
        <div className="w-3/4 flex flex-col min-h-0">
          <div className="basis-1/2 min-h-0 flex flex-col">
            {/* Busca de materiais movida para o header superior */}
            {/* Category Bar - Only show when categories are enabled */}
            {useCategoriesEnabled && categories.length > 0 ? (
              <CategoryBar
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                materialCountByCategory={materials.reduce((acc, m) => {
                  if (m.category_id) {
                    acc[m.category_id] = (acc[m.category_id] || 0) + 1;
                  }
                  return acc;
                }, {} as Record<string, number>)}
              />
            ) : null}
            <ScrollArea className="flex-1 touch-auto min-h-0">
              <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-4">Carregando...</div>}>
                <MemoizedMaterialGrid 
                  materials={filteredMaterials} 
                  onMaterialSelect={(m) => { setMaterialSearch(""); handleSelectMaterial(m); }} 
                  onManualInsert={() => {}} 
                  isSaleMode={isSaleMode} 
                  hasActiveOrder={!!activeOrder} 
                  onNewOrderRequest={handleNewOrderRequest}
                  selectedCategoryId={materialSearch.trim() ? null : selectedCategoryId}
                />
              </React.Suspense>
            </ScrollArea>
          </div>

          <div className="basis-1/2 min-h-0 border-t border-slate-700">
            <ScrollArea className="h-full touch-auto">
              <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-4">Carregando...</div>}>
                <MemoizedOrderDetails customer={currentCustomer} activeOrder={activeOrder} onCompleteOrder={handleInitiateCompleteOrder} formatPeso={formatPeso} onDeleteItem={handleDeleteOrderItem} />
              </React.Suspense>
            </ScrollArea>
          </div>
        </div>
      </div>
      
      <React.Suspense fallback={<div className="bg-slate-800 text-slate-300 p-2">Carregando...</div>}>
        <MemoizedFooter onMenuClick={handleMenuClick} currentBalance={currentBalance} onBalanceUpdate={updateCashRegisterBalance} />
      </React.Suspense>
    </>;

  return <div data-tutorial="pdv-main" className="flex flex-col h-screen touch-auto bg-slate-900">
      <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-2">Carregando...</div>}>
        <CashRegisterOpeningModal open={showCashRegisterOpeningModal} onOpenChange={setShowCashRegisterOpeningModal} onComplete={handleCashRegisterOpened} />
      </React.Suspense>
      
      {isCashRegisterOpen ? <>
          {/* Renderização condicional baseada no dispositivo */}
          {(isMobile || isTablet) ? renderMobileTabletLayout() : renderDesktopLayout()}
          
          {/* Modals com Suspense para carregamento assíncrono */}
          <React.Suspense fallback={null}>
            {selectedMaterialModal && <MaterialModal open={!!selectedMaterialModal} material={selectedMaterialModal} peso={pesoModal} total={totalMaterial} onAdd={handleAddMaterialToOrder} onCancel={() => setSelectedMaterialModal(null)} isSaleMode={isSaleMode} onRequestWeight={handleNavigateToScale} onNavigateToOrders={handleNavigateToOrders} />}
          </React.Suspense>
          
          <React.Suspense fallback={null}>
            {showWeightAlert && <AlertModal open={showWeightAlert} onClose={() => setShowWeightAlert(false)} title="CALMA AI..." description="VOCÊ ESQUECEU DO PESO NA BALANÇA!" />}
          </React.Suspense>

          {/* Modal de Novo Pedido */}
          <React.Suspense fallback={null}>
            {showNewOrderModal && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 p-6 rounded-lg w-96">
                  <h2 className="text-white text-xl font-bold mb-4">Novo Pedido</h2>
                  <div className="mb-4">
                    <label className="text-white block mb-2">Nome do Cliente (opcional)</label>
                    <input type="text" placeholder="# Nome Cliente" className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-green-500 focus:outline-none" onKeyDown={e => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  handleCreateNewOrder(target.value || undefined);
                }
              }} />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setShowNewOrderModal(false)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                      Cancelar
                    </button>
                    <button onClick={() => {
                const input = document.querySelector('input[placeholder="# Nome Cliente"]') as HTMLInputElement;
                handleCreateNewOrder(input?.value || undefined);
              }} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                      Criar Pedido
                    </button>
                  </div>
                </div>
              </div>}
          </React.Suspense>
          
          <React.Suspense fallback={null}>
            {showOrderCompletionModal && <OrderCompletionModal open={showOrderCompletionModal} onClose={() => setShowOrderCompletionModal(false)} onSave={handleCompleteOrder} onPrint={handlePrintOrder} customer={currentCustomer} order={activeOrder} formatPeso={formatPeso} isSaleMode={isSaleMode} />}
          </React.Suspense>

          <React.Suspense fallback={null}>
            {showCashRegisterAddFundsModal && <CashRegisterAddFundsModal open={showCashRegisterAddFundsModal} onOpenChange={setShowCashRegisterAddFundsModal} onComplete={handleAddFundsForInsufficientBalance} insufficientFundsDetails={insufficientFundsDetails} />}
          </React.Suspense>
          
          <React.Suspense fallback={null}>
            {showPasswordModal && <PasswordPromptModal open={showPasswordModal} onOpenChange={setShowPasswordModal} onAuthenticated={handlePasswordAuthenticated} title={pendingOrderForInsufficientFunds ? "Saldo Insuficiente" : "Acesso ao Menu"} description={pendingOrderForInsufficientFunds ? "Digite sua senha para adicionar saldo ao caixa" : "Digite sua senha para acessar o menu"} />}
          </React.Suspense>

          <React.Suspense fallback={null}>
            {showErrorReportModal && <ErrorReportModal open={showErrorReportModal} onClose={() => setShowErrorReportModal(false)} />}
          </React.Suspense>

          <React.Suspense fallback={null}>
            {showVendaAvulsaModal && <VendaAvulsaModal open={showVendaAvulsaModal} onOpenChange={setShowVendaAvulsaModal} onConfirm={handleVendaAvulsa} materials={materials} stockMap={vendaAvulsaStockMap} />}
          </React.Suspense>

          <NotificationModal
            isOpen={showNotificationsModal}
            onClose={() => setShowNotificationsModal(false)}
            notifications={notifications}
            isLoading={isLoadingNotifications}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead}
          />

          {showPrintConfirmModal && <PrintConfirmationModal isOpen={showPrintConfirmModal} onClose={() => setShowPrintConfirmModal(false)} onConfirm={() => {
        setShowPrintConfirmModal(false);
        setShowMaterialsPrintModal(true);
      }} />}

          {showMaterialsPrintModal && <MaterialsPrintModal 
            onPrintComplete={() => {
              setShowMaterialsPrintModal(false);
            }}
            isSaleMode={isSaleMode}
          />}

          <GenerateTableChoiceModal
            isOpen={showGenerateTableModal}
            onClose={() => setShowGenerateTableModal(false)}
            onChooseThermal={() => {
              setShowGenerateTableModal(false);
              setShowPrintConfirmModal(true);
            }}
            onChoosePdf={() => {
              setShowGenerateTableModal(false);
              setShowMaterialsPdfModal(true);
            }}
          />

          {showMaterialsPdfModal && (
            <MaterialsPdfModal
              isOpen={showMaterialsPdfModal}
              onClose={() => setShowMaterialsPdfModal(false)}
              isSaleMode={isSaleMode}
            />
          )}

          <React.Suspense fallback={null}>
            {showCashRegisterClosingModal && <CashRegisterClosingModal open={showCashRegisterClosingModal} onOpenChange={setShowCashRegisterClosingModal} onComplete={() => {
              logAction('cash_close', 'Caixa fechado', 'cash_register');
              setShowCashRegisterClosingModal(false);
              // Atualiza estado local sem recarregar a página inteira (evita tela "Carregando..." longa)
              setIsCashRegisterOpen(false);
              setShowWelcomeScreen(true);
              setCurrentBalance(0);
              // Refaz a verificação em background para sincronizar com o backend
              checkCashRegister();
            }} />}
          </React.Suspense>

          <React.Suspense fallback={null}>
            {showExpenseModal && <ExpenseModal 
              open={showExpenseModal} 
              onOpenChange={(open) => {
                setShowExpenseModal(open);
              }}
              onComplete={async (updatedRegister) => {
                // Update balance immediately when expense is added
                setCurrentBalance(updatedRegister.currentAmount);
              }}
            />}
          </React.Suspense>
        </> : null}

      {/* PDV Tutorial — substituído pelo banner instrucional na WelcomeScreen */}
    </div>;
};
export default Index;

