import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Copy, Check, CheckCircle, AlertCircle, Timer, Smartphone } from 'lucide-react';
import { PixPaymentResponse } from '@/types/mercadopago';
import { useToast } from '@/hooks/use-toast';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { useSubscriptionSync } from '@/hooks/useSubscriptionSync';
import { PaymentSuccessModal } from './PaymentSuccessModal';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface QRCodeDisplayProps {
  paymentData: PixPaymentResponse;
  onPaymentComplete?: () => void;
  onPaymentStatusChange?: (status: string) => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ 
  paymentData, 
  onPaymentComplete,
  onPaymentStatusChange 
}) => {
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [subscriptionActivated, setSubscriptionActivated] = useState(false);
  const [activatedPlan, setActivatedPlan] = useState<{ name: string; expiresAt: string } | null>(null);
  const { toast } = useToast();
  const { pollPaymentStatus } = useMercadoPago();
  const { syncSubscriptionData } = useSubscriptionSync();

  const progressPercentage = (timeLeft / 600) * 100;

  // Timer countdown effect
  useEffect(() => {
    if (paymentStatus !== 'pending') return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          setPaymentStatus('expired');
          onPaymentStatusChange?.('expired');
          toast({
            title: "QR Code expirado",
            description: "O tempo limite foi atingido. Gere um novo QR Code.",
            variant: "destructive"
          });
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [toast, paymentStatus, onPaymentStatusChange]);

  useEffect(() => {
    if (paymentData?.id && paymentStatus === 'pending' && timeLeft > 0) {
      pollPaymentStatus(paymentData.id, async (status) => {
        setPaymentStatus(status);
        onPaymentStatusChange?.(status);
        
        if (status === 'approved') {
          toast({
            title: "Pagamento aprovado!",
            description: "Sincronizando sua assinatura...",
          });
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          await syncSubscriptionData();
          
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: subscription } = await supabase
              .from('user_subscriptions')
              .select('*, subscription_plans(name)')
              .eq('user_id', user.id)
              .eq('is_active', true)
              .maybeSingle();
            
            if (subscription && new Date(subscription.expires_at) > new Date()) {
              setSubscriptionActivated(true);
              setActivatedPlan({
                name: (subscription as any).subscription_plans?.name || 'Plano',
                expiresAt: subscription.expires_at
              });
            } else {
              setSubscriptionActivated(false);
            }
            
            setShowSuccessModal(true);
          }
          
          onPaymentComplete?.();
        } else if (status === 'rejected' || status === 'cancelled') {
          toast({
            title: "Pagamento não aprovado",
            description: "Tente novamente ou use outro método de pagamento.",
            variant: "destructive"
          });
        }
      }).catch(error => {
        console.error('Erro no polling:', error);
      });
    }
  }, [paymentData?.id, pollPaymentStatus, onPaymentComplete, toast, paymentStatus, timeLeft, syncSubscriptionData, onPaymentStatusChange]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyPixCode = async () => {
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

  const isExpired = timeLeft === 0 || paymentStatus === 'expired';
  const isApproved = paymentStatus === 'approved';
  const isRejected = paymentStatus === 'rejected' || paymentStatus === 'cancelled';

  return (
    <div className="space-y-4">
      {/* Timer & Progress */}
      {!isApproved && !isRejected && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Timer className="h-4 w-4" />
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
              "h-2 transition-all bg-muted",
              timeLeft <= 60 && "[&>div]:bg-destructive",
              timeLeft <= 180 && timeLeft > 60 && "[&>div]:bg-yellow-500",
              timeLeft > 180 && "[&>div]:bg-primary"
            )}
          />
        </div>
      )}

      {/* QR Code Container */}
      <div className={cn(
        "relative rounded-xl overflow-hidden transition-all",
        isExpired && "opacity-50"
      )}>
        <div className="bg-white p-4 rounded-xl flex justify-center mx-auto max-w-[280px]">
          <img 
            src={`data:image/png;base64,${paymentData.qr_code_base64}`}
            alt="QR Code PIX"
            className="w-48 h-48 sm:w-56 sm:h-56"
          />
        </div>
        
        {isExpired && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
              <p className="font-semibold text-destructive">QR Code Expirado</p>
              <p className="text-xs text-muted-foreground">Gere um novo código</p>
            </div>
          </div>
        )}
      </div>

      {/* Copy Button */}
      <Button
        onClick={copyPixCode}
        disabled={isExpired}
        variant={copied ? "secondary" : "default"}
        className={cn(
          "w-full h-11 font-semibold rounded-xl transition-all",
          copied 
            ? "bg-green-600 hover:bg-green-700 text-white" 
            : "bg-primary hover:bg-primary/90 text-primary-foreground"
        )}
        size="lg"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Código Copiado!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-2" />
            Copiar Código PIX
          </>
        )}
      </Button>

      {/* Instructions */}
      <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" />
          Como pagar
        </p>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Abra o app do seu banco</li>
          <li>Escolha pagar com <span className="font-medium text-foreground">PIX</span></li>
          <li>Escaneie o código ou cole o código copiado</li>
          <li>Confirme o pagamento</li>
        </ol>
      </div>

      {/* Payment Status */}
      <div className={cn(
        "rounded-xl p-4 transition-all border",
        isApproved && "bg-green-500/10 border-green-500/30",
        isRejected && "bg-destructive/10 border-destructive/30",
        !isApproved && !isRejected && "bg-muted/30 border-border"
      )}>
        {isApproved ? (
          <div className="flex items-center justify-center gap-2 text-green-500">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Pagamento Aprovado!</span>
          </div>
        ) : isRejected ? (
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Pagamento não aprovado</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground font-medium">
              Aguardando pagamento...
            </p>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
      </div>
      
      <PaymentSuccessModal 
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        isActivated={subscriptionActivated}
        planName={activatedPlan?.name}
        expiresAt={activatedPlan?.expiresAt}
      />
    </div>
  );
};

export default QRCodeDisplay;
