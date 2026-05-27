import React, { useState, useMemo, useEffect, useRef, startTransition } from 'react';
import { FeatureGuard } from '@/components/FeatureGuard';
import { FEATURE_KEYS } from '@/constants/featureAccess';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, DollarSign, Scale, FileText, TrendingUp, Tag, Package, Filter, TrendingDown, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { getOrders, getMaterials, getMaterialCategories, getCashRegisters, calculateCashSummary } from '@/utils/supabaseStorage';
import { getOrdersForUser, getMaterialsForUser, getCashRegistersForUser } from '@/utils/adminDataAccess';
import { Order, MaterialCategory, CashRegister } from '@/types/pdv';
import { StandardFilter, FilterPeriod } from '@/components/StandardFilter';
import { MetricCard } from '@/components/MetricCard';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReportPrintButton } from '@/components/ReportPrintButton';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteScroll, useScrollLoadMore } from '@/hooks/useInfiniteScroll';
import { AdminViewBanner } from '@/components/admin/AdminViewBanner';
import ReprintReceiptModal from '@/components/ReprintReceiptModal';
import { getCustomers } from '@/utils/supabaseStorage';
import { Customer } from '@/types/pdv';

const SalesOrders = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const isMobile = useIsMobile();
  
  // Admin view state from navigation
  const adminViewingUser = location.state?.adminViewingUser;
  const adminViewingUserName = location.state?.adminViewingUserName;
  const isAdminView = !!adminViewingUser;
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('last30');
  const [filterStartDate, setFilterStartDate] = useState(startDate);
  const [filterEndDate, setFilterEndDate] = useState(endDate);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [materialSearchOpen, setMaterialSearchOpen] = useState(false);
  const [materialSearchValue, setMaterialSearchValue] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reprintOrder, setReprintOrder] = useState<Order | null>(null);
  const [reprintCustomer, setReprintCustomer] = useState<Customer | null>(null);
  const [showReprintModal, setShowReprintModal] = useState(false);

  // Ref for virtualization
  const parentRef = useRef<HTMLDivElement>(null);
  
  const handleExitAdminView = () => {
    navigate(location.pathname + location.search, { replace: true, state: {} });
  };

  interface SaleItem {
    orderId: string;
    orderDate: number;
    materialId: string;
    materialName: string;
    categoryId: string | null;
    categoryName: string | null;
    categoryColor: string | null;
    weight: number;
    salePrice: number;
    purchasePrice: number;
    saleTotal: number;
    profit: number;
    // Campos de ajuste de preço
    originalPrice: number;
    priceAdjustment: number;
    // Campo de tara
    tara: number;
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        let ordersData, materialsData, cashRegistersData;
        
        if (isAdminView && adminViewingUser) {
          // Load data for specific user in admin view
          [ordersData, materialsData, cashRegistersData] = await Promise.all([
            getOrdersForUser(adminViewingUser),
            getMaterialsForUser(adminViewingUser),
            getCashRegistersForUser(adminViewingUser)
          ]);
        } else {
          [ordersData, materialsData, cashRegistersData] = await Promise.all([
            getOrders(),
            getMaterials(),
            getCashRegisters()
          ]);
        }

        const customersData = await getCustomers();
        setCustomers(customersData);
        
        const categoriesData = await getMaterialCategories();
        setOrders(ordersData);
        setMaterials(materialsData);
        setCategories(categoriesData);
        setCashRegisters(cashRegistersData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [startDate, endDate, isAdminView, adminViewingUser]);


  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    let filterStart: Date;
    let filterEnd: Date = new Date(now);
    filterEnd.setHours(23, 59, 59, 999);

    if (selectedPeriod === 'custom' && filterStartDate && filterEndDate) {
      filterStart = new Date(filterStartDate + 'T00:00:00');
      filterEnd = new Date(filterEndDate + 'T23:59:59.999');
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
          filterStart.setDate(now.getDate() - 30);
          filterStart.setHours(0, 0, 0, 0);
      }
    }

    return { filterStart, filterEnd };
  }, [selectedPeriod, filterStartDate, filterEndDate]);

  // Buscar o preço de compra mais recente de cada material (baseado nas compras reais)
  // Estrutura: { materialName: [{ timestamp, price }] } ordenado por data
  const materialPurchaseHistory = useMemo(() => {
    const historyMap: Record<string, Array<{ timestamp: number; price: number }>> = {};
    
    // Percorrer todas as ordens de COMPRA completadas
    orders.forEach(order => {
      if (order.type === 'compra' && order.status === 'completed' && !order.cancelled) {
        order.items.forEach(item => {
          const materialName = item.materialName.toLowerCase().trim();
          
          if (!historyMap[materialName]) {
            historyMap[materialName] = [];
          }
          
          // Usar o preço praticado na compra (item.price já inclui desconto/acréscimo)
          historyMap[materialName].push({
            timestamp: order.timestamp,
            price: item.price // Preço por kg praticado na compra
          });
        });
      }
    });
    
    // Ordenar cada material por timestamp
    Object.keys(historyMap).forEach(key => {
      historyMap[key].sort((a, b) => a.timestamp - b.timestamp);
    });
    
    return historyMap;
  }, [orders]);

  // Função para buscar o preço de compra mais recente antes de uma data de venda
  const getLastPurchasePrice = (materialName: string, saleTimestamp: number): number | null => {
    const history = materialPurchaseHistory[materialName.toLowerCase().trim()];
    if (!history || history.length === 0) return null;
    
    // Buscar a última compra que ocorreu antes ou no mesmo momento da venda
    let lastPrice: number | null = null;
    for (const purchase of history) {
      if (purchase.timestamp <= saleTimestamp) {
        lastPrice = purchase.price;
      } else {
        break;
      }
    }
    
    // Se não encontrou compra anterior, usa a primeira compra disponível
    return lastPrice !== null ? lastPrice : history[0].price;
  };

  // All items in the period (for general totals - not affected by category filter)
  const allPeriodItems = useMemo(() => {
    const { filterStart, filterEnd } = dateRange;

    const salesOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return order.type === 'venda' && 
             order.status === 'completed' &&
             order.items && order.items.length > 0 &&
             !order.cancelled &&
             orderDate >= filterStart && 
             orderDate <= filterEnd;
    });

    const items: SaleItem[] = [];
    salesOrders.forEach(order => {
      order.items.forEach(item => {
        const material = materials.find(m => m.id === item.materialId);
        const category = material?.category_id 
          ? categories.find(c => c.id === material.category_id) 
          : null;
        
        // CORREÇÃO: Usar o preço exato da última compra deste material
        // antes ou no momento da venda (não WAC global)
        const lastPurchasePrice = getLastPurchasePrice(item.materialName, order.timestamp);
        const purchasePrice = lastPurchasePrice ?? material?.price ?? 0;
        const profit = item.total - (purchasePrice * item.quantity);
        
        items.push({
          orderId: order.id,
          orderDate: order.timestamp,
          materialId: item.materialId,
          materialName: item.materialName,
          categoryId: category?.id || null,
          categoryName: category?.name || null,
          categoryColor: category?.hex_color || category?.color || null,
          weight: item.quantity,
          salePrice: item.price,
          purchasePrice,
          saleTotal: item.total,
          profit,
          originalPrice: item.originalPrice || material?.salePrice || item.price,
          priceAdjustment: item.priceAdjustment || 0,
          tara: item.tara || 0
        });
      });
    });

    return items.sort((a, b) => b.orderDate - a.orderDate);
  }, [orders, materials, categories, dateRange, materialPurchaseHistory]);

  // Items filtered by category and material
  const filteredItems = useMemo(() => {
    let items = [...allPeriodItems];

    if (selectedMaterials.length > 0) {
      items = items.filter(item => 
        selectedMaterials.some(selected => 
          item.materialName?.toLowerCase().includes(selected.toLowerCase())
        )
      );
    }

    if (selectedCategory !== 'all') {
      const selectedCategoryObj = categories.find(c => c.id === selectedCategory);
      const categoryName = selectedCategoryObj?.name?.toLowerCase() || '';
      
      items = items.filter(item => {
        if (item.categoryId === selectedCategory) return true;
        if (!item.categoryId && categoryName && item.materialName?.toLowerCase().includes(categoryName)) {
          return true;
        }
        return false;
      });
    }

    return items;
  }, [allPeriodItems, selectedMaterials, selectedCategory, categories]);

  // Infinite scroll - exibe 20 itens por vez
  const { visibleItems, loadMore, hasMore, loadedCount, totalCount } = useInfiniteScroll({
    items: filteredItems,
    pageSize: 20
  });

  // Virtualizer - agora usa visibleItems
  const rowVirtualizer = useVirtualizer({
    count: visibleItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  // Scroll load more trigger
  useScrollLoadMore(parentRef, loadMore, hasMore);

  // Calculate total expenses for the period from cash registers
  const periodExpenses = useMemo(() => {
    const { filterStart, filterEnd } = dateRange;
    
    // Filter cash registers that fall within the selected period
    const registersInPeriod = cashRegisters.filter(register => {
      const openingDate = new Date(register.openingTimestamp);
      return openingDate >= filterStart && openingDate <= filterEnd;
    });
    
    // Sum all expenses from filtered registers
    let totalExpenses = 0;
    registersInPeriod.forEach(register => {
      const expenses = register.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      totalExpenses += expenses;
    });
    
    return totalExpenses;
  }, [cashRegisters, dateRange]);

  // GENERAL PERIOD TOTALS (not affected by category filter)
  const periodTotals = useMemo(() => {
    const { filterStart, filterEnd } = dateRange;

    const orderCount = new Set(allPeriodItems.map(item => item.orderId)).size;
    const totalWeight = allPeriodItems.reduce((sum, item) => sum + item.weight, 0);
    const totalAmount = allPeriodItems.reduce((sum, item) => sum + item.saleTotal, 0);
    const totalProfit = allPeriodItems.reduce((sum, item) => sum + item.profit, 0); // Margem bruta (sobre vendido)
    const totalExpenses = periodExpenses;
    const totalNetProfit = totalProfit - totalExpenses; // Margem líquida

    // Regime de caixa: somatório de compras do período
    let totalPurchases = 0;
    let totalPurchasesWeight = 0;
    orders.forEach(order => {
      if (
        order.type !== 'compra' ||
        order.status !== 'completed' ||
        order.cancelled ||
        !order.items?.length
      ) return;
      const orderDate = new Date(order.timestamp);
      if (orderDate < filterStart || orderDate > filterEnd) return;
      order.items.forEach(it => {
        totalPurchases += it.total || 0;
        totalPurchasesWeight += it.quantity || 0;
      });
    });

    // Caixa do período = Vendas − Compras − Despesas
    const cashFlow = totalAmount - totalPurchases - totalExpenses;

    // Variação de estoque (kg comprados − kg vendidos) e valor estimado
    const stockKgVariation = totalPurchasesWeight - totalWeight;
    const avgPurchasePricePerKg = totalPurchasesWeight > 0
      ? totalPurchases / totalPurchasesWeight
      : 0;
    const stockValueVariation = stockKgVariation * avgPurchasePricePerKg;

    return {
      orderCount,
      totalWeight,
      totalAmount,
      totalProfit, // Margem Bruta
      totalExpenses, // Despesas do período
      totalNetProfit, // Margem Líquida
      totalPurchases,
      totalPurchasesWeight,
      cashFlow,
      stockKgVariation,
      stockValueVariation,
    };
  }, [allPeriodItems, periodExpenses, orders, dateRange]);

  // FILTERED TOTALS (only when category filter is active)
  const filteredTotals = useMemo(() => ({
    itemCount: filteredItems.length,
    orderCount: new Set(filteredItems.map(item => item.orderId)).size,
    totalWeight: filteredItems.reduce((sum, item) => sum + item.weight, 0),
    totalAmount: filteredItems.reduce((sum, item) => sum + item.saleTotal, 0),
    totalProfit: filteredItems.reduce((sum, item) => sum + item.profit, 0)
  }), [filteredItems]);

  const hasFilter = selectedCategory !== 'all' || selectedMaterials.length > 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const formatWeight = (value: number) => {
    return `${value.toFixed(2)} kg`;
  };

  const uniqueMaterials = useMemo(() => {
    return materials
      .map(m => m.name)
      .filter(Boolean)
      .sort();
  }, [materials]);

  const clearFilters = () => {
    setSelectedPeriod('last30');
    setFilterStartDate('');
    setFilterEndDate('');
    setSelectedCategory('all');
    setSelectedMaterials([]);
    setMaterialSearchValue('');
  };

  const removeMaterial = (materialToRemove: string) => {
    setSelectedMaterials(prev => prev.filter(material => material !== materialToRemove));
  };

  const formatPeso = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(3)}/kg`;
  };

  const handleReprintOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const customer = customers.find(c => c.id === order.customerId);
    if (!customer) return;
    setReprintOrder(order);
    setReprintCustomer(customer);
    setShowReprintModal(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-800">
        <header className="bg-slate-900 text-white p-3 border-b border-slate-700">
          <h1 className="text-lg md:text-xl font-bold">Vendas Realizadas</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-white text-lg">Carregando...</div>
        </main>
      </div>
    );
  }

  return (
    <FeatureGuard feature={FEATURE_KEYS.BASIC_HISTORY}>
    <>
    <div className="flex flex-col min-h-screen bg-slate-800">
      <header className="bg-slate-900 text-white p-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline text-sm">Voltar</span>
            </Link>
            <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Vendas Realizadas
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ReportPrintButton
              reportTitle="Relatório de Vendas"
              period={{ label: selectedPeriod === 'daily' ? 'Hoje' : selectedPeriod === 'custom' ? `${filterStartDate} a ${filterEndDate}` : `Últimos ${selectedPeriod.replace('last', '')} dias` }}
              metrics={[
                { label: 'Total Vendas', value: `R$ ${periodTotals.totalAmount.toFixed(2)}` },
                { label: 'Peso Vendido', value: `${periodTotals.totalWeight.toFixed(2)} kg` },
                { label: 'Nº Transações', value: periodTotals.orderCount },
                { label: 'Total Compras', value: `R$ ${periodTotals.totalPurchases.toFixed(2)}` },
                { label: 'Peso Comprado', value: `${periodTotals.totalPurchasesWeight.toFixed(2)} kg` },
                { label: 'Despesas', value: `R$ ${periodTotals.totalExpenses.toFixed(2)}` },
                { label: 'Margem Bruta (vendido)', value: `R$ ${periodTotals.totalProfit.toFixed(2)}` },
                { label: 'Margem Líquida (margem - despesas)', value: `R$ ${periodTotals.totalNetProfit.toFixed(2)}` },
                { label: 'Caixa do Período (Vendas - Compras - Despesas)', value: `R$ ${periodTotals.cashFlow.toFixed(2)}` },
                { label: 'Variação de Estoque', value: `${periodTotals.stockKgVariation >= 0 ? '+' : ''}${periodTotals.stockKgVariation.toFixed(2)} kg (≈ R$ ${periodTotals.stockValueVariation.toFixed(2)})` },
              ]}
            />
            <ContextualHelpButton module="venda" />
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
        {/* Filtro Padronizado com Categoria */}
        <StandardFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          startDate={filterStartDate}
          onStartDateChange={setFilterStartDate}
          endDate={filterEndDate}
          onEndDateChange={setFilterEndDate}
          onClear={clearFilters}
          extraFilters={
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Category Filter */}
              {categories.length > 0 && (
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-8 px-2 text-xs bg-slate-800 border-slate-600 text-white w-auto min-w-[70px] rounded-lg">
                    <Tag className="h-3 w-3 mr-1 text-emerald-500" />
                    <SelectValue placeholder="Cat." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-xs">Todas</SelectItem>
                    {categories.filter(c => c.is_active !== false).map(cat => (
                      <SelectItem key={cat.id} value={cat.id} className="text-xs">
                        <span className="flex items-center gap-1.5">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: cat.hex_color || cat.color || '#6b7280' }}
                          />
                          {cat.name.substring(0, 10)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Material Filter - compacto */}
              <Popover open={materialSearchOpen} onOpenChange={setMaterialSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-8 px-2 rounded-lg bg-slate-800 border-slate-600 text-white hover:bg-slate-700 flex items-center gap-1"
                  >
                    <Filter className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs">Mat.</span>
                    {selectedMaterials.length > 0 && (
                      <Badge variant="secondary" className="bg-emerald-600 text-white text-[10px] px-1 py-0 h-4">
                        {selectedMaterials.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 bg-slate-800 border-slate-600">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar..." 
                      value={materialSearchValue}
                      onValueChange={setMaterialSearchValue}
                      className="text-white text-xs"
                    />
                    <CommandList>
                      <CommandEmpty className="text-slate-400 text-xs p-2">Nenhum.</CommandEmpty>
                      <CommandGroup>
                        {uniqueMaterials
                          .filter(material => 
                            material.toLowerCase().includes(materialSearchValue.toLowerCase())
                          )
                          .slice(0, 10)
                          .map((material) => (
                            <CommandItem
                              key={material}
                              value={material}
                              onSelect={() => {
                                if (!selectedMaterials.includes(material)) {
                                  setSelectedMaterials(prev => [...prev, material]);
                                }
                                setMaterialSearchValue('');
                                setMaterialSearchOpen(false);
                              }}
                              className="text-white hover:bg-slate-700 text-xs"
                            >
                              {material.substring(0, 20)}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                  {selectedMaterials.length > 0 && (
                    <div className="p-1.5 border-t border-slate-600">
                      <div className="flex flex-wrap gap-1">
                        {selectedMaterials.map((material) => (
                          <span
                            key={material}
                            className="bg-emerald-600/20 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5"
                          >
                            {material.substring(0, 10)}
                            <button onClick={() => removeMaterial(material)} className="hover:text-white">
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          }
        />

        {/* Totais do Período (sempre visíveis) */}
        <div className="mb-3">
          <p className="text-slate-400 text-[10px] mb-1">Período</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <MetricCard
              icon={DollarSign}
              iconColor="text-emerald-500"
              label="Vendas"
              value={formatCurrency(periodTotals.totalAmount)}
              compact
            />
            <MetricCard
              icon={Scale}
              iconColor="text-emerald-500"
              label="Peso Vendido"
              value={formatWeight(periodTotals.totalWeight)}
              compact
            />
            <MetricCard
              icon={FileText}
              iconColor="text-emerald-500"
              label="Transações"
              value={periodTotals.orderCount}
              compact
            />
            <MetricCard
              icon={TrendingUp}
              iconColor={periodTotals.totalNetProfit >= 0 ? "text-emerald-500" : "text-rose-500"}
              label="Margem Líquida"
              value={formatCurrency(periodTotals.totalNetProfit)}
              subValue={`Bruta: ${formatCurrency(periodTotals.totalProfit)}${periodTotals.totalExpenses > 0 ? ` | Desp: -${formatCurrency(periodTotals.totalExpenses)}` : ''}`}
              compact
            />
          </div>

          {/* Regime de Caixa - Reconciliação financeira */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            <MetricCard
              icon={TrendingDown}
              iconColor="text-rose-400"
              label="Compras"
              value={formatCurrency(periodTotals.totalPurchases)}
              subValue={`${periodTotals.totalPurchasesWeight.toFixed(2)} kg`}
              compact
            />
            <MetricCard
              icon={DollarSign}
              iconColor={periodTotals.cashFlow >= 0 ? "text-emerald-500" : "text-rose-500"}
              label="Caixa do Período"
              value={formatCurrency(periodTotals.cashFlow)}
              subValue="Vendas − Compras − Despesas"
              compact
            />
            <MetricCard
              icon={Package}
              iconColor={periodTotals.stockKgVariation >= 0 ? "text-sky-400" : "text-amber-400"}
              label="Variação de Estoque"
              value={`${periodTotals.stockKgVariation >= 0 ? '+' : ''}${periodTotals.stockKgVariation.toFixed(2)} kg`}
              subValue={`≈ ${formatCurrency(periodTotals.stockValueVariation)}`}
              compact
            />
          </div>

          {/* Card explicativo - reconcilia margem (competência) com caixa */}
          <div className="mt-2 rounded-lg border border-slate-600 bg-slate-900/40 p-3 text-xs">
            <p className="text-slate-300 font-semibold mb-2">Resumo financeiro do período</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
              <div className="font-mono leading-relaxed">
                <div className="flex justify-between"><span>Vendas</span><span className="text-emerald-400">{formatCurrency(periodTotals.totalAmount)}</span></div>
                <div className="flex justify-between"><span>− Compras</span><span className="text-rose-400">{formatCurrency(periodTotals.totalPurchases)}</span></div>
                <div className="flex justify-between"><span>− Despesas</span><span className="text-rose-400">{formatCurrency(periodTotals.totalExpenses)}</span></div>
                <div className="flex justify-between border-t border-slate-700 mt-1 pt-1 font-bold">
                  <span>= Caixa do período</span>
                  <span className={periodTotals.cashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(periodTotals.cashFlow)}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                <strong className="text-slate-200">Margem ≠ Caixa.</strong> A <em>Margem Líquida</em> ({formatCurrency(periodTotals.totalNetProfit)}) mede o lucro contábil sobre o material <strong>efetivamente vendido</strong>, usando o preço da última compra como custo. Já o <em>Caixa do Período</em> reflete o dinheiro que entrou ou saiu de fato.
                {periodTotals.stockKgVariation > 0 && (
                  <> A diferença é explicada por <strong>{periodTotals.stockKgVariation.toFixed(2)} kg</strong> comprados e ainda não vendidos (≈ {formatCurrency(periodTotals.stockValueVariation)} parados em estoque).</>
                )}
                {periodTotals.stockKgVariation < 0 && (
                  <> Você vendeu <strong>{Math.abs(periodTotals.stockKgVariation).toFixed(2)} kg</strong> a mais do que comprou no período — consumiu estoque (≈ {formatCurrency(Math.abs(periodTotals.stockValueVariation))}).</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Totais Filtrados (somente quando filtro ativo) */}
        {hasFilter && (
          <div className="mb-3">
            <p className="text-amber-400 text-[10px] mb-1 flex items-center gap-1">
              <Filter className="h-2.5 w-2.5" />
              Filtro: {categories.find(c => c.id === selectedCategory)?.name}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <MetricCard
                icon={Package}
                iconColor="text-amber-500"
                label="Itens"
                value={filteredTotals.itemCount}
                compact
              />
              <MetricCard
                icon={FileText}
                iconColor="text-amber-500"
                label="Pedidos"
                value={filteredTotals.orderCount}
                compact
              />
              <MetricCard
                icon={Scale}
                iconColor="text-amber-500"
                label="Peso"
                value={formatWeight(filteredTotals.totalWeight)}
                compact
              />
              <MetricCard
                icon={TrendingUp}
                iconColor={filteredTotals.totalProfit >= 0 ? "text-amber-500" : "text-rose-500"}
                label="Margem"
                value={formatCurrency(filteredTotals.totalProfit)}
                compact
              />
            </div>
          </div>
        )}

        {/* Lista de Vendas */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="p-2">
            <CardTitle className="text-white text-sm">
              Itens <span className="text-slate-400 text-xs font-normal">({filteredItems.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-1.5 md:p-3">
            {filteredItems.length > 0 ? (
              <div 
                ref={parentRef}
                className="overflow-auto"
                style={{ height: 'calc(100vh - 420px)', minHeight: '300px' }}
              >
                {/* Header Row - Div based */}
                <div className="sticky top-0 bg-slate-700 z-10 flex items-center border-b border-slate-600 text-slate-300 text-xs font-medium">
                  <div className="p-2 w-[80px]">Data</div>
                  <div className="p-2 w-[80px] hidden md:block">Pedido</div>
                  <div className="p-2 flex-1">Material</div>
                  <div className="p-2 w-[80px] hidden lg:block">Cat.</div>
                  <div className="p-2 w-[70px] hidden sm:block">Peso</div>
                  <div className="p-2 w-[60px] hidden xl:block">Tara</div>
                  <div className="p-2 w-[80px] hidden md:block">P.Compra</div>
                  <div className="p-2 w-[80px] hidden md:block">P.Venda</div>
                  <div className="p-2 w-[70px] hidden lg:block">Ajuste</div>
                  <div className="p-2 w-[80px]">Total</div>
                  <div className="p-2 w-[80px]">Lucro</div>
                  <div className="p-2 w-[40px]"></div>
                </div>
                
                {/* Virtual Rows */}
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const item = visibleItems[virtualRow.index];
                    const dt = formatDateTime(item.orderDate);
                    return (
                      <div
                        key={`${item.orderId}-${virtualRow.index}`}
                        className="absolute left-0 w-full flex items-center border-b border-slate-600 hover:bg-slate-600/30 cursor-pointer active:bg-slate-600/50"
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        onClick={() => {
                          startTransition(() => {
                            navigate(`/current-stock?material=${encodeURIComponent(item.materialName)}`);
                          });
                        }}
                      >
                        <div className="text-slate-300 text-sm p-2 w-[80px]">
                          <div>{dt.date}</div>
                          <div className="text-xs text-slate-500">{dt.time}</div>
                        </div>
                        <div className="text-slate-400 text-xs p-2 font-mono w-[80px] hidden md:block">
                          #{item.orderId.substring(0, 8)}
                        </div>
                        <div className="text-slate-300 text-sm p-2 flex-1 truncate">
                          {item.materialName}
                        </div>
                        <div className="p-2 w-[80px] hidden lg:block">
                          {item.categoryName ? (
                            <Badge 
                              variant="outline"
                              className="text-xs border-0"
                              style={{ 
                                backgroundColor: `${item.categoryColor || '#6b7280'}20`,
                                color: item.categoryColor || '#9ca3af'
                              }}
                            >
                              {item.categoryName}
                            </Badge>
                          ) : (
                            <span className="text-slate-500 text-xs">-</span>
                          )}
                        </div>
                        <div className="text-slate-300 text-sm p-2 w-[70px] hidden sm:block">
                          {formatWeight(item.weight)}
                        </div>
                        {/* Coluna de Tara */}
                        <div className="text-slate-300 text-sm p-2 w-[60px] hidden xl:block">
                          {item.tara > 0 ? (
                            <span className="text-amber-400 text-xs">{formatWeight(item.tara)}</span>
                          ) : (
                            <span className="text-slate-500 text-xs">-</span>
                          )}
                        </div>
                        <div className="text-slate-300 text-sm p-2 w-[80px] hidden md:block">
                          {formatCurrency(item.purchasePrice)}
                        </div>
                        <div className="text-slate-300 text-sm p-2 w-[80px] hidden md:block">
                          {formatCurrency(item.salePrice)}
                        </div>
                        {/* Coluna de Ajuste de Preço */}
                        <div className="p-2 w-[70px] hidden lg:block">
                          {item.priceAdjustment !== 0 ? (
                            <span className={`text-xs font-medium ${
                              item.priceAdjustment > 0 
                                ? 'text-emerald-400' // Acréscimo = mais receita (verde para vendas)
                                : 'text-rose-400'    // Desconto = menos receita (vermelho)
                            }`}>
                              {item.priceAdjustment > 0 ? '+' : ''}{formatCurrency(item.priceAdjustment)}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">-</span>
                          )}
                        </div>
                        <div className="text-white font-semibold text-sm p-2 w-[80px]">
                          {formatCurrency(item.saleTotal)}
                        </div>
                        <div className={`font-semibold text-sm p-2 w-[80px] ${item.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(item.profit)}
                        </div>
                        <div className="p-2 w-[40px] flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReprintOrder(item.orderId);
                            }}
                            className="text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Reimprimir comprovante"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto mb-3 text-slate-500" />
                <h3 className="text-white font-semibold mb-1">Nenhuma venda encontrada</h3>
                <p className="text-slate-400 text-sm">
                  As vendas registradas no PDV aparecerão aqui.
                </p>
              </div>
            )}
            
            {/* Count indicator */}
            {totalCount > 0 && (
              <div className="text-sm text-slate-400 text-center mt-3">
                Exibindo {loadedCount} de {totalCount} itens
                {hasMore && <span className="text-emerald-400 ml-2">(Role para carregar mais)</span>}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>

    <ReprintReceiptModal
      open={showReprintModal}
      onClose={() => setShowReprintModal(false)}
      customer={reprintCustomer}
      order={reprintOrder}
      formatPeso={formatPeso}
      isSaleMode={true}
    />
    </>
    </FeatureGuard>
  );
};

export default SalesOrders;
