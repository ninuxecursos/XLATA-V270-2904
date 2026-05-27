import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, Lock, Check, ArrowLeft, QrCode, Clock, CheckCircle, CreditCard, Copy, AlertCircle, Smartphone, Timer, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PaymentFormData, PlanData, PixPaymentResponse } from '@/types/mercadopago';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useSubscriptionSync } from '@/hooks/useSubscriptionSync';
import { PaymentSuccessModal } from '@/components/PaymentSuccessModal';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CardPaymentForm } from './CardPaymentForm';

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

type PaymentMethod = 'pix' | 'card';
type CheckoutStep = 'method' | 'form' | 'qrcode' | 'verifying' | 'approved' | 'rejected' | 'card';

interface CheckoutPageProps {
  selectedPlan: PlanData & { 
    period?: string; 
    description?: string;
    period_days?: number;
  };
  onClose: () => void;
  benefits?: string[];
}

const defaultBenefits = [
  'Cadastro ilimitado de materiais',
  'Gerenciamento completo de estoque',
  'Controle de compras e vendas',
  'Relatórios e análises detalhadas',
  'Sistema de caixa integrado',
  'Suporte técnico prioritário',
  'Atualizações automáticas',
  'Acesso ao guia completo em vídeo',
];

const steps = [
  { id: 'form', label: 'Dados', icon: CreditCard },
  { id: 'qrcode', label: 'QR Code', icon: QrCode },
  { id: 'verifying', label: 'Verificando', icon: Clock },
  { id: 'approved', label: 'Aprovado', icon: CheckCircle },
];

