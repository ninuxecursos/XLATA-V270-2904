import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Copy, Check, Loader2, Clock, QrCode, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ShopPixPaymentProps {
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

interface PixPaymentData {
  id: string;
  qr_code: string;
  qr_code_base64: string;
  ticket_url: string;
  status: string;
}

export function ShopPixPayment({
  orderId,
  totalAmount,
  customerData,
  onPaymentSuccess,
  onBack,
  primaryColor = '#10B981'
}: ShopPixPaymentProps) {
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PixPaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate PIX payment using shop-specific endpoint (no JWT required)
  const generatePixPayment = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cleanPhone = customerData.phone.replace(/\D/g, '');
      const cleanCpf = customerData.cpf.replace(/\D/g, '');

      const { data, error: fnError } = await supabase.functions.invoke('create-shop-pix-payment', {
        body: {
          order_id: orderId,
          payer: {
            name: customerData.name.trim(),
            email: customerData.email.trim().toLowerCase(),
            phone: cleanPhone,
            identification: {
              type: 'CPF',
              number: cleanCpf,
            },
          },
          transaction_amount: totalAmount,
          description: `Pedido XLata Shop #${orderId.substring(0, 8)}`,
          external_reference: `shop_order_${orderId}`,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      setPaymentData(data);
    } catch (err) {
      console.error('Error generating PIX:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar QR Code PIX');
    } finally {
      setLoading(false);
    }
  }, [orderId, totalAmount, customerData]);

  // Poll for payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!paymentData?.id) return;

    try {
      // Check local database first
      const { data: localPayment } = await supabase
        .from('mercado_pago_payments')
        .select('status')
        .eq('payment_id', paymentData.id)
        .single();

      if (localPayment?.status === 'approved') {
        setPaymentStatus('approved');
        onPaymentSuccess();
        return true;
      }

      // Then check MP API
      const { data } = await supabase.functions.invoke('get-payment-status', {
        body: { payment_id: paymentData.id },
      });

      if (data?.status) {
        setPaymentStatus(data.status);

        if (data.status === 'approved') {
          onPaymentSuccess();
          return true;
        }
      }
    } catch (err) {
      console.error('Error checking payment:', err);
    }

    return false;
  }, [paymentData?.id, onPaymentSuccess]);

  // Initialize payment
  useEffect(() => {
    generatePixPayment();
  }, [generatePixPayment]);

  // Countdown timer
  useEffect(() => {
    if (paymentStatus === 'approved' || !paymentData) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('Tempo expirado. Gere um novo QR Code.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentData, paymentStatus]);

  // Poll for payment status
  useEffect(() => {
    if (!paymentData?.id || paymentStatus === 'approved') return;

    const pollInterval = setInterval(checkPaymentStatus, 5000);
    return () => clearInterval(pollInterval);
  }, [paymentData?.id, paymentStatus, checkPaymentStatus]);

  const copyPixCode = async () => {
    if (!paymentData?.qr_code) return;

    try {
      await navigator.clipboard.writeText(paymentData.qr_code);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Erro ao copiar código');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: primaryColor }} />
        <p className="text-gray-600">Gerando QR Code PIX...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-red-600 text-center mb-4">{error}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={generatePixPayment} style={{ backgroundColor: primaryColor }} className="text-white">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'approved') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <Check className="w-10 h-10" style={{ color: primaryColor }} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Confirmado!
        </h2>
        <p className="text-gray-500 text-center max-w-xs">
          Seu pagamento foi processado com sucesso. Seu pedido está sendo preparado.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold text-gray-900">Pagamento via PIX</h2>
      </div>

      {/* Timer */}
      <Card className="mb-4 border-amber-200 bg-amber-50">
        <CardContent className="py-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Tempo restante:</span>
          </div>
          <span className="font-bold text-amber-800">{formatTime(timeLeft)}</span>
        </CardContent>
      </Card>

      {/* Amount */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500">Valor a pagar</p>
        <p className="text-3xl font-bold" style={{ color: primaryColor }}>
          {formatCurrency(totalAmount)}
        </p>
      </div>

      {/* QR Code */}
      {paymentData?.qr_code_base64 && (
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <img 
              src={`data:image/png;base64,${paymentData.qr_code_base64}`}
              alt="QR Code PIX"
              className="w-48 h-48"
            />
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <QrCode className="w-4 h-4" />
          Como pagar
        </h3>
        <ol className="text-sm text-gray-600 space-y-2">
          <li className="flex gap-2">
            <span className="font-bold" style={{ color: primaryColor }}>1.</span>
            Abra o app do seu banco
          </li>
          <li className="flex gap-2">
            <span className="font-bold" style={{ color: primaryColor }}>2.</span>
            Escolha pagar via PIX com QR Code
          </li>
          <li className="flex gap-2">
            <span className="font-bold" style={{ color: primaryColor }}>3.</span>
            Escaneie o código acima ou copie e cole
          </li>
          <li className="flex gap-2">
            <span className="font-bold" style={{ color: primaryColor }}>4.</span>
            Confirme o pagamento
          </li>
        </ol>
      </div>

      {/* Copy Button */}
      <Button
        variant="outline"
        className="w-full mb-4"
        onClick={copyPixCode}
        disabled={copied}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Código Copiado!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" />
            Copiar Código PIX
          </>
        )}
      </Button>

      {/* Status indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Aguardando pagamento...
      </div>
    </div>
  );
}
