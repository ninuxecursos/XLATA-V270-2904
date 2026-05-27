import React, { useState, useMemo, useEffect, useRef, startTransition } from 'react';
import { FeatureGuard } from '@/components/FeatureGuard';
import { FEATURE_KEYS } from '@/constants/featureAccess';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ArrowLeft, ShoppingCart, X, DollarSign, Scale, Filter, Tag, Package } from 'lucide-react';
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { getOrders, getMaterials, getMaterialCategories } from '@/utils/supabaseStorage';
import { getOrdersForUser, getMaterialsForUser } from '@/utils/adminDataAccess';
import { Order, Material, MaterialCategory } from '@/types/pdv';
import { StandardFilter, FilterPeriod } from '@/components/StandardFilter';
import { MetricCard } from '@/components/MetricCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportPrintButton } from '@/components/ReportPrintButton';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteScroll, useScrollLoadMore } from '@/hooks/useInfiniteScroll';
import { AdminViewBanner } from '@/components/admin/AdminViewBanner';

// Interface para item de compra individual (padrão ERP)
interface PurchaseItem {
  orderId: string;
  orderDate: number;
  materialId: string;
  materialName: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  weight: number;
  unitPrice: number;
  totalPrice: number;
  // Campos de ajuste de preço
  originalPrice: number;
  priceAdjustment: number;
  // Campo de tara
  tara: number;
}

