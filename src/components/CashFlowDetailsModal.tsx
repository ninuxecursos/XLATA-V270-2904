import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  ShoppingCart, 
  TrendingDown, 
  TrendingUp, 
  Printer, 
  Trash2,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CashFlowItem } from '@/utils/supabaseStorage';
import { useIsMobile } from '@/hooks/use-mobile';

interface CashFlowDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CashFlowItem | null;
  onPrint: (item: CashFlowItem) => void;
  onDelete: (itemId: string) => void;
}

const CashFlowDetailsModal: React.FC<CashFlowDetailsModalProps> = ({
  isOpen,
  onClose,
  item,
  onPrint,
  onDelete,
}) => {
  const isMobile = useIsMobile();

  if (!item) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPrint(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
    onClose();
  };

  const InfoRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-600/50 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`font-medium text-sm ${valueColor || 'text-white'}`}>{value}</span>
    </div>
  );

  const SectionCard = ({ title, icon: Icon, iconColor, children }: { 
    title: string; 
    icon: React.ElementType; 
    iconColor: string;
    children: React.ReactNode 
  }) => (
    <Card className="bg-slate-800/50 border-slate-600/50">
      <CardContent className={isMobile ? "p-3" : "p-4"}>
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <h3 className="text-white font-semibold text-sm">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`bg-slate-800 border-slate-700 ${isMobile ? 'p-0' : 'max-w-lg'}`}>
        <DialogHeader className={isMobile ? "p-4 pb-2 border-b border-slate-700" : "pb-2"}>
          <DialogTitle className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {item.userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-base font-semibold">{item.userName}</p>
              <p className="text-xs text-slate-400 font-normal flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Fechamento Concluído
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className={isMobile ? "h-[calc(100vh-200px)]" : "max-h-[60vh]"}>
          <div className={`space-y-3 ${isMobile ? 'p-4' : 'px-1'}`}>
            {/* Período */}
            <SectionCard title="Período" icon={Calendar} iconColor="text-blue-400">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">Abertura</p>
                  <p className="text-white text-sm font-medium">{formatDate(item.openingDate)}</p>
                  <p className="text-emerald-400 text-xs flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {formatTime(item.openingDate)}
                  </p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">Fechamento</p>
                  <p className="text-white text-sm font-medium">
                    {item.closingDate ? formatDate(item.closingDate) : '-'}
                  </p>
                  {item.closingDate && (
                    <p className="text-rose-400 text-xs flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {formatTime(item.closingDate)}
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Valores Iniciais/Finais */}
            <SectionCard title="Caixa" icon={DollarSign} iconColor="text-emerald-400">
              <InfoRow label="Valor Inicial" value={formatCurrency(item.openingAmount)} />
              <InfoRow label="Valor Final" value={formatCurrency(item.finalAmount)} valueColor="text-white font-bold" />
            </SectionCard>

            {/* Movimentações */}
            <SectionCard title="Movimentações" icon={ShoppingCart} iconColor="text-blue-400">
              <InfoRow label="Compras" value={formatCurrency(item.totalPurchases)} valueColor="text-blue-400" />
              <InfoRow label="Vendas" value={formatCurrency(item.totalSales)} valueColor="text-emerald-400" />
              <InfoRow label="Despesas" value={formatCurrency(item.totalExpenses)} valueColor="text-rose-400" />
            </SectionCard>

            {/* Lucros */}
            <SectionCard title="Lucros" icon={TrendingUp} iconColor="text-emerald-400">
              <InfoRow label="Lucro Bruto" value={formatCurrency(item.grossProfit)} valueColor="text-emerald-400" />
              <InfoRow 
                label="Lucro Líquido" 
                value={formatCurrency(item.netProfit)} 
                valueColor={item.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} 
              />
            </SectionCard>

            {/* Conferência */}
            <SectionCard title="Conferência" icon={item.difference >= 0 ? CheckCircle2 : AlertCircle} iconColor={item.difference >= 0 ? "text-emerald-400" : "text-rose-400"}>
              <InfoRow label="Valor Esperado" value={formatCurrency(item.expectedAmount)} />
              <InfoRow label="Valor Final" value={formatCurrency(item.finalAmount)} />
              <div className="mt-2 pt-2 border-t border-slate-600">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">Diferença</span>
                  <span className={`text-lg font-bold ${item.difference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(item.difference)}
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>
        </ScrollArea>

        {/* Ações */}
        <div className={`flex gap-2 ${isMobile ? 'p-4 pt-2 border-t border-slate-700' : 'pt-2'}`}>
          <Button
            onClick={handlePrint}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="flex-1 h-11"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CashFlowDetailsModal;
