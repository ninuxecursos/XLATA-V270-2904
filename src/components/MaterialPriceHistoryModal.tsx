import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MaterialPriceHistory } from "@/types/pdv";
import { cn } from "@/lib/utils";

interface MaterialPriceHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: string;
  materialName: string;
}

const ITEMS_PER_PAGE = 20;

const MaterialPriceHistoryModal: React.FC<MaterialPriceHistoryModalProps> = ({
  open,
  onOpenChange,
  materialId,
  materialName,
}) => {
  const [history, setHistory] = useState<MaterialPriceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && materialId) {
      setHistory([]);
      setPage(0);
      setHasMore(true);
      loadHistory(false);
    }
  }, [open, materialId]);

  const loadHistory = async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const currentPage = isLoadMore ? page + 1 : 0;
      const start = currentPage * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('material_price_history')
        .select('*')
        .eq('material_id', materialId)
        .order('changed_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      const mappedData = data?.map(h => ({
        id: h.id,
        user_id: h.user_id,
        material_id: h.material_id,
        material_name: h.material_name,
        old_price: h.old_price != null ? Number(h.old_price) : null,
        old_sale_price: h.old_sale_price != null ? Number(h.old_sale_price) : null,
        new_price: Number(h.new_price),
        new_sale_price: Number(h.new_sale_price),
        changed_at: h.changed_at,
        change_type: h.change_type || 'manual'
      })) || [];

      if (isLoadMore) {
        setHistory(prev => [...prev, ...mappedData]);
      } else {
        setHistory(mappedData);
      }

      setHasMore(mappedData.length === ITEMS_PER_PAGE);
      setPage(currentPage);
    } catch (error) {
      console.error('Error loading price history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || loadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadHistory(true);
    }
  }, [loadingMore, hasMore, page]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return `R$ ${price.toFixed(2)}`;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriceChange = (oldPrice: number | null, newPrice: number) => {
    if (oldPrice === null || oldPrice === 0) return { direction: 'none', percentage: 0 };
    
    const diff = newPrice - oldPrice;
    const percentage = (diff / oldPrice) * 100;
    
    if (diff > 0) return { direction: 'up', percentage };
    if (diff < 0) return { direction: 'down', percentage: Math.abs(percentage) };
    return { direction: 'none', percentage: 0 };
  };

  const renderPriceChange = (oldPrice: number | null, newPrice: number, label: string) => {
    const change = getPriceChange(oldPrice, newPrice);
    
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm gap-0.5 sm:gap-2">
        <span className="text-slate-400 font-medium">{label}:</span>
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <span className="text-slate-500">{formatPrice(oldPrice)}</span>
          <span className="text-slate-600">→</span>
          <span className="text-white font-medium">{formatPrice(newPrice)}</span>
          {change.direction === 'up' && (
            <Badge variant="outline" className={cn(
              "text-[10px] sm:text-xs flex items-center gap-0.5 px-1 sm:px-2",
              "border-red-500 text-red-400"
            )}>
              <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              +{change.percentage.toFixed(1)}%
            </Badge>
          )}
          {change.direction === 'down' && (
            <Badge variant="outline" className={cn(
              "text-[10px] sm:text-xs flex items-center gap-0.5 px-1 sm:px-2",
              "border-green-500 text-green-400"
            )}>
              <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              -{change.percentage.toFixed(1)}%
            </Badge>
          )}
          {change.direction === 'none' && oldPrice !== null && (
            <Badge variant="outline" className="text-[10px] sm:text-xs flex items-center gap-0.5 px-1 sm:px-2 border-slate-500 text-slate-400">
              <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              0%
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white w-[95vw] max-w-xl max-h-[85vh] sm:max-h-[80vh] px-3 sm:px-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
            <History className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            <span className="truncate">Histórico de Preços - {materialName}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div 
          ref={scrollRef}
          className="h-[60vh] sm:h-[500px] overflow-y-auto px-1 sm:px-2"
        >
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400 px-4">
              <History className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-center text-sm">Nenhum histórico de alteração de preço encontrado.</p>
              <p className="text-xs mt-1 text-center">O histórico será registrado a partir da próxima alteração.</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {history.map((entry, index) => (
                <div 
                  key={entry.id}
                  className="bg-slate-700/50 rounded-lg p-3 sm:p-4 border border-slate-600/50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                    <span className="text-xs text-slate-400">
                      📅 {formatDateTime(entry.changed_at)}
                    </span>
                    {index === 0 && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs w-fit">
                        Mais recente
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {renderPriceChange(entry.old_price, entry.new_price, 'Compra')}
                    {renderPriceChange(entry.old_sale_price, entry.new_sale_price, 'Venda')}
                  </div>
                </div>
              ))}

              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                  <span className="ml-2 text-xs text-slate-400">Carregando mais...</span>
                </div>
              )}

              {!hasMore && history.length > 0 && (
                <div className="text-center text-xs text-slate-500 py-3">
                  Fim do histórico
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialPriceHistoryModal;
