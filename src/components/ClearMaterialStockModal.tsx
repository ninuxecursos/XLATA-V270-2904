import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PasswordPromptModal from './PasswordPromptModal';

interface ClearMaterialStockModalProps {
  open: boolean;
  onClose: () => void;
  materialName: string;
  onStockCleared: () => void;
}

const ClearMaterialStockModal: React.FC<ClearMaterialStockModalProps> = ({
  open,
  onClose,
  materialName,
  onStockCleared
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { user } = useAuth();

  const expectedText = materialName.toUpperCase();
  const isConfirmed = confirmationText.toUpperCase() === expectedText;

  useEffect(() => {
    if (open) {
      setConfirmationText('');
      setShowPasswordModal(false);
    }
  }, [open]);

  const handleRequestClear = () => {
    if (!isConfirmed) return;
    setShowPasswordModal(true);
  };

  const handlePasswordAuthenticated = async () => {
    setShowPasswordModal(false);
    await executeClearStock();
  };

  const executeClearStock = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para realizar esta ação.",
        variant: "destructive",
      });
      return;
    }

    setIsClearing(true);

    try {
      // Buscar todos os order_items desse material
      const { data: orderItems, error: fetchError } = await supabase
        .from('order_items')
        .select('id, order_id')
        .eq('user_id', user.id)
        .eq('material_name', materialName);

      if (fetchError) throw fetchError;

      if (orderItems && orderItems.length > 0) {
        // Deletar os order_items
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('user_id', user.id)
          .eq('material_name', materialName);

        if (deleteError) throw deleteError;

        // Limpar pedidos órfãos (sem itens)
        const orderIds = [...new Set(orderItems.map(i => i.order_id))];
        for (const orderId of orderIds) {
          const { data: remainingItems } = await supabase
            .from('order_items')
            .select('id')
            .eq('order_id', orderId)
            .limit(1);

          if (!remainingItems || remainingItems.length === 0) {
            await supabase.from('orders').delete().eq('id', orderId);
          }
        }
      }

      toast({
        title: "Estoque zerado",
        description: `Todos os registros de "${materialName}" foram removidos.`,
      });

      onStockCleared();
      onClose();
    } catch (error) {
      console.error('Error clearing material stock:', error);
      toast({
        title: "Erro",
        description: "Erro ao zerar estoque do material. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleCancel = () => {
    setConfirmationText('');
    onClose();
  };

  return (
    <>
      <Dialog open={open && !showPasswordModal} onOpenChange={onClose}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <DialogTitle className="text-xl text-red-400 font-bold">
              Zerar Estoque do Material
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-base mt-2">
              Você está prestes a remover <span className="font-bold text-red-400">TODOS</span> os registros de compra e venda do material{' '}
              <span className="font-semibold text-white">"{materialName}"</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 my-4">
            <p className="text-sm text-red-300 text-center">
              ⚠️ Esta ação é <strong>irreversível</strong> e removerá todo o histórico de transações deste material.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">
              Digite <span className="font-bold text-white">"{materialName.toUpperCase()}"</span> para confirmar:
            </Label>
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Digite o nome do material"
              className="bg-slate-700 border-slate-600 text-white text-center text-lg font-medium"
              disabled={isClearing}
            />
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row mt-4">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="w-full sm:w-auto bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
              disabled={isClearing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRequestClear}
              disabled={!isConfirmed || isClearing}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isClearing ? "Zerando..." : "Zerar Estoque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PasswordPromptModal
        open={showPasswordModal}
        onOpenChange={(open) => !open && setShowPasswordModal(false)}
        onAuthenticated={handlePasswordAuthenticated}
        title="Confirmar Exclusão"
        description="Digite sua senha para confirmar a exclusão do estoque deste material."
      />
    </>
  );
};

export default ClearMaterialStockModal;
