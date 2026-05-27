import React, { useEffect, useState } from 'react';
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { PlanData } from '@/types/mercadopago';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types from Mercado Pago SDK
interface IPayerIdentification {
  type: string;
  number: string;
}

interface ICardPaymentBrickPayer {
  email?: string;
  identification?: IPayerIdentification;
}

interface ICardPaymentFormData {
  token: string;
  issuer_id: string;
  payment_method_id: string;
  transaction_amount: number;
  installments: number;
  payer: ICardPaymentBrickPayer;
}

interface CardPaymentFormProps {
  selectedPlan: PlanData & { period_days?: number };
  userId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const CardPaymentForm: React.FC<CardPaymentFormProps> = ({
  selectedPlan,
  userId,
  onSuccess,
  onError
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBrickReady, setIsBrickReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [brickLoadError, setBrickLoadError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializePayment = async () => {
      try {
        // Buscar chave pública do banco de dados
        const { data, error } = await supabase
          .from('payment_gateway_config')
          .select('public_key, card_enabled, max_installments')
          .eq('gateway_name', 'mercado_pago')
          .eq('is_active', true)
          .single();

        if (error || !data?.public_key) {
          setInitError('Gateway de pagamento não configurado. Contate o suporte.');
          return;
        }

        if (!data.card_enabled) {
          setInitError('Pagamento com cartão está temporariamente indisponível.');
          return;
        }

        // Initialize Mercado Pago SDK com a chave do banco
        initMercadoPago(data.public_key, { locale: 'pt-BR' });
        setIsInitialized(true);
      } catch (err) {
        console.error('Erro ao inicializar pagamento:', err);
        setInitError('Erro ao carregar formulário de pagamento.');
      }
    };

    initializePayment();

    return () => {
      // Cleanup brick on unmount
      try {
        (window as any)?.cardPaymentBrickController?.unmount();
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, []);

  const handleSubmit = async (formData: ICardPaymentFormData) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const external_reference = `user_${userId}_plan_${selectedPlan.plan_type}`;
      
      const { data, error } = await supabase.functions.invoke('create-card-payment', {
        body: {
          token: formData.token,
          transaction_amount: selectedPlan.amount,
          description: `Assinatura ${selectedPlan.name}`,
          external_reference,
          installments: formData.installments,
          payment_method_id: formData.payment_method_id,
          issuer_id: formData.issuer_id,
          payer: {
            email: formData.payer.email,
            identification: formData.payer.identification
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.status === 'approved') {
        toast({
          title: "Pagamento aprovado!",
          description: "Seu plano foi ativado com sucesso."
        });
        onSuccess();
      } else if (data.status === 'in_process' || data.status === 'pending') {
        toast({
          title: "Pagamento em processamento",
          description: "Aguarde a confirmação do pagamento."
        });
        // Still call success - webhook will handle activation
        onSuccess();
      } else {
        const errorMessages: Record<string, string> = {
          'cc_rejected_bad_filled_card_number': 'Verifique o número do cartão',
          'cc_rejected_bad_filled_date': 'Verifique a data de validade',
          'cc_rejected_bad_filled_other': 'Verifique os dados do cartão',
          'cc_rejected_bad_filled_security_code': 'Verifique o código de segurança',
          'cc_rejected_blacklist': 'Não foi possível processar o pagamento',
          'cc_rejected_call_for_authorize': 'Autorize o pagamento junto ao banco',
          'cc_rejected_card_disabled': 'Cartão desabilitado. Contate o banco',
          'cc_rejected_card_error': 'Não foi possível processar o pagamento',
          'cc_rejected_duplicated_payment': 'Pagamento duplicado',
          'cc_rejected_high_risk': 'Pagamento recusado por segurança',
          'cc_rejected_insufficient_amount': 'Saldo insuficiente',
          'cc_rejected_invalid_installments': 'Parcelas inválidas',
          'cc_rejected_max_attempts': 'Limite de tentativas atingido'
        };
        
        const errorMessage = errorMessages[data.status_detail] || 'Pagamento não aprovado. Tente novamente.';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error('Card payment error:', err);
      toast({
        title: "Erro no pagamento",
        description: err.message || "Não foi possível processar o pagamento",
        variant: "destructive"
      });
      onError(err.message || "Erro ao processar pagamento");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReady = () => {
    console.log('✅ CardPayment Brick ready');
    setIsBrickReady(true);
  };

  const handleError = (error: any) => {
    console.error('❌ CardPayment Brick error:', error);
    const errorMessage = error?.message || error?.cause || 'Erro ao carregar formulário de cartão';
    setBrickLoadError(errorMessage);
  };

  if (initError) {
    return (
      <div className="space-y-4">
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-destructive text-sm font-medium">{initError}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente usar o pagamento via PIX ou entre em contato com o suporte.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Carregando formulário de pagamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-foreground mb-4">
        <CreditCard className="h-5 w-5 text-primary" />
        <span className="font-medium">Pagamento com Cartão</span>
      </div>

      {isProcessing && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-primary text-sm font-medium">
              Processando pagamento...
            </p>
          </div>
        </div>
      )}

      {brickLoadError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-destructive text-sm font-medium">Erro ao carregar formulário</p>
              <p className="text-xs text-muted-foreground mt-1">{brickLoadError}</p>
            </div>
          </div>
        </div>
      )}

      {!isBrickReady && !brickLoadError && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Carregando formulário de cartão...</p>
        </div>
      )}

      <div className="relative" style={{ minHeight: !isBrickReady ? 400 : undefined }}>
      <div className={`card-payment-container ${!isBrickReady ? 'opacity-0 absolute inset-0 pointer-events-none' : ''}`}>
        <CardPayment
          initialization={{
            amount: selectedPlan.amount
          }}
          customization={{
            paymentMethods: {
              minInstallments: 1,
              maxInstallments: 12
            },
            visual: {
              style: {
                theme: 'dark',
                customVariables: {
                  baseColor: '#10b981',
                  secondaryColor: '#1e293b',
                  inputBackgroundColor: '#1e293b',
                  formBackgroundColor: 'transparent'
                }
              }
            }
          }}
          onSubmit={handleSubmit}
          onReady={handleReady}
          onError={handleError}
        />
      </div>
      </div>

      <div className="flex items-start gap-2 mt-4 p-3 bg-muted/30 rounded-lg border border-border">
        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Seus dados de pagamento são processados de forma segura pelo Mercado Pago. 
          Não armazenamos informações do seu cartão.
        </p>
      </div>
    </div>
  );
};
