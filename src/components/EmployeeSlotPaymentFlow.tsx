import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, ArrowRight, Users, CreditCard, QrCode, CheckCircle2, 
  Loader2, Copy, Clock, UserPlus, Shield, Smartphone
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { supabase } from '@/integrations/supabase/client';
import { formatPhone, formatCPF } from '@/lib/validations/checkout';
import { PaymentFormData, PlanData } from '@/types/mercadopago';
import { toast } from 'sonner';
import { EmployeeInlineForm } from '@/components/EmployeeInlineForm';
import { useDepotEmployees, EmployeeFormData, CreateEmployeeResult } from '@/hooks/useDepotEmployees';
import { useEmployeeSlotPrice, formatBRL } from '@/hooks/useEmployeeSlotPrice';

interface EmployeeSlotPaymentFlowProps {
  onBack: () => void;
  onComplete: () => void;
}

type Step = 'guide' | 'payer' | 'qrcode' | 'employee';

export function EmployeeSlotPaymentFlow({ onBack, onComplete }: EmployeeSlotPaymentFlowProps) {
  const { user } = useAuth();
  const { loading, paymentData, createPixPayment, pollPaymentStatus, reset } = useMercadoPago();
  const { createEmployee, updateEmployee } = useDepotEmployees();
  const { price: slotPrice, formatted: slotPriceFormatted } = useEmployeeSlotPrice();
  const EMPLOYEE_SLOT_PLAN: PlanData = {
    id: 'employee_slot',
    name: 'Vaga de Funcionário',
    price: slotPriceFormatted,
    amount: slotPrice,
    plan_type: 'employee_slot',
  };
  
  const [step, setStep] = useState<Step>('guide');
  const [payerForm, setPayerForm] = useState<PaymentFormData>({ name: '', email: '', phone: '', cpf: '' });
  const [paymentApproved, setPaymentApproved] = useState(false);
  const [slotPaymentId, setSlotPaymentId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 min
  const [copied, setCopied] = useState(false);

  // Auto-fill payer data from profile
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('name, email, whatsapp').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setPayerForm(prev => ({
            ...prev,
            name: data.name || '',
            email: data.email || '',
            phone: data.whatsapp || '',
          }));
        }
      });
  }, [user?.id]);

  // Timer for QR Code
  useEffect(() => {
    if (step !== 'qrcode' || paymentApproved) return;
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [step, paymentApproved, timeLeft]);

  // Poll payment after QR code generated
  useEffect(() => {
    if (!paymentData?.id || paymentApproved) return;
    
    pollPaymentStatus(paymentData.id, (status) => {
      if (status === 'approved') {
        setPaymentApproved(true);
        setSlotPaymentId(paymentData.id);
        toast.success('Pagamento aprovado! Agora cadastre o funcionário.');
        setStep('employee');
      }
    }).catch(console.error);
  }, [paymentData?.id, paymentApproved, pollPaymentStatus]);

  const handlePayerSubmit = async () => {
    if (!user?.id) return;
    if (!payerForm.name || !payerForm.email || !payerForm.cpf) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const slotPlan: PlanData = {
        ...EMPLOYEE_SLOT_PLAN,
        plan_type: `employee_slot`,
      };
      
      // Override external_reference format for employee slots
      const cleanPhone = payerForm.phone.replace(/\D/g, '');
      const cleanCpf = payerForm.cpf.replace(/\D/g, '');

      if (cleanCpf.length !== 11) {
        toast.error('CPF deve ter 11 dígitos');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          payer: {
            name: payerForm.name.trim(),
            email: payerForm.email.trim().toLowerCase(),
            phone: cleanPhone,
            identification: { type: 'CPF', number: cleanCpf },
          },
          transaction_amount: EMPLOYEE_SLOT_PLAN.amount,
          description: 'Vaga de Funcionário - Acesso Mensal',
          external_reference: `employee_slot_${user.id}_${Date.now()}`,
          payment_method_id: 'pix',
        },
      });

      if (error) throw new Error(error.message);

      // Manually set payment data since we bypassed the hook
      // We need to use the hook's internal state - let's use createPixPayment instead
      // Actually we called supabase directly, so let's set state manually
      // The paymentData from useMercadoPago won't be set. Let's refactor.
      
      // Store payment data locally
      setLocalPaymentData(data);
      setStep('qrcode');
      setTimeLeft(600);
    } catch (err: any) {
      console.error('Erro ao criar pagamento:', err);
      toast.error('Erro ao gerar QR Code. Tente novamente.');
    }
  };

  // Local payment data since we call the edge function directly
  const [localPaymentData, setLocalPaymentData] = useState<any>(null);
  const activePaymentData = localPaymentData;

  // Poll using local payment data
  useEffect(() => {
    if (!activePaymentData?.id || paymentApproved) return;
    
    const poll = async () => {
      const maxAttempts = 120;
      let attempts = 0;

      const doPoll = async (): Promise<void> => {
        if (paymentApproved) return;
        
        try {
          // Check local DB first
          const { data: localPayment } = await supabase
            .from('mercado_pago_payments')
            .select('status')
            .eq('payment_id', activePaymentData.id)
            .single();

          if (localPayment?.status === 'approved') {
            setPaymentApproved(true);
            setSlotPaymentId(activePaymentData.id.toString());
            toast.success('Pagamento aprovado! Agora cadastre o funcionário.');
            setStep('employee');
            return;
          }

          // Check via edge function
          const { data: statusData } = await supabase.functions.invoke('get-payment-status', {
            body: { payment_id: activePaymentData.id },
          });

          attempts++;

          if (statusData?.status === 'approved') {
            setPaymentApproved(true);
            setSlotPaymentId(activePaymentData.id.toString());
            toast.success('Pagamento aprovado! Agora cadastre o funcionário.');
            setStep('employee');
            return;
          }

          if (attempts < maxAttempts && !paymentApproved) {
            await new Promise(r => setTimeout(r, 5000));
            return doPoll();
          }
        } catch (err) {
          console.error('Erro no polling:', err);
          if (attempts < 3) {
            await new Promise(r => setTimeout(r, 2000));
            return doPoll();
          }
        }
      };

      await doPoll();
    };

    poll();
  }, [activePaymentData?.id]);

  const handleCopyCode = () => {
    if (activePaymentData?.qr_code) {
      navigator.clipboard.writeText(activePaymentData.qr_code);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleEmployeeSave = async (data: EmployeeFormData): Promise<CreateEmployeeResult> => {
    const result = await createEmployee(data);
    
    // Link the slot to the new employee
    if (result.employee && slotPaymentId && user?.id) {
      const { error } = await supabase
        .from('employee_slots')
        .update({ employee_id: result.employee.id })
        .eq('owner_user_id', user.id)
        .eq('payment_reference', slotPaymentId)
        .is('employee_id', null);
      
      if (error) {
        console.error('Erro ao vincular slot:', error);
      }
    }
    
    if (result.employee) {
      // Don't call onComplete yet - let the password modal show first
    }
    
    return result;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Step 1: Guide
  if (step === 'guide') {
    return (
      <div className="flex-1 w-full p-4 md:p-6 max-w-2xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card className="border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Novo Funcionário</CardTitle>
            <p className="text-muted-foreground mt-2">
              Para adicionar um novo funcionário ao sistema, é necessário um pagamento mensal adicional.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold">{slotPriceFormatted} / mês por funcionário</p>
                  <p className="text-sm text-muted-foreground">Pagamento via PIX - acesso por 30 dias</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold">Acesso em dispositivo próprio</p>
                  <p className="text-sm text-muted-foreground">O funcionário acessa com login e senha exclusivos</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-semibold">Permissões personalizáveis</p>
                  <p className="text-sm text-muted-foreground">Controle o que cada funcionário pode acessar</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Como funciona:</strong> Após o pagamento via PIX, uma vaga será liberada por 30 dias. 
                Você poderá cadastrar o funcionário imediatamente após a confirmação do pagamento.
              </p>
            </div>

            <Button 
              onClick={() => setStep('payer')} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
            >
              Continuar para pagamento
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Payer data
  if (step === 'payer') {
    return (
      <div className="flex-1 w-full p-4 md:p-6 max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => setStep('guide')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Dados do pagador
            </CardTitle>
            <p className="text-sm text-muted-foreground">Informe os dados para gerar o PIX</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                value={payerForm.name}
                onChange={(e) => setPayerForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={payerForm.email}
                onChange={(e) => setPayerForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={payerForm.phone}
                onChange={(e) => setPayerForm(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={payerForm.cpf}
                onChange={(e) => setPayerForm(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor a pagar</span>
              <span className="text-lg font-bold text-emerald-600">{slotPriceFormatted}</span>
            </div>

            <Button 
              onClick={handlePayerSubmit} 
              disabled={loading || !payerForm.name || !payerForm.email || !payerForm.cpf}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando QR Code...
                </>
              ) : (
                <>
                  Gerar QR Code PIX
                  <QrCode className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: QR Code
  if (step === 'qrcode' && activePaymentData) {
    return (
      <div className="flex-1 w-full p-4 md:p-6 max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => { setStep('payer'); setLocalPaymentData(null); }} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5" />
              Pague via PIX
            </CardTitle>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className={`text-sm font-mono ${timeLeft < 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                Expira em {formatTime(timeLeft)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activePaymentData.qr_code_base64 && (
              <div className="flex justify-center">
                <img 
                  src={`data:image/png;base64,${activePaymentData.qr_code_base64}`} 
                  alt="QR Code PIX" 
                  className="w-48 h-48 md:w-56 md:h-56"
                />
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-2 text-center">Código PIX (copiar e colar)</p>
              <div className="flex gap-2">
                <Input 
                  value={activePaymentData.qr_code || ''} 
                  readOnly 
                  className="text-xs font-mono"
                />
                <Button variant="outline" size="sm" onClick={handleCopyCode}>
                  {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Aguardando confirmação do pagamento...
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <span className="text-lg font-bold text-emerald-600">{slotPriceFormatted}</span>
              <p className="text-xs text-muted-foreground">Vaga de Funcionário - 30 dias</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 4: Employee form (after payment approved)
  if (step === 'employee') {
    return (
      <div className="flex-1 w-full p-4 md:p-6">
        <div className="max-w-2xl mx-auto mb-4">
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 mb-4">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Pagamento aprovado - Vaga liberada por 30 dias
          </Badge>
        </div>
        <EmployeeInlineForm
          onBack={onComplete}
          onSave={handleEmployeeSave}
          onUpdate={updateEmployee}
        />
      </div>
    );
  }

  return null;
}
