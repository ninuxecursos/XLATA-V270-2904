import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addExpenseToCashRegister, getActiveCashRegister } from '../utils/supabaseStorage';
import { toast } from '@/hooks/use-toast';
import { CashRegister } from '../types/pdv';
import { TrendingDown, X, User, Banknote, QrCode } from 'lucide-react';
import PasswordPromptModal from './PasswordPromptModal';
import { useAuth } from '@/hooks/useAuth';
import { useEmployee } from '@/contexts/EmployeeContext';

const formSchema = z.object({
  amount: z
    .number({ required_error: "Valor é obrigatório" })
    .positive("O valor deve ser maior que zero"),
  description: z
    .string()
    .min(1, "Descrição é obrigatória"),
  category: z
    .string()
    .min(1, "Categoria é obrigatória"),
  paymentMethod: z
    .enum(['Dinheiro', 'PIX'], { required_error: "Forma de pagamento é obrigatória" })
});

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (register: CashRegister) => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ 
  open, 
  onOpenChange,
  onComplete
}) => {
  const { user } = useAuth();
  const { isEmployee, employeeRole } = useEmployee();
  const operatorName = (user?.user_metadata as any)?.name || (user?.user_metadata as any)?.full_name || user?.email || 'Operador';
  const operatorRoleLabel = isEmployee ? (employeeRole || 'Funcionário') : 'Dono';

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingExpenseData, setPendingExpenseData] = useState<{amount: number, description: string, category: string, paymentMethod: 'Dinheiro' | 'PIX'} | null>(null);
  const [displayValue, setDisplayValue] = useState('R$ 0,00');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      description: "",
      category: "",
      paymentMethod: 'Dinheiro'
    }
  });

  // Format currency input with mask
  const formatCurrency = (inputValue: string) => {
    // Remove all non-numeric characters
    const numericValue = inputValue.replace(/[^\d]/g, '');
    
    if (!numericValue) {
      return 'R$ 0,00';
    }
    
    // Convert to cents and format
    const cents = parseInt(numericValue);
    const reais = cents / 100;
    
    return `R$ ${reais.toFixed(2).replace('.', ',')}`;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatCurrency(inputValue);
    setDisplayValue(formatted);
    
    // Extract numeric value for form
    const numericValue = formatted.replace('R$ ', '').replace(',', '.');
    const amount = parseFloat(numericValue);
    form.setValue('amount', amount);
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setPendingExpenseData({
      amount: data.amount,
      description: data.description,
      category: data.category,
      paymentMethod: data.paymentMethod,
    });
    setShowPasswordModal(true);
  };

  const handlePasswordAuthenticated = () => {
    if (pendingExpenseData && pendingExpenseData.amount && pendingExpenseData.description && pendingExpenseData.category) {
      executeAddExpense(pendingExpenseData);
      setPendingExpenseData(null);
    }
  };

  const executeAddExpense = async (data: {amount: number, description: string, category: string, paymentMethod: 'Dinheiro' | 'PIX'}) => {
    try {
      const fullDescription = `${data.category} - ${data.description} [${data.paymentMethod}] (${operatorRoleLabel}: ${operatorName})`;
      const updatedRegister = await addExpenseToCashRegister(data.amount, fullDescription);
      
      if (updatedRegister) {
        // Reset form first
        form.reset();
        setDisplayValue('R$ 0,00');
        
        // Execute onComplete callback BEFORE closing modal to ensure balance is updated
        if (onComplete) {
          onComplete(updatedRegister);
        }
        
        // Show success toast
        toast({
          title: "Despesa adicionada",
          description: `R$ ${data.amount.toFixed(2).replace('.', ',')} - ${data.category} - ${data.description}`,
          duration: 3000,
        });
        
        // Close modal AFTER everything is complete
        onOpenChange(false);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível adicionar despesa. Verifique se o caixa está aberto.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message === 'Saldo insuficiente' 
        ? 'Saldo insuficiente no caixa para esta despesa.'
        : 'Não foi possível adicionar despesa ao caixa.';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset();
      setDisplayValue('R$ 0,00');
    }
  }, [open, form]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="sm:max-w-[500px] bg-pdv-dark text-white border-gray-700 p-0"
          hideCloseButton={true}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-6 w-6 text-white" />
              <h2 className="text-xl font-semibold text-white">Adicionar Despesa</h2>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Operator info header */}
          <div className="mx-6 mb-4 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-emerald-300/80 font-semibold">Operador logado</div>
              <div className="text-sm font-semibold text-white truncate">{operatorName}</div>
            </div>
            <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded-full uppercase ${isEmployee ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
              {operatorRoleLabel}
            </span>
          </div>

          {/* Form */}
          <div className="px-6 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Description field */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-base">Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva a despesa"
                          className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {/* Category field */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-base">Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="Almoço" className="text-white hover:bg-gray-700">Almoço</SelectItem>
                          <SelectItem value="Vale" className="text-white hover:bg-gray-700">Vale</SelectItem>
                          <SelectItem value="Despesa Geral" className="text-white hover:bg-gray-700">Despesa Geral</SelectItem>
                          <SelectItem value="Diária" className="text-white hover:bg-gray-700">Diária</SelectItem>
                          <SelectItem value="Pgto Semana" className="text-white hover:bg-gray-700">Pgto Semana</SelectItem>
                          <SelectItem value="Café" className="text-white hover:bg-gray-700">Café</SelectItem>
                          <SelectItem value="Comissão" className="text-white hover:bg-gray-700">Comissão</SelectItem>
                          <SelectItem value="Combustível" className="text-white hover:bg-gray-700">Combustível</SelectItem>
                          <SelectItem value="Ajudante Geral" className="text-white hover:bg-gray-700">Ajudante Geral</SelectItem>
                          <SelectItem value="Estorno" className="text-white hover:bg-gray-700">Estorno</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                {/* Amount field with currency mask */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-base">Valor (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="R$ 0,00" 
                          type="text"
                          value={displayValue}
                          onChange={handleAmountChange}
                          className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 h-16 text-center font-bold"
                          style={{ 
                            fontSize: '1.68em',
                            color: '#2DCC68'
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {/* Payment method */}
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-base">Forma de pagamento</FormLabel>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => field.onChange('Dinheiro')}
                          className={`flex items-center justify-center gap-2 h-14 rounded-lg border-2 transition-all font-semibold ${
                            field.value === 'Dinheiro'
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20'
                              : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <Banknote className="h-5 w-5" />
                          Dinheiro
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange('PIX')}
                          className={`flex items-center justify-center gap-2 h-14 rounded-lg border-2 transition-all font-semibold ${
                            field.value === 'PIX'
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20'
                              : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <QrCode className="h-5 w-5" />
                          PIX
                        </button>
                      </div>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white border-0"
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-pdv-green hover:bg-pdv-green/90 text-white"
                  >
                    Confirmar
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <PasswordPromptModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        onAuthenticated={handlePasswordAuthenticated}
        title="Confirmar Despesa"
        description="Digite sua senha para confirmar a adição da despesa"
      />
    </>
  );
};

export default ExpenseModal;
