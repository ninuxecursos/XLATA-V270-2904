import React, { useState } from 'react';
import { ShieldAlert, Users, Clock, ArrowLeft, RefreshCw, MonitorSmartphone, LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface PdvAccessBlockedProps {
  errorMessage: string | null;
  activeSessionCount: number;
  maxSlots: number;
  workHoursBlocked: boolean;
  deviceConflict?: boolean;
  onRetry: () => void;
  onTakeover?: (password: string) => Promise<{ success: boolean; message?: string }>;
}

const PdvAccessBlocked: React.FC<PdvAccessBlockedProps> = ({
  errorMessage,
  activeSessionCount,
  maxSlots,
  workHoursBlocked,
  deviceConflict = false,
  onRetry,
  onTakeover,
}) => {
  const navigate = useNavigate();
  const [takeoverOpen, setTakeoverOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const renderIcon = () => {
    if (workHoursBlocked) {
      return (
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
      );
    }
    if (deviceConflict) {
      return (
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <MonitorSmartphone className="w-8 h-8 text-emerald-500" />
        </div>
      );
    }
    return (
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-8 h-8 text-destructive" />
      </div>
    );
  };

  const title = workHoursBlocked
    ? 'Fora do Horário de Expediente'
    : deviceConflict
      ? 'PDV já aberto em outro dispositivo'
      : 'Limite de Acessos Atingido';

  const fallbackMessage = deviceConflict
    ? 'Este usuário já está com o PDV aberto em outro dispositivo. Feche o PDV no outro dispositivo para continuar aqui.'
    : 'Não foi possível acessar o PDV no momento.';

  const handleTakeover = async () => {
    if (!password.trim() || !onTakeover) return;
    setSubmitting(true);
    const result = await onTakeover(password);
    setSubmitting(false);
    if (result.success) {
      toast.success('Outro dispositivo desconectado. Conectando aqui...');
      setTakeoverOpen(false);
      setPassword('');
    } else {
      toast.error(result.message || 'Falha ao desconectar outro dispositivo');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-6">
        {renderIcon()}

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {errorMessage || fallbackMessage}
          </p>
          {deviceConflict && (
            <p className="text-xs text-muted-foreground/80 pt-1">
              A liberação é automática em até ~90 segundos após o outro dispositivo fechar a página do PDV.
            </p>
          )}
        </div>

        {!workHoursBlocked && !deviceConflict && (
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>
                {activeSessionCount} de {maxSlots} acessos em uso
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-destructive rounded-full h-2 transition-all"
                style={{ width: `${Math.min((activeSessionCount / maxSlots) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground/70">
              Para liberar mais acessos simultâneos, adquira uma vaga de funcionário extra no menu Funcionários.
            </p>
          </div>
        )}

        {deviceConflict && onTakeover && (
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
            onClick={() => setTakeoverOpen(true)}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Desconectar outro dispositivo e conectar aqui
          </Button>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <Button
            className="flex-1"
            onClick={onRetry}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Tentar novamente
          </Button>
        </div>
      </div>

      <Dialog open={takeoverOpen} onOpenChange={(o) => { if (!submitting) setTakeoverOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MonitorSmartphone className="w-5 h-5 text-emerald-500" />
              Desconectar outro dispositivo
            </DialogTitle>
            <DialogDescription>
              Para sua segurança, confirme sua senha. O PDV será desconectado no outro dispositivo e aberto aqui.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="takeover-password">Senha da sua conta</Label>
            <div className="relative">
              <Input
                id="takeover-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTakeover(); }}
                placeholder="Digite sua senha"
                className="h-12 pr-10"
                autoFocus
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setTakeoverOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleTakeover}
              disabled={submitting || !password.trim()}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Conectando...</>
              ) : (
                <><LogIn className="w-4 h-4 mr-2" /> Confirmar e conectar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PdvAccessBlocked;
