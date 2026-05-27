import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, Clock, CheckCircle, Truck, XCircle, 
  ArrowLeft, ShoppingBag, AlertCircle, CreditCard, 
  MapPin, Calendar, Copy, ExternalLink, Phone, Mail,
  Star, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { useShopConfig } from '@/hooks/useShopConfig';
import { useShopOrderById } from '@/hooks/useShopOrders';
import { ShopHeader } from '@/components/shop/public/ShopHeader';
import { ShopFooter } from '@/components/shop/public/ShopFooter';
import { ShopBottomNav } from '@/components/shop/mobile/ShopBottomNav';
import { ProductReviewForm } from '@/components/shop/public/ProductReviewForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const ORDER_STATUS_CONFIG: Record<string, {
  label: string;
  icon: typeof Package;
  color: string;
  bgColor: string;
  step: number;
}> = {
  'rascunho': { label: 'Rascunho', icon: AlertCircle, color: '#6B7280', bgColor: '#F3F4F6', step: 0 },
  'aguardando_pagamento': { label: 'Aguardando Pagamento', icon: CreditCard, color: '#F59E0B', bgColor: '#FEF3C7', step: 1 },
  'pago': { label: 'Pagamento Confirmado', icon: CheckCircle, color: '#10B981', bgColor: '#D1FAE5', step: 2 },
  'em_preparacao': { label: 'Em Preparação', icon: Package, color: '#3B82F6', bgColor: '#DBEAFE', step: 3 },
  'enviado': { label: 'Enviado', icon: Truck, color: '#8B5CF6', bgColor: '#EDE9FE', step: 4 },
  'entregue': { label: 'Entregue', icon: CheckCircle, color: '#10B981', bgColor: '#D1FAE5', step: 5 },
  'cancelado': { label: 'Cancelado', icon: XCircle, color: '#EF4444', bgColor: '#FEE2E2', step: -1 },
};

function OrderTimeline({ status, primaryColor }: { status: string; primaryColor: string }) {
  const currentStep = ORDER_STATUS_CONFIG[status]?.step || 0;
  
  if (status === 'cancelado') {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 text-red-500">
          <XCircle className="w-5 h-5" />
          <span className="font-medium">Pedido Cancelado</span>
        </div>
      </div>
    );
  }

  const steps = [
    { step: 1, label: 'Pedido Recebido', icon: ShoppingBag, description: 'Seu pedido foi registrado' },
    { step: 2, label: 'Pagamento Confirmado', icon: CreditCard, description: 'Pagamento processado' },
    { step: 3, label: 'Em Preparação', icon: Package, description: 'Preparando seu pedido' },
    { step: 4, label: 'Enviado', icon: Truck, description: 'A caminho do destino' },
    { step: 5, label: 'Entregue', icon: CheckCircle, description: 'Pedido entregue' },
  ];

  return (
    <div className="space-y-4">
      {steps.map((item, index) => {
        const isCompleted = currentStep >= item.step;
        const isCurrent = currentStep === item.step || (currentStep === 0 && item.step === 1);
        const StepIcon = item.icon;
        
        return (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isCompleted ? 'text-white' : 'bg-gray-200 text-gray-400'
                }`}
                style={{ 
                  backgroundColor: isCompleted ? primaryColor : undefined 
                }}
              >
                <StepIcon className="w-5 h-5" />
              </div>
              {index < steps.length - 1 && (
                <div 
                  className={`w-0.5 h-12 mt-2 ${isCompleted ? '' : 'bg-gray-200'}`}
                  style={{ backgroundColor: isCompleted ? primaryColor : undefined }}
                />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                {item.label}
              </p>
              <p className={`text-sm ${isCompleted ? 'text-gray-500' : 'text-gray-300'}`}>
                {item.description}
              </p>
              {isCurrent && (
                <span 
                  className="inline-block text-xs px-2 py-1 rounded-full mt-2 text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Status atual
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ShopOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, shopUser } = useShopAuth();
  const { data: config } = useShopConfig();
  const { data: order, isLoading } = useShopOrderById(orderId || '');

  const primaryColor = config?.colors?.primary || '#10B981';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/shop/account');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 light" data-theme="light">
        <ShopHeader />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
            <div className="h-48 bg-gray-200 rounded-2xl" />
          </div>
        </div>
        <ShopBottomNav />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 light" data-theme="light">
        <ShopHeader />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Package className="w-16 h-16 text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Pedido não encontrado</h1>
          <Button onClick={() => navigate('/shop/orders')}>
            Voltar aos pedidos
          </Button>
        </div>
        <ShopBottomNav />
      </div>
    );
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG['rascunho'];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50 light" data-theme="light">
      <ShopHeader />
      
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl text-gray-700 hover:bg-gray-100"
            onClick={() => navigate('/shop/orders')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                Pedido #{order.order_number || order.id.slice(0, 8).toUpperCase()}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => copyToClipboard(order.order_number || order.id)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div 
          className="rounded-2xl p-6 mb-6"
          style={{ backgroundColor: statusConfig.bgColor }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${statusConfig.color}20` }}
            >
              <StatusIcon className="w-7 h-7" style={{ color: statusConfig.color }} />
            </div>
            <div>
              <p className="font-bold text-lg" style={{ color: statusConfig.color }}>
                {statusConfig.label}
              </p>
              <p className="text-sm text-gray-600">
                Última atualização: {format(new Date(order.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        {/* Tracking Code */}
        {order.tracking_code && (
          <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Código de Rastreio</p>
                  <p className="font-bold text-blue-800">{order.tracking_code}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-600 hover:bg-blue-100"
                onClick={() => copyToClipboard(order.tracking_code!)}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copiar
              </Button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Timeline */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Acompanhamento</h2>
            <OrderTimeline status={order.status} primaryColor={primaryColor} />
          </div>

          {/* Order Details */}
          <div className="space-y-6">
            {/* Items */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">Itens do Pedido</h2>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qtd: {item.quantity} × {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-bold text-gray-900">
                      {formatCurrency(item.total_price)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.shipping_cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Frete</span>
                    <span className="text-gray-900">{formatCurrency(order.shipping_cost)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Desconto</span>
                    <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-lg" style={{ color: primaryColor }}>
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">Dados do Cliente</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-gray-900">{order.customer_email}</p>
                  </div>
                </div>
                {order.customer_phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Telefone</p>
                      <p className="text-gray-900">{order.customer_phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Review Section - Only for delivered orders */}
        {order.status === 'entregue' && shopUser && (
          <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <h2 className="font-bold text-gray-900">Avalie seus produtos</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Sua opinião é muito importante! Avalie os produtos que você recebeu.
            </p>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <ProductReviewForm
                  key={index}
                  productId={item.product_id}
                  orderId={order.id}
                  userId={shopUser.id}
                  productName={item.product_name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-2">Precisa de ajuda?</h2>
          <p className="text-sm text-gray-500 mb-4">
            Entre em contato conosco se tiver alguma dúvida sobre seu pedido.
          </p>
          <Button 
            variant="outline"
            onClick={() => navigate('/shop/faq')}
          >
            Central de Ajuda
          </Button>
        </div>
      </main>

      <ShopFooter />
      <ShopBottomNav />
    </div>
  );
}
