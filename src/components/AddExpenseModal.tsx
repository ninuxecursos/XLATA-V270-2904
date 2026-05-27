
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { getActiveCashRegister, addExpenseToCashRegister } from '@/utils/localStorage';

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const EXPENSE_TYPES = [
  "Almoço",
  "Vale",
  "Despesa Geral",
  "Combustível",
  "Diária"
];

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  open,
  onOpenChange,
  onComplete,
}) => {
  const [description, setDescription] = useState('');
  const [expenseType, setExpenseType] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [displayValue, setDisplayValue] = useState('R$ 0,00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);

  React.useEffect(() => {
    const loadCurrentBalance = async () => {
      try {
        const register = await getActiveCashRegister();
        if (register) {
          setCurrentBalance(register.currentAmount);
        }
      } catch (error) {
        console.error('Error loading current balance:', error);
      }
    };

    if (open) {
      loadCurrentBalance();
    }
  }, [open]);

  const formatCurrency = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^\d]/g, '');
    
    // If empty, return default
    if (!numericValue) {
      return 'R$ 0,00';
    }
    
    // Convert to number and format
    const number = parseInt(numericValue) / 100;
    return `R$ ${number.toFixed(2).replace('.', ',')}`;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatCurrency(inputValue);
    setDisplayValue(formattedValue);
    
    // Extract numeric value for internal use
    const numericValue = formattedValue.replace(/[^\d,]/g, '').replace(',', '.');
    setAmount(numericValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast({
        title: "Erro",
        description: "A descrição é obrigatória",
        variant: "destructive",
      });
      return;
    }

    if (!expenseType) {
      toast({
        title: "Erro",
        description: "O motivo da despesa é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      toast({
        title: "Erro",
        description: "O valor deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    // Check if register has enough funds
    if (currentBalance < expenseAmount) {
      toast({
        title: "Saldo insuficiente",
        description: "O caixa não possui saldo suficiente para esta despesa.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Register the expense
      const fullDescription = `${expenseType}: ${description}`;
      await addExpenseToCashRegister(expenseAmount, fullDescription);
      
      toast({
        title: "Despesa registrada",
        description: `R$ ${expenseAmount.toFixed(2)} registrado como despesa.`,
      });
      
      // Reset form
      setDescription('');
      setExpenseType('');
      setAmount('');
      setDisplayValue('R$ 0,00');
      
      // Close modal and notify parent
      onOpenChange(false);
      onComplete();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível registrar a despesa",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDescription('');
    setExpenseType('');
    setAmount('');
    setDisplayValue('R$ 0,00');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#2a2a2a] border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Adicionar Despesa</DialogTitle>
          <DialogDescription className="text-gray-400">
            Registre uma despesa do caixa atual
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-white">
              Descrição
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a despesa"
              required
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 resize-none"
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="expenseType" className="text-sm font-medium text-white">
              Motivo
            </label>
            <Select 
              value={expenseType} 
              onValueChange={setExpenseType}
            >
              <SelectTrigger 
                id="expenseType" 
                className="bg-gray-700 border-gray-600 text-white h-12"
              >
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {EXPENSE_TYPES.map((type) => (
                  <SelectItem 
                    key={type} 
                    value={type}
                    className="text-white hover:bg-gray-600 focus:bg-gray-600"
                  >
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium text-white">
              Valor (R$)
            </label>
            <Input
              id="amount"
              type="text"
              value={displayValue}
              onChange={handleAmountChange}
              placeholder="R$ 0,00"
              required
              className="text-center bg-gray-700 border-gray-600 placeholder:text-gray-400 text-3xl font-bold h-16 text-[#10b981]"
            />
          </div>
          
          <DialogFooter className="mt-8 flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-700 h-12"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 bg-[#10b981] hover:bg-[#0d9668] text-white h-12"
            >
              {isSubmitting ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseModal;
