import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShopHeader } from '@/components/shop/public/ShopHeader';
import { ShopFooter } from '@/components/shop/public/ShopFooter';
import { ShopBottomNav } from '@/components/shop/mobile/ShopBottomNav';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { useShopConfig } from '@/hooks/useShopConfig';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ShopAccountSecurity() {
  const navigate = useNavigate();
  const { shopUser, isAuthenticated, logout } = useShopAuth();
  const { data: config } = useShopConfig();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const primaryColor = config?.colors?.primary || '#10B981';

  if (!isAuthenticated) {
    navigate('/shop/account');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopUser?.email) return;
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsLoading(true);
    try {
      // Primeiro validar a senha atual
      const { data: authResult } = await supabase.rpc('shop_user_authenticate', {
        p_email: shopUser.email,
        p_password: formData.currentPassword
      });

      if (!authResult || authResult.length === 0) {
        toast.error('Senha atual incorreta');
        setIsLoading(false);
        return;
      }

      // Atualizar a senha
      const { error } = await supabase.rpc('shop_user_update_password', {
        p_user_id: shopUser.id,
        p_old_password: formData.currentPassword,
        p_new_password: formData.newPassword
      });

      if (error) throw error;
      
      toast.success('Senha alterada com sucesso!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 light" data-theme="light">
      <ShopHeader />
      
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl text-gray-700 hover:bg-gray-100"
            onClick={() => navigate('/shop/account')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Segurança</h1>
        </div>

        {/* Security Icon */}
        <div className="flex justify-center mb-8">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Shield className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Alterar Senha
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-gray-700">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="h-12 rounded-xl pr-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-700">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="h-12 rounded-xl pr-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-400">Mínimo de 6 caracteres</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="h-12 rounded-xl bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full h-12 rounded-xl text-white font-semibold"
            style={{ backgroundColor: primaryColor }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Alterando...
              </>
            ) : (
              'Alterar Senha'
            )}
          </Button>
        </form>

        {/* Sessão */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Sessão Ativa</h3>
          <p className="text-sm text-gray-500 mb-4">
            Caso suspeite de atividade irregular, encerre todas as sessões.
          </p>
          <Button
            variant="outline"
            className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => {
              logout();
              navigate('/shop');
              toast.success('Você foi desconectado');
            }}
          >
            Encerrar Sessão
          </Button>
        </div>
      </main>

      <ShopFooter />
      <ShopBottomNav />
    </div>
  );
}
