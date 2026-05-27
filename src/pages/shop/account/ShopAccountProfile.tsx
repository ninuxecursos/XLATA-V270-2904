import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Loader2 } from 'lucide-react';
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
import { formatPhone } from '@/lib/validations/checkout';

export default function ShopAccountProfile() {
  const navigate = useNavigate();
  const { shopUser, isAuthenticated } = useShopAuth();
  const { data: config } = useShopConfig();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const primaryColor = config?.colors?.primary || '#10B981';

  useEffect(() => {
    if (shopUser) {
      setFormData({
        name: shopUser.name || '',
        email: shopUser.email || '',
        phone: shopUser.phone || ''
      });
    }
  }, [shopUser]);

  if (!isAuthenticated) {
    navigate('/shop/account');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopUser?.id) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('shop_users')
        .update({
          name: formData.name,
          phone: formData.phone || null
        })
        .eq('id', shopUser.id);

      if (error) throw error;
      
      toast.success('Dados atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar dados');
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
          <h1 className="text-xl font-bold text-gray-900">Dados Pessoais</h1>
        </div>

        {/* Profile Icon */}
        <div className="flex justify-center mb-8">
          <div 
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {shopUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome Completo
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="h-12 rounded-xl bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                placeholder="Seu nome"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="h-12 rounded-xl bg-gray-100 border-gray-300 text-gray-500"
              />
              <p className="text-xs text-gray-400">O email não pode ser alterado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  phone: formatPhone(e.target.value)
                }))}
                className="h-12 rounded-xl bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                placeholder="(11) 99999-9999"
                maxLength={15}
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
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </form>
      </main>

      <ShopFooter />
      <ShopBottomNav />
    </div>
  );
}
