import { ShopMobileProductCard } from './ShopMobileProductCard';

interface Product {
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
}

interface InteractiveEvent {
  product_id: string;
  ends_at: string;
}

interface ShopMobileProductGridProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  activeEvents?: InteractiveEvent[];
}

export function ShopMobileProductGrid({ 
  products, 
  title, 
  subtitle, 
  emptyMessage = 'Nenhum produto encontrado',
  activeEvents = []
}: ShopMobileProductGridProps) {
  if (products.length === 0) {
    return (
      <section className="px-4 py-8">
        {title && (
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        )}
        <div className="text-center py-8 text-gray-500">
          <p>{emptyMessage}</p>
        </div>
      </section>
    );
  }

  const getEventForProduct = (productId: string) => {
    return activeEvents.find(e => e.product_id === productId);
  };

  return (
    <section className="px-3 py-4">
      {title && (
        <div className="mb-3 px-1">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      
      {/* Grid 2 colunas fixo */}
      <div className="grid grid-cols-2 gap-2.5">
        {products.map((product) => {
          const event = getEventForProduct(product.id);
          const isInteractive = product.sale_type === 'interactive' && !!event;
          
          return (
            <ShopMobileProductCard
              key={product.id}
              product={product}
              isInteractive={isInteractive}
              eventEndsAt={event?.ends_at}
            />
          );
        })}
      </div>
    </section>
  );
}
