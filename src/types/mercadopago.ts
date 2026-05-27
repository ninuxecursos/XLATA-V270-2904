export interface PaymentFormData {
  name: string;
  phone: string;
  email: string;
  cpf: string;
}

export interface PlanData {
  id: string;
  name: string;
  price: string;   // "R$ 97,90"
  amount: number;  // 97.90
  plan_type: string; // "monthly", "quarterly", "trial", etc.
}

export interface PixPaymentResponse {
  id: string;
  qr_code: string;
  qr_code_base64: string;
  ticket_url: string;
  status: string;
}

export interface PaymentStatus {
  id: string;
  status: 'pending' | 'approved' | 'cancelled' | 'rejected';
  status_detail?: string;
}
