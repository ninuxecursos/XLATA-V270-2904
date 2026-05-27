import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DollarSign, AlertTriangle } from 'lucide-react';
import { addCashToRegister } from '../utils/supabaseStorage';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  amount: z.string().min(1, "Valor é obrigatório").refine((val) => {
    const cleanValue = val.replace(/[R$\s.,]/g, '');
    const num = parseFloat(cleanValue) / 100;
    return !isNaN(num) && num > 0;
  }, "Valor deve ser um número positivo"),
  origin: z.string().min(1, "Origem é obrigatória")
});

interface InsufficientFundsDetails {
  required: number;
  current: number;
  missing: number;
}

interface CashRegisterAddFundsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  insufficientFundsDetails?: InsufficientFundsDetails | null;
}

const CashRegisterAddFundsModal: React.FC<CashRegisterAddFundsModalProps> = ({ 
  open, 
  onOpenChange,
  onComplete,
  insufficientFundsDetails
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      origin: ""
    }
  });

  // Função para formatar valor como moeda
  const formatCurrencyMask = (value: string) => {
    // Remove tudo que não é número
    const numericValue = value.replace(/\D/g, '');
    
    if (!numericValue) return '';
    
    // Converte para centavos
    const number = parseInt(numericValue) / 100;
    
    // Formata como moeda brasileira
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para converter valor formatado para número
  const parseCurrencyValue = (value: string): number => {
    const cleanValue = value.replace(/[R$\s.,]/g, '');
    return parseFloat(cleanValue) / 100;
  };

  // Sempre limpar o formulário quando o modal abrir
  useEffect(() => {
    if (open) {
      form.reset({
        amount: "",
        origin: insufficientFundsDetails ? 'Saldo para finalizar pedido' : ""
      });
    }
  }, [open, insufficientFundsDetails, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      const amount = parseCurrencyValue(data.amount);
      const description = insufficientFundsDetails ? 
        `${data.origin} - Adição de saldo para pedido (faltavam R$ ${insufficientFundsDetails.missing.toFixed(2)})` :
        `${data.origin} - Adição de saldo ao caixa`;
      
      await addCashToRegister(amount, description);
      
      toast({
        title: "Saldo adicionado",
        description: `R$ ${amount.toFixed(2)} adicionados ao caixa com sucesso!`,
        duration: 3000,
      });
      
      onComplete();
      onOpenChange(false);
      form.reset();
      
    } catch (error) {
      console.error('Error adding cash:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar saldo. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    form.reset();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCurrencyMask(e.target.value);
    form.setValue('amount', formattedValue);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-center text-white flex items-center justify-center gap-2">
            <DollarSign className="h-5 w-5 text-pdv-green" /> 
            Adicionar Saldo ao Caixa
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Informe o valor e a origem que deseja adicionar ao caixa
          </DialogDescription>
        </DialogHeader>
        
        {/* Alert quando há saldo insuficiente */}
        {insufficientFundsDetails && (
          <Alert variant="destructive" className="bg-red-900/30 border-red-800 text-white mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Saldo Insuficiente para Finalizar Pedido</AlertTitle>
            <AlertDescription className="space-y-1">
              <div>Valor necessário: <strong>R$ {insufficientFundsDetails.required.toFixed(2)}</strong></div>
              <div>Saldo atual: <strong>R$ {insufficientFundsDetails.current.toFixed(2)}</strong></div>
              <div>Valor que falta: <strong>R$ {insufficientFundsDetails.missing.toFixed(2)}</strong></div>
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Origem</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Dinheiro próprio, Empréstimo, etc..." 
                      className="bg-gray-800 border-gray-700 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Valor</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="R$ 0,00" 
                      className="bg-gray-800 border-gray-700 text-white text-2xl font-semibold text-center"
                      style={{ fontSize: '1.8rem' }}
                      value={field.value}
                      onChange={handleAmountChange}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <DialogFooter className="flex gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleCancel}
                className="bg-transparent hover:bg-gray-700 text-white border-gray-600"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-pdv-green hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? "Adicionando..." : "Adicionar Saldo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CashRegisterAddFundsModal;
