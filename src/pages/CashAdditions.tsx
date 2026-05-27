import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FeatureGuard } from '@/components/FeatureGuard';
import { FEATURE_KEYS } from '@/constants/featureAccess';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Search, Calendar, DollarSign, FileText } from 'lucide-react';
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCashRegisters } from '@/utils/supabaseStorage';
import { StandardFilter, FilterPeriod } from '@/components/StandardFilter';
import { MetricCard } from '@/components/MetricCard';
import { ReportPrintButton } from '@/components/ReportPrintButton';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteScroll, useScrollLoadMore } from '@/hooks/useInfiniteScroll';
import { useAdminViewState } from '@/hooks/useAdminView';
import { getCashRegistersForUser } from '@/utils/adminDataAccess';
import { AdminViewBanner } from '@/components/admin/AdminViewBanner';

interface CashAddition {
  id: string;
  amount: number;
  description: string;
  timestamp: string;
  cashRegisterId: string;
  cashRegisterDate: string;
}

const CashAdditions = () => {
  const [searchParams] = useSearchParams();
  const [cashAdditions, setCashAdditions] = useState<CashAddition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('last30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Admin view state
  const { isAdminView, adminViewingUser, adminViewingUserName } = useAdminViewState();

  // Ref for virtualization
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const urlStartDate = searchParams.get('startDate');
    const urlEndDate = searchParams.get('endDate');
    const urlPeriod = searchParams.get('period');
    
    if (urlStartDate) setStartDate(urlStartDate);
    if (urlEndDate) setEndDate(urlEndDate);
    if (urlPeriod) setSelectedPeriod(urlPeriod as FilterPeriod);
  }, [searchParams]);

  useEffect(() => {
    const loadCashAdditions = async () => {
      try {
        setLoading(true);
        // Use admin data access when in admin view mode
        const cashRegisters = isAdminView && adminViewingUser 
          ? await getCashRegistersForUser(adminViewingUser)
          : await getCashRegisters();
        
        const additions: CashAddition[] = [];
        
        cashRegisters.forEach(register => {
          if (register.transactions) {
            register.transactions
              .filter(transaction => transaction.type === 'addition')
              .forEach(transaction => {
                additions.push({
                  id: `${register.id}-${transaction.timestamp}`,
                  amount: transaction.amount,
                  description: transaction.description || 'Adição de saldo',
                  timestamp: new Date(transaction.timestamp).toISOString(),
                  cashRegisterId: register.id,
                  cashRegisterDate: new Date(register.openingTimestamp).toISOString()
                });
              });
          }
        });

        additions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setCashAdditions(additions);
      } catch (error) {
        console.error('Error loading cash additions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCashAdditions();
  }, [selectedPeriod, startDate, endDate, isAdminView, adminViewingUser]);

  const filteredAdditions = useMemo(() => {
    let filtered = cashAdditions;

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

    filtered = filtered.filter(addition => {
      const additionDate = new Date(addition.timestamp);
      return additionDate >= filterStartDate && additionDate <= filterEndDate;
    });

    if (searchTerm) {
      filtered = filtered.filter(addition =>
        addition.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addition.amount.toString().includes(searchTerm)
      );
    }

    return filtered;
  }, [cashAdditions, selectedPeriod, startDate, endDate, searchTerm]);

  // Infinite scroll - exibe 20 itens por vez
  const { visibleItems, loadMore, hasMore, loadedCount, totalCount } = useInfiniteScroll({
    items: filteredAdditions,
    pageSize: 20
  });

  // Virtualizer - agora usa visibleItems
  const rowVirtualizer = useVirtualizer({
    count: visibleItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  // Scroll load more trigger
  useScrollLoadMore(parentRef, loadMore, hasMore);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (timestamp: string) => {
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const totalAdditions = filteredAdditions.reduce((sum, addition) => sum + addition.amount, 0);

  const clearFilters = () => {
    setSelectedPeriod('last30');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-800">
        <header className="bg-slate-900 text-white p-3 border-b border-slate-700">
          <h1 className="text-lg md:text-xl font-bold">Adições de Saldo</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-white text-lg">Carregando...</div>
        </main>
      </div>
    );
  }

  return (
    <FeatureGuard feature={FEATURE_KEYS.CASH_REGISTER}>
    <div className="flex flex-col min-h-screen bg-slate-800">
      {/* Admin View Banner */}
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
              <Plus className="h-5 w-5 text-emerald-500" />
              Adições de Saldo
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ReportPrintButton
              reportTitle="Adições de Saldo"
              period={{ label: selectedPeriod === 'daily' ? 'Hoje' : selectedPeriod === 'custom' ? `${startDate} a ${endDate}` : `Últimos ${selectedPeriod.replace('last', '')} dias` }}
              metrics={[
                { label: 'Total Adicionado', value: formatCurrency(totalAdditions), color: '#10B981' },
                { label: 'Nº de Adições', value: filteredAdditions.length }
              ]}
            />
            <ContextualHelpButton module="caixa" />
          </div>
        </div>
      </header>

      <main className="flex-1 p-2 md:p-4 overflow-auto">
        {/* Filtro Padronizado */}
        <StandardFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onClear={clearFilters}
        />

        {/* Resumo - Cards Compactos */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <MetricCard
            icon={DollarSign}
            iconColor="text-emerald-500"
            label="Total Adicionado"
            value={formatCurrency(totalAdditions)}
          />
          <MetricCard
            icon={FileText}
            iconColor="text-emerald-500"
            label="Nº de Adições"
            value={filteredAdditions.length}
          />
        </div>

        {/* Busca */}
        <Card className="bg-slate-700 border-slate-600 mb-3">
          <CardContent className="p-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por descrição ou valor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Adições - Virtualized */}
        {filteredAdditions.length === 0 ? (
          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="p-6 text-center">
              <Plus className="h-12 w-12 mx-auto mb-3 text-slate-500" />
              <h3 className="text-lg font-semibold text-white mb-1">
                Nenhuma adição encontrada
              </h3>
              <p className="text-slate-400 text-sm">
                Tente ajustar os filtros ou período.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div 
              ref={parentRef}
              className="overflow-auto"
              style={{ height: 'calc(100vh - 350px)', minHeight: '300px' }}
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const addition = visibleItems[virtualRow.index];
                  return (
                    <div
                      key={addition.id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <Card className="bg-slate-700 border-slate-600 mx-0.5 mb-1">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-emerald-600/20 p-2 rounded-lg">
                                <Plus className="h-4 w-4 text-emerald-400" />
                              </div>
                              <div>
                                <div className="text-base font-semibold text-emerald-400">
                                  {formatCurrency(addition.amount)}
                                </div>
                                <div className="text-sm text-slate-300 truncate max-w-[150px] sm:max-w-none">
                                  {addition.description}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDateTime(addition.timestamp)}
                                </div>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">
                              Adição
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Count indicator - outside scroll container */}
            <div className="text-sm text-slate-400 text-center py-2">
              Exibindo {loadedCount} de {totalCount} adições
              {hasMore && <span className="text-emerald-400 ml-2">(Role para carregar mais)</span>}
            </div>
          </>
        )}
      </main>
    </div>
    </FeatureGuard>
  );
};

export default CashAdditions;
