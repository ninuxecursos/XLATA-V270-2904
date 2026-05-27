import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Star, Eye } from 'lucide-react';
import { useShopConfig } from '@/hooks/useShopConfig';

interface ShopMobileProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    sale_price?: number | null;
    images?: string[] | null;
    is_featured?: boolean;
    sale_type?: string;
    stock_quantity: number;
    condition?: 'novo' | 'usado' | 'no_estado' | null;
    sold_count?: number;
    view_count?: number;
  };
  isInteractive?: boolean;
  eventEndsAt?: string | null;
}

const conditionConfig = {
  novo: { label: 'Novo', color: 'bg-green-500' },
  usado: { label: 'Usado', color: 'bg-blue-500' },
  no_estado: { label: 'No Estado', color: 'bg-amber-500' }
};

export function ShopMobileProductCard({ product, isInteractive, eventEndsAt }: ShopMobileProductCardProps) {
  const { data: config } = useShopConfig();
  const primaryColor = config?.primary_color || '#10B981';
  
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.sale_price! / product.price) * 100)
    : 0;

  const displayPrice = hasDiscount ? product.sale_price! : product.price;
  
  // Calculate installment (10x sem juros)
  const installmentValue = product.price / 10;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const imageUrl = product.images?.[0] || '/placeholder.svg';

  return (
    <Link 
      to={`/shop/${product.slug}`}
      className={`
        block bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 
        shop-touch-active hover:shadow-md transition-shadow
        ${isInteractive ? 'ring-1 ring-purple-300' : ''}
      `}
    >
      {/* Image - Square for mobile */}
      <div className="relative aspect-square bg-gray-50">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Discount Badge - Top Right */}
        {hasDiscount && !isInteractive && (
          <Badge className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 font-bold">
            -{discountPercent}%
          </Badge>
        )}

        {/* Interactive Event Badge - Top Left */}
        {isInteractive && (
          <Badge className="absolute top-1.5 left-1.5 bg-purple-500 text-white text-[10px] px-1.5 py-0.5 flex items-center gap-0.5">
            <Zap className="w-3 h-3" />
            Evento
          </Badge>
        )}

        {/* Timer for interactive */}
        {isInteractive && eventEndsAt && (
          <div className="absolute bottom-1.5 left-1.5 right-1.5">
            <div className="bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center justify-center gap-1">
              <Clock className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-white text-[9px] font-medium">Em breve</span>
            </div>
          </div>
        )}

        {/* Out of stock */}
        {product.stock_quantity <= 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-xs">VENDIDO</span>
          </div>
        )}

        {/* View count indicator - bottom right corner */}
        {typeof product.view_count === 'number' && product.view_count > 0 && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1">
            <Eye className="w-3 h-3 text-white/80" />
            <span className="text-white/90 text-[9px] font-medium">{product.view_count}</span>
          </div>
        )}
      </div>

      {/* Info - Below image like reference */}
      <div className="p-2.5">
        {/* Badges row - Below image */}
        <div className="flex flex-wrap gap-1 mb-1.5">
          {product.is_featured && !isInteractive && (
            <Badge 
              className="text-white text-[10px] px-1.5 py-0.5 font-semibold"
              style={{ backgroundColor: primaryColor }}
            >
              MAIS VENDIDO
            </Badge>
          )}
          {product.condition && conditionConfig[product.condition] && (
            <Badge className={`${conditionConfig[product.condition].color} text-white text-[10px] px-1.5 py-0.5 font-semibold`}>
              {conditionConfig[product.condition].label.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Product name - 2 lines max */}
        <h3 className="text-gray-700 text-xs font-normal line-clamp-2 leading-snug min-h-[2.25rem] mb-1">
          {product.name}
        </h3>
        
        {/* Pricing section */}
        <div className="space-y-0.5">
          {isInteractive ? (
            <span className="text-purple-600 font-bold text-sm">
              Oferta Interativa
            </span>
          ) : (
            <>
              {/* Original price strikethrough */}
              {hasDiscount && (
                <div className="text-gray-400 text-[11px] line-through">
                  {formatCurrency(product.price)}
                </div>
              )}
              
              {/* Main price with "no Pix" */}
              <div className="flex items-baseline gap-1">
                <span 
                  className="font-bold text-lg leading-none"
                  style={{ color: primaryColor }}
                >
                  {formatCurrency(displayPrice)}
                </span>
                <span className="text-gray-500 text-[10px]">no Pix</span>
              </div>
              
              {/* Installment info */}
              <div className="text-[10px] text-gray-500">
                ou {formatCurrency(product.price)} em{' '}
                <span className="text-blue-600">10x {formatCurrency(installmentValue)} sem juros</span>
              </div>
              
              {/* Real sold count - only show if product has sales */}
              {(product.sold_count ?? 0) > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{product.sold_count} vendido{product.sold_count !== 1 ? 's' : ''}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
