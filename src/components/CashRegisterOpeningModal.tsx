
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { openCashRegister } from '../utils/supabaseStorage';
import { toast } from '@/hooks/use-toast';
import { CashRegister } from '../types/pdv';
import { Wallet, ArrowLeft, Clock, User, CheckCircle2 } from 'lucide-react';
import NumericKeyboardInput from './NumericKeyboardInput';
import PasswordPromptModal from './PasswordPromptModal';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formSchema = z.object({
  initialAmount: z
    .number({ required_error: "Valor inicial é obrigatório" })
    .min(0, "O valor não pode ser negativo")
});

interface CashRegisterOpeningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (register: CashRegister) => void;
}

const CashRegisterOpeningModal: React.FC<CashRegisterOpeningModalProps> = ({ 
  open, 
  onOpenChange,
  onComplete
}) => {
  const { user } = useAuth();
  const { isOnboardingActive, progress, completeSubStep, setCashOpeningModalVisible } = useOnboarding();
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const isOpeningOnboardingStep = isOnboardingActive && progress.currentStep === 3;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialAmount: 0
    }
  });

  // Atualizar horário a cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (open && isOpeningOnboardingStep) {
      completeSubStep(3, 'open');
    }
  }, [open, isOpeningOnboardingStep, completeSubStep]);

  // Sinaliza visibilidade do modal para o sistema de onboarding ocultar banners sobrepostos
  useEffect(() => {
    setCashOpeningModalVisible(open);
    return () => setCashOpeningModalVisible(false);
  }, [open, setCashOpeningModalVisible]);

  // Extrair nome do usuário
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const userInitial = userName.charAt(0).toUpperCase();

  const handleOpenCash = async (data: z.infer<typeof formSchema>) => {
    if (isOpeningOnboardingStep) {
      await completeSubStep(3, 'confirm');
    }

    if (!isAuthenticated) {
      setShowPasswordPrompt(true);
      return;
    }
    await onSubmit(data);
  };

  const onSubmit = async (data?: z.infer<typeof formSchema>) => {
    const formData = data || form.getValues();
    try {
      const register = await openCashRegister(formData.initialAmount);
      toast({
        title: "Caixa aberto com sucesso",
        description: `Valor inicial: R$ ${formData.initialAmount.toFixed(2)}`,
        duration: 3000,
      });
      onComplete(register);
    } catch (error) {
      toast({
        title: "Erro ao abrir caixa",
        description: "Ocorreu um erro ao abrir o caixa. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    setShowPasswordPrompt(false);
    onSubmit();
  };

  const handleBack = () => {
    onOpenChange(false);
    navigate('/');
  };

  return (
    <Dialog 
      modal={!isOpeningOnboardingStep}
      open={open} 
      onOpenChange={(newOpen) => {
        if (newOpen === false) return;
        onOpenChange(newOpen);
      }}
    >
      <DialogContent 
        overlayClassName={isOpeningOnboardingStep ? "pointer-events-none" : undefined}
        className="w-full max-w-md bg-gray-900 text-white border-gray-800 p-0 overflow-hidden max-h-[95vh] md:max-h-[90vh]" 
        hideCloseButton={true}
      >
        {/* Header compacto com gradiente */}
        <div className="bg-gradient-to-br from-pdv-green/20 to-gray-900 p-4 pb-2">
          {/* Ícone e título compactos */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-pdv-green/20 border border-pdv-green/30 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-pdv-green" />
            </div>
            <h1 className="text-lg font-bold text-white">Abertura de Caixa</h1>
          </div>

          {/* Card do usuário compacto */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-2 border border-gray-700/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-pdv-green flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">{userInitial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-gray-400" />
                  <p className="text-white font-medium text-xs truncate">{userName}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <p className="text-gray-400 text-[10px]">
                    {format(currentTime, "dd/MM/yyyy '•' HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário com teclado centralizado */}
        <div className="p-4 pt-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleOpenCash)} className="space-y-3">
              <FormField
                control={form.control}
                name="initialAmount"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <p className="text-center text-gray-400 text-xs mb-1">Valor Inicial do Caixa</p>
                    <FormControl>
                      <div className="w-full max-w-xs mx-auto">
                        <NumericKeyboardInput
                          value={field.value}
                          onChange={(num) => field.onChange(num)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400 text-center text-xs" />
                  </FormItem>
                )}
              />
              
              {/* Botões */}
              <div className="flex flex-col gap-2 pt-1">
                <Button 
                  type="submit" 
                  data-tutorial="confirm-cash"
                  className="w-full h-14 bg-pdv-green hover:bg-pdv-green/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-lg"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  Abrir Caixa
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={handleBack}
                  className="w-full h-9 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl flex items-center justify-center gap-2 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao Início
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <PasswordPromptModal
          open={showPasswordPrompt}
          onOpenChange={setShowPasswordPrompt}
          onAuthenticated={handleAuthenticated}
          title="Confirmar Abertura de Caixa"
          description="Digite sua senha para confirmar a abertura do caixa"
        />
      </DialogContent>
    </Dialog>
  );
};

export default CashRegisterOpeningModal;
