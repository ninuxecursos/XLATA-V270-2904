import { ArrowLeft, Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useShopCart } from '@/hooks/useShopCart';
import { useShopConfig } from '@/hooks/useShopConfig';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { ShopHeader } from '@/components/shop/public/ShopHeader';
import { ShopAuthModal } from '@/components/shop/public/ShopAuthModal';
import { useState } from 'react';

export default function ShopCart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, totalPrice } = useShopCart();
  const { data: config } = useShopConfig();
  const { isAuthenticated } = useShopAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const primaryColor = config?.colors?.primary || config?.primary_color || '#10B981';

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      navigate('/shop/checkout');
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    navigate('/shop/checkout');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <ShopHeader />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/shop')}
            className="h-10 w-10 rounded-xl text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <ShoppingCart className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Meu Carrinho</h1>
              <p className="text-sm text-gray-500">
                {items.length} {items.length === 1 ? 'item' : 'itens'}
              </p>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <ShoppingBag className="w-12 h-12" style={{ color: primaryColor }} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Seu carrinho está vazio
            </h3>
            <p className="text-gray-500 mb-8">
              Explore nossa loja e adicione produtos incríveis!
            </p>
            <Button 
              className="text-white px-8 py-3 h-auto rounded-xl font-semibold"
              style={{ backgroundColor: primaryColor }}
              onClick={() => navigate('/shop')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continuar Comprando
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div 
                  key={item.productId} 
                  className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
                >
                  {/* Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 line-clamp-2">
                      {item.name}
                    </h4>
                    <p 
                      className="font-bold text-lg mt-1"
                      style={{ color: primaryColor }}
                    >
                      {formatCurrency(item.price)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-l-lg rounded-r-none"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-10 text-center font-semibold text-gray-900">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-r-lg rounded-l-none"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg ml-auto"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Item Total (desktop) */}
                  <div className="hidden sm:flex flex-col items-end justify-center">
                    <span className="text-sm text-gray-500">Total</span>
                    <span 
                      className="text-lg font-bold"
                      style={{ color: primaryColor }}
                    >
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Continue Shopping */}
              <Button 
                variant="outline"
                className="w-full h-12 font-medium rounded-xl border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => navigate('/shop')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continuar Comprando
              </Button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm sticky top-4">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Resumo do Pedido</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({items.reduce((sum, i) => sum + i.quantity, 0)} itens)</span>
                    <span className="font-medium text-gray-900">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Frete</span>
                    <span className="text-gray-500 text-xs">Calculado no checkout</span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">Total</span>
                      <span 
                        className="text-2xl font-bold"
                        style={{ color: primaryColor }}
                      >
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full h-12 text-white font-semibold text-base rounded-xl mt-6"
                  style={{ backgroundColor: primaryColor }}
                  onClick={handleCheckout}
                  disabled={!config?.is_open}
                >
                  {config?.is_open ? (
                    <>
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Finalizar Pedido
                    </>
                  ) : (
                    'Loja Fechada'
                  )}
                </Button>

                {!config?.is_open && (
                  <p className="text-center text-sm text-amber-600 mt-2">
                    A loja está fechada no momento
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <ShopAuthModal 
        isOpen={showAuthModal} 
        onClose={() => {
          setShowAuthModal(false);
        }}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
