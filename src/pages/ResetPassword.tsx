import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import LoginLogo from '@/components/LoginLogo';
import { SEOHead } from '@/components/portal/SEOHead';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user has a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setHasSession(true);
      } else {
        console.log('❌ No session found - invalid or expired reset link');
      }
      setChecking(false);
    };

    // Listen for auth state changes (when user clicks reset link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setHasSession(true);
        setChecking(false);
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return "A senha deve ter pelo menos 8 caracteres";
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      return "A senha deve conter letras minúsculas";
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      return "A senha deve conter letras maiúsculas";
    }
    if (!/(?=.*\d)/.test(pwd)) {
      return "A senha deve conter números";
    }
    return null;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validatePassword(password);
    if (validationError) {
      toast({
        title: "❌ Senha inválida",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "❌ Senhas não coincidem",
        description: "As senhas digitadas são diferentes.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "✅ Senha alterada!",
        description: "Sua senha foi redefinida com sucesso."
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: "❌ Erro",
        description: error.message || "Não foi possível redefinir a senha.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>Verificando link de recuperação...</p>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <Card className="bg-gray-800/90 border-gray-700 max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-white text-xl font-bold mb-2">Link Inválido ou Expirado</h2>
            <p className="text-gray-400 mb-6">
              Este link de recuperação de senha é inválido ou já expirou. 
              Por favor, solicite um novo link na página de login.
            </p>
            <Button 
              onClick={() => navigate('/login')}
              className="bg-green-600 hover:bg-green-700"
            >
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <Card className="bg-gray-800/90 border-gray-700 max-w-md w-full">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">Senha Alterada!</h2>
            <p className="text-gray-400 mb-4">
              Sua senha foi redefinida com sucesso. Você será redirecionado para o login...
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Redefinir Senha - XLata"
        description="Redefina sua senha do XLata"
        allowIndexing={false}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <LoginLogo />
            <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <KeyRound className="h-6 w-6 text-cyan-400" />
              Redefinir Senha
            </h1>
            <p className="text-gray-400">Digite sua nova senha abaixo</p>
          </div>

          <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-center">Nova Senha</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-900 border-gray-600 text-white pr-10"
                      placeholder="Min. 8 caracteres (A-Z, a-z, 0-9)"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-gray-500 text-xs">
                    A senha deve conter: letras maiúsculas, minúsculas e números
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-gray-900 border-gray-600 text-white pr-10"
                      placeholder="Repita a nova senha"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !password || !confirmPassword}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
                >
                  {isLoading ? "🔄 Redefinindo..." : "Redefinir Senha"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Button
                  variant="link"
                  onClick={() => navigate('/login')}
                  className="text-gray-400 hover:text-gray-300"
                >
                  Voltar para Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
