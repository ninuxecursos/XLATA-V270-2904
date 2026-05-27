import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingDown, Loader2, FileText, Tag, Percent, Trash2, Calendar, Clock, MoreVertical, Printer, HelpCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { getCashRegisters, calculateCashSummary } from '@/utils/supabaseStorage';
import { StandardFilter, FilterPeriod } from '@/components/StandardFilter';
import { MetricCard } from '@/components/MetricCard';
import { ReportPrintButton } from '@/components/ReportPrintButton';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteScroll, useScrollLoadMore } from '@/hooks/useInfiniteScroll';
import { useAdminViewState } from '@/hooks/useAdminView';
import { getCashRegistersForUser } from '@/utils/adminDataAccess';
import { AdminViewBanner } from '@/components/admin/AdminViewBanner';
import PasswordPromptModal from '@/components/PasswordPromptModal';
import ClearExpensesModal from '@/components/ClearExpensesModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// Interface tipada para item de despesa analítico
interface ExpenseItem {
  id: string;
  timestamp: number;
  registerId: string;
  origin: 'PDV' | 'Manual';
  description: string;
  category: string;
  details: string;
  amount: number;
}

// Parser para extrair categoria da descrição (formato: "Categoria - Detalhe")
const parseExpenseDescription = (description: string): { category: string; details: string } => {
  const parts = description.split(' - ');
  if (parts.length >= 2) {
    return {
      category: parts[0].trim(),
      details: parts.slice(1).join(' - ').trim()
    };
  }
  return {
    category: 'Outros',
    details: description.trim()
  };
};

