import { useState, useCallback, useEffect } from 'react';
import { Mail, Lock, User, Phone, Loader2, X, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { useShopConfig } from '@/hooks/useShopConfig';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ShopAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultTab?: 'login' | 'register';
}

// Máscara de telefone brasileiro: (11) 99999-9999
const formatPhoneBR = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  const limited = numbers.slice(0, 11);
  if (limited.length === 0) return '';
  if (limited.length <= 2) return `(${limited}`;
  if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
};

const REGISTER_STEPS = 4;

const PasswordHint = ({ ok, text }: { ok: boolean; text: string }) => (
  <div className="flex items-center gap-2 text-xs">
    <div className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-gray-300'}`} />
    <span className={ok ? 'text-emerald-600' : 'text-gray-400'}>{text}</span>
  </div>
);

export function ShopAuthModal({ isOpen, onClose, onSuccess, defaultTab = 'login' }: ShopAuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login state
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Register state - step by step
  const [registerStep, setRegisterStep] = useState(1);
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  const { login, register } = useShopAuth();
  const { data: config } = useShopConfig();

  // Sync tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setRegisterStep(1);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, defaultTab]);

  // Phone mask handler
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneBR(e.target.value);
    setRegisterData(prev => ({ ...prev, phone: formatted }));
  }, []);

  // Register step validation
  const canAdvanceRegister = () => {
    switch (registerStep) {
      case 1: return registerData.name.trim().length >= 2;
      case 2: return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email);
      case 3:
        return registerData.password.length >= 6 &&
          registerData.password === registerData.confirmPassword;
      case 4:
        return registerData.phone.replace(/\D/g, '').length >= 10;
      default: return false;
    }
  };

  const handleRegisterNext = () => {
    if (registerStep < REGISTER_STEPS && canAdvanceRegister()) {
      setRegisterStep(s => s + 1);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  };

  const handleRegisterBack = () => {
    if (registerStep > 1) {
      setRegisterStep(s => s - 1);
    } else {
      setActiveTab('login');
    }
  };

  const handleRegisterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canAdvanceRegister()) {
      e.preventDefault();
      if (registerStep < REGISTER_STEPS) handleRegisterNext();
      else handleRegister();
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast.error('Preencha todos os campos');
      return;
    }
    setIsLoading(true);
    const success = await login(loginData.email, loginData.password);
    if (success) {
      toast.success('Login realizado com sucesso!');
      onClose();
      setLoginData({ email: '', password: '' });
      onSuccess?.();
    } else {
      toast.error('Email ou senha incorretos');
    }
    setIsLoading(false);
  };

  // Register handler
  const handleRegister = async () => {
    if (!canAdvanceRegister()) return;
    setIsLoading(true);
    const success = await register(
      registerData.email,
      registerData.password,
      registerData.name,
      registerData.phone || undefined
    );
    if (success) {
      toast.success('Conta criada com sucesso!');
      onClose();
      setRegisterData({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
      setRegisterStep(1);
      onSuccess?.();
    } else {
      toast.error('Erro ao criar conta. Tente novamente.');
    }
    setIsLoading(false);
  };

  const switchToRegister = () => {
    setActiveTab('register');
    setRegisterStep(1);
  };

  const progressPercent = (registerStep / REGISTER_STEPS) * 100;

  const stepConfig = [
    { label: 'Qual seu nome?', hint: 'Vamos começar pelo básico 👋', icon: User },
    { label: 'Qual seu e-mail?', hint: 'Para acessar sua conta 📧', icon: Mail },
    { label: 'Crie uma senha', hint: 'Mínimo 6 caracteres 🔒', icon: Lock },
    { label: 'Seu WhatsApp', hint: 'Para contato sobre pedidos 📱', icon: Phone },
  ];

  const currentStep = stepConfig[registerStep - 1];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="p-0 gap-0 max-w-[95vw] sm:max-w-md bg-white border-0 overflow-hidden rounded-2xl shadow-2xl">
        {/* Green header - matching main system */}
        <div className="relative bg-emerald-500 px-6 py-4 flex items-center justify-between">
          {activeTab === 'register' && registerStep > 1 ? (
            <Button
              variant="ghost"
              onClick={handleRegisterBack}
              className="text-white hover:text-white/80 -ml-2 p-2 h-auto"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-9" />
          )}

          {/* Logo */}
          {config?.store_logo ? (
            <img
              src={config.store_logo}
              alt={config?.store_name || 'Loja'}
              className="h-8 object-contain brightness-0 invert"
            />
          ) : (
            <span className="text-lg font-bold text-white">
              {config?.store_name || 'Loja XLata'}
            </span>
          )}

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Subtitle below header */}
        <div className="bg-emerald-500 px-6 pb-4 text-center">
          <h2 className="text-lg font-bold text-white">
            {config?.store_name || 'Loja XLata'}
          </h2>
          <p className="text-sm text-white/80 mt-0.5">
            {activeTab === 'login' ? 'Acesse sua conta' : currentStep.hint}
          </p>
        </div>

        {/* Content area */}
        <div className="p-5 sm:p-6 max-h-[65vh] overflow-y-auto" onKeyDown={activeTab === 'register' ? handleRegisterKeyDown : undefined}>
          {activeTab === 'login' ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Entrar</h1>
              <p className="text-gray-500 mb-6 text-sm">Acesse sua conta para continuar</p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-gray-700 text-sm font-medium">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10 h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 text-sm font-medium">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
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

              {/* Divider + Create account */}
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
                  onClick={switchToRegister}
                  className="w-full h-12 mt-6 border-emerald-300 text-emerald-600 hover:bg-emerald-50 font-semibold rounded-xl text-base"
                  disabled={isLoading}
                >
                  Criar conta grátis
                </Button>
              </div>
            </>
          ) : (
            /* Register - Step by step wizard */
            <>
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Passo {registerStep} de {REGISTER_STEPS}</span>
                  <span className="text-sm text-gray-500">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2 bg-gray-100" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={registerStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{currentStep.label}</h1>
                  <p className="text-gray-500 mb-6 text-sm">{currentStep.hint}</p>

                  {/* Step 1 - Name */}
                  {registerStep === 1 && (
                    <div className="space-y-2">
                      <Label className="text-gray-700 text-sm font-medium">Seu nome</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="text"
                          value={registerData.name}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                          className="pl-10 h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500"
                          placeholder="João da Silva"
                          autoFocus
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2 - Email */}
                  {registerStep === 2 && (
                    <div className="space-y-2">
                      <Label className="text-gray-700 text-sm font-medium">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="email"
                          value={registerData.email}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                          className="pl-10 h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500"
                          placeholder="seu@email.com"
                          autoFocus
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 3 - Password */}
                  {registerStep === 3 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-gray-700 text-sm font-medium">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={registerData.password}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                            className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500"
                            placeholder="Min. 6 caracteres"
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
                        {registerData.password.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <PasswordHint ok={registerData.password.length >= 6} text="6+ caracteres" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 text-sm font-medium">Confirmar senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
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
                        {registerData.confirmPassword.length > 0 && registerData.password !== registerData.confirmPassword && (
                          <p className="text-red-500 text-xs">As senhas não coincidem</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 4 - Phone + Summary */}
                  {registerStep === 4 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-gray-700 text-sm font-medium">WhatsApp</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            type="tel"
                            inputMode="numeric"
                            value={registerData.phone}
                            onChange={handlePhoneChange}
                            className="pl-10 h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl text-base focus:border-emerald-500 focus:ring-emerald-500"
                            placeholder="(11) 99999-9999"
                            maxLength={15}
                            autoFocus
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Resumo da conta:</p>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>👤 {registerData.name}</p>
                          <p>📧 {registerData.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-8 space-y-3">
                    {registerStep < REGISTER_STEPS ? (
                      <Button
                        onClick={handleRegisterNext}
                        disabled={!canAdvanceRegister() || isLoading}
                        className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-base disabled:opacity-40"
                      >
                        Continuar
                      </Button>
                    ) : (
                      <Button
                        onClick={handleRegister}
                        disabled={!canAdvanceRegister() || isLoading}
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
                      onClick={() => { setActiveTab('login'); setRegisterStep(1); }}
                      className="w-full h-12 border-emerald-300 text-emerald-600 hover:bg-emerald-50 font-semibold rounded-xl text-base"
                      disabled={isLoading}
                    >
                      Já tenho conta — Entrar
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Ao continuar, você concorda com nossos termos de uso.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
