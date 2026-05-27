import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import PasswordAuthModal from './PasswordAuthModal';

export type DataSector = 
  | 'compras' 
  | 'vendas' 
  | 'transacoes' 
  | 'despesas' 
  | 'adicoes_caixa' 
  | 'fluxo_caixa';

interface SectorConfig {
  title: string;
  description: string;
  confirmationText: string;
  warningItems: string[];
}

const SECTOR_CONFIGS: Record<DataSector, SectorConfig> = {
  compras: {
    title: 'Zerar Compras',
    description: 'Remover TODOS os pedidos de compra',
    confirmationText: 'ZERAR COMPRAS',
    warningItems: [
      'Deletar TODOS os pedidos de COMPRA',
      'Remover itens de estoque relacionados às compras',
      'O estoque atual será afetado',
      'Esta ação NÃO pode ser desfeita'
    ]
  },
  vendas: {
    title: 'Zerar Vendas',
    description: 'Remover TODOS os pedidos de venda',
    confirmationText: 'ZERAR VENDAS',
    warningItems: [
      'Deletar TODOS os pedidos de VENDA',
      'Remover itens de estoque relacionados às vendas',
      'O estoque atual será afetado',
      'Esta ação NÃO pode ser desfeita'
    ]
  },
  transacoes: {
    title: 'Zerar Transações',
    description: 'Remover TODAS as transações de caixa',
    confirmationText: 'ZERAR TRANSACOES',
    warningItems: [
      'Deletar TODAS as transações registradas',
      'Afeta o histórico de movimentações de caixa',
      'Esta ação NÃO pode ser desfeita'
    ]
  },
  despesas: {
    title: 'Zerar Despesas',
    description: 'Remover TODAS as despesas registradas',
    confirmationText: 'ZERAR DESPESAS',
    warningItems: [
      'Deletar TODAS as despesas cadastradas',
      'Afeta relatórios financeiros',
      'Esta ação NÃO pode ser desfeita'
    ]
  },
  adicoes_caixa: {
    title: 'Zerar Adições de Caixa',
    description: 'Remover TODAS as adições de caixa',
    confirmationText: 'ZERAR ADICOES',
    warningItems: [
      'Deletar TODAS as adições de caixa',
      'Afeta o saldo histórico do caixa',
      'Esta ação NÃO pode ser desfeita'
    ]
  },
  fluxo_caixa: {
    title: 'Zerar Fluxo de Caixa',
    description: 'Remover TODOS os fechamentos de caixa',
    confirmationText: 'ZERAR FLUXO',
    warningItems: [
      'Deletar TODOS os fechamentos de caixa',
      'Remover histórico completo de fluxo de caixa',
      'Remover todas as transações associadas',
      'Esta ação NÃO pode ser desfeita'
    ]
  }
};

interface ClearDataSectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sector: DataSector;
  onDataCleared: () => void;
}

const BATCH_SIZE = 500;
const BATCH_DELAY = 100;

