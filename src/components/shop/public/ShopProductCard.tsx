import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ShopProduct } from '@/hooks/useShopProducts';
import { useShopConfig } from '@/hooks/useShopConfig';
import { Star, Eye } from 'lucide-react';

const conditionConfig = {
  novo: { label: 'Novo', color: 'bg-green-500' },
  usado: { label: 'Usado', color: 'bg-blue-500' },
  no_estado: { label: 'No Estado', color: 'bg-amber-500' }
};

interface ShopProductCardProps {
  product: ShopProduct;
}

export function ShopProductCard({ product }: ShopProductCardProps) {
  const { data: config } = useShopConfig();
  const primaryColor = config?.primary_color || '#10B981';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.sale_price! / product.price) * 100)
    : 0;
  const displayPrice = hasDiscount ? product.sale_price! : product.price;
  const installmentValue = product.price / 10;

  return (
    <Link 
      to={`/shop/${product.slug}`} 
      className="block shop-product-card shop-card-hover group"
    >
      {/* Product Image */}
      <div className="aspect-[4/5] bg-gray-50 relative overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 text-4xl">📦</span>
          </div>
        )}
      
        {/* Discount Badge - Top Right */}
        {hasDiscount && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 shop-discount-badge">
              -{discountPercent}%
            </Badge>
          </div>
        )}

        {/* Status Badges - Top Left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_featured && (
            <Badge 
              className="text-white text-[10px] px-1.5 py-0.5"
              style={{ backgroundColor: primaryColor }}
            >
              MAIS VENDIDO
            </Badge>
          )}
          {product.condition && conditionConfig[product.condition] && (
            <Badge className={`${conditionConfig[product.condition].color} text-white text-[10px] px-1.5 py-0.5`}>
              {conditionConfig[product.condition].label.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Stock Badges - Bottom Left */}
        {product.stock_quantity <= 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge className="bg-red-600 text-white text-sm font-bold px-4 py-1.5 shadow-lg uppercase tracking-wide">
              Vendido
            </Badge>
          </div>
        )}
        
        {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
          <Badge className="absolute bottom-2 left-2 bg-amber-500 text-white text-[10px] px-1.5 py-0.5">
            Últimas {product.stock_quantity} un.
          </Badge>
        )}

        {/* View count indicator - bottom right corner */}
        {typeof product.view_count === 'number' && product.view_count > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1">
            <Eye className="w-3 h-3 text-white/80" />
            <span className="text-white/90 text-[10px] font-medium">{product.view_count}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Product Name - 2 lines max */}
        <h3 className="text-gray-800 text-sm font-medium line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Pricing section - Same as mobile */}
        <div className="mt-2 space-y-0.5">
          {/* Original price strikethrough */}
          {hasDiscount ? (
            <>
              <span className="text-gray-400 text-xs line-through">
                {formatCurrency(product.price)}
              </span>
              <div className="flex items-baseline gap-1">
                <span 
                  className="font-bold text-lg leading-none"
                  style={{ color: primaryColor }}
                >
                  {formatCurrency(displayPrice)}
                </span>
                <span className="text-gray-500 text-[10px]">no Pix</span>
              </div>
            </>
          ) : (
            <div className="flex items-baseline gap-1">
              <span 
                className="font-bold text-lg leading-none"
                style={{ color: primaryColor }}
              >
                {formatCurrency(displayPrice)}
              </span>
              <span className="text-gray-500 text-[10px]">no Pix</span>
            </div>
          )}
          
          {/* Installment info */}
          <div className="text-[10px] text-gray-500">
            ou {formatCurrency(product.price)} em{' '}
            <span className="text-blue-600">10x {formatCurrency(installmentValue)} sem juros</span>
          </div>
        </div>

        {/* Real sold count - only show if product has sales */}
        {product.sold_count > 0 && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{product.sold_count} vendido{product.sold_count !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
