import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ClearStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStockCleared: () => void;
}

const BATCH_SIZE = 500;
const BATCH_DELAY = 100;

const ClearStockModal: React.FC<ClearStockModalProps> = ({ 
  open, 
  onOpenChange,
  onStockCleared
}) => {
  const [isClearing, setIsClearing] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' });
  const { user } = useAuth();
  
  const CONFIRMATION_TEXT = 'ZERAR ESTOQUE';

  const deleteInBatches = async (
    table: 'orders' | 'order_items',
    userId: string,
    onProgress: (deleted: number) => void
  ): Promise<number> => {
    let totalDeleted = 0;
    let hasMore = true;
    
    while (hasMore) {
      const { data: batch, error: fetchError } = await supabase
        .from(table)
        .select('id')
        .eq('user_id', userId)
        .limit(BATCH_SIZE);
      
      if (fetchError) {
        console.error(`Erro ao buscar ${table}:`, fetchError);
        throw fetchError;
      }
      
      if (!batch || batch.length === 0) {
        hasMore = false;
        continue;
      }
      
      const ids = batch.map(r => r.id);
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .in('id', ids);
      
      if (deleteError) {
        console.error(`Erro ao deletar ${table}:`, deleteError);
        throw deleteError;
      }
      
      totalDeleted += ids.length;
      onProgress(totalDeleted);
      
      await new Promise(r => setTimeout(r, BATCH_DELAY));
      
      hasMore = batch.length === BATCH_SIZE;
    }
    
    return totalDeleted;
  };

  const handleClearStock = async () => {
    if (!user || confirmationText !== CONFIRMATION_TEXT) return;

    setIsClearing(true);
    setProgress({ current: 0, total: 0, phase: 'Contando registros...' });

    try {
      // Fase 1: Contar registros
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      const { count: itemsCount } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      const totalOrders = ordersCount || 0;
      const totalItems = itemsCount || 0;
      const total = totalOrders + totalItems;
      
      if (total === 0) {
        toast({
          title: "Estoque já está zerado",
          description: "Não há registros para remover.",
          duration: 3000,
        });
        onOpenChange(false);
        return;
      }
      
      setProgress({ current: 0, total, phase: 'Deletando itens de pedidos...' });
      
      // Fase 2: Deletar order_items em batches
      await deleteInBatches('order_items', user.id, (deleted) => {
        setProgress(p => ({ ...p, current: deleted }));
      });
      
      setProgress(p => ({ 
        ...p, 
        current: totalItems, 
        phase: 'Deletando pedidos...' 
      }));
      
      // Fase 3: Deletar orders em batches
      await deleteInBatches('orders', user.id, (deleted) => {
        setProgress(p => ({ 
          ...p, 
          current: totalItems + deleted 
        }));
      });

      toast({
        title: "Estoque zerado com sucesso",
        description: `Removidos ${totalItems.toLocaleString()} itens e ${totalOrders.toLocaleString()} pedidos.`,
        duration: 4000,
      });

      onStockCleared();
      onOpenChange(false);
      setConfirmationText('');
    } catch (error) {
      console.error('Erro ao zerar estoque:', error);
      toast({
        title: "Erro ao zerar estoque",
        description: "Ocorreu um erro durante a operação. Alguns dados podem ter sido removidos. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsClearing(false);
      setProgress({ current: 0, total: 0, phase: '' });
    }
  };

  const handleCancel = () => {
    if (isClearing) return;
    setConfirmationText('');
    onOpenChange(false);
  };

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen && !isClearing) {
        handleCancel();
      }
    }}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2 text-2xl text-red-400">
            <Trash2 className="h-7 w-7" /> 
            Zerar Estoque Completo
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400 text-lg">
            Esta ação é irreversível e removerá TODOS os dados de estoque
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {isClearing && progress.total > 0 ? (
            <div className="space-y-3 py-4">
              <p className="text-sm text-gray-300 text-center font-medium">{progress.phase}</p>
              <Progress value={progressPercent} className="h-3" />
              <p className="text-xs text-gray-500 text-center">
                {progress.current.toLocaleString()} / {progress.total.toLocaleString()} registros
              </p>
              <p className="text-xs text-yellow-500 text-center">
                Não feche esta janela durante o processo
              </p>
            </div>
          ) : (
            <>
              <Alert className="border-red-600 bg-red-900/20">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <AlertDescription className="text-red-200 text-base">
                  <strong>ATENÇÃO:</strong> Esta ação irá:
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>Deletar TODOS os pedidos de compra e venda</li>
                    <li>Remover TODOS os itens de estoque</li>
                    <li>Zerar completamente o histórico de movimentações</li>
                    <li>Esta ação NÃO pode ser desfeita</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <label className="text-white font-medium">
                  Para confirmar, digite exatamente: <span className="text-red-400 font-bold">{CONFIRMATION_TEXT}</span>
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Digite aqui para confirmar"
                  className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-md focus:outline-none focus:border-red-400"
                  autoFocus
                />
              </div>
            </>
          )}
          
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleCancel}
              className="flex-1 bg-transparent hover:bg-gray-700 text-white border-gray-600"
              disabled={isClearing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleClearStock}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={isClearing || confirmationText !== CONFIRMATION_TEXT}
            >
              {isClearing ? "Processando..." : "Zerar Estoque"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClearStockModal;
