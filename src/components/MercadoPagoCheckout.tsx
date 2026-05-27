import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, ArrowLeft, Shield, Lock, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PaymentFormData, PlanData } from '@/types/mercadopago';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import QRCodeDisplay from './QRCodeDisplay';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import CheckoutProgressBar, { CheckoutStep } from './checkout/CheckoutProgressBar';

const formSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(11, 'Telefone deve ter no máximo 11 dígitos')
    .regex(/^\d+$/, 'Telefone deve conter apenas números'),
  email: z.string()
    .email('Email inválido')
    .max(100, 'Email muito longo'),
  cpf: z.string()
    .length(11, 'CPF deve ter exatamente 11 dígitos')
    .regex(/^\d+$/, 'CPF deve conter apenas números')
});

interface MercadoPagoCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: PlanData;
}

const MercadoPagoCheckout: React.FC<MercadoPagoCheckoutProps> = ({
  isOpen,
  onClose,
  selectedPlan
}) => {
  const [step, setStep] = useState<CheckoutStep>('form');
  const { toast } = useToast();
  const { user } = useAuth();
  const { loading, paymentData, createPixPayment, reset } = useMercadoPago();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<PaymentFormData>({
    resolver: zodResolver(formSchema)
  });

  // Auto-fill user data from profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, phone, whatsapp, email')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.name) setValue('name', profile.name);
          const phoneNumber = profile.whatsapp || profile.phone;
          if (phoneNumber) {
            // Remove non-numeric characters
            const cleanPhone = phoneNumber.replace(/\D/g, '');
            setValue('phone', cleanPhone);
          }
          if (profile.email || user.email) {
            setValue('email', profile.email || user.email || '');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    };

    if (isOpen) {
      loadUserProfile();
    }
  }, [user, isOpen, setValue]);

  const onSubmit = async (data: PaymentFormData) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer o pagamento.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createPixPayment(data, selectedPlan, user.id);
      setStep('qrcode');
      toast({
        title: "QR Code gerado!",
        description: "Escaneie o código para efetuar o pagamento."
      });
    } catch (error) {
      console.error('Erro no checkout:', error);
    }
  };

  const handleClose = () => {
    setStep('form');
    reset();
    onClose();
  };

  const handleBack = () => {
    setStep('form');
    reset();
  };

  const handlePaymentStatusChange = (status: string) => {
    if (status === 'approved') {
      setStep('approved');
    } else if (status === 'rejected' || status === 'cancelled') {
      setStep('rejected');
    } else if (status === 'pending') {
      setStep('qrcode');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[92vw] max-w-md p-0 mx-auto bg-card border-border rounded-2xl overflow-hidden gap-0">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="bg-card p-5 border-b border-border">
          <DialogHeader className="pb-0">
            <div className="flex items-center gap-3">
              {step !== 'form' && step !== 'approved' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="p-2 h-auto hover:bg-muted rounded-lg text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-foreground text-lg font-semibold">
                    Checkout Seguro
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Lock className="h-3 w-3" />
                    Pagamento via PIX
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="mt-4">
            <CheckoutProgressBar currentStep={step} />
          </div>
        </div>

        {/* Content */}
        <div className="p-5 bg-card max-h-[70vh] overflow-y-auto">
          {step === 'form' ? (
            <div className="space-y-4">
              {/* Plan Summary Card */}
              <div className="bg-muted/50 rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Plano selecionado</p>
                    <p className="text-foreground font-semibold text-base mt-0.5">
                      {selectedPlan.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="text-xl font-bold text-primary">
                      {selectedPlan.price}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-foreground text-sm font-medium">
                      Nome Completo
                    </Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Seu nome completo"
                      readOnly
                      tabIndex={-1}
                      className="h-11 bg-muted/30 border-border text-foreground/90 cursor-not-allowed rounded-lg"
                    />
                    <p className="text-[10px] text-muted-foreground">Dado da sua conta — não editável</p>
                    {errors.name && (
                      <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-foreground text-sm font-medium">
                        WhatsApp
                      </Label>
                      <Input
                        id="phone"
                        {...register('phone')}
                        placeholder="11999999999"
                        type="tel"
                        maxLength={11}
                        readOnly
                        tabIndex={-1}
                        className="h-11 bg-muted/30 border-border text-foreground/90 cursor-not-allowed rounded-lg"
                      />
                      {errors.phone && (
                        <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cpf" className="text-foreground text-sm font-medium">
                        CPF
                      </Label>
                      <Input
                        id="cpf"
                        {...register('cpf')}
                        placeholder="00000000000"
                        type="text"
                        maxLength={11}
                        className="h-11 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                      />
                      {errors.cpf && (
                        <p className="text-xs text-destructive mt-1">{errors.cpf.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-foreground text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="seu@email.com"
                      readOnly
                      tabIndex={-1}
                      className="h-11 bg-muted/30 border-border text-foreground/90 cursor-not-allowed rounded-lg"
                    />
                    <p className="text-[10px] text-muted-foreground">Email da conta — não editável</p>
                    {errors.email && (
                      <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Gerando QR Code...
                    </>
                  ) : (
                    'Gerar QR Code PIX'
                  )}
                </Button>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Seus dados estão protegidos e criptografados
                  </p>
                </div>
              </form>
            </div>
          ) : (
            paymentData && (
              <QRCodeDisplay
                paymentData={paymentData}
                onPaymentStatusChange={handlePaymentStatusChange}
                onPaymentComplete={() => {
                  toast({
                    title: "Pagamento aprovado!",
                    description: "Sua assinatura foi ativada com sucesso."
                  });
                  handleClose();
                }}
              />
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MercadoPagoCheckout;