const PurchaseOrders = () => {
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
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('last30');
  const [filterStartDate, setFilterStartDate] = useState(startDate);
  const [filterEndDate, setFilterEndDate] = useState(endDate);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [materialSearchOpen, setMaterialSearchOpen] = useState(false);
  const [materialSearchValue, setMaterialSearchValue] = useState('');

  // Ref for virtualization
  const parentRef = useRef<HTMLDivElement>(null);
  
  const handleExitAdminView = () => {
    navigate(location.pathname + location.search, { replace: true, state: {} });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        let ordersData, materialsData;
        
        if (isAdminView && adminViewingUser) {
          // Load data for specific user in admin view
          [ordersData, materialsData] = await Promise.all([
            getOrdersForUser(adminViewingUser),
            getMaterialsForUser(adminViewingUser)
          ]);
        } else {
          [ordersData, materialsData] = await Promise.all([
            getOrders(),
            getMaterials()
          ]);
        }
        
        const categoriesData = await getMaterialCategories();
        setOrders(ordersData);
        setMaterials(materialsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [startDate, endDate, isAdminView, adminViewingUser]);

  // Calcular range de datas baseado no período
  const dateRange = useMemo(() => {
    const now = new Date();
    let filterStart: Date;
    let filterEnd: Date = new Date(now);
    filterEnd.setHours(23, 59, 59, 999);

    if (selectedPeriod === 'custom' && filterStartDate && filterEndDate) {
      filterStart = new Date(filterStartDate + 'T00:00:00');
      filterEnd = new Date(filterEndDate + 'T23:59:59');
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

  // TODOS OS ITENS DO PERÍODO (sem filtro de material/categoria)
  const allPeriodItems = useMemo(() => {
    const { filterStart, filterEnd } = dateRange;

    const ordersInPeriod = orders.filter(order => 
      order.type === 'compra' && 
      order.status === 'completed' &&
      order.items && order.items.length > 0 &&
      !order.cancelled
    ).filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate >= filterStart && orderDate <= filterEnd;
    });

    const items: PurchaseItem[] = [];
    ordersInPeriod.forEach(order => {
      order.items.forEach(item => {
        const material = materials.find(m => m.id === item.materialId);
        const category = material?.category_id 
          ? categories.find(c => c.id === material.category_id) 
          : null;
        
        items.push({
          orderId: order.id,
          orderDate: order.timestamp,
          materialId: item.materialId,
          materialName: item.materialName,
          categoryId: category?.id || null,
          categoryName: category?.name || null,
          categoryColor: category?.hex_color || category?.color || null,
          weight: item.quantity,
          unitPrice: item.price,
          totalPrice: item.total,
          originalPrice: item.originalPrice || material?.price || item.price,
          priceAdjustment: item.priceAdjustment || 0,
          tara: item.tara || 0
        });
      });
    });

    return items;
  }, [orders, materials, categories, dateRange]);

  // ITENS FILTRADOS por material/categoria
  const filteredItems = useMemo(() => {
    let items = [...allPeriodItems];

    if (selectedMaterials.length > 0) {
      items = items.filter(item => 
        selectedMaterials.some(selected => 
          item.materialName.toLowerCase().includes(selected.toLowerCase())
        )
      );
    }

    if (selectedCategory !== 'all') {
      items = items.filter(item => item.categoryId === selectedCategory);
    }

    return items.sort((a, b) => b.orderDate - a.orderDate);
  }, [allPeriodItems, selectedMaterials, selectedCategory]);

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

  // TOTAIS GERAIS DO PERÍODO (não afetados por filtro de material)
  const periodTotals = useMemo(() => ({
    orderCount: new Set(allPeriodItems.map(item => item.orderId)).size,
    totalWeight: allPeriodItems.reduce((sum, item) => sum + item.weight, 0),
    totalAmount: allPeriodItems.reduce((sum, item) => sum + item.totalPrice, 0)
  }), [allPeriodItems]);

  // TOTAIS DO MATERIAL FILTRADO (somente quando há filtro)
  const filteredTotals = useMemo(() => ({
    itemCount: filteredItems.length,
    orderCount: new Set(filteredItems.map(item => item.orderId)).size,
    totalWeight: filteredItems.reduce((sum, item) => sum + item.weight, 0),
    totalAmount: filteredItems.reduce((sum, item) => sum + item.totalPrice, 0)
  }), [filteredItems]);

  const hasFilter = selectedMaterials.length > 0 || selectedCategory !== 'all';

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
    setSelectedMaterials([]);
    setSelectedCategory('all');
    setMaterialSearchValue('');
  };

  const removeMaterial = (materialToRemove: string) => {
    setSelectedMaterials(prev => prev.filter(material => material !== materialToRemove));
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-800">
        <header className="bg-slate-900 text-white p-3 border-b border-slate-700">
          <h1 className="text-lg md:text-xl font-bold">Materiais Comprados</h1>
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
              <ShoppingCart className="h-5 w-5 text-emerald-500" />
              Materiais Comprados
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ReportPrintButton
              reportTitle="Relatório de Compras"
              period={{ label: selectedPeriod === 'daily' ? 'Hoje' : selectedPeriod === 'custom' ? `${filterStartDate} a ${filterEndDate}` : `Últimos ${selectedPeriod.replace('last', '')} dias` }}
              metrics={[
                { label: 'Total Compras', value: `R$ ${periodTotals.totalAmount.toFixed(2)}`, color: '#3B82F6' },
                { label: 'Peso Total', value: `${periodTotals.totalWeight.toFixed(2)} kg` },
                { label: 'Nº Compras', value: periodTotals.orderCount }
              ]}
            />
            <ContextualHelpButton module="compra" />
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
        {/* Filtro Padronizado com Seleção de Materiais e Categorias */}
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

        {/* TOTAIS GERAIS DO PERÍODO - Sempre visíveis */}
        <div className="mb-3">
          <p className="text-slate-400 text-[10px] mb-1">Período</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <MetricCard
              icon={DollarSign}
              iconColor="text-emerald-500"
              label="Total"
              value={formatCurrency(periodTotals.totalAmount)}
              compact
            />
            <MetricCard
              icon={Scale}
              iconColor="text-emerald-500"
              label="Peso"
              value={formatWeight(periodTotals.totalWeight)}
              compact
            />
            <MetricCard
              icon={ShoppingCart}
              iconColor="text-emerald-500"
              label="Compras"
              value={periodTotals.orderCount}
              compact
              className="col-span-2 md:col-span-1"
            />
          </div>
        </div>

        {/* TOTAIS DO FILTRO - Somente quando há filtro ativo */}
        {hasFilter && (
          <div className="mb-3">
            <p className="text-amber-400 text-[10px] mb-1 flex items-center gap-1">
              <Filter className="h-2.5 w-2.5" />
              Filtro
              {selectedMaterials.length > 0 && `: ${selectedMaterials.slice(0, 2).join(', ')}${selectedMaterials.length > 2 ? '...' : ''}`}
              {selectedCategory !== 'all' && (
                <>
                  {selectedMaterials.length > 0 && ' | '}
                  {categories.find(c => c.id === selectedCategory)?.name?.substring(0, 10)}
                </>
              )}
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
                icon={ShoppingCart}
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
                icon={DollarSign}
                iconColor="text-amber-500"
                label="Valor"
                value={formatCurrency(filteredTotals.totalAmount)}
                compact
              />
            </div>
          </div>
        )}

        {/* Lista de Itens de Compra */}
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
                  <div className="p-2 w-[100px]">Data/Hora</div>
                  <div className="p-2 w-[80px]">Pedido</div>
                  <div className="p-2 flex-1">Material</div>
                  <div className="p-2 w-[100px] hidden lg:block">Categoria</div>
                  <div className="p-2 w-[80px] hidden sm:block">Peso</div>
                  <div className="p-2 w-[60px] hidden lg:block">Tara</div>
                  <div className="p-2 w-[80px] hidden md:block">Ajuste/kg</div>
                  <div className="p-2 w-[100px]">Valor</div>
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
                    const { date, time } = formatDateTime(item.orderDate);
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
                        <div className="text-slate-300 text-sm p-2 w-[100px]">
                          <div>{date}</div>
                          <div className="text-xs text-slate-500">{time}</div>
                        </div>
                        <div className="text-slate-400 text-xs p-2 font-mono w-[80px]">
                          #{item.orderId.substring(0, 8)}
                        </div>
                        <div className="text-slate-300 text-sm p-2 flex-1 truncate">
                          {item.materialName}
                        </div>
                        <div className="p-2 w-[100px] hidden lg:block">
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
                        <div className="text-slate-300 text-sm p-2 w-[80px] hidden sm:block">
                          {formatWeight(item.weight)}
                        </div>
                        {/* Coluna de Tara */}
                        <div className="text-slate-300 text-sm p-2 w-[60px] hidden lg:block">
                          {item.tara > 0 ? (
                            <span className="text-amber-400 text-xs">{formatWeight(item.tara)}</span>
                          ) : (
                            <span className="text-slate-500 text-xs">-</span>
                          )}
                        </div>
                        {/* Coluna de Ajuste de Preço */}
                        <div className="p-2 w-[80px] hidden md:block">
                          {item.priceAdjustment !== 0 ? (
                            <span className={`text-xs font-medium ${
                              item.priceAdjustment < 0 
                                ? 'text-rose-400'     // Negativo = vermelho
                                : 'text-emerald-400'  // Positivo = verde
                            }`}>
                              {item.priceAdjustment > 0 ? '+' : ''}{formatCurrency(item.priceAdjustment)}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">-</span>
                          )}
                        </div>
                        <div className="text-white font-semibold text-sm p-2 w-[100px]">
                          {formatCurrency(item.totalPrice)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-slate-500" />
                <h3 className="text-white font-semibold mb-1">Nenhuma compra encontrada</h3>
                <p className="text-slate-400 text-sm">
                  {hasFilter 
                    ? 'Nenhum item corresponde aos filtros selecionados.' 
                    : 'As compras registradas no PDV aparecerão aqui.'
                  }
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
    </FeatureGuard>
  );
};

export default PurchaseOrders;
