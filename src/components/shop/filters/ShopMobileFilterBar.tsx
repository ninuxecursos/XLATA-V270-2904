import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShopFilterSidebar } from './ShopFilterSidebar';
import { ShopCategory } from '@/hooks/useShopCategories';
import { ShopProduct } from '@/hooks/useShopProducts';

const sortOptions = [
  { value: 'relevance', label: 'Relevantes' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'newest', label: 'Recentes' },
  { value: 'discount', label: 'Desconto' }
];

interface ShopMobileFilterBarProps {
  categories: ShopCategory[];
  products: ShopProduct[];
  totalResults: number;
}

export function ShopMobileFilterBar({ 
  categories, 
  products, 
  totalResults 
}: ShopMobileFilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentSort = searchParams.get('sort') || 'relevance';
  const currentLabel = sortOptions.find(o => o.value === currentSort)?.label || 'Relevantes';

  // Count active filters
  const activeFiltersCount = [
    searchParams.get('category'),
    searchParams.get('condition'),
    searchParams.get('discount'),
    searchParams.get('minPrice') || searchParams.get('maxPrice')
  ].filter(Boolean).length;

  const handleSelect = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'relevance') {
      newParams.delete('sort');
    } else {
      newParams.set('sort', value);
    }
    setSearchParams(newParams);
    setIsSortOpen(false);
  };

  return (
    <>
      {/* Compact Filter Bar */}
      <div className="flex items-center gap-2 py-2 px-1">
        {/* Filter Button with badge */}
        <button
          onClick={() => setIsFilterOpen(true)}
          className={cn(
            "relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors",
            activeFiltersCount > 0 
              ? "bg-green-600 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="ml-0.5 w-5 h-5 flex items-center justify-center bg-white text-green-600 text-xs font-bold rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Results count */}
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {totalResults}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <span className="max-w-[80px] truncate">{currentLabel}</span>
            <ChevronDown className={cn(
              "w-3.5 h-3.5 transition-transform flex-shrink-0",
              isSortOpen && "rotate-180"
            )} />
          </button>

          {isSortOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsSortOpen(false)} 
              />
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full px-3 py-2.5 text-sm text-left flex items-center justify-between",
                      currentSort === option.value 
                        ? "bg-green-50 text-green-700 font-medium" 
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <span>{option.label}</span>
                    {currentSort === option.value && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Active Filters - Chips inline */}
      <ActiveFilterChips categories={categories} />

      {/* Filter Sidebar */}
      {isFilterOpen && (
        <ShopFilterSidebar
          categories={categories}
          products={products}
          totalResults={totalResults}
          onClose={() => setIsFilterOpen(false)}
          isMobile={true}
        />
      )}
    </>
  );
}

// Compact inline filter chips
function ActiveFilterChips({ categories }: { categories: ShopCategory[] }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategorySlug = searchParams.get('category');
  const selectedCondition = searchParams.get('condition');
  const selectedDiscount = searchParams.get('discount');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  const selectedCategory = categories.find(c => c.slug === selectedCategorySlug);

  const conditionLabels: Record<string, string> = {
    novo: 'Novo',
    usado: 'Usado',
    no_estado: 'No Estado'
  };

  const removeFilter = (key: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (key === 'price') {
      newParams.delete('minPrice');
      newParams.delete('maxPrice');
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const filters: { key: string; label: string }[] = [];

  if (selectedCategory) {
    filters.push({ key: 'category', label: selectedCategory.name });
  }
  if (selectedCondition) {
    filters.push({ key: 'condition', label: conditionLabels[selectedCondition] || selectedCondition });
  }
  if (selectedDiscount) {
    filters.push({ key: 'discount', label: `${selectedDiscount}%+` });
  }
  if (minPrice || maxPrice) {
    const priceLabel = minPrice && maxPrice 
      ? `R$${minPrice}-${maxPrice}`
      : minPrice 
        ? `+R$${minPrice}`
        : `<R$${maxPrice}`;
    filters.push({ key: 'price', label: priceLabel });
  }

  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-1 pb-2 overflow-x-auto scrollbar-hide">
      {filters.map(filter => (
        <button
          key={filter.key}
          onClick={() => removeFilter(filter.key)}
          className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full whitespace-nowrap hover:bg-green-100 transition-colors flex-shrink-0"
        >
          <span>{filter.label}</span>
          <X className="w-3 h-3" />
        </button>
      ))}
    </div>
  );
}
