declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, ArrowLeft, User, Mail, Lock, CheckCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { validateSupabaseConnection } from '@/utils/connectionValidator';
import EmailConfirmationModal from '@/components/EmailConfirmationModal';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/portal/SEOHead';
import { motion, AnimatePresence } from 'framer-motion';

interface ReferralInfo {
  name: string;
}

const TOTAL_STEPS = 4;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const referralKey = searchParams.get('ref');

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirmationModal, setShowEmailConfirmationModal] = useState(false);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);

  useEffect(() => {
    if (referralKey) {
      checkReferralKey(referralKey);
    }
  }, [referralKey]);

  const checkReferralKey = async (refKey: string) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('ref_key', refKey)
        .single();

      if (error || !data) {
        const { data: dataById, error: errorById } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('id', refKey)
          .single();
        if (!errorById && dataById) {
          data = dataById;
          error = null;
        }
      }

      if (!error && data) {
        setReferralInfo(data);
        toast({
          title: "Link de indicação detectado!",
          description: `Você foi indicado por ${data.name}.`,
        });
      }
    } catch (error) {
      console.error('Erro ao verificar chave de referência:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canAdvance = () => {
    switch (step) {
      case 1: return formData.name.trim().length >= 2;
      case 2: return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      case 3: return formData.password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password) && formData.password === formData.confirmPassword;
      case 4: return acceptTerms;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS && canAdvance()) {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
    else navigate('/landing');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canAdvance()) {
      e.preventDefault();
      if (step < TOTAL_STEPS) handleNext();
      else handleRegister();
    }
  };

  const handleRegister = async () => {
    if (!canAdvance()) return;
    setIsLoading(true);

    try {
      const connectionStatus = await validateSupabaseConnection();
      if (!connectionStatus.isConnected) {
        toast({ title: "Servidor offline", description: "Não foi possível conectar ao servidor. Tente novamente.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const result = await signUp(formData.email, formData.password, {
        name: formData.name,
        whatsapp: '',
        indicador_id: referralKey || null
      });

      if (result.error) {
        toast({ title: "Erro no cadastro", description: result.error.message || "Erro inesperado. Tente novamente.", variant: "destructive" });
      } else if (result.data?.user) {
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          window.gtag('event', 'conversion', {
            send_to: 'AW-17214693640/k7iUCJTo1-saEIjCzZBA'
          });
        }
        setShowEmailConfirmationModal(true);
        if (referralKey && referralInfo) {
          toast({ title: "Cadastro realizado!", description: `Sua conta foi vinculada à indicação de ${referralInfo.name}.` });
        }
      } else {
        toast({ title: "Email já cadastrado", description: "Este email já está cadastrado. Tente fazer login.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Erro crítico", description: "Falha na comunicação com o servidor.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailConfirmationClose = () => {
    setShowEmailConfirmationModal(false);
    navigate('/login');
  };

  const progressPercent = (step / TOTAL_STEPS) * 100;

  const stepConfig = [
    { label: 'Qual seu nome?', hint: 'Vamos começar pelo básico 👋', icon: User },
    { label: 'Qual seu e-mail?', hint: 'Para acessar sua conta 📧', icon: Mail },
    { label: 'Crie uma senha segura', hint: 'Mínimo 8 caracteres com maiúscula, minúscula e número 🔒', icon: Lock },
    { label: 'Quase lá!', hint: 'Aceite os termos para finalizar ✅', icon: CheckCircle },
  ];

  const current = stepConfig[step - 1];

  return (
    <>
      <SEOHead
        title="Criar Conta - XLata"
        description="Crie sua conta no XLata e comece seu teste grátis de 7 dias."
        allowIndexing={false}
      />
      <div className="min-h-screen flex">
        <AuthBrandPanel
          title="Comece agora!"
          subtitle="Crie sua conta e controle seus fiados de forma prática e organizada."
        />

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col min-h-screen">
          {/* Mobile green header */}
          <div className="lg:hidden bg-emerald-500 px-4 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
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
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>

          {/* Form content */}
          <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16">
            <div className="w-full max-w-md" onKeyDown={handleKeyDown}>
              {/* Progress */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Passo {step} de {TOTAL_STEPS}</span>
                  <span className="text-sm text-gray-500">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2 bg-gray-100" />
              </div>

              {referralInfo && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6">
                  <p className="text-emerald-700 text-sm text-center">
                    ✨ Indicado por <strong>{referralInfo.name}</strong>
                  </p>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{current.label}</h1>
                  <p className="text-gray-500 mb-6 text-sm">{current.hint}</p>

                  {/* Step 1 - Nome */}
                  {step === 1 && (
                    <div className="space-y-2">
                      <Label className="text-gray-700 text-sm font-medium">Seu nome</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="pl-10 h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500"
                          placeholder="João da Silva"
                          autoFocus
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2 - Email */}
                  {step === 2 && (
                    <div className="space-y-2">
                      <Label className="text-gray-700 text-sm font-medium">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="pl-10 h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500"
                          placeholder="seu@email.com"
                          autoFocus
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 3 - Senha */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-gray-700 text-sm font-medium">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500"
                            placeholder="Min. 8 caracteres"
                            autoFocus
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
                        {/* Password hints */}
                        {formData.password.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <PasswordHint ok={formData.password.length >= 8} text="8+ caracteres" />
                            <PasswordHint ok={/[A-Z]/.test(formData.password)} text="Letra maiúscula" />
                            <PasswordHint ok={/[a-z]/.test(formData.password)} text="Letra minúscula" />
                            <PasswordHint ok={/\d/.test(formData.password)} text="Número" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 text-sm font-medium">Confirmar senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500"
                            placeholder="Repita a senha"
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
                          <p className="text-red-500 text-xs">As senhas não coincidem</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 4 - Terms */}
                  {step === 4 && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="text-sm text-gray-600 space-y-2">
                          <p><strong>Resumo da sua conta:</strong></p>
                          <p>👤 {formData.name}</p>
                          <p>📧 {formData.email}</p>
                          <p>🎁 7 dias de teste grátis</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl">
                        <Checkbox
                          id="terms"
                          checked={acceptTerms}
                          onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                          disabled={isLoading}
                          className="mt-0.5 border-gray-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        />
                        <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
                          Aceito os{' '}
                          <button
                            type="button"
                            onClick={() => navigate('/termos-de-uso')}
                            className="text-emerald-600 hover:text-emerald-700 underline font-medium"
                          >
                            Termos de Uso e Condições
                          </button>{' '}
                          do sistema XLata.
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-8 space-y-3">
                    {step < TOTAL_STEPS ? (
                      <Button
                        onClick={handleNext}
                        disabled={!canAdvance() || isLoading}
                        className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-base disabled:opacity-40"
                      >
                        Continuar
                      </Button>
                    ) : (
                      <Button
                        onClick={handleRegister}
                        disabled={!canAdvance() || isLoading}
                        className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-base disabled:opacity-40"
                      >
                        {isLoading ? "Criando conta..." : "Criar Conta"}
                      </Button>
                    )}

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
                      onClick={() => navigate('/login')}
                      className="w-full h-12 border-emerald-300 text-emerald-600 hover:bg-emerald-50 font-semibold rounded-xl text-base"
                      disabled={isLoading}
                    >
                      Já tenho conta — Entrar
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 text-center">
            <p className="text-xs text-gray-400">7 dias grátis • Sem cartão de crédito</p>
          </div>
        </div>
      </div>

      <EmailConfirmationModal
        open={showEmailConfirmationModal}
        onClose={handleEmailConfirmationClose}
        email={formData.email}
      />
    </>
  );
};

const PasswordHint: React.FC<{ ok: boolean; text: string }> = ({ ok, text }) => (
  <div className="flex items-center gap-2 text-xs">
    <div className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-gray-300'}`} />
    <span className={ok ? 'text-emerald-600' : 'text-gray-400'}>{text}</span>
  </div>
);

export default Register;
