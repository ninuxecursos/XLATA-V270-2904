import { ShopProduct } from '@/hooks/useShopProducts';
import { ShopProductCard } from './ShopProductCard';

interface ShopProductGridProps {
  products: ShopProduct[];
  title: string;
  subtitle?: string;
  emptyMessage?: string;
}

export function ShopProductGrid({ 
  products, 
  title, 
  subtitle,
  emptyMessage = 'Nenhum produto disponível'
}: ShopProductGridProps) {
  if (products.length === 0) {
    return (
      <section className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-1">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mb-6">{subtitle}</p>}
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 lg:py-10" id="produtos">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="mb-4 lg:mb-6">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Product Grid - 6 columns on desktop */}
        <div className="shop-grid-6">
          {products.map((product) => (
            <ShopProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
