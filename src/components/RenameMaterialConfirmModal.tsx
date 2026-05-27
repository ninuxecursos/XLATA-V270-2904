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
import { RefreshCw, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PasswordPromptModal from './PasswordPromptModal';

interface RenameMaterialConfirmModalProps {
  open: boolean;
  onClose: () => void;
  oldName: string;
  newName: string;
  onRenameConfirmed: () => void;
}

const RenameMaterialConfirmModal: React.FC<RenameMaterialConfirmModalProps> = ({
  open,
  onClose,
  oldName,
  newName,
  onRenameConfirmed
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      setShowPasswordModal(false);
    }
  }, [open]);

  const handleRequestRename = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordAuthenticated = async () => {
    setShowPasswordModal(false);
    await executeRename();
  };

  const executeRename = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para realizar esta ação.",
        variant: "destructive",
      });
      return;
    }

    setIsRenaming(true);

    try {
      // Atualizar todos os order_items com o nome antigo
      const { error: updateError, count } = await supabase
        .from('order_items')
        .update({ material_name: newName })
        .eq('user_id', user.id)
        .eq('material_name', oldName);

      if (updateError) throw updateError;

      toast({
        title: "Nome propagado",
        description: `Todos os registros de "${oldName}" foram atualizados para "${newName}".`,
      });

      onRenameConfirmed();
      onClose();
    } catch (error) {
      console.error('Error propagating material name:', error);
      toast({
        title: "Erro",
        description: "Erro ao propagar alteração de nome. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <>
      <Dialog open={open && !showPasswordModal} onOpenChange={onClose}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-blue-500/20 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
            <DialogTitle className="text-xl text-blue-400 font-bold">
              Propagar Alteração de Nome
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-base mt-2">
              Este material possui registros no estoque. A alteração do nome será propagada para todos os registros históricos.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-700/50 rounded-lg p-4 my-4">
            <div className="flex items-center justify-center gap-3">
              <span className="text-amber-400 font-medium">"{oldName}"</span>
              <ArrowRight className="h-5 w-5 text-slate-400" />
              <span className="text-emerald-400 font-medium">"{newName}"</span>
            </div>
          </div>

          <p className="text-sm text-slate-400 text-center">
            Todos os registros de compra e venda serão atualizados com o novo nome.
          </p>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row mt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full sm:w-auto bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
              disabled={isRenaming}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRequestRename}
              disabled={isRenaming}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isRenaming ? "Propagando..." : "Confirmar e Propagar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PasswordPromptModal
        open={showPasswordModal}
        onOpenChange={(open) => !open && setShowPasswordModal(false)}
        onAuthenticated={handlePasswordAuthenticated}
        title="Confirmar Alteração"
        description="Digite sua senha para confirmar a propagação do nome em todos os registros."
      />
    </>
  );
};

export default RenameMaterialConfirmModal;
