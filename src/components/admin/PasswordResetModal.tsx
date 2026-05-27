import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Key, Copy, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PasswordResetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  password: string;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  open,
  onOpenChange,
  email,
  password
}) => {
  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast({
        title: "Senha copiada!",
        description: "A senha foi copiada para a área de transferência.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a senha.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Key className="h-5 w-5 text-green-400" />
            Senha Resetada com Sucesso
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
            <Label className="text-gray-400 text-sm">Email do Usuário</Label>
            <p className="text-white font-medium">{email}</p>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-lg border border-green-600">
            <Label className="text-gray-400 text-sm mb-2 block">Nova Senha</Label>
            <div className="flex items-center gap-2">
              <p className="text-white font-mono text-lg font-bold flex-1">
                {password}
              </p>
              <Button
                onClick={handleCopyPassword}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Senha
              </Button>
            </div>
          </div>
          
          <div className="bg-yellow-900/30 p-3 rounded-lg border border-yellow-700">
            <p className="text-yellow-300 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Importante:</strong> Envie esta senha ao usuário por email ou WhatsApp. 
                Ela não será exibida novamente.
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
