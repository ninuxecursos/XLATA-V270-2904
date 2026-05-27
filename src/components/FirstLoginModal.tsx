import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { useTrialActivation } from '@/utils/trialActivation';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface FirstLoginModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  onTrialActivated?: () => void;
}

export const FirstLoginModal: React.FC<FirstLoginModalProps> = ({
  open,
  onClose,
  userName,
  onTrialActivated
}) => {
  const [isActivating, setIsActivating] = useState(false);
  const [trialActivated, setTrialActivated] = useState(false);
  const { activateUserTrial } = useTrialActivation();
  const isMobile = useIsMobile();
  
  const handleActivateTrial = async () => {
    setIsActivating(true);
    
    try {
      const result = await activateUserTrial();
      
      if (result.success) {
        setTrialActivated(true);
        toast({
          title: "✅ Teste Grátis Ativado!",
          description: result.message,
        });
        
        setTimeout(() => {
          onClose();
          onTrialActivated?.();
        }, 1500);
      } else {
        toast({
          title: "❌ Erro na Ativação",
          description: result.message,
          variant: "destructive",
        });
        setIsActivating(false);
      }
    } catch (error) {
      toast({
        title: "❌ Erro Inesperado",
        description: "Ocorreu um erro ao ativar o teste. Tente novamente.",
        variant: "destructive",
      });
      setIsActivating(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className={cn(
          "bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-600 [&>button]:hidden",
          isMobile 
            ? "w-full h-full max-w-full max-h-full rounded-none m-0 flex flex-col" 
            : "max-w-2xl"
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className={cn(
          isMobile && "flex-1 overflow-y-auto"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              "text-center text-white font-bold",
              isMobile ? "text-2xl mb-2 pt-4" : "text-3xl mb-4"
            )}>
              🎉 Bem-vindo(a) ao XLata, {userName}!
            </DialogTitle>
          </DialogHeader>
          
          <div className={cn(
            "space-y-6",
            isMobile ? "py-4 px-2" : "py-6"
          )}>
            {/* Logo */}
            <div className={cn(
              "flex justify-center",
              isMobile ? "mb-4" : "mb-6"
            )}>
              <img
                src="/lovable-uploads/xlata.site_logotipo.png"
                alt="Logo XLata"
                className={cn(
                  "w-auto drop-shadow-2xl",
                  isMobile ? "h-16" : "h-24"
                )}
              />
            </div>
            
            {/* Mensagem de boas-vindas */}
            <div className="text-center space-y-3">
              <h2 className={cn(
                "font-bold text-green-400",
                isMobile ? "text-xl" : "text-2xl"
              )}>
                Sua conta foi criada com sucesso! 🚀
              </h2>
              <p className={cn(
                "text-gray-300",
                isMobile ? "text-base px-2" : "text-lg"
              )}>
                Ative agora seu <strong>teste grátis de 7 dias</strong> com todos os recursos do sistema.
              </p>
            </div>
            
            {/* Card de benefícios do teste */}
            <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-600">
              <CardContent className={cn(
                isMobile ? "p-4" : "p-6"
              )}>
                <div className={cn(
                  "flex gap-4",
                  isMobile ? "flex-col items-center text-center" : "items-start"
                )}>
                  <div className={cn(
                    "bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center flex-shrink-0",
                    isMobile ? "w-14 h-14" : "w-12 h-12"
                  )}>
                    <Sparkles className={cn(
                      "text-white",
                      isMobile ? "h-7 w-7" : "h-6 w-6"
                    )} />
                  </div>
                  <div className="flex-1">
                    <h3 className={cn(
                      "text-white font-bold mb-3",
                      isMobile ? "text-lg" : "text-lg"
                    )}>
                      O que você ganha com o teste grátis?
                    </h3>
                    <ul className={cn(
                      "space-y-3 text-gray-300",
                      isMobile ? "text-sm" : "text-sm"
                    )}>
                      <li className="flex items-center gap-3">
                        <CheckCircle className={cn(
                          "text-green-400 flex-shrink-0",
                          isMobile ? "h-5 w-5" : "h-4 w-4"
                        )} />
                        <span>7 dias com acesso total ao sistema</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className={cn(
                          "text-green-400 flex-shrink-0",
                          isMobile ? "h-5 w-5" : "h-4 w-4"
                        )} />
                        <span>Guias completos em vídeo para aprender</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className={cn(
                          "text-green-400 flex-shrink-0",
                          isMobile ? "h-5 w-5" : "h-4 w-4"
                        )} />
                        <span>Todos os recursos disponíveis</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className={cn(
                          "text-green-400 flex-shrink-0",
                          isMobile ? "h-5 w-5" : "h-4 w-4"
                        )} />
                        <span>Sem necessidade de cartão de crédito</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Info hint - somente em desktop */}
            {!isMobile && (
              <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-3 mt-2">
                <p className="text-center text-purple-300 text-sm flex items-center justify-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Após ativar, você será guiado passo a passo na configuração do sistema
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Botão de ativação - fixo no bottom em mobile */}
        <div className={cn(
          "flex flex-col gap-3",
          isMobile 
            ? "p-4 border-t border-gray-700 bg-gray-900/95 safe-area-bottom" 
            : "pt-4 px-6 pb-6"
        )}>
          <Button
            onClick={handleActivateTrial}
            disabled={isActivating || trialActivated}
            className={cn(
              "w-full bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white font-bold disabled:opacity-70",
              isMobile ? "text-base py-6 rounded-xl" : "text-lg py-6"
            )}
          >
            {isActivating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ATIVANDO...
              </>
            ) : trialActivated ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                ATIVADO! REDIRECIONANDO...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                ATIVAR TESTE GRÁTIS DE 7 DIAS
              </>
            )}
          </Button>
          
          {/* Info hint em mobile - abaixo do botão */}
          {isMobile && (
            <p className="text-center text-purple-300 text-xs flex items-center justify-center gap-2">
              <BookOpen className="h-3 w-3" />
              Você será guiado na configuração após ativar
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
