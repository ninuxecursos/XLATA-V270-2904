import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, TrendingUp, Package, DollarSign, ArrowUpCircle, ArrowDownCircle, Scale, Percent, Receipt, Clock, Edit, ShoppingCart } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileFilterChip } from './MobileFilterChip';
import { MobileFilterSheet } from './MobileFilterSheet';
import { FilterPeriod } from './StandardFilter';

interface MaterialStock {
  materialName: string;
  currentStock: number;
  purchasePrice: number;
  salePrice: number;
  totalValue: number;
  profitProjection: number;
  totalPurchases: number;
  totalSales: number;
  totalPurchaseCost: number;
  totalPurchaseQuantity: number;
  avgPurchasePrice: number;
  transactions: Array<{
    date: number;
    type: 'compra' | 'venda';
    quantity: number;
    price: number;
    total: number;
    priceAdjustment?: number;
    tara?: number;
  }>;
}

interface MaterialDetailsViewProps {
  material: MaterialStock;
  totalWeight: number;
  onBack: () => void;
  onEditMaterial?: (materialName: string) => void;
  onSellStock?: (material: MaterialStock) => void;
}

const BATCH_SIZE = 30;

const MaterialDetailsView = ({ material, totalWeight, onBack, onEditMaterial, onSellStock }: MaterialDetailsViewProps) => {
  const [displayedTransactions, setDisplayedTransactions] = useState<typeof material.transactions>([]);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Date filter states
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    if (filterPeriod === 'all') {
      return material.transactions;
    }

    const now = new Date();
    let startDate: Date | null = null;
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    if (filterPeriod === 'custom' && filterStartDate && filterEndDate) {
      startDate = new Date(filterStartDate + 'T00:00:00');
      endDate = new Date(filterEndDate + 'T23:59:59.999');
    } else {
      switch (filterPeriod) {
        case 'daily':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'last30':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'last60':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 60);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'last90':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 90);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'last365':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 365);
          startDate.setHours(0, 0, 0, 0);
          break;
      }
    }

    return material.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return startDate && transactionDate >= startDate && transactionDate <= endDate;
    });
  }, [material.transactions, filterPeriod, filterStartDate, filterEndDate]);

  // Initialize with first batch when material or filter changes
  useEffect(() => {
    const initialBatch = filteredTransactions.slice(0, BATCH_SIZE);
    setDisplayedTransactions(initialBatch);
    setHasMore(filteredTransactions.length > BATCH_SIZE);
  }, [filteredTransactions]);

  // Load more transactions
  const loadMore = useCallback(() => {
    setDisplayedTransactions(prev => {
      const currentLength = prev.length;
      const nextBatch = filteredTransactions.slice(currentLength, currentLength + BATCH_SIZE);
      
      if (nextBatch.length > 0) {
        setHasMore(currentLength + nextBatch.length < filteredTransactions.length);
        return [...prev, ...nextBatch];
      }
      setHasMore(false);
      return prev;
    });
  }, [filteredTransactions]);

  // Load all transactions at once
  const loadAll = useCallback(() => {
    setDisplayedTransactions(filteredTransactions);
    setHasMore(false);
  }, [filteredTransactions]);

  // Detectar scroll próximo ao fim
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMore();
    }
  }, [hasMore, loadMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatWeight = (value: number) => {
    return `${value.toFixed(2)} kg`;
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }),
      time: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const percentage = totalWeight > 0 ? (material.currentStock / totalWeight * 100) : 0;
  const totalSaleValue = material.currentStock * material.salePrice;

  return (
    <div className="flex flex-col h-screen bg-slate-800 overflow-hidden">
      {/* Header - Fixed */}
      <header className="flex-shrink-0 bg-slate-900 text-white p-3 border-b border-slate-700">
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
          {/* Título e botão voltar */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-1"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="ml-1 text-sm">Voltar</span>
            </Button>
            <h1 className={`font-bold flex items-center gap-2 truncate ${isMobile ? 'text-base' : 'text-lg md:text-xl'}`}>
              <Package className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <span className="truncate">{material.materialName}</span>
            </h1>
          </div>
          
          {/* Botões de ação - em linha no mobile, ocupando toda a largura */}
          <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
            {onSellStock && material.currentStock > 0 && (
              <Button
                variant="outline"
                size={isMobile ? 'default' : 'sm'}
                onClick={() => onSellStock(material)}
                className={`bg-blue-600/20 border-blue-500/50 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 ${isMobile ? 'flex-1 h-11' : ''}`}
              >
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                Vender
              </Button>
            )}
            {onEditMaterial && (
              <Button
                variant="outline"
                size={isMobile ? 'default' : 'sm'}
                onClick={() => onEditMaterial(material.materialName)}
                className={`bg-emerald-600/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/30 hover:text-emerald-300 ${isMobile ? 'flex-1 h-11' : ''}`}
              >
                <Edit className="h-4 w-4 mr-1.5" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 flex flex-col min-h-0 p-2 md:p-4 overflow-hidden">
        {/* Fixed sections - Stock, Prices, Values */}
        <div className="flex-shrink-0">
          {/* Seção: Estoque */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Estoque</h3>
            <div className="grid grid-cols-3 gap-2">
              {/* Peso */}
              <Card className="bg-slate-700 border-slate-600">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Scale className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400">Peso</span>
                  </div>
                  <div className="text-sm font-bold text-white">{formatWeight(material.currentStock)}</div>
                </CardContent>
              </Card>
              
              {/* Percentual */}
              <Card className="bg-slate-700 border-slate-600">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Percent className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400">% Total</span>
                  </div>
                  <div className="text-sm font-bold text-white">{percentage.toFixed(1)}%</div>
                  <Progress value={percentage} className="h-1 mt-1.5" />
                </CardContent>
              </Card>
              
              {/* Transações */}
              <Card className="bg-slate-700 border-slate-600">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Receipt className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400">Movim.</span>
                  </div>
                  <div className="text-sm font-bold text-white">{material.transactions.length}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Seção: Preços */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Preços por kg</h3>
            <div className="grid grid-cols-3 gap-2">
              {/* Preço Médio de Compra (Calculado) */}
              <Card className="bg-slate-700 border-slate-600">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-yellow-500" />
                    <span className="text-xs text-slate-400">Média Compra</span>
                  </div>
                  <div className="text-sm font-bold text-yellow-400">{formatCurrency(material.avgPurchasePrice || 0)}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Custo médio real</div>
                </CardContent>
              </Card>
              
              {/* Preço Atual de Compra (do cadastro) */}
              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">Compra Atual</span>
                  </div>
                  <div className="text-sm font-bold text-slate-400">{formatCurrency(material.purchasePrice)}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Preço cadastro</div>
                </CardContent>
              </Card>
              
              {/* Preço de Venda Atual */}
              <Card className="bg-slate-700 border-slate-600">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs text-slate-400">Venda Atual</span>
                  </div>
                  <div className="text-sm font-bold text-blue-400">{formatCurrency(material.salePrice)}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Valor de hoje</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Seção: Valores em Estoque */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Valores em Estoque</h3>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* Custo Real do Estoque (baseado em preços históricos) */}
              <Card className="bg-slate-700 border-slate-600">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-yellow-500" />
                    <span className="text-xs text-slate-400">Custo Real</span>
                  </div>
                  <div className="text-sm font-bold text-yellow-400">{formatCurrency(material.totalValue)}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Valor pago historicamente</div>
                </CardContent>
              </Card>
              
              {/* Valor de Venda Total (preço atual × estoque) */}
              <Card className="bg-slate-700 border-slate-600">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs text-slate-400">Valor Venda Hoje</span>
                  </div>
                  <div className="text-sm font-bold text-blue-400">{formatCurrency(totalSaleValue)}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Se vender agora</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Projeção de Lucro - Destacado */}
            <Card className="bg-emerald-900/30 border-emerald-700/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-emerald-300">Projeção de Lucro</span>
                  </div>
                  <div className="text-lg font-bold text-emerald-400">{formatCurrency(material.profitProjection)}</div>
                </div>
                <div className="text-[10px] text-emerald-600 mt-1 text-right">Venda Hoje - Custo Real</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* History Section - Takes remaining space and scrolls */}
        <Card className="flex-1 min-h-0 flex flex-col bg-slate-700 border-slate-600">
          <CardHeader className="flex-shrink-0 p-3 pb-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                Histórico ({filteredTransactions.length}
                {filterPeriod !== 'all' && ` de ${material.transactions.length}`})
              </CardTitle>
              
              {/* Date filter chip */}
              <MobileFilterChip
                selectedPeriod={filterPeriod}
                startDate={filterStartDate}
                endDate={filterEndDate}
                onClick={() => setFilterSheetOpen(true)}
                onClear={() => {
                  setFilterPeriod('all');
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
              />
            </div>
          </CardHeader>
          <CardContent 
            ref={scrollContainerRef}
            className="flex-1 min-h-0 p-2 md:p-3 overflow-y-auto"
          >
            {displayedTransactions.length > 0 ? (
              <div className="space-y-2">
                {displayedTransactions.map((transaction, index) => {
                  const { date, time } = formatDateTime(transaction.date);
                  return (
                    <Card 
                      key={index}
                      className={`border ${
                        transaction.type === 'compra' 
                          ? 'bg-emerald-900/20 border-emerald-800/50' 
                          : 'bg-rose-900/20 border-rose-800/50'
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            {transaction.type === 'compra' ? (
                              <ArrowUpCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <ArrowDownCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <span className={`text-sm font-semibold ${
                                transaction.type === 'compra' ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {transaction.type === 'compra' ? 'Compra' : 'Venda'}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-slate-400">{date}</span>
                                <span className="text-xs text-slate-500">às</span>
                                <span className="text-xs text-slate-400 font-medium">{time}</span>
                              </div>
                              {/* Linha de detalhes adicionais (tara/ajuste) */}
                              {(transaction.tara > 0 || (transaction.priceAdjustment ?? 0) !== 0) && (
                                <div className="flex items-center gap-3 mt-1 text-[10px]">
                                  {transaction.tara > 0 && (
                                    <span className="text-amber-400">
                                      Tara: {formatWeight(transaction.tara)}
                                    </span>
                                  )}
                                  {(transaction.priceAdjustment ?? 0) !== 0 && (
                                    <span className={transaction.type === 'compra' 
                                      ? (transaction.priceAdjustment < 0 ? 'text-emerald-400' : 'text-rose-400')
                                      : (transaction.priceAdjustment > 0 ? 'text-emerald-400' : 'text-rose-400')
                                    }>
                                      {transaction.priceAdjustment < 0 ? 'Desc: ' : 'Acrés: '}
                                      {formatCurrency(Math.abs(transaction.priceAdjustment))}/kg
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-white font-medium">
                              {formatWeight(transaction.quantity)}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {formatCurrency(transaction.price)}/kg
                            </div>
                            <div className={`text-sm font-semibold mt-1 ${
                              transaction.type === 'compra' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {formatCurrency(transaction.total)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {/* Loading indicator with Load All button */}
                {hasMore && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <div className="animate-pulse flex items-center gap-2 text-slate-400">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                      <span className="text-sm">Carregando mais...</span>
                    </div>
                    <button
                      onClick={loadAll}
                      className="px-3 py-1.5 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded-lg border border-slate-500 transition-colors"
                    >
                      Carregar Tudo ({filteredTransactions.length})
                    </button>
                  </div>
                )}
                
                {/* End of list indicator */}
                {!hasMore && displayedTransactions.length > 0 && (
                  <div className="text-center py-3 text-slate-500 text-xs">
                    {filterPeriod !== 'all' 
                      ? `${filteredTransactions.length} transações no período`
                      : `Todas as ${material.transactions.length} transações carregadas`
                    }
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Nenhuma transação registrada para este material.
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Filter Sheet */}
      <MobileFilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        selectedPeriod={filterPeriod}
        onPeriodChange={setFilterPeriod}
        startDate={filterStartDate}
        onStartDateChange={setFilterStartDate}
        endDate={filterEndDate}
        onEndDateChange={setFilterEndDate}
        onApply={() => setFilterSheetOpen(false)}
        onClear={() => {
          setFilterPeriod('all');
          setFilterStartDate('');
          setFilterEndDate('');
        }}
        showAllOption={true}
      />
    </div>
  );
};

export default MaterialDetailsView;
