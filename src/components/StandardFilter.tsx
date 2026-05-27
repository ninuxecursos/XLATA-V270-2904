import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileFilterChip } from "./MobileFilterChip";
import { MobileFilterSheet } from "./MobileFilterSheet";

export type FilterPeriod = "daily" | "last30" | "last60" | "last90" | "last365" | "custom" | "all";

interface StandardFilterProps {
  selectedPeriod: FilterPeriod;
  onPeriodChange: (period: FilterPeriod) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
  showAllOption?: boolean;
  extraFilters?: React.ReactNode;
}

export function StandardFilter({
  selectedPeriod,
  onPeriodChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClear,
  showAllOption = false,
  extraFilters,
}: StandardFilterProps) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Mobile: Compact chip + bottom sheet
  if (isMobile) {
    return (
      <>
        <div className="flex items-center gap-1.5 mb-2 w-full">
          <MobileFilterChip
            selectedPeriod={selectedPeriod}
            startDate={startDate}
            endDate={endDate}
            onClick={() => setSheetOpen(true)}
            onClear={onClear}
          />
          
          {/* Extra filters inline como chips compactos */}
          {extraFilters}
        </div>

        <MobileFilterSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          selectedPeriod={selectedPeriod}
          onPeriodChange={onPeriodChange}
          startDate={startDate}
          onStartDateChange={onStartDateChange}
          endDate={endDate}
          onEndDateChange={onEndDateChange}
          onApply={() => setSheetOpen(false)}
          onClear={onClear}
          showAllOption={showAllOption}
        />
      </>
    );
  }

  // Desktop/Tablet: Full filter card
  return (
    <Card className="bg-slate-700 border-slate-600 mb-3">
      <CardContent className="p-3">
        <div className="flex flex-col gap-3">
          {/* Main filters row - 3 colunas: Período, De, Até */}
          <div className="grid grid-cols-3 gap-2">
            {/* Período */}
            <div>
              <Label className="text-slate-300 text-sm mb-1 block">Período</Label>
              <Select value={selectedPeriod} onValueChange={(v) => onPeriodChange(v as FilterPeriod)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-10">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="daily" className="text-white">Hoje</SelectItem>
                  <SelectItem value="last30" className="text-white">Últimos 30 dias</SelectItem>
                  <SelectItem value="last60" className="text-white">Últimos 60 dias</SelectItem>
                  <SelectItem value="last90" className="text-white">Últimos 90 dias</SelectItem>
                  <SelectItem value="last365" className="text-white">Últimos 365 dias</SelectItem>
                  <SelectItem value="custom" className="text-white">Personalizado</SelectItem>
                  {showAllOption && <SelectItem value="all" className="text-white">Todos</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* De (Data Inicial) */}
            <div>
              <Label className="text-slate-300 text-sm mb-1 block">
                <Calendar className="h-3 w-3 inline mr-1" />
                De
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white h-10"
                disabled={selectedPeriod !== "custom"}
              />
            </div>

            {/* Até (Data Final) */}
            <div>
              <Label className="text-slate-300 text-sm mb-1 block">
                <Calendar className="h-3 w-3 inline mr-1" />
                Até
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white h-10"
                disabled={selectedPeriod !== "custom"}
              />
            </div>
          </div>

          {/* Botão Limpar - largura total */}
          <Button
            variant="outline"
            onClick={onClear}
            className="h-10 w-full bg-transparent border-slate-600 text-slate-300 hover:bg-slate-600"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>

          {/* Extra filters row */}
          {extraFilters && (
            <div className="border-t border-slate-600 pt-3">
              {extraFilters}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
