import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Eye, EyeOff, ArrowLeft, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { validateSupabaseConnection } from '@/utils/connectionValidator';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';
import { useRateLimit } from '@/hooks/useRateLimit';
import { SEOHead } from '@/components/portal/SEOHead';
import { supabase } from '@/integrations/supabase/client';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, user, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { checkRateLimit, recordAttempt, resetRateLimit } = useRateLimit('login', {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handlePasswordReset = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      toast({ title: "Email inválido", description: "Por favor, digite um email válido.", variant: "destructive" });
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada para redefinir sua senha." });
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Não foi possível enviar o email de recuperação.", variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateLimitStatus = checkRateLimit();
    if (!rateLimitStatus.allowed) {
      toast({ title: "Muitas tentativas", description: `Aguarde ${rateLimitStatus.remainingTime} minutos.`, variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const connectionStatus = await validateSupabaseConnection();
      if (!connectionStatus.isConnected) {
        toast({ title: "Servidor offline", description: "Não foi possível conectar ao servidor.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      const { data, error } = await signIn(email, password);
      if (error) {
        const attemptResult = recordAttempt();
        let description = error.message || "Erro inesperado.";
        if (attemptResult.blocked) {
          description = `Muitas tentativas falhas. Aguarde ${attemptResult.remainingTime} minutos.`;
        } else {
          const remaining = checkRateLimit().attemptsLeft;
          if (remaining <= 2) description += ` (${remaining} tentativas restantes)`;
        }
        toast({ title: "Erro no login", description, variant: "destructive" });
      } else if (data?.session) {
        resetRateLimit();
        toast({ title: "Login realizado!", description: "Bem-vindo ao Sistema PDV" });
        navigate('/');
      }
    } catch (error: any) {
      toast({ title: "Erro crítico", description: "Falha na comunicação com o servidor.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Login - XLata"
        description="Acesse sua conta XLata - Sistema para Depósito de Reciclagem"
        allowIndexing={false}
      />
      <div className="min-h-screen flex">
        <AuthBrandPanel
          title="Bem-vindo de volta!"
          subtitle="Acesse sua conta para gerenciar seus fiados de forma simples e rápida."
        />

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col min-h-screen">
          {/* Mobile green header */}
          <div className="lg:hidden bg-emerald-500 px-4 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/landing')}
              className="text-white hover:text-white/80 -ml-2 p-2 h-auto"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img
              src="/lovable-uploads/0a88c5b7-5cee-4840-953d-8ac270aaa491.png"
              alt="XLata Logo"
              className="h-8 brightness-0 invert"
            />
            <div className="w-9" />
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block p-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/landing')}
              className="text-gray-600 hover:text-gray-900 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>

          {/* Form content */}
          <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16">
            <div className="w-full max-w-md">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Entrar</h1>
              <p className="text-gray-500 mb-8 text-sm">Acesse sua conta para continuar</p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-gray-700 text-sm font-medium">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500"
                      placeholder="seu@email.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-700 text-sm font-medium">Senha</Label>
                    <button
                      type="button"
                      onClick={() => { setResetEmail(email); setShowForgotPassword(true); }}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                      disabled={isLoading}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500"
                      placeholder="Sua senha"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-base disabled:opacity-50"
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-gray-400">ou</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => navigate('/register')}
                  className="w-full h-12 mt-6 border-emerald-300 text-emerald-600 hover:bg-emerald-50 font-semibold rounded-xl text-base"
                  disabled={isLoading}
                >
                  Criar conta grátis
                </Button>
              </div>
            </div>
          </div>

          {/* Footer padding */}
          <div className="p-6" />
        </div>
      </div>

      {/* Password Reset Modal */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="bg-white border-gray-200 sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-500" />
              Recuperar Senha
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Digite seu email para receber o link de recuperação de senha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Email</Label>
              <Input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="seu@email.com"
                className="h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                disabled={resetLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowForgotPassword(false)}
                className="flex-1 h-11 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl"
                disabled={resetLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePasswordReset}
                disabled={resetLoading || !resetEmail}
                className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
              >
                {resetLoading ? 'Enviando...' : 'Enviar Link'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Login;
