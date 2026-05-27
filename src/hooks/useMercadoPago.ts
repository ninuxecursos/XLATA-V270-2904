import { useState, useCallback } from 'react';
import { PaymentFormData, PlanData, PixPaymentResponse } from '@/types/mercadopago';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMercadoPago = () => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PixPaymentResponse | null>(null);
  const { toast } = useToast();

  // 🔹 AGORA RECEBE userId TAMBÉM
  const createPixPayment = useCallback(
    async (formData: PaymentFormData, plan: PlanData, userId: string) => {
      setLoading(true);
      try {
        // Limpar e formatar dados
        const cleanPhone = formData.phone.replace(/\D/g, '');
        const cleanCpf = formData.cpf.replace(/\D/g, '');

        // Validar formato de telefone (deve ter 10 ou 11 dígitos)
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
          throw new Error('Telefone deve ter 10 ou 11 dígitos');
        }

        // Validar CPF (deve ter 11 dígitos)
        if (cleanCpf.length !== 11) {
          throw new Error('CPF deve ter 11 dígitos');
        }

        console.log('Criando pagamento PIX:', {
          planName: plan.name,
          amount: plan.amount,
          email: formData.email,
          planType: plan.plan_type,
          userId,
        });

        const { data, error } = await supabase.functions.invoke('create-pix-payment', {
          body: {
            payer: {
              name: formData.name.trim(),
              email: formData.email.trim().toLowerCase(),
              phone: cleanPhone,
              identification: {
                type: 'CPF',
                number: cleanCpf,
              },
            },
            transaction_amount: plan.amount,
            description: `Assinatura ${plan.name}`,
            // 🔑 FORMATO QUE O WEBHOOK ENTENDE
            external_reference: `user_${userId}_plan_${plan.plan_type}`,
            payment_method_id: 'pix',
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        setPaymentData(data);
        return data;
      } catch (error) {
        console.error('Erro ao criar pagamento PIX:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao gerar QR Code. Tente novamente.',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const checkPaymentStatus = useCallback(async (paymentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-status', {
        body: { payment_id: paymentId },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      throw error;
    }
  }, []);

  const pollPaymentStatus = useCallback(
    async (paymentId: string, onStatusChange?: (status: string) => void) => {
      const maxAttempts = 120; // 10 minutos (5s * 120)
      let attempts = 0;

      const poll = async (): Promise<any> => {
        try {
          // ✅ Consultar banco local PRIMEIRO
          const { data: localPayment } = await supabase
            .from('mercado_pago_payments')
            .select('status')
            .eq('payment_id', paymentId)
            .single();

          if (localPayment?.status === 'approved') {
            console.log('Payment approved via local database check');
            if (onStatusChange) {
              onStatusChange('approved');
            }
            return { status: 'approved' };
          }

          // Se ainda pending, consultar API MP
          const status = await checkPaymentStatus(paymentId);
          attempts++;

          if (onStatusChange) {
            onStatusChange(status.status);
          }

          if (
            status.status === 'approved' ||
            status.status === 'rejected' ||
            status.status === 'cancelled'
          ) {
            return status;
          }

          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            return poll();
          }

          return status;
        } catch (error) {
          console.error('Erro no polling:', error);
          if (attempts < 3) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return poll();
          }
          throw error;
        }
      };

      return poll();
    },
    [checkPaymentStatus]
  );

  const reset = useCallback(() => {
    setPaymentData(null);
    setLoading(false);
  }, []);

  return {
    loading,
    paymentData,
    createPixPayment,
    checkPaymentStatus,
    pollPaymentStatus,
    reset,
  };
};
