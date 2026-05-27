
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { DollarSign } from 'lucide-react';

interface LowBalanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  requiredAmount?: number;
  onAddFunds: () => void;
  onCancel: () => void;
}

const LowBalanceModal: React.FC<LowBalanceModalProps> = ({ 
  open, 
  onOpenChange,
  currentBalance,
  requiredAmount,
  onAddFunds,
  onCancel
}) => {
  const isInsufficientFunds = requiredAmount && currentBalance < requiredAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-center text-white flex items-center justify-center gap-2">
            <DollarSign className="h-5 w-5 text-pdv-red" /> 
            {isInsufficientFunds ? "Saldo Insuficiente" : "Saldo Baixo"}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Saldo atual: R$ {currentBalance.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        
        <Alert variant="destructive" className="bg-red-900/30 border-red-800 text-white">
          <AlertTitle>
            {isInsufficientFunds 
              ? `Saldo insuficiente para concluir a operação (R$ ${requiredAmount?.toFixed(2)})`
              : "Saldo do caixa está baixo"
            }
          </AlertTitle>
          <AlertDescription>
            É necessário adicionar mais saldo ao caixa para continuar operando com segurança.
          </AlertDescription>
        </Alert>
        
        <DialogFooter className="flex sm:justify-center gap-3">
          <Button 
            variant="outline" 
            className="border-gray-700 text-gray-300"
            onClick={onCancel}
          >
            {isInsufficientFunds ? "Cancelar Operação" : "Continuar Assim Mesmo"}
          </Button>
          <Button 
            className="bg-pdv-green hover:bg-green-700"
            onClick={onAddFunds}
          >
            Adicionar Saldo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LowBalanceModal;