const Expenses = () => {
  const [searchParams] = useSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('last30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const isMobile = useIsMobile();

  // Admin view state
  const { isAdminView, adminViewingUser, adminViewingUserName } = useAdminViewState();

  // Ref for virtualization
  const parentRef = useRef<HTMLDivElement>(null);

  // Modal states for clearing expenses
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showClearExpensesModal, setShowClearExpensesModal] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    const urlStartDate = searchParams.get('startDate');
    const urlEndDate = searchParams.get('endDate');
    const urlPeriod = searchParams.get('period');
    
    if (urlStartDate) setStartDate(urlStartDate);
    if (urlEndDate) setEndDate(urlEndDate);
    if (urlPeriod) setSelectedPeriod(urlPeriod as FilterPeriod);
  }, [searchParams]);

  const [expensesData, setExpensesData] = useState<ExpenseItem[]>([]);

  useEffect(() => {
    const loadExpensesData = async () => {
      setIsLoading(true);
      try {
        const cashRegisters = isAdminView && adminViewingUser 
          ? await getCashRegistersForUser(adminViewingUser)
          : await getCashRegisters();
        
        const now = new Date();
        let filterStartDate: Date;
        let filterEndDate: Date = new Date(now);
        filterEndDate.setHours(23, 59, 59, 999);

        if (selectedPeriod === 'custom' && startDate && endDate) {
          filterStartDate = new Date(startDate + 'T00:00:00');
          filterEndDate = new Date(endDate + 'T23:59:59.999');
        } else {
          switch (selectedPeriod) {
            case 'daily':
              filterStartDate = new Date(now);
              filterStartDate.setHours(0, 0, 0, 0);
              filterEndDate = new Date(now);
              filterEndDate.setHours(23, 59, 59, 999);
              break;
            case 'last30':
              filterStartDate = new Date(now);
              filterStartDate.setDate(now.getDate() - 30);
              filterStartDate.setHours(0, 0, 0, 0);
              break;
            case 'last60':
              filterStartDate = new Date(now);
              filterStartDate.setDate(now.getDate() - 60);
              filterStartDate.setHours(0, 0, 0, 0);
              break;
            case 'last90':
              filterStartDate = new Date(now);
              filterStartDate.setDate(now.getDate() - 90);
              filterStartDate.setHours(0, 0, 0, 0);
              break;
            case 'last365':
              filterStartDate = new Date(now);
              filterStartDate.setDate(now.getDate() - 365);
              filterStartDate.setHours(0, 0, 0, 0);
              break;
            default:
              filterStartDate = new Date(now);
              filterStartDate.setDate(now.getDate() - 30);
              filterStartDate.setHours(0, 0, 0, 0);
          }
        }

        const filteredRegisters = cashRegisters.filter(register => {
          const registerDate = new Date(register.openingTimestamp);
          return registerDate >= filterStartDate && registerDate <= filterEndDate;
        });

        const allExpenses: ExpenseItem[] = [];

        await Promise.all(
          filteredRegisters.map(async (register) => {
            const summary = await calculateCashSummary(register);
            summary.expenses.forEach(expense => {
              const parsed = parseExpenseDescription(expense.description);
              allExpenses.push({
                id: expense.id,
                timestamp: expense.timestamp,
                registerId: register.id,
                origin: 'PDV',
                description: expense.description,
                category: parsed.category,
                details: parsed.details,
                amount: expense.amount
              });
            });
          })
        );

        const sortedExpenses = allExpenses.sort((a, b) => b.timestamp - a.timestamp);
        setExpensesData(sortedExpenses);
      } catch (error) {
        console.error('Error loading expenses data:', error);
        setExpensesData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadExpensesData();
  }, [selectedPeriod, startDate, endDate, isAdminView, adminViewingUser, reloadTrigger]);

  const uniqueCategories = useMemo(() => {
    const categories = [...new Set(expensesData.map(e => e.category))];
    return categories.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [expensesData]);

  const periodTotals = useMemo(() => ({
    totalAmount: expensesData.reduce((sum, e) => sum + e.amount, 0),
    totalCount: expensesData.length
  }), [expensesData]);

  const filteredExpenses = useMemo(() => {
    if (selectedCategory === 'all') return expensesData;
    return expensesData.filter(e => e.category === selectedCategory);
  }, [expensesData, selectedCategory]);

  const { visibleItems, loadMore, hasMore, loadedCount, totalCount } = useInfiniteScroll({
    items: filteredExpenses,
    pageSize: 20
  });

  const rowVirtualizer = useVirtualizer({
    count: visibleItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isMobile ? 80 : 52,
    overscan: 5,
  });

  useScrollLoadMore(parentRef, loadMore, hasMore);

  const filteredTotals = useMemo(() => {
    if (selectedCategory === 'all') return null;
    
    const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const percentage = periodTotals.totalAmount > 0 
      ? (totalAmount / periodTotals.totalAmount) * 100 
      : 0;
    
    return {
      totalAmount,
      totalCount: filteredExpenses.length,
      percentage: percentage.toFixed(1)
    };
  }, [filteredExpenses, selectedCategory, periodTotals]);

  const hasFilter = selectedCategory !== 'all';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleClearExpensesRequest = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordAuthenticated = () => {
    setShowPasswordModal(false);
    setShowClearExpensesModal(true);
  };

  const handleExpensesCleared = () => {
    setReloadTrigger(prev => prev + 1);
  };

  const clearFilters = () => {
    setSelectedPeriod('last30');
    setStartDate('');
    setEndDate('');
    setSelectedCategory('all');
  };

  // ─── Mobile Native Card Item ───
  const MobileExpenseCard = ({ expense }: { expense: ExpenseItem }) => (
    <div className="bg-card/60 rounded-2xl p-3.5 border border-border/30 active:scale-[0.98] transition-transform">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{expense.details}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              {expense.category}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {expense.origin}
            </span>
          </div>
        </div>
        <span className="text-sm font-bold text-destructive whitespace-nowrap">
          {formatCurrency(expense.amount)}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="w-2.5 h-2.5" />
          {formatDate(expense.timestamp)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {formatTime(expense.timestamp)}
        </span>
      </div>
    </div>
  );

  // ─── MOBILE LAYOUT ───
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {isAdminView && (
          <div className="bg-card border-b border-border px-4 py-2">
            <AdminViewBanner 
              adminViewingUserName={adminViewingUserName}
              showBackToAdmin={true}
            />
          </div>
        )}

        {/* Native header */}
        <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/configuracoes" className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center active:scale-95 transition-transform">
                <ArrowLeft className="h-4 w-4 text-foreground" />
              </Link>
              <div>
                <h1 className="text-base font-bold text-foreground">Despesas</h1>
                <p className="text-[10px] text-muted-foreground">Relatório analítico</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center active:scale-95 transition-transform">
                  <MoreVertical className="h-4 w-4 text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border rounded-xl min-w-[180px]">
                <DropdownMenuItem className="text-foreground text-sm rounded-lg gap-2" onSelect={() => {
                  setTimeout(() => {
                    const wrapper = document.querySelector('[data-expense-print]') as HTMLElement;
                    const btn = wrapper?.querySelector('button') as HTMLElement;
                    btn?.click();
                  }, 150);
                }}>
                  <Printer className="h-4 w-4" />
                  Imprimir
                </DropdownMenuItem>
                <DropdownMenuItem className="text-foreground text-sm rounded-lg gap-2" onSelect={() => {
                  setTimeout(() => {
                    const wrapper = document.querySelector('[data-expense-help]') as HTMLElement;
                    const btn = wrapper?.querySelector('button') as HTMLElement;
                    btn?.click();
                  }, 150);
                }}>
                  <HelpCircle className="h-4 w-4" />
                  Ajuda
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive text-sm rounded-lg gap-2" onSelect={handleClearExpensesRequest}>
                  <Trash2 className="h-4 w-4" />
                  Zerar Despesas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Hidden buttons for dropdown triggers */}
            <div className="hidden">
              <div data-expense-print>
                <ReportPrintButton
                  reportTitle="Relatório de Despesas"
                  period={{ label: selectedPeriod === 'daily' ? 'Hoje' : selectedPeriod === 'custom' ? `${startDate} a ${endDate}` : `Últimos ${selectedPeriod.replace('last', '')} dias` }}
                  metrics={[
                    { label: 'Total Despesas', value: `R$ ${periodTotals.totalAmount.toFixed(2)}`, color: '#EF4444' },
                    { label: 'Nº Lançamentos', value: periodTotals.totalCount }
                  ]}
                />
              </div>
              <div data-expense-help><ContextualHelpButton module="despesas" /></div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-3 space-y-3 pb-24">
          {/* Filters */}
          <StandardFilter
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            onClear={clearFilters}
            extraFilters={
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 px-2.5 text-xs bg-card border-border text-foreground w-auto min-w-[90px] rounded-xl">
                  <Tag className="h-3 w-3 mr-1 text-primary" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-xl">
                  <SelectItem value="all" className="text-foreground text-xs rounded-lg">Todas</SelectItem>
                  {uniqueCategories.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-foreground text-xs rounded-lg">
                      {cat.substring(0, 18)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />

          {/* Summary Cards - native style */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-card rounded-2xl p-3.5 border border-border/30">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                <span className="text-[10px] text-muted-foreground font-medium">Total (Período)</span>
              </div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(periodTotals.totalAmount)}</p>
            </div>
            <div className="bg-card rounded-2xl p-3.5 border border-border/30">
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] text-muted-foreground font-medium">Lançamentos</span>
              </div>
              <p className="text-lg font-bold text-foreground">{periodTotals.totalCount}</p>
            </div>
          </div>

          {/* Category totals */}
          {filteredTotals && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-amber-500/5 rounded-2xl p-3 border border-amber-500/20">
                <span className="text-[9px] text-amber-400 font-medium block truncate">{selectedCategory}</span>
                <p className="text-sm font-bold text-foreground mt-0.5">{formatCurrency(filteredTotals.totalAmount)}</p>
              </div>
              <div className="bg-amber-500/5 rounded-2xl p-3 border border-amber-500/20">
                <span className="text-[9px] text-amber-400 font-medium">Filtro</span>
                <p className="text-sm font-bold text-foreground mt-0.5">{filteredTotals.totalCount}</p>
              </div>
              <div className="bg-amber-500/5 rounded-2xl p-3 border border-amber-500/20">
                <span className="text-[9px] text-amber-400 font-medium">Particip.</span>
                <p className="text-sm font-bold text-foreground mt-0.5">{filteredTotals.percentage}%</p>
              </div>
            </div>
          )}

          {/* List header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {hasFilter ? selectedCategory : 'Lista de Despesas'}
              <span className="text-muted-foreground font-normal ml-1.5">({filteredExpenses.length})</span>
            </h2>
          </div>

          {/* Expense list - native cards */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <span className="text-sm text-muted-foreground">Carregando despesas...</span>
            </div>
          ) : filteredExpenses.length > 0 ? (
            <div ref={parentRef} className="space-y-2" style={{ height: 'calc(100vh - 420px)', minHeight: '250px', overflow: 'auto' }}>
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const expense = visibleItems[virtualRow.index];
                  return (
                    <div
                      key={expense.id}
                      className="absolute left-0 w-full px-0.5"
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <MobileExpenseCard expense={expense} />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <TrendingDown className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-foreground font-semibold text-base mb-1">Nenhuma despesa encontrada</h3>
              <p className="text-muted-foreground text-sm text-center px-8">
                As despesas registradas no caixa aparecerão aqui.
              </p>
            </div>
          )}

          {totalCount > 0 && (
            <p className="text-xs text-muted-foreground text-center pb-4">
              Exibindo {loadedCount} de {totalCount}
              {hasMore && <span className="text-primary ml-1">(Role para mais)</span>}
            </p>
          )}
        </main>

        <PasswordPromptModal
          open={showPasswordModal}
          onOpenChange={setShowPasswordModal}
          onAuthenticated={handlePasswordAuthenticated}
          title="Zerar Despesas"
          description="Digite a senha para confirmar a limpeza das despesas."
        />
        <ClearExpensesModal
          open={showClearExpensesModal}
          onOpenChange={setShowClearExpensesModal}
          onExpensesCleared={handleExpensesCleared}
        />
      </div>
    );
  }

  // ─── DESKTOP LAYOUT (unchanged) ───
  return (
    <div className="flex flex-col min-h-screen bg-slate-800">
      {isAdminView && (
        <div className="bg-slate-900 border-b border-slate-700 px-4 py-2">
          <AdminViewBanner 
            adminViewingUserName={adminViewingUserName}
            showBackToAdmin={true}
          />
        </div>
      )}
      
      <header className="bg-slate-900 text-white p-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline text-sm">Voltar</span>
            </Link>
            <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-rose-500" />
              Despesas Gerais
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ReportPrintButton
              reportTitle="Relatório de Despesas"
              period={{ label: selectedPeriod === 'daily' ? 'Hoje' : selectedPeriod === 'custom' ? `${startDate} a ${endDate}` : `Últimos ${selectedPeriod.replace('last', '')} dias` }}
              metrics={[
                { label: 'Total Despesas', value: `R$ ${periodTotals.totalAmount.toFixed(2)}`, color: '#EF4444' },
                { label: 'Nº Lançamentos', value: periodTotals.totalCount }
              ]}
            />
            <ContextualHelpButton module="despesas" />
            <Button
              onClick={handleClearExpensesRequest}
              size="sm"
              variant="outline"
              className="bg-rose-900/20 border-rose-600 text-rose-400 hover:bg-rose-900/40 text-xs px-2"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Zerar
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-2 md:p-4 overflow-auto">
        <StandardFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onClear={clearFilters}
          extraFilters={
            <div className="flex items-center gap-1.5">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 px-2 text-xs bg-slate-800 border-slate-600 text-white w-auto min-w-[80px] rounded-lg">
                  <Tag className="h-3 w-3 mr-1 text-emerald-500" />
                  <SelectValue placeholder="Cat." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-white text-xs">Todas</SelectItem>
                  {uniqueCategories.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-white text-xs">
                      {cat.substring(0, 15)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />

        <div className="grid grid-cols-2 gap-2 mb-2">
          <MetricCard icon={TrendingDown} iconColor="text-rose-500" label="Total (Período)" value={formatCurrency(periodTotals.totalAmount)} compact />
          <MetricCard icon={FileText} iconColor="text-emerald-500" label="Lançamentos" value={periodTotals.totalCount} compact />
        </div>

        {filteredTotals && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <MetricCard icon={Tag} iconColor="text-amber-500" label={selectedCategory.substring(0, 12)} value={formatCurrency(filteredTotals.totalAmount)} className="bg-amber-900/20 border-amber-700/30" compact />
            <MetricCard icon={FileText} iconColor="text-amber-500" label="Filtro" value={filteredTotals.totalCount} className="bg-amber-900/20 border-amber-700/30" compact />
            <MetricCard icon={Percent} iconColor="text-amber-500" label="Particip." value={`${filteredTotals.percentage}%`} className="bg-amber-900/20 border-amber-700/30" compact />
          </div>
        )}

        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="p-3">
            <CardTitle className="text-white text-base md:text-lg">
              {hasFilter ? `Despesas: ${selectedCategory}` : 'Lista de Despesas'} 
              <span className="text-slate-400 text-xs font-normal ml-2">({filteredExpenses.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                <span className="ml-2 text-slate-400">Carregando...</span>
              </div>
            ) : filteredExpenses.length > 0 ? (
              <div 
                ref={parentRef}
                className="overflow-auto"
                style={{ height: 'calc(100vh - 380px)', minHeight: '300px' }}
              >
                <div className="sticky top-0 bg-slate-700 z-10 flex items-center border-b border-slate-600 text-slate-300 text-xs font-medium">
                  <div className="p-2 w-[100px]">Data/Hora</div>
                  <div className="p-2 w-[80px] hidden md:block">ID</div>
                  <div className="p-2 w-[60px] hidden sm:block">Origem</div>
                  <div className="p-2 w-[100px]">Categoria</div>
                  <div className="p-2 flex-1">Descrição</div>
                  <div className="p-2 w-[100px]">Valor</div>
                  <div className="p-2 w-[80px] hidden lg:block">Caixa</div>
                </div>
                
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const expense = visibleItems[virtualRow.index];
                    return (
                      <div
                        key={expense.id}
                        className="absolute left-0 w-full flex items-center border-b border-slate-600 hover:bg-slate-600/30"
                        style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                      >
                        <div className="text-slate-300 text-sm p-2 w-[100px]">
                          <div>{formatDate(expense.timestamp)}</div>
                          <div className="text-xs text-slate-500">{formatTime(expense.timestamp)}</div>
                        </div>
                        <div className="text-slate-400 font-mono text-xs p-2 w-[80px] hidden md:block">{expense.id.substring(0, 8)}</div>
                        <div className="text-slate-300 text-sm p-2 w-[60px] hidden sm:block">
                          <span className="px-2 py-1 rounded text-xs bg-blue-900/50 text-blue-300">{expense.origin}</span>
                        </div>
                        <div className="text-slate-300 text-sm p-2 w-[100px]">
                          <span className="px-2 py-1 rounded text-xs bg-slate-600 text-slate-200">{expense.category}</span>
                        </div>
                        <div className="text-slate-300 text-sm p-2 flex-1 truncate">{expense.details}</div>
                        <div className="text-rose-400 font-semibold text-sm p-2 w-[100px]">{formatCurrency(expense.amount)}</div>
                        <div className="text-slate-400 font-mono text-xs p-2 w-[80px] hidden lg:block">{expense.registerId.substring(0, 8)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <TrendingDown className="h-12 w-12 mx-auto mb-3 text-slate-500" />
                <h3 className="text-white font-semibold mb-1">Nenhuma despesa encontrada</h3>
                <p className="text-slate-400 text-sm">As despesas registradas no caixa aparecerão aqui.</p>
              </div>
            )}

            {totalCount > 0 && (
              <div className="text-sm text-slate-400 text-center mt-3">
                Exibindo {loadedCount} de {totalCount} despesas
                {hasMore && <span className="text-emerald-400 ml-2">(Role para carregar mais)</span>}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <PasswordPromptModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        onAuthenticated={handlePasswordAuthenticated}
        title="Zerar Despesas"
        description="Digite a senha para confirmar a limpeza das despesas."
      />
      <ClearExpensesModal
        open={showClearExpensesModal}
        onOpenChange={setShowClearExpensesModal}
        onExpensesCleared={handleExpensesCleared}
      />
    </div>
  );
};

export default Expenses;