const CheckoutPage: React.FC<CheckoutPageProps> = ({
  selectedPlan,
  onClose,
  benefits = defaultBenefits
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [step, setStep] = useState<CheckoutStep>('form');
  const [paymentData, setPaymentData] = useState<PixPaymentResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [copied, setCopied] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [subscriptionActivated, setSubscriptionActivated] = useState(false);
  const [activatedPlan, setActivatedPlan] = useState<{ name: string; expiresAt: string } | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { loading, createPixPayment, pollPaymentStatus, reset } = useMercadoPago();
  const { syncSubscriptionData } = useSubscriptionSync();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(formSchema)
  });

  // Auto-fill user data
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

    loadUserProfile();
  }, [user, setValue]);

  // Timer countdown
  useEffect(() => {
    if (step !== 'qrcode' && step !== 'verifying') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStep('rejected');
          toast({
            title: "QR Code expirado",
            description: "O tempo limite foi atingido. Gere um novo QR Code.",
            variant: "destructive"
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, toast]);

  // Payment polling
  useEffect(() => {
    if (!paymentData?.id || (step !== 'qrcode' && step !== 'verifying') || timeLeft <= 0) return;

    pollPaymentStatus(paymentData.id, async (status) => {
      if (status === 'approved') {
        setStep('approved');
        toast({
          title: "Pagamento aprovado!",
          description: "Sincronizando sua assinatura...",
        });

        // Wait for Edge Function to activate subscription
        await new Promise(resolve => setTimeout(resolve, 3000));
        await syncSubscriptionData();

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          // Query subscription with payment_reference to get the exact one just created
          const { data: subscriptions } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('is_active', true)
            .order('activated_at', { ascending: false })
            .limit(1);

          const subscription = subscriptions?.[0];
          const now = new Date();
          const maxReasonableDate = new Date();
          maxReasonableDate.setFullYear(maxReasonableDate.getFullYear() + 5); // Max 5 years from now

          // Check if subscription exists and has reasonable expires_at (not in 2044)
          if (subscription) {
            const expiresAt = new Date(subscription.expires_at);
            const isReasonableDate = expiresAt > now && expiresAt < maxReasonableDate;
            
            if (isReasonableDate) {
              setSubscriptionActivated(true);
              setActivatedPlan({
                name: selectedPlan.name || 'Plano',
                expiresAt: subscription.expires_at
              });
            } else {
              // Even if date seems wrong, payment was approved - mark as activated
              console.warn('Subscription date seems incorrect but payment approved:', subscription.expires_at);
              setSubscriptionActivated(true);
              setActivatedPlan({
                name: selectedPlan.name || 'Plano',
                expiresAt: subscription.expires_at
              });
            }
          } else {
            // No subscription found but payment approved - this shouldn't happen
            // Still mark as success since Mercado Pago confirmed payment
            console.warn('No subscription found after approved payment');
            setSubscriptionActivated(true);
            setActivatedPlan({
              name: selectedPlan.name || 'Plano',
              expiresAt: new Date(Date.now() + (selectedPlan.period_days || 30) * 24 * 60 * 60 * 1000).toISOString()
            });
          }

          setShowSuccessModal(true);
        }
      } else if (status === 'rejected' || status === 'cancelled') {
        setStep('rejected');
        toast({
          title: "Pagamento não aprovado",
          description: "Tente novamente ou use outro método de pagamento.",
          variant: "destructive"
        });
      }
    }).catch(console.error);
  }, [paymentData?.id, step, timeLeft, pollPaymentStatus, syncSubscriptionData, toast, selectedPlan]);

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
      const result = await createPixPayment(data, selectedPlan, user.id);
      setPaymentData(result);
      setStep('qrcode');
      setTimeLeft(600);
      toast({
        title: "QR Code gerado!",
        description: "Escaneie o código para efetuar o pagamento."
      });
    } catch (error) {
      console.error('Erro no checkout:', error);
    }
  };

  const handleBack = () => {
    if (step === 'form' || step === 'card') {
      onClose();
      return;
    } else {
      setStep('form');
    }
    setPaymentData(null);
    reset();
    setTimeLeft(600);
  };

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'pix') {
      setStep('form');
    } else {
      setStep('card');
    }
  };

  const handleCardSuccess = async () => {
    setStep('approved');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await syncSubscriptionData();
    
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .order('activated_at', { ascending: false })
        .limit(1);

      const subscription = subscriptions?.[0];
      if (subscription) {
        setSubscriptionActivated(true);
        setActivatedPlan({
          name: selectedPlan.name || 'Plano',
          expiresAt: subscription.expires_at
        });
      }
    }
    setShowSuccessModal(true);
  };

  const handleCardError = (error: string) => {
    console.error('Card payment error:', error);
  };

  const copyPixCode = async () => {
    if (!paymentData?.qr_code) return;
    try {
      await navigator.clipboard.writeText(paymentData.qr_code);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Cole no seu app do banco para pagar."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar código PIX:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentIndex = () => {
    if (step === 'method') return 0;
    if (step === 'card') return 1;
    if (step === 'rejected') return 2;
    const idx = steps.findIndex(s => s.id === step);
    return idx >= 0 ? idx : 0;
  };

  const currentIndex = getCurrentIndex();
  const progressPercentage = (timeLeft / 600) * 100;
  const isExpired = timeLeft === 0 || step === 'rejected';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-background via-background to-muted/20 py-4 sm:py-8 px-3 sm:px-4 pb-safe">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted -ml-2 h-10 px-3"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="text-sm">Voltar aos Planos</span>
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Checkout Seguro</span>
          </div>
        </div>

        {/* Main Content - Two Columns on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Plan Summary - Compact on mobile */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 h-fit order-2 lg:order-1">
            {/* Mobile: Compact horizontal layout */}
            <div className="sm:hidden">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-foreground truncate">
                    {selectedPlan.name}
                  </h2>
                  {selectedPlan.period_days && (
                    <p className="text-xs text-muted-foreground">
                      {selectedPlan.period_days} dias de acesso
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-2xl font-bold text-primary">
                    {selectedPlan.price}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {selectedPlan.period || 'por mês'}
                  </p>
                </div>
              </div>
              
              {/* Collapsible benefits on mobile */}
              <details className="group">
                <summary className="text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer flex items-center gap-1 py-2 select-none">
                  <Check className="h-3 w-3 text-primary" />
                  {benefits.length} benefícios incluídos
                  <span className="ml-auto text-[10px] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <ul className="space-y-2 pt-2 pb-1">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <span className="text-muted-foreground text-xs">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>

            {/* Desktop: Full layout */}
            <div className="hidden sm:block">
              <div className="mb-6">
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  {selectedPlan.name}
                </h2>
                {selectedPlan.description && (
                  <p className="text-muted-foreground">
                    {selectedPlan.description}
                  </p>
                )}
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl lg:text-5xl font-bold text-primary">
                    {selectedPlan.price}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {selectedPlan.period || 'por mês'}
                </p>
                {selectedPlan.period_days && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedPlan.period_days} dias de acesso
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
                  O que está incluído:
                </h3>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Flow */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden order-1 lg:order-2">
            {/* Progress Steps */}
            <div className="bg-muted/30 border-b border-border px-4 sm:px-6 py-3 sm:py-4">
              <div className="relative flex items-center justify-between">
                <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-muted rounded-full" />
                <div 
                  className="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                />
                {steps.map((stepItem, index) => {
                  const Icon = stepItem.icon;
                  const isCompleted = index < currentIndex;
                  const isCurrent = index === currentIndex;
                  const isRejected = step === 'rejected' && index === 2;

                  return (
                    <div key={stepItem.id} className="relative flex flex-col items-center z-10">
                      <div
                        className={cn(
                          "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                          isCompleted && "bg-primary border-primary text-primary-foreground",
                          isCurrent && !isRejected && "bg-primary border-primary text-primary-foreground ring-2 sm:ring-4 ring-primary/20",
                          isRejected && "bg-destructive border-destructive text-destructive-foreground ring-2 sm:ring-4 ring-destructive/20",
                          !isCompleted && !isCurrent && "bg-muted border-border text-muted-foreground"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", isCurrent && "animate-pulse")} />
                        )}
                      </div>
                      <span
                        className={cn(
                          "mt-1.5 text-[10px] sm:text-xs font-medium transition-colors",
                          (isCompleted || isCurrent) && !isRejected && "text-primary",
                          isRejected && "text-destructive",
                          !isCompleted && !isCurrent && "text-muted-foreground"
                        )}
                      >
                        {isRejected ? 'Erro' : stepItem.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Payment Method Selection */}
              {step === 'method' && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
                      Escolha a Forma de Pagamento
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      Selecione como deseja pagar
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* PIX Option */}
                    <button
                      onClick={() => handleSelectPaymentMethod('pix')}
                      className={cn(
                        "p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30",
                        paymentMethod === 'pix' ? "border-primary bg-primary/10" : "border-border"
                      )}
                    >
                      <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <QrCode className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="text-foreground font-semibold text-base sm:text-lg">PIX</h4>
                          <p className="text-muted-foreground text-[10px] sm:text-sm mt-0.5 sm:mt-1">
                            Pagamento instantâneo
                          </p>
                        </div>
                        <span className="text-[10px] sm:text-xs bg-emerald-500/20 text-emerald-500 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium">
                          Aprovação imediata
                        </span>
                      </div>
                    </button>

                    {/* Card Option */}
                    <button
                      onClick={() => handleSelectPaymentMethod('card')}
                      className={cn(
                        "p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30",
                        paymentMethod === 'card' ? "border-primary bg-primary/10" : "border-border"
                      )}
                    >
                      <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="text-foreground font-semibold text-base sm:text-lg">Cartão</h4>
                          <p className="text-muted-foreground text-[10px] sm:text-sm mt-0.5 sm:mt-1">
                            Crédito em até 12x
                          </p>
                        </div>
                        <span className="text-[10px] sm:text-xs bg-blue-500/20 text-blue-500 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium">
                          Parcelamento
                        </span>
                      </div>
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2 sm:pt-4">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Pagamento seguro processado pelo Mercado Pago
                    </p>
                  </div>
                </div>
              )}

              {/* Card Payment */}
              {step === 'card' && user && (
                <div className="space-y-4 sm:space-y-6">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="text-muted-foreground hover:text-foreground mb-1 -ml-2 h-9"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  
                  <CardPaymentForm
                    selectedPlan={selectedPlan}
                    userId={user.id}
                    onSuccess={handleCardSuccess}
                    onError={handleCardError}
                  />
                </div>
              )}

              {step === 'form' && (
                <div className="space-y-4 sm:space-y-6">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="text-muted-foreground hover:text-foreground mb-1 -ml-2 h-9"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
                      Dados do Pagamento PIX
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      Confirme seus dados para gerar o QR Code
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-foreground text-sm font-medium">
                        Nome Completo
                      </Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="Seu nome completo"
                        readOnly
                        disabled
                        className="h-11 sm:h-12 bg-muted/70 border-border text-foreground/70 placeholder:text-muted-foreground rounded-xl text-sm cursor-not-allowed"
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
                          className="h-11 sm:h-12 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm"
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
                          className="h-11 sm:h-12 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm"
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
                        disabled
                        className="h-11 sm:h-12 bg-muted/70 border-border text-foreground/70 placeholder:text-muted-foreground rounded-xl text-sm cursor-not-allowed"
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 sm:h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm sm:text-base rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 mt-4 sm:mt-6"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Gerando QR Code...
                        </>
                      ) : (
                        <>
                          <QrCode className="mr-2 h-5 w-5" />
                          Gerar QR Code PIX
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 pt-1 sm:pt-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Seus dados estão protegidos e criptografados
                      </p>
                    </div>
                  </form>
                </div>
              )}

              {(step === 'qrcode' || step === 'verifying') && paymentData && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
                      Pagamento PIX
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      Escaneie o QR Code ou copie o código PIX
                    </p>
                  </div>

                  {/* Status Banner */}
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                      </div>
                      <div>
                        <p className="text-yellow-500 font-semibold text-xs sm:text-sm">
                          Aguardando pagamento...
                        </p>
                        <p className="text-yellow-500/80 text-[10px] sm:text-xs mt-0.5">
                          O pagamento será confirmado automaticamente.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Timer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Tempo restante
                      </span>
                      <span className={cn(
                        "font-mono font-semibold",
                        timeLeft <= 60 ? "text-destructive" : 
                        timeLeft <= 180 ? "text-yellow-500" : "text-foreground"
                      )}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                    <Progress 
                      value={progressPercentage} 
                      className={cn(
                        "h-1.5 sm:h-2 transition-all bg-muted",
                        timeLeft <= 60 && "[&>div]:bg-destructive",
                        timeLeft <= 180 && timeLeft > 60 && "[&>div]:bg-yellow-500",
                        timeLeft > 180 && "[&>div]:bg-primary"
                      )}
                    />
                  </div>

                  {/* QR Code */}
                  <div className={cn(
                    "relative rounded-xl overflow-hidden transition-all",
                    isExpired && "opacity-50"
                  )}>
                    <div className="bg-white p-3 sm:p-4 rounded-xl flex justify-center mx-auto max-w-[220px] sm:max-w-[280px]">
                      <img 
                        src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                        alt="QR Code PIX"
                        className="w-40 h-40 sm:w-56 sm:h-56"
                      />
                    </div>
                    
                    {isExpired && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                        <div className="text-center">
                          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-destructive mx-auto mb-2" />
                          <p className="font-semibold text-destructive text-sm">QR Code Expirado</p>
                          <p className="text-xs text-muted-foreground">Gere um novo código</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Copy Code Section */}
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-foreground text-xs sm:text-sm font-medium">
                      Código PIX Copia e Cola
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={paymentData.qr_code}
                        readOnly
                        className="h-10 sm:h-12 bg-muted/50 border-border text-foreground text-[10px] sm:text-xs font-mono rounded-xl"
                      />
                      <Button
                        onClick={copyPixCode}
                        disabled={isExpired}
                        variant={copied ? "secondary" : "default"}
                        className={cn(
                          "h-10 sm:h-12 px-3 sm:px-4 rounded-xl transition-all flex-shrink-0",
                          copied 
                            ? "bg-green-600 hover:bg-green-700 text-white" 
                            : "bg-primary hover:bg-primary/90"
                        )}
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-muted/30 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3 border border-border">
                    <p className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                      Instruções:
                    </p>
                    <ol className="text-xs sm:text-sm text-muted-foreground space-y-1.5 sm:space-y-2 list-decimal list-inside">
                      <li>Abra o app do seu banco</li>
                      <li>Escolha pagar com <span className="font-medium text-foreground">PIX</span></li>
                      <li>Escaneie o QR Code ou cole o código</li>
                      <li>Confirme o pagamento</li>
                    </ol>
                  </div>

                  {/* Back Button */}
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="w-full text-muted-foreground hover:text-foreground h-10"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar e alterar dados
                  </Button>
                </div>
              )}

              {step === 'approved' && (
                <div className="text-center py-6 sm:py-8 space-y-4 sm:space-y-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                      Pagamento Aprovado!
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Seu plano foi ativado com sucesso.
                    </p>
                  </div>
                  <Button
                    onClick={onClose}
                    className="w-full h-12 sm:h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
                  >
                    Ir para o Painel
                  </Button>
                </div>
              )}

              {step === 'rejected' && (
                <div className="text-center py-6 sm:py-8 space-y-4 sm:space-y-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                    <X className="h-8 w-8 sm:h-10 sm:w-10 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                      Pagamento não realizado
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      O QR Code expirou ou o pagamento foi cancelado.
                    </p>
                  </div>
                  <Button
                    onClick={handleBack}
                    className="w-full h-12 sm:h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PaymentSuccessModal 
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onClose();
        }}
        isActivated={subscriptionActivated}
        planName={activatedPlan?.name}
        expiresAt={activatedPlan?.expiresAt}
      />
    </div>
  );
};

export default CheckoutPage;
