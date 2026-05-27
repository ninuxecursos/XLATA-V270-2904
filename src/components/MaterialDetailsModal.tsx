import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, Package, DollarSign, ArrowUpCircle, ArrowDownCircle, Scale, Percent, Receipt } from 'lucide-react';

interface MaterialStock {
  materialName: string;
  currentStock: number;
  purchasePrice: number;
  salePrice: number;
  totalValue: number;
  profitProjection: number;
  totalPurchases: number;
  totalSales: number;
  transactions: Array<{
    date: number;
    type: 'compra' | 'venda';
    quantity: number;
    price: number;
    total: number;
  }>;
}

interface MaterialDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: MaterialStock | null;
  totalWeight: number;
}

const MaterialDetailsModal = ({ open, onOpenChange, material, totalWeight }: MaterialDetailsModalProps) => {
  if (!material) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatWeight = (value: number) => {
    return `${value.toFixed(2)} kg`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const percentage = totalWeight > 0 ? (material.currentStock / totalWeight * 100) : 0;
  const totalSaleValue = material.currentStock * material.salePrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] p-0 bg-slate-900 border-slate-700 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-4 py-3 bg-slate-800 border-b border-slate-700">
          <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-500" />
            <span className="truncate">{material.materialName}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-60px)]">
          <div className="p-4 space-y-4">
            {/* Seção: Estoque */}
            <div>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Estoque</h3>
              <div className="grid grid-cols-3 gap-2">
                {/* Peso */}
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Scale className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400">Peso</span>
                  </div>
                  <div className="text-sm font-bold text-white">{formatWeight(material.currentStock)}</div>
                </div>
                
                {/* Percentual */}
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Percent className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400">% Total</span>
                  </div>
                  <div className="text-sm font-bold text-white">{percentage.toFixed(1)}%</div>
                  <Progress value={percentage} className="h-1 mt-1.5" />
                </div>
                
                {/* Transações */}
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Receipt className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400">Movim.</span>
                  </div>
                  <div className="text-sm font-bold text-white">{material.transactions.length}</div>
                </div>
              </div>
            </div>

            {/* Seção: Preços */}
            <div>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Preços por kg</h3>
              <div className="grid grid-cols-2 gap-2">
                {/* Preço de Compra */}
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-yellow-500" />
                    <span className="text-xs text-slate-400">Compra</span>
                  </div>
                  <div className="text-sm font-bold text-yellow-400">{formatCurrency(material.purchasePrice)}</div>
                </div>
                
                {/* Preço de Venda */}
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs text-slate-400">Venda</span>
                  </div>
                  <div className="text-sm font-bold text-blue-400">{formatCurrency(material.salePrice)}</div>
                </div>
              </div>
            </div>

            {/* Seção: Valores em Estoque */}
            <div>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Valores em Estoque</h3>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {/* Custo Total */}
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-yellow-500" />
                    <span className="text-xs text-slate-400">Custo Total</span>
                  </div>
                  <div className="text-sm font-bold text-yellow-400">{formatCurrency(material.totalValue)}</div>
                </div>
                
                {/* Valor de Venda Total */}
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs text-slate-400">Valor Venda</span>
                  </div>
                  <div className="text-sm font-bold text-blue-400">{formatCurrency(totalSaleValue)}</div>
                </div>
              </div>
              
              {/* Projeção de Lucro - Destacado */}
              <div className="bg-emerald-900/30 rounded-lg p-3 border border-emerald-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-emerald-300">Projeção de Lucro</span>
                  </div>
                  <div className="text-lg font-bold text-emerald-400">{formatCurrency(material.profitProjection)}</div>
                </div>
              </div>
            </div>

            {/* Seção: Histórico de Transações */}
            {material.transactions.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                  Histórico ({material.transactions.length})
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {material.transactions.map((transaction, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-2.5 rounded-lg border ${
                        transaction.type === 'compra' 
                          ? 'bg-emerald-900/20 border-emerald-800/50' 
                          : 'bg-rose-900/20 border-rose-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {transaction.type === 'compra' ? (
                          <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-rose-500" />
                        )}
                        <div>
                          <span className={`text-xs font-medium ${
                            transaction.type === 'compra' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {transaction.type === 'compra' ? 'Compra' : 'Venda'}
                          </span>
                          <span className="text-xs text-slate-500 ml-2">
                            {formatDate(transaction.date)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white font-medium">
                          {formatWeight(transaction.quantity)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatCurrency(transaction.total)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensagem se não houver transações */}
            {material.transactions.length === 0 && (
              <div className="text-center py-4 text-slate-500 text-sm">
                Nenhuma transação registrada
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialDetailsModal;