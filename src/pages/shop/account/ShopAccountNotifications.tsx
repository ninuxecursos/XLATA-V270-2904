import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, Mail, MessageSquare, Tag, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ShopHeader } from '@/components/shop/public/ShopHeader';
import { ShopFooter } from '@/components/shop/public/ShopFooter';
import { ShopBottomNav } from '@/components/shop/mobile/ShopBottomNav';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { useShopConfig } from '@/hooks/useShopConfig';
import { toast } from 'sonner';

interface NotificationSetting {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
}

export default function ShopAccountNotifications() {
  const navigate = useNavigate();
  const { isAuthenticated } = useShopAuth();
  const { data: config } = useShopConfig();
  
  const primaryColor = config?.colors?.primary || '#10B981';
  
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'order_updates',
      icon: Package,
      label: 'Atualizações de Pedidos',
      description: 'Receber notificações sobre status dos pedidos',
      enabled: true
    },
    {
      id: 'promotions',
      icon: Tag,
      label: 'Promoções e Ofertas',
      description: 'Receber ofertas exclusivas e descontos',
      enabled: true
    },
    {
      id: 'email_marketing',
      icon: Mail,
      label: 'Email Marketing',
      description: 'Novidades e lançamentos por email',
      enabled: false
    },
    {
      id: 'whatsapp',
      icon: MessageSquare,
      label: 'WhatsApp',
      description: 'Receber mensagens via WhatsApp',
      enabled: false
    }
  ]);

  if (!isAuthenticated) {
    navigate('/shop/account');
    return null;
  }

  const handleToggle = (id: string) => {
    setSettings(prev => prev.map(setting => 
      setting.id === id 
        ? { ...setting, enabled: !setting.enabled }
        : setting
    ));
    toast.success('Preferência atualizada');
  };

  const allEnabled = settings.every(s => s.enabled);
  const allDisabled = settings.every(s => !s.enabled);

  return (
    <div className="min-h-screen bg-gray-50 light" data-theme="light">
      <ShopHeader />
      
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl"
            onClick={() => navigate('/shop/account')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Notificações</h1>
        </div>

        {/* Bell Icon */}
        <div className="flex justify-center mb-8">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            {allDisabled ? (
              <BellOff className="w-10 h-10 text-gray-400" />
            ) : (
              <Bell className="w-10 h-10" style={{ color: primaryColor }} />
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl"
            onClick={() => {
              setSettings(prev => prev.map(s => ({ ...s, enabled: true })));
              toast.success('Todas as notificações ativadas');
            }}
            disabled={allEnabled}
          >
            Ativar Todas
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl"
            onClick={() => {
              setSettings(prev => prev.map(s => ({ ...s, enabled: false })));
              toast.success('Todas as notificações desativadas');
            }}
            disabled={allDisabled}
          >
            Desativar Todas
          </Button>
        </div>

        {/* Settings List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {settings.map((setting, index) => (
            <div
              key={setting.id}
              className={`flex items-center gap-4 p-4 ${
                index < settings.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ 
                  backgroundColor: setting.enabled ? `${primaryColor}15` : '#F3F4F6'
                }}
              >
                <setting.icon 
                  className="w-5 h-5" 
                  style={{ 
                    color: setting.enabled ? primaryColor : '#9CA3AF'
                  }} 
                />
              </div>
              
              <div className="flex-1">
                <p className="font-medium text-gray-900">{setting.label}</p>
                <p className="text-sm text-gray-500">{setting.description}</p>
              </div>
              
              <Switch
                checked={setting.enabled}
                onCheckedChange={() => handleToggle(setting.id)}
              />
            </div>
          ))}
        </div>

        {/* Info */}
        <p className="text-xs text-gray-400 text-center mt-6">
          Você pode alterar suas preferências a qualquer momento.
          <br />
          Notificações importantes sobre pedidos serão sempre enviadas.
        </p>
      </main>

      <ShopFooter />
      <ShopBottomNav />
    </div>
  );
}