const ClearDataSectorModal: React.FC<ClearDataSectorModalProps> = ({ 
  open, 
  onOpenChange,
  sector,
  onDataCleared
}) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' });
  const { user } = useAuth();
  
  const config = SECTOR_CONFIGS[sector];

  // When parent opens the modal, show password modal first
  useEffect(() => {
    if (open) {
      setShowPasswordModal(true);
      setShowConfirmModal(false);
      setConfirmationText('');
      setProgress({ current: 0, total: 0, phase: '' });
    } else {
      setShowPasswordModal(false);
      setShowConfirmModal(false);
    }
  }, [open]);

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    setShowConfirmModal(true);
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    onOpenChange(false);
  };

  const handleConfirmCancel = () => {
    setShowConfirmModal(false);
    onOpenChange(false);
  };

  const deleteOrdersByType = async (
    orderType: 'compra' | 'venda',
    onProgress: (deleted: number) => void
  ): Promise<number> => {
    let totalDeleted = 0;
    let hasMore = true;
    
    while (hasMore) {
      const { data: batch, error: fetchError } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user!.id)
        .eq('type', orderType)
        .limit(BATCH_SIZE);
      
      if (fetchError) {
        console.error(`Erro ao buscar orders:`, fetchError);
        throw fetchError;
      }
      
      if (!batch || batch.length === 0) {
        hasMore = false;
        continue;
      }
      
      const ids = batch.map(r => r.id);
      
      await supabase
        .from('order_items')
        .delete()
        .in('order_id', ids);
      
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .in('id', ids);
      
      if (deleteError) {
        console.error(`Erro ao deletar orders:`, deleteError);
        throw deleteError;
      }
      
      totalDeleted += ids.length;
      onProgress(totalDeleted);
      
      await new Promise(r => setTimeout(r, BATCH_DELAY));
      
      hasMore = batch.length === BATCH_SIZE;
    }
    
    return totalDeleted;
  };

  const deleteTransactionsByType = async (
    transactionType: string | null,
    onProgress: (deleted: number) => void
  ): Promise<number> => {
    let totalDeleted = 0;
    let hasMore = true;
    
    while (hasMore) {
      let query = supabase
        .from('cash_transactions')
        .select('id')
        .eq('user_id', user!.id)
        .limit(BATCH_SIZE);
      
      if (transactionType) {
        query = query.eq('type', transactionType);
      }
      
      const { data: batch, error: fetchError } = await query;
      
      if (fetchError) {
        console.error(`Erro ao buscar transactions:`, fetchError);
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
        console.error(`Erro ao deletar transactions:`, deleteError);
        throw deleteError;
      }
      
      totalDeleted += ids.length;
      onProgress(totalDeleted);
      
      await new Promise(r => setTimeout(r, BATCH_DELAY));
      
      hasMore = batch.length === BATCH_SIZE;
    }
    
    return totalDeleted;
  };

  const deleteCashRegisters = async (
    onProgress: (deleted: number) => void
  ): Promise<number> => {
    let totalDeleted = 0;
    let hasMore = true;
    
    while (hasMore) {
      const { data: batch, error: fetchError } = await supabase
        .from('cash_registers')
        .select('id')
        .eq('user_id', user!.id)
        .limit(BATCH_SIZE);
      
      if (fetchError) {
        console.error(`Erro ao buscar cash_registers:`, fetchError);
        throw fetchError;
      }
      
      if (!batch || batch.length === 0) {
        hasMore = false;
        continue;
      }
      
      const ids = batch.map(r => r.id);
      const { error: deleteError } = await supabase
        .from('cash_registers')
        .delete()
        .in('id', ids);
      
      if (deleteError) {
        console.error(`Erro ao deletar cash_registers:`, deleteError);
        throw deleteError;
      }
      
      totalDeleted += ids.length;
      onProgress(totalDeleted);
      
      await new Promise(r => setTimeout(r, BATCH_DELAY));
      
      hasMore = batch.length === BATCH_SIZE;
    }
    
    return totalDeleted;
  };

  const countRecords = async (): Promise<number> => {
    if (!user) return 0;

    switch (sector) {
      case 'compras': {
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('type', 'compra');
        return count || 0;
      }
      case 'vendas': {
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('type', 'venda');
        return count || 0;
      }
      case 'transacoes': {
        const { count } = await supabase
          .from('cash_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        return count || 0;
      }
      case 'despesas': {
        const { count } = await supabase
          .from('cash_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('type', 'expense');
        return count || 0;
      }
      case 'adicoes_caixa': {
        const { count } = await supabase
          .from('cash_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('type', 'addition');
        return count || 0;
      }
      case 'fluxo_caixa': {
        const { count } = await supabase
          .from('cash_registers')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        return count || 0;
      }
      default:
        return 0;
    }
  };

  const handleClearData = async () => {
    if (!user || confirmationText !== config.confirmationText) return;

    setIsClearing(true);
    setProgress({ current: 0, total: 0, phase: 'Contando registros...' });

    try {
      const total = await countRecords();
      
      if (total === 0) {
        toast({
          title: "Nenhum registro encontrado",
          description: "Não há dados para remover neste setor.",
          duration: 3000,
        });
        setShowConfirmModal(false);
        onOpenChange(false);
        return;
      }
      
      setProgress({ current: 0, total, phase: 'Removendo registros...' });

      let deletedCount = 0;

      switch (sector) {
        case 'compras': {
          deletedCount = await deleteOrdersByType(
            'compra',
            (deleted) => setProgress(p => ({ ...p, current: deleted }))
          );
          break;
        }
        case 'vendas': {
          deletedCount = await deleteOrdersByType(
            'venda',
            (deleted) => setProgress(p => ({ ...p, current: deleted }))
          );
          break;
        }
        case 'transacoes': {
          deletedCount = await deleteTransactionsByType(
            null,
            (deleted) => setProgress(p => ({ ...p, current: deleted }))
          );
          break;
        }
        case 'despesas': {
          deletedCount = await deleteTransactionsByType(
            'expense',
            (deleted) => setProgress(p => ({ ...p, current: deleted }))
          );
          break;
        }
        case 'adicoes_caixa': {
          deletedCount = await deleteTransactionsByType(
            'addition',
            (deleted) => setProgress(p => ({ ...p, current: deleted }))
          );
          break;
        }
        case 'fluxo_caixa': {
          await deleteTransactionsByType(null, () => {});
          deletedCount = await deleteCashRegisters(
            (deleted) => setProgress(p => ({ ...p, current: deleted }))
          );
          break;
        }
      }

      toast({
        title: `${config.title} concluído`,
        description: `Removidos ${deletedCount.toLocaleString()} registros com sucesso.`,
        duration: 4000,
      });

      onDataCleared();
      setShowConfirmModal(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao zerar dados:', error);
      toast({
        title: "Erro ao zerar dados",
        description: "Ocorreu um erro durante a operação. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsClearing(false);
      setProgress({ current: 0, total: 0, phase: '' });
    }
  };

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <>
      {/* Password Authentication Modal - Separate from confirmation */}
      <PasswordAuthModal
        open={showPasswordModal}
        onSuccess={handlePasswordSuccess}
        onCancel={handlePasswordCancel}
        title="Autenticação Necessária"
        description={`Para ${config.title.toLowerCase()}, confirme sua senha`}
      />

      {/* Confirmation Modal - Only shows after successful authentication */}
      <Dialog open={showConfirmModal} onOpenChange={(newOpen) => {
        if (!newOpen && !isClearing) {
          handleConfirmCancel();
        }
      }}>
        <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2 text-2xl text-red-400">
              <Trash2 className="h-7 w-7" />
              {config.title}
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400 text-lg">
              {config.description}
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
                      {config.warningItems.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <label className="text-white font-medium">
                    Para confirmar, digite exatamente: <span className="text-red-400 font-bold">{config.confirmationText}</span>
                  </label>
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value.toUpperCase())}
                    placeholder="Digite aqui para confirmar"
                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-md focus:outline-none focus:border-red-400"
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleConfirmCancel}
                    className="flex-1 bg-transparent hover:bg-gray-700 text-white border-gray-600"
                    disabled={isClearing}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleClearData}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    disabled={isClearing || confirmationText !== config.confirmationText}
                  >
                    {isClearing ? "Processando..." : config.title}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClearDataSectorModal;
