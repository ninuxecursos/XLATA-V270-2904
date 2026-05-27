import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterPeriod } from './StandardFilter';

interface MobileFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPeriod: FilterPeriod;
  onPeriodChange: (period: FilterPeriod) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onApply: () => void;
  onClear: () => void;
  showAllOption?: boolean;
  extraFilters?: React.ReactNode;
}

const periodOptions: { value: FilterPeriod; label: string }[] = [
  { value: 'daily', label: 'Hoje' },
  { value: 'last30', label: '30 dias' },
  { value: 'last60', label: '60 dias' },
  { value: 'last90', label: '90 dias' },
  { value: 'last365', label: '365 dias' },
  { value: 'custom', label: 'Personalizado' },
];

export function MobileFilterSheet({
  open,
  onOpenChange,
  selectedPeriod,
  onPeriodChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onApply,
  onClear,
  showAllOption = false,
  extraFilters,
}: MobileFilterSheetProps) {
  const allOptions = showAllOption 
    ? [...periodOptions, { value: 'all' as FilterPeriod, label: 'Todos' }]
    : periodOptions;

  const handleApply = () => {
    onApply();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
              {allOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onPeriodChange(option.value)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95",
                    selectedPeriod === option.value
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  )}
                >
                  {selectedPeriod === option.value && (
                    <Check className="w-3.5 h-3.5 inline mr-1.5" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom date range */}
          {selectedPeriod === 'custom' && (
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
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white h-12 rounded-xl text-base"
                  />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs mb-1.5 block">Fim</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white h-12 rounded-xl text-base"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Extra filters */}
          {extraFilters && (
            <div className="space-y-3">
              {extraFilters}
            </div>
          )}
        </div>

        {/* Bottom actions - Fixed */}
        <div className="px-5 py-4 border-t border-slate-700 bg-slate-900 flex gap-3 safe-area-bottom">
          <Button
            variant="outline"
            onClick={onClear}
            className="flex-1 h-12 rounded-xl bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
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
  );
}
