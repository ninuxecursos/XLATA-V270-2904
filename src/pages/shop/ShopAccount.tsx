import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Package, ShoppingBag, Settings, MapPin, Heart, 
  ChevronRight, LogOut, Edit2, Bell, Shield, HelpCircle,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { useShopConfig } from '@/hooks/useShopConfig';
import { useShopOrders } from '@/hooks/useShopOrders';
import { useFavoritesCount } from '@/hooks/useShopFavorites';
import { ShopHeader } from '@/components/shop/public/ShopHeader';
import { ShopFooter } from '@/components/shop/public/ShopFooter';
import { ShopBottomNav } from '@/components/shop/mobile/ShopBottomNav';

export default function ShopAccount() {
  const navigate = useNavigate();
  const { shopUser, isAuthenticated, logout } = useShopAuth();
  const { data: config } = useShopConfig();
  const { data: orders = [] } = useShopOrders(shopUser?.id);
  const { data: favoritesCount = 0 } = useFavoritesCount(shopUser?.id);

  const primaryColor = config?.colors?.primary || '#10B981';

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 light" data-theme="light">
        <ShopHeader />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <User className="w-12 h-12" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesse sua conta</h1>
          <p className="text-gray-500 mb-6 text-center">
            Faça login para ver seus pedidos e configurações
          </p>
          <Button 
            className="text-white px-8"
            style={{ backgroundColor: primaryColor }}
            onClick={() => navigate('/shop')}
          >
            Fazer Login
          </Button>
        </div>
        <ShopBottomNav />
      </div>
    );
  }

  const pendingOrders = orders.filter(o => 
    ['rascunho', 'aguardando_pagamento', 'pago', 'em_preparacao'].includes(o.status)
  ).length;

  const menuSections = [
    {
      title: 'Meus Pedidos',
      items: [
        {
          icon: Package,
          label: 'Meus Pedidos',
          description: 'Acompanhe seus pedidos',
          badge: pendingOrders > 0 ? `${pendingOrders} em andamento` : undefined,
          link: '/shop/orders'
        },
        {
          icon: Heart,
          label: 'Favoritos',
          description: 'Produtos salvos',
          link: '/shop/account/favorites'
        },
      ]
    },
    {
      title: 'Configurações',
      items: [
        {
          icon: User,
          label: 'Dados Pessoais',
          description: 'Nome, email e telefone',
          link: '/shop/account/profile'
        },
        {
          icon: MapPin,
          label: 'Endereços',
          description: 'Gerencie seus endereços',
          link: '/shop/account/addresses'
        },
        {
          icon: Bell,
          label: 'Notificações',
          description: 'Preferências de avisos',
          link: '/shop/account/notifications'
        },
        {
          icon: Shield,
          label: 'Segurança',
          description: 'Senha e autenticação',
          link: '/shop/account/security'
        },
      ]
    },
    {
      title: 'Ajuda',
      items: [
        {
          icon: HelpCircle,
          label: 'Central de Ajuda',
          description: 'Dúvidas frequentes',
          link: '/shop/faq'
        },
        {
          icon: ShoppingBag,
          label: 'Como Comprar',
          description: 'Passo a passo',
          link: '/shop/how-to-buy'
        },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 light" data-theme="light">
      <ShopHeader />
      
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-8">
        {/* Header com voltar */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl text-gray-700 hover:bg-gray-100"
            onClick={() => navigate('/shop')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Minha Conta</h1>
        </div>

        {/* Profile Card */}
        <div 
          className="rounded-2xl p-6 mb-6 text-white"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` 
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
              {shopUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{shopUser?.name}</h2>
              <p className="text-white/80 text-sm">{shopUser?.email}</p>
              {shopUser?.phone && (
                <p className="text-white/70 text-xs mt-1">{shopUser.phone}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl bg-white/20 hover:bg-white/30 text-white"
              onClick={() => navigate('/shop/account/profile')}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="text-center">
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-xs text-white/70">Pedidos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{pendingOrders}</p>
              <p className="text-xs text-white/70">Em andamento</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{favoritesCount}</p>
              <p className="text-xs text-white/70">Favoritos</p>
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        <div className="space-y-6">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
                {section.title}
              </h3>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {section.items.map((item, itemIndex) => (
                  <Link
                    key={itemIndex}
                    to={item.link}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{item.label}</p>
                        {item.badge && (
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div className="mt-8">
          <button
            onClick={() => {
              logout();
              navigate('/shop');
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition-colors border border-red-100"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-100">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-red-600">Sair da conta</p>
              <p className="text-sm text-red-400">Encerrar sessão</p>
            </div>
          </button>
        </div>

        {/* Store info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Loja <span style={{ color: primaryColor }} className="font-semibold">{config?.store_name || 'XLata'}</span>
          </p>
        </div>
      </main>

      <ShopFooter />
      <ShopBottomNav />
    </div>
  );
}
