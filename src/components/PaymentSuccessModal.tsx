import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, MessageCircle } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface PaymentSuccessModalProps {
  open: boolean;
  onClose: () => void;
  isActivated: boolean;
  planName?: string;
  expiresAt?: string;
}

export const PaymentSuccessModal = ({ 
  open, 
  onClose, 
  isActivated, 
  planName,
  expiresAt 
}: PaymentSuccessModalProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (open && isActivated) {
      const timer = setTimeout(() => {
        navigate('/guia-completo');
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [open, isActivated, navigate, onClose]);

  const handleWhatsAppSupport = () => {
    window.open('https://wa.me/5511963512105?text=Olá! Meu pagamento PIX foi aprovado mas minha assinatura não foi ativada. Preciso de ajuda.', '_blank');
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            {isActivated ? (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-yellow-500" />
            )}
          </div>
          <AlertDialogTitle className="text-center text-xl">
            {isActivated ? 'Pagamento Aprovado!' : 'Pagamento Aprovado - Ação Necessária'}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription className="text-center space-y-2">
          {isActivated ? (
            <>
              <p className="text-base">Seu pagamento foi confirmado com sucesso!</p>
              <p className="font-semibold text-primary">
                Plano {planName} ativado até {expiresAt ? new Date(expiresAt).toLocaleDateString('pt-BR') : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                Você será redirecionado para o Guia Completo em 3 segundos...
              </p>
            </>
          ) : (
            <>
              <p className="text-base">Seu pagamento foi aprovado, mas sua assinatura não foi ativada automaticamente.</p>
              <p className="text-sm text-muted-foreground">
                Por favor, entre em contato com nosso suporte para ativar manualmente.
              </p>
            </>
          )}
        </AlertDialogDescription>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          {isActivated ? (
            <Button 
              onClick={() => {
                navigate('/guia-completo');
                onClose();
              }}
              className="w-full"
            >
              Ir para o Guia Completo
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleWhatsAppSupport}
                className="w-full gap-2"
                variant="default"
              >
                <MessageCircle className="w-4 h-4" />
                Solicitar Ajuda via WhatsApp
              </Button>
              <Button 
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Fechar
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
