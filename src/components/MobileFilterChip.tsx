import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { FilterPeriod } from './StandardFilter';
import { cn } from '@/lib/utils';

interface MobileFilterChipProps {
  selectedPeriod: FilterPeriod;
  startDate?: string;
  endDate?: string;
  onClick: () => void;
  onClear?: () => void;
  className?: string;
}

const periodLabels: Record<FilterPeriod, string> = {
  daily: 'Hoje',
  last30: '30 dias',
  last60: '60 dias',
  last90: '90 dias',
  last365: '365 dias',
  custom: 'Personalizado',
  all: 'Todos',
};

export function MobileFilterChip({
  selectedPeriod,
  startDate,
  endDate,
  onClick,
  onClear,
  className,
}: MobileFilterChipProps) {
  const formatDateRange = () => {
    if (selectedPeriod === 'custom' && startDate && endDate) {
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
    }
    return periodLabels[selectedPeriod] || 'Hoje';
  };

  const showClear = selectedPeriod !== 'daily';

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Button
        variant="outline"
        onClick={onClick}
        className="h-8 px-2.5 rounded-lg bg-slate-800 border-slate-600 text-white hover:bg-slate-700 flex items-center gap-1.5 active:scale-95 transition-all"
      >
        <Calendar className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-xs font-medium">{formatDateRange()}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </Button>
      
      {showClear && onClear && (
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
  );
}
