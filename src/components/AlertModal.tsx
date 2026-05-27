
import React, { useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ 
  open, 
  onClose, 
  title, 
  description 
}) => {
  // Handle Enter key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.key === 'Enter') {
        e.preventDefault();
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-pdv-dark text-white border-gray-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl text-center text-red-500 font-bold">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xl text-center text-white">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={onClose}
            className="w-full bg-pdv-green hover:bg-pdv-green/90 text-xl py-3"
          >
            OK, ENTENDI!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AlertModal;
