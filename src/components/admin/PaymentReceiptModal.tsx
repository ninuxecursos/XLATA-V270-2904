import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Share2, 
  CheckCircle, 
  Clock, 
  XCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface PixPayment {
  id: string;
  payment_id: string;
  payer_email: string;
  transaction_amount: number;
  status: string;
  status_detail: string | null;
  created_at: string;
  updated_at: string;
  external_reference: string | null;
}

interface PaymentReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PixPayment | null;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  open,
  onOpenChange,
  payment,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!payment) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'approved':
        return { 
          label: 'Aprovado', 
          color: 'bg-emerald-600 text-white',
          icon: CheckCircle,
          description: 'Pagamento confirmado'
        };
      case 'pending':
        return { 
          label: 'Pendente', 
          color: 'bg-amber-500 text-white',
          icon: Clock,
          description: 'Aguardando confirmação'
        };
      case 'rejected':
        return { 
          label: 'Rejeitado', 
          color: 'bg-red-600 text-white',
          icon: XCircle,
          description: 'Pagamento não aprovado'
        };
      case 'cancelled':
        return { 
          label: 'Cancelado', 
          color: 'bg-gray-600 text-white',
          icon: XCircle,
          description: 'Pagamento cancelado'
        };
      default:
        return { 
          label: status, 
          color: 'bg-gray-500 text-white',
          icon: Clock,
          description: 'Status desconhecido'
        };
    }
  };

  const extractPlanType = (reference: string | null) => {
    if (!reference) return 'N/A';
    const match = reference.match(/plan_(\w+)/);
    if (match) {
      const planMap: Record<string, string> = {
        'trial': 'Teste (7 dias)',
        'monthly': 'Mensal',
        'quarterly': 'Trimestral',
        'biannual': 'Semestral',
        'annual': 'Anual',
        'triennial': 'Trienal'
      };
      return planMap[match[1]] || match[1];
    }
    return 'N/A';
  };

  const handleDownloadPDF = async () => {
    try {
      // Dynamic import of html2pdf
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = receiptRef.current;
      if (!element) return;

      const opt = {
        margin: 10,
        filename: `comprovante-pix-${payment.payment_id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      
      toast({
        title: "PDF gerado",
        description: "Comprovante baixado com sucesso!"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF.",
        variant: "destructive"
      });
    }
  };

  const handleShareWhatsApp = () => {
    const statusInfo = getStatusInfo(payment.status);
    const planType = extractPlanType(payment.external_reference);
    
    const message = `🧾 *Comprovante de Pagamento PIX - XLata*

📋 *ID do Pagamento:* ${payment.payment_id}
📧 *Email:* ${payment.payer_email}
💰 *Valor:* ${formatCurrency(payment.transaction_amount)}
📅 *Data:* ${format(new Date(payment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
📦 *Plano:* ${planType}
✅ *Status:* ${statusInfo.label}
${statusInfo.description}

---
XLata - Sistema de Gestão para Reciclagem
https://xlata.site`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp aberto",
      description: "Compartilhe o comprovante!"
    });
  };

  const handleCopyPaymentId = () => {
    navigator.clipboard.writeText(payment.payment_id);
    toast({
      title: "Copiado!",
      description: "ID do pagamento copiado para a área de transferência."
    });
  };

  const statusInfo = getStatusInfo(payment.status);
  const StatusIcon = statusInfo.icon;
  const planType = extractPlanType(payment.external_reference);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <StatusIcon className="h-5 w-5 text-primary" />
            Comprovante de Pagamento PIX
          </DialogTitle>
          <DialogDescription>
            Detalhes do pagamento #{payment.payment_id.slice(-8)}
          </DialogDescription>
        </DialogHeader>

        {/* Receipt Content */}
        <div ref={receiptRef} className="bg-background p-6 rounded-lg border border-border">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-emerald-500">XLata</h2>
            <p className="text-sm text-muted-foreground">Sistema de Gestão para Reciclagem</p>
            <Separator className="my-4" />
            <Badge className={statusInfo.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>

          {/* Payment Details */}
          <Card className="bg-muted/30 border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ID do Pagamento</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-foreground">{payment.payment_id}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={handleCopyPaymentId}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email do Pagador</span>
                <span className="text-sm text-foreground">{payment.payer_email}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Plano</span>
                <span className="text-sm text-foreground">{planType}</span>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor</span>
                <span className="text-xl font-bold text-emerald-500">
                  {formatCurrency(payment.transaction_amount)}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Data/Hora</span>
                <span className="text-sm text-foreground">
                  {format(new Date(payment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>

              {payment.status_detail && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Detalhe</span>
                  <span className="text-sm text-foreground">{payment.status_detail}</span>
                </div>
              )}

              <Separator />

              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  Comprovante gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button 
            onClick={handleDownloadPDF} 
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
          <Button 
            onClick={handleShareWhatsApp} 
            variant="outline"
            className="flex-1 border-emerald-600 text-emerald-500 hover:bg-emerald-600/10"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Enviar WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentReceiptModal;
