
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-gray-800 border-gray-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Exclusão de Usuário
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            <div className="space-y-3">
              <p>
                Tem certeza que deseja excluir permanentemente o usuário <strong className="text-white">{userName || userEmail}</strong>?
              </p>
              <p className="text-sm text-yellow-400">
                ⚠️ Esta ação não pode ser desfeita e irá:
              </p>
              <ul className="text-sm text-gray-400 list-disc list-inside space-y-1 ml-4">
                <li>Excluir permanentemente a conta do usuário</li>
                <li>Remover todas as assinaturas associadas</li>
                <li>Limpar todos os dados do usuário do sistema</li>
                <li>Impossibilitar o acesso futuro com essas credenciais</li>
              </ul>
              <p className="text-sm text-red-400 font-medium">
                Digite o email do usuário para confirmar: {userEmail}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-gray-600 text-white hover:bg-gray-700">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
