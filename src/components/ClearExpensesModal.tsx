import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ClearExpensesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpensesCleared: () => void;
}

const BATCH_SIZE = 500;
const BATCH_DELAY = 100;

const ClearExpensesModal: React.FC<ClearExpensesModalProps> = ({ 
  open, 
  onOpenChange,
  onExpensesCleared
}) => {
  const [isClearing, setIsClearing] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' });
  const { user } = useAuth();
  
  const CONFIRMATION_TEXT = 'ZERAR DESPESAS';

  const deleteExpensesInBatches = async (
    userId: string,
    onProgress: (deleted: number) => void
  ): Promise<number> => {
    let totalDeleted = 0;
    let hasMore = true;
    
    while (hasMore) {
      // Buscar transações do tipo 'expense' do usuário
      const { data: batch, error: fetchError } = await supabase
        .from('cash_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .limit(BATCH_SIZE);
      
      if (fetchError) {
        console.error('Erro ao buscar despesas:', fetchError);
        throw fetchError;
      }
      
      if (!batch || batch.length === 0) {
        hasMore = false;
        continue;
      }
      
      const ids = batch.map(r => r.id);
      const { error: deleteError } = await supabase
        .from('cash_transactions')
        .delete()
        .in('id', ids);
      
      if (deleteError) {
        console.error('Erro ao deletar despesas:', deleteError);
        throw deleteError;
      }
      
      totalDeleted += ids.length;
      onProgress(totalDeleted);
      
      await new Promise(r => setTimeout(r, BATCH_DELAY));
      
      hasMore = batch.length === BATCH_SIZE;
    }
    
    return totalDeleted;
  };

  const handleClearExpenses = async () => {
    if (!user || confirmationText !== CONFIRMATION_TEXT) return;

    setIsClearing(true);
    setProgress({ current: 0, total: 0, phase: 'Contando despesas...' });

    try {
      // Fase 1: Contar despesas
      const { count: expensesCount } = await supabase
        .from('cash_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'expense');
      
      const total = expensesCount || 0;
      
      if (total === 0) {
        toast({
          title: "Sem despesas para remover",
          description: "Não há registros de despesas para remover.",
          duration: 3000,
        });
        onOpenChange(false);
        return;
      }
      
      setProgress({ current: 0, total, phase: 'Deletando despesas...' });
      
      // Fase 2: Deletar despesas em batches
      await deleteExpensesInBatches(user.id, (deleted) => {
        setProgress(p => ({ ...p, current: deleted }));
      });

      toast({
        title: "Despesas zeradas com sucesso",
        description: `Removidas ${total.toLocaleString()} despesas do sistema.`,
        duration: 4000,
      });

      onExpensesCleared();
      onOpenChange(false);
      setConfirmationText('');
    } catch (error) {
      console.error('Erro ao zerar despesas:', error);
      toast({
        title: "Erro ao zerar despesas",
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
            Zerar Despesas
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400 text-lg">
            Esta ação é irreversível e removerá TODAS as despesas registradas
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
                    <li>Deletar TODAS as despesas registradas</li>
                    <li>Remover o histórico de gastos operacionais</li>
                    <li>Afetar os cálculos de lucro líquido</li>
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
              onClick={handleClearExpenses}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={isClearing || confirmationText !== CONFIRMATION_TEXT}
            >
              {isClearing ? "Processando..." : "Zerar Despesas"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClearExpensesModal;