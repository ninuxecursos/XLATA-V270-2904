// src/hooks/useMercadoPago.ts
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PaymentFormData, PlanData } from "@/types/mercadopago";

interface UseMercadoPagoReturn {
  loading: boolean;
  paymentData: any | null;
  createPixPayment: (
    formData: PaymentFormData,
    plan: PlanData,
    userId: string
  ) => Promise<void>;
  reset: () => void;
}

export function useMercadoPago(): UseMercadoPagoReturn {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any | null>(null);

  const createPixPayment = async (
    formData: PaymentFormData,
    plan: PlanData,
    userId: string
  ) => {
    setLoading(true);
    try {
      const body = {
        payer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          identification: {
            type: "CPF",
            number: formData.cpf,
          },
        },
        transaction_amount: plan.amount,
        description: `Assinatura ${plan.name}`,
        payment_method_id: "pix",
        // 🔑 padrão que o webhook espera
        external_reference: `user_${userId}_plan_${plan.plan_type}`,
      };

      console.log("Enviando para create-pix-payment:", body);

      const { data, error } = await supabase.functions.invoke(
        "create-pix-payment",
        {
          body,
        }
      );

      if (error) {
        console.error("Erro ao criar pagamento PIX:", error);
        throw error;
      }

      setPaymentData(data);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPaymentData(null);
  };

  return {
    loading,
    paymentData,
    createPixPayment,
    reset,
  };
}
