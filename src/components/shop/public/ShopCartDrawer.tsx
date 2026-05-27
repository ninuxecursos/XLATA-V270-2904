import { Minus, Plus, Trash2, ShoppingBag, ShoppingCart, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { useShopCart } from '@/hooks/useShopCart';
import { useShopConfig } from '@/hooks/useShopConfig';
import { ShopCheckout } from './ShopCheckout';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ShopCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShopCartDrawer({ isOpen, onClose }: ShopCartDrawerProps) {
  const { items, updateQuantity, removeItem, totalPrice } = useShopCart();
  const { data: config } = useShopConfig();
  const [showCheckout, setShowCheckout] = useState(false);
  const isMobile = useIsMobile();

  const primaryColor = config?.colors?.primary || '#10B981';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (showCheckout) {
    return (
      <ShopCheckout 
        isOpen={isOpen} 
        onClose={() => {
          setShowCheckout(false);
          onClose();
        }}
        onBack={() => setShowCheckout(false)}
      />
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        hideCloseButton 
        side={isMobile ? "top" : "right"}
        className={cn(
          "flex flex-col p-0 bg-white shadow-2xl",
          isMobile ? "w-full max-h-[90dvh] rounded-b-2xl border-b" : "w-full sm:max-w-md border-l"
        )}
      >
        {/* Header temático */}
        <div 
          className="flex items-center justify-between px-4 py-4 border-b"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Meu Carrinho
              </h2>
              <p className="text-sm text-white/80">
                {items.length} {items.length === 1 ? 'item' : 'itens'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 rounded-xl bg-white/20 hover:bg-white/30 text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
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
              onClick={onClose}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continuar Comprando
            </Button>
          </div>
        ) : (
          <>
            {/* Items List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {items.map((item) => (
                  <div 
                    key={item.productId} 
                    className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    {/* Image */}
                    <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <ShoppingBag className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">
                        {item.name}
                      </h4>
                      <p 
                        className="font-bold text-base mt-1"
                        style={{ color: primaryColor }}
                      >
                        {formatCurrency(item.price)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-l-lg rounded-r-none"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-semibold text-gray-900 text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-r-lg rounded-l-none"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg ml-auto"
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t bg-gray-50 p-4 space-y-4">
              {/* Summary */}
              <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Frete</span>
                  <span className="text-gray-500 text-xs">Calculado no checkout</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span 
                      className="text-xl font-bold"
                      style={{ color: primaryColor }}
                    >
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button 
                  className="w-full h-12 text-white font-semibold text-base rounded-xl"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => setShowCheckout(true)}
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
                
                <Button 
                  variant="outline"
                  className="w-full h-11 font-medium rounded-xl border-gray-300 text-gray-700 hover:bg-gray-100"
                  onClick={onClose}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Continuar Comprando
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
