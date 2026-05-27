import { User, ShoppingBag, MapPin, Heart, Settings, LogOut, X, ChevronRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { useShopConfig } from '@/hooks/useShopConfig';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';

interface ShopProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  shopUserName?: string;
  onAuthClick: (defaultTab?: 'login' | 'register') => void;
  onLogout: () => void;
  onOrdersClick?: () => void;
}

export function ShopProfileModal({ 
  isOpen, 
  onClose, 
  isAuthenticated,
  shopUserName,
  onAuthClick,
  onLogout,
  onOrdersClick
}: ShopProfileModalProps) {
  const navigate = useNavigate();
  const { data: config } = useShopConfig();
  const primaryColor = config?.colors?.primary || '#10B981';
  const storeName = config?.store_name || 'Loja';

  const menuItems = [
    {
      icon: Package,
      label: 'Meus Pedidos',
      description: 'Acompanhe seus pedidos',
      onClick: () => {
        navigate('/shop/orders');
        onClose();
      }
    },
    {
      icon: Heart,
      label: 'Favoritos',
      description: 'Produtos salvos',
      onClick: () => onClose()
    },
    {
      icon: MapPin,
      label: 'Endereços',
      description: 'Gerencie seus endereços',
      onClick: () => onClose()
    },
    {
      icon: Settings,
      label: 'Configurações',
      description: 'Preferências da conta',
      onClick: () => {
        navigate('/shop/account');
        onClose();
      }
    },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[85dvh] rounded-t-3xl p-0 bg-white border-t-0 shadow-2xl md:hidden"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header com avatar */}
        <div 
          className="px-5 py-6"
          style={{ backgroundColor: `${primaryColor}10` }}
        >
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {shopUserName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  Olá, {shopUserName}
                </h2>
                <p className="text-sm text-gray-500">
                  Bem-vindo(a) de volta!
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-xl hover:bg-gray-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gray-200"
                >
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Olá, visitante
                  </h2>
                  <p className="text-sm text-gray-500">
                    Entre ou cadastre-se
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-xl hover:bg-gray-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 h-[calc(85dvh-180px)]">
          <div className="px-5 py-4">
            {isAuthenticated ? (
              <>
                {/* Menu Items */}
                <div className="space-y-2">
                  {menuItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={item.onClick}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <item.icon className="w-5 h-5" style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                </div>

                {/* Logout Button */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
                      <LogOut className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-red-600">Sair da conta</p>
                      <p className="text-sm text-red-400">Encerrar sessão</p>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Login/Register Buttons */}
                <div className="space-y-3">
                  <Button
                    className="w-full h-14 text-base font-semibold rounded-2xl text-white shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => {
                      onAuthClick('login');
                      onClose();
                    }}
                  >
                    <User className="w-5 h-5 mr-2" />
                    Entrar na minha conta
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full h-14 text-base font-semibold rounded-2xl bg-transparent"
                    style={{ 
                      borderColor: primaryColor, 
                      color: primaryColor,
                      borderWidth: '2px'
                    }}
                    onClick={() => {
                      onAuthClick('register');
                      onClose();
                    }}
                  >
                    Criar uma conta
                  </Button>
                </div>

                {/* Benefícios */}
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">
                    Vantagens de ter uma conta
                  </h3>
                  <div className="space-y-3">
                    {[
                      { icon: Package, text: 'Acompanhe seus pedidos' },
                      { icon: Heart, text: 'Salve seus produtos favoritos' },
                      { icon: ShoppingBag, text: 'Compras mais rápidas' },
                    ].map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                        <benefit.icon className="w-5 h-5" style={{ color: primaryColor }} />
                        <span className="text-sm text-gray-700">{benefit.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer com logo da loja */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <span>Loja</span>
            <span className="font-semibold" style={{ color: primaryColor }}>
              {storeName}
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
