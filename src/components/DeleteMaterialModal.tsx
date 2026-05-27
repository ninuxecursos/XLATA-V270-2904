
import React, { useEffect } from 'react';
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

interface DeleteMaterialModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  materialName: string;
}

const DeleteMaterialModal: React.FC<DeleteMaterialModalProps> = ({ 
  open, 
  onClose, 
  onConfirm,
  materialName 
}) => {
  // Handle Enter key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onConfirm]);

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-pdv-dark text-white border-gray-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl text-center text-red-500 font-bold">
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xl text-center text-white">
            Tem certeza que deseja excluir o material "{materialName}"?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center gap-4">
          <AlertDialogCancel 
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white text-xl py-3 px-6"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white text-xl py-3 px-6"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteMaterialModal;
