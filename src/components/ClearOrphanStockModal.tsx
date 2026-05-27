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
import { clearOrphanStock } from '@/utils/orphanMaterials';
import PasswordPromptModal from './PasswordPromptModal';

interface ClearOrphanStockModalProps {
  open: boolean;
  onClose: () => void;
  orphanName: string;
  currentStock: number;
  onSuccess: () => void;
}

const ClearOrphanStockModal: React.FC<ClearOrphanStockModalProps> = ({
  open,
  onClose,
  orphanName,
  currentStock,
  onSuccess
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const expectedText = orphanName.toUpperCase();
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
    await executeClear();
  };

  const executeClear = async () => {
    setIsClearing(true);
    try {
      const result = await clearOrphanStock(orphanName);
      
      toast({
        title: "Estoque zerado!",
        description: `${result.deletedCount} registro(s) de "${orphanName}" foram removidos.`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error clearing orphan stock:', error);
      toast({
        title: "Erro",
        description: "Erro ao zerar estoque. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const formatWeight = (value: number) => `${value.toFixed(2)} kg`;

  return (
    <>
      <Dialog open={open && !showPasswordModal} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <DialogTitle className="text-xl text-red-400 font-bold">
              Zerar Estoque Órfão
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-base mt-2">
              Você está prestes a remover <span className="font-bold text-red-400">TODOS</span> os registros do material órfão{' '}
              <span className="font-semibold text-white">"{orphanName}"</span>.
              <br />
              <span className="text-slate-400 text-sm">Saldo atual: {formatWeight(currentStock)}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 my-4">
            <p className="text-sm text-red-300 text-center">
              ⚠️ Esta ação é <strong>irreversível</strong> e removerá todo o histórico de transações deste material.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">
              Digite <span className="font-bold text-white">"{orphanName.toUpperCase()}"</span> para confirmar:
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
              onClick={onClose}
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
        description={`Digite sua senha para confirmar a exclusão do estoque de "${orphanName}".`}
      />
    </>
  );
};

export default ClearOrphanStockModal;
