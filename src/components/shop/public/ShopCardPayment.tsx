import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Check, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react';

interface ShopCardPaymentProps {
  orderId: string;
  totalAmount: number;
  customerData: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
  };
  onPaymentSuccess: () => void;
  onBack: () => void;
  primaryColor?: string;
}

export function ShopCardPayment({
  orderId,
  totalAmount,
  customerData,
  onPaymentSuccess,
  onBack,
  primaryColor = '#10B981'
}: ShopCardPaymentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  // Minimum amount for card payments (Mercado Pago requires at least R$ 1.00)
  const MIN_CARD_AMOUNT = 1.00;
  const isAmountTooLow = totalAmount < MIN_CARD_AMOUNT;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Initialize Mercado Pago SDK
  useEffect(() => {
    const initSDK = async () => {
      // Check minimum amount first
      if (isAmountTooLow) {
        setError(`O valor mínimo para pagamento com cartão é ${formatCurrency(MIN_CARD_AMOUNT)}. Use PIX para valores menores.`);
        setLoading(false);
        return;
      }

      try {
        // Fetch public key from config
        const { data: config } = await supabase
          .from('payment_gateway_config')
          .select('public_key')
          .eq('gateway_name', 'mercado_pago')
          .eq('is_active', true)
          .single();

        if (!config?.public_key) {
          throw new Error('Chave pública do Mercado Pago não configurada');
        }

        initMercadoPago(config.public_key, { locale: 'pt-BR' });
        setSdkReady(true);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing MP SDK:', err);
        setError(err instanceof Error ? err.message : 'Erro ao inicializar pagamento');
        setLoading(false);
      }
    };

    initSDK();
  }, [isAmountTooLow]);

  const handleCardPayment = useCallback(async (formData: any) => {
    setProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-shop-card-payment', {
        body: {
          token: formData.token,
          order_id: orderId,
          transaction_amount: totalAmount,
          description: `Pedido XLata Shop #${orderId.substring(0, 8)}`,
          installments: formData.installments,
          payment_method_id: formData.payment_method_id,
          issuer_id: formData.issuer_id,
          payer: {
            email: customerData.email.trim().toLowerCase(),
            identification: {
              type: 'CPF',
              number: customerData.cpf.replace(/\D/g, '')
            }
          }
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.status === 'approved') {
        toast.success('Pagamento aprovado!');
        onPaymentSuccess();
      } else if (data.status === 'in_process' || data.status === 'pending') {
        toast.info('Pagamento em processamento');
        // Still consider it a success for the checkout flow
        onPaymentSuccess();
      } else {
        const statusMessages: Record<string, string> = {
          rejected: 'Pagamento recusado. Verifique os dados do cartão.',
          cancelled: 'Pagamento cancelado.',
          refunded: 'Pagamento estornado.'
        };
        throw new Error(statusMessages[data.status] || `Status: ${data.status}`);
      }
    } catch (err) {
      console.error('Card payment error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
      toast.error('Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  }, [orderId, totalAmount, customerData, onPaymentSuccess]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: primaryColor }} />
        <p className="text-gray-600">Carregando formulário de pagamento...</p>
      </div>
    );
  }

  if (error && !sdkReady || isAmountTooLow) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-red-600 text-center mb-2 font-medium">
          {isAmountTooLow ? 'Valor mínimo não atingido' : 'Erro no pagamento'}
        </p>
        <p className="text-gray-600 text-center text-sm mb-4 max-w-sm">
          {error || `O valor mínimo para pagamento com cartão é ${formatCurrency(MIN_CARD_AMOUNT)}. Use PIX para valores menores.`}
        </p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isAmountTooLow ? 'Escolher PIX' : 'Voltar'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} disabled={processing}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold text-gray-900">Pagamento com Cartão</h2>
      </div>

      {/* Amount */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500">Valor a pagar</p>
        <p className="text-3xl font-bold" style={{ color: primaryColor }}>
          {formatCurrency(totalAmount)}
        </p>
      </div>

      {/* Card Icon */}
      <div className="flex justify-center mb-6">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <CreditCard className="w-8 h-8" style={{ color: primaryColor }} />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mercado Pago Card Form */}
      {sdkReady && (
        <div className="mb-4">
          <CardPayment
            initialization={{
              amount: totalAmount,
              payer: {
                email: customerData.email
              }
            }}
            customization={{
              visual: {
                style: {
                  theme: 'default'
                }
              },
              paymentMethods: {
                maxInstallments: 12,
                minInstallments: 1
              }
            }}
            onSubmit={handleCardPayment}
            onReady={() => console.log('Card form ready')}
            onError={(err) => {
              console.error('Card form error:', JSON.stringify(err, null, 2));
              // Handle specific error messages
              let errorMessage = 'Erro no formulário de pagamento';
              if (err && typeof err === 'object') {
                if (err.message?.includes('larger amount') || err.cause?.includes('amount')) {
                  errorMessage = `O valor mínimo para cartão é ${formatCurrency(MIN_CARD_AMOUNT)}. Use PIX para valores menores.`;
                } else if (err.message) {
                  errorMessage = err.message;
                }
              }
              setError(errorMessage);
            }}
          />
        </div>
      )}

      {/* Processing indicator */}
      {processing && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processando pagamento...
        </div>
      )}
    </div>
  );
}
