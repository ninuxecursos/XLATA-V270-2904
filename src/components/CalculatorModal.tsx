
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X } from 'lucide-react';
import Calculator from './Calculator';

interface CalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CalculatorModal: React.FC<CalculatorModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] p-0 border-gray-800 bg-gray-900">
        <DialogHeader className="p-4 border-b border-gray-800 flex justify-between items-center">
          <DialogTitle className="text-white text-center w-full">Calculadora</DialogTitle>
          <DialogDescription className="sr-only">Calculadora para operações matemáticas</DialogDescription>
          <button 
            className="absolute right-4 top-4 text-gray-400 hover:text-white"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>
        <div className="h-[600px] w-full">
          <Calculator />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalculatorModal;
