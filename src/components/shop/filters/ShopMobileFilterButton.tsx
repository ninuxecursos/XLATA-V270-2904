import { useState } from 'react';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { ShopFilterSidebar } from './ShopFilterSidebar';
import { ShopCategory } from '@/hooks/useShopCategories';
import { ShopProduct } from '@/hooks/useShopProducts';

interface ShopMobileFilterButtonProps {
  categories: ShopCategory[];
  products: ShopProduct[];
  totalResults: number;
}

export function ShopMobileFilterButton({ 
  categories, 
  products, 
  totalResults 
}: ShopMobileFilterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span>Filtrar</span>
      </button>

      {isOpen && (
        <ShopFilterSidebar
          categories={categories}
          products={products}
          totalResults={totalResults}
          onClose={() => setIsOpen(false)}
          isMobile={true}
        />
      )}
    </>
  );
}
