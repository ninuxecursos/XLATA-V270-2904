import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Copy, Check, Eye, EyeOff, Key, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface EmployeePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  password: string;
  employeeName: string;
}

export function EmployeePasswordModal({ 
  isOpen, 
  onClose, 
  email, 
  password, 
  employeeName 
}: EmployeePasswordModalProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      toast.success('Email copiado!');
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      toast.error('Erro ao copiar email');
    }
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedPassword(true);
      toast.success('Senha copiada!');
      setTimeout(() => setCopiedPassword(false), 2000);
    } catch {
      toast.error('Erro ao copiar senha');
    }
  };

  const handleCopyAll = async () => {
    try {
      const text = `Credenciais de Acesso - ${employeeName}\n\nEmail: ${email}\nSenha: ${password}`;
      await navigator.clipboard.writeText(text);
      toast.success('Credenciais copiadas!');
    } catch {
      toast.error('Erro ao copiar credenciais');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <Key className="h-5 w-5" />
            Funcionário Criado com Sucesso!
          </DialogTitle>
          <DialogDescription>
            Credenciais de acesso para <strong>{employeeName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Banner */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Atenção: Guarde estas informações!</p>
              <p className="mt-1">Esta senha não será exibida novamente. Anote ou envie para o funcionário agora.</p>
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="h-4 w-4" />
              Email de Acesso
            </Label>
            <div className="flex gap-2">
              <Input 
                value={email} 
                readOnly 
                className="font-mono bg-muted"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={handleCopyEmail}
              >
                {copiedEmail ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-muted-foreground">
              <Key className="h-4 w-4" />
              Senha Gerada
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input 
                  type={showPassword ? 'text' : 'password'}
                  value={password} 
                  readOnly 
                  className="font-mono bg-muted pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={handleCopyPassword}
              >
                {copiedPassword ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Copy All Button */}
          <Button 
            type="button" 
            variant="secondary" 
            className="w-full"
            onClick={handleCopyAll}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar Todas as Credenciais
          </Button>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">Próximos passos:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Envie as credenciais para o funcionário</li>
              <li>O funcionário deve fazer login com esses dados</li>
              <li>Recomende que altere a senha no primeiro acesso</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>
            OK, Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
