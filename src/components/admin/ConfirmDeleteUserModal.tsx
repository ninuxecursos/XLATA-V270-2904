
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, AlertTriangle } from 'lucide-react';

interface ConfirmDeleteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userName: string;
  userEmail: string;
}

export const ConfirmDeleteUserModal: React.FC<ConfirmDeleteUserModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  userName,
  userEmail
}) => {
  const [confirmText, setConfirmText] = useState('');
  const expectedText = 'EXCLUIR';

  const handleConfirm = () => {
    if (confirmText === expectedText) {
      onConfirm();
      setConfirmText('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setConfirmText('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-gray-800 border-gray-700 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Exclusão de Usuário
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300 space-y-4">
            <div className="space-y-3">
              <p>
                Tem certeza que deseja excluir permanentemente o usuário{' '}
                <strong className="text-white">{userName || userEmail}</strong>?
              </p>
              <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
                <p className="text-sm text-red-400 font-medium mb-2">
                  ⚠️ Esta ação não pode ser desfeita e irá:
                </p>
                <ul className="text-sm text-gray-400 list-disc list-inside space-y-1 ml-2">
                  <li>Excluir permanentemente a conta do usuário</li>
                  <li>Remover todas as assinaturas associadas</li>
                  <li>Excluir todos os pedidos e vendas</li>
                  <li>Limpar histórico de transações</li>
                  <li>Remover dados de materiais e estoque</li>
                  <li>Excluir registros de caixa</li>
                  <li>Impossibilitar acesso futuro com essas credenciais</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-yellow-400 font-medium">
                  Para confirmar, digite <span className="text-red-400 font-bold">EXCLUIR</span> no campo abaixo:
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Digite EXCLUIR para confirmar"
                  className="bg-gray-700 border-gray-600 text-white"
                  autoComplete="off"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={confirmText !== expectedText}
            className={`${
              confirmText === expectedText
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Permanentemente
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
