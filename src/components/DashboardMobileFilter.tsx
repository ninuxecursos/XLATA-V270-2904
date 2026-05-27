import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, ChevronDown, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

interface DashboardMobileFilterProps {
  periodType: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  filterStartDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  filterEndDate?: Date;
  onEndDateChange: (date: Date | undefined) => void;
  onClear: () => void;
}

const periodLabels: Record<PeriodType, string> = {
  daily: 'Hoje',
  weekly: 'Semana',
  monthly: 'Mês',
  yearly: 'Ano',
  custom: 'Personalizado',
};

const periodOptions: { value: PeriodType; label: string }[] = [
  { value: 'daily', label: 'Hoje' },
  { value: 'weekly', label: 'Esta Semana' },
  { value: 'monthly', label: 'Este Mês' },
  { value: 'yearly', label: 'Este Ano' },
  { value: 'custom', label: 'Personalizado' },
];

export function DashboardMobileFilter({
  periodType,
  onPeriodChange,
  filterStartDate,
  onStartDateChange,
  filterEndDate,
  onEndDateChange,
  onClear,
}: DashboardMobileFilterProps) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const formatDateRange = () => {
    if (periodType === 'custom' && filterStartDate && filterEndDate) {
      const start = format(filterStartDate, 'dd/MM', { locale: ptBR });
      const end = format(filterEndDate, 'dd/MM', { locale: ptBR });
      return `${start} - ${end}`;
    }
    return periodLabels[periodType] || 'Hoje';
  };

  const showClear = periodType !== 'daily';

  const handleApply = () => {
    setSheetOpen(false);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const [year, month, day] = dateValue.split('-').map(Number);
      const date = new Date(year, month - 1, day, 0, 0, 0);
      onStartDateChange(date);
      onPeriodChange('custom');
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const [year, month, day] = dateValue.split('-').map(Number);
      const date = new Date(year, month - 1, day, 23, 59, 59);
      onEndDateChange(date);
      onPeriodChange('custom');
    }
  };

  const formatDateForInput = (date?: Date) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  // Mobile: Compact chip + bottom sheet
  if (isMobile) {
    return (
      <>
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setSheetOpen(true)}
            className="h-8 px-2.5 rounded-lg bg-slate-800 border-slate-600 text-white hover:bg-slate-700 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-medium">{formatDateRange()}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </Button>
          
          {showClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent 
            side="bottom" 
            className="bg-slate-900 border-slate-700 rounded-t-3xl px-0 pb-safe max-h-[85vh] overflow-hidden"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-2 pb-3">
              <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
            </div>

            <SheetHeader className="px-5 pb-4 border-b border-slate-700">
              <SheetTitle className="text-white text-lg font-bold text-left">
                Filtrar por período
              </SheetTitle>
            </SheetHeader>

            <div className="px-5 py-4 space-y-5 overflow-y-auto max-h-[60vh]">
              {/* Period pills */}
              <div>
                <Label className="text-slate-300 text-sm mb-3 block">Período</Label>
                <div className="flex flex-wrap gap-2">
                  {periodOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onPeriodChange(option.value)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95",
                        periodType === option.value
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      )}
                    >
                      {periodType === option.value && (
                        <Check className="w-3.5 h-3.5 inline mr-1.5" />
                      )}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom date range */}
              {periodType === 'custom' && (
                <div className="space-y-3 p-4 bg-slate-800/50 rounded-2xl">
                  <Label className="text-slate-300 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Período personalizado
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-400 text-xs mb-1.5 block">Início</Label>
                      <Input
                        type="date"
                        value={formatDateForInput(filterStartDate)}
                        onChange={handleStartDateChange}
                        className="bg-slate-800 border-slate-600 text-white h-12 rounded-xl text-base"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs mb-1.5 block">Fim</Label>
                      <Input
                        type="date"
                        value={formatDateForInput(filterEndDate)}
                        onChange={handleEndDateChange}
                        className="bg-slate-800 border-slate-600 text-white h-12 rounded-xl text-base"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom actions - Fixed */}
            <div className="px-5 py-4 border-t border-slate-700 bg-slate-900 flex gap-3 safe-area-bottom">
              <Button
                variant="outline"
                onClick={onClear}
                className="flex-1 h-12 rounded-xl border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Limpar
              </Button>
              <Button
                onClick={handleApply}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Aplicar
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: Return null, let the existing filter be used
  return null;
}
