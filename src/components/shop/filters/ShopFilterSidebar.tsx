import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShopCategory } from '@/hooks/useShopCategories';
import { ShopProduct } from '@/hooks/useShopProducts';

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-semibold text-gray-800 text-sm">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}

interface ShopFilterSidebarProps {
  categories: ShopCategory[];
  products: ShopProduct[];
  totalResults: number;
  onClose?: () => void;
  isMobile?: boolean;
}

export function ShopFilterSidebar({
  categories,
  products,
  totalResults,
  onClose,
  isMobile = false
}: ShopFilterSidebarProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const selectedCategorySlug = searchParams.get('category');
  const selectedCondition = searchParams.get('condition');
  const selectedDiscount = searchParams.get('discount');
  const sortBy = searchParams.get('sort') || 'relevance';

  // Contagem de produtos por categoria
  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(product => {
      if (product.category_id) {
        counts[product.category_id] = (counts[product.category_id] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Contagem por condição
  const conditionCount = useMemo(() => {
    const counts = { novo: 0, usado: 0, no_estado: 0 };
    products.forEach(product => {
      const condition = product.condition || 'usado';
      if (condition in counts) {
        counts[condition as keyof typeof counts]++;
      }
    });
    return counts;
  }, [products]);

  // Faixas de preço
  const priceRanges = useMemo(() => {
    const prices = products.map(p => p.sale_price || p.price);
    if (prices.length === 0) return [];

    const maxProductPrice = Math.max(...prices);
    const ranges = [
      { label: 'Até R$ 100', min: 0, max: 100 },
      { label: 'R$ 100 a R$ 500', min: 100, max: 500 },
      { label: 'R$ 500 a R$ 1.000', min: 500, max: 1000 },
      { label: 'R$ 1.000 a R$ 5.000', min: 1000, max: 5000 },
      { label: 'Mais de R$ 5.000', min: 5000, max: Infinity }
    ];

    return ranges.filter(range => {
      const count = products.filter(p => {
        const price = p.sale_price || p.price;
        return price >= range.min && (range.max === Infinity || price < range.max);
      }).length;
      return count > 0;
    }).map(range => ({
      ...range,
      count: products.filter(p => {
        const price = p.sale_price || p.price;
        return price >= range.min && (range.max === Infinity || price < range.max);
      }).length
    }));
  }, [products]);

  // Contagem de descontos
  const discountRanges = useMemo(() => {
    const ranges = [
      { label: 'Mais de 50% OFF', min: 50 },
      { label: 'Mais de 40% OFF', min: 40 },
      { label: 'Mais de 30% OFF', min: 30 },
      { label: 'Mais de 20% OFF', min: 20 },
      { label: 'Mais de 10% OFF', min: 10 }
    ];

    return ranges.map(range => {
      const count = products.filter(p => {
        if (!p.sale_price || p.sale_price >= p.price) return false;
        const discount = Math.round((1 - p.sale_price / p.price) * 100);
        return discount >= range.min;
      }).length;
      return { ...range, count };
    }).filter(r => r.count > 0);
  }, [products]);

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const applyPriceFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    if (minPrice) newParams.set('minPrice', minPrice);
    else newParams.delete('minPrice');
    if (maxPrice) newParams.set('maxPrice', maxPrice);
    else newParams.delete('maxPrice');
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setMinPrice('');
    setMaxPrice('');
  };

  const hasActiveFilters = selectedCategorySlug || selectedCondition || selectedDiscount || 
    searchParams.get('minPrice') || searchParams.get('maxPrice');

  return (
    <aside className={cn(
      "bg-white",
      isMobile ? "fixed inset-0 z-50 overflow-y-auto" : "w-64 flex-shrink-0"
    )}>
      {/* Header Mobile */}
      {isMobile && (
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <span className="font-semibold text-gray-800">Filtros</span>
          <button onClick={onClose} className="p-2 -mr-2">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      )}

      <div className="p-4">
        {/* Resultados */}
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{totalResults.toLocaleString('pt-BR')} resultados</h2>
          {hasActiveFilters && (
            <button 
              onClick={clearAllFilters}
              className="text-blue-600 text-sm mt-1 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Categorias */}
        <FilterSection title="Categorias">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => updateFilter('category', null)}
                className={cn(
                  "text-sm hover:text-blue-600 transition-colors text-left w-full flex items-center justify-between",
                  !selectedCategorySlug ? "text-blue-600 font-medium" : "text-gray-700"
                )}
              >
                <span>Todas</span>
                <span className="text-gray-400 text-xs">({products.length})</span>
              </button>
            </li>
            {categories.map(category => {
              const count = categoryCount[category.id] || 0;
              if (count === 0) return null;
              return (
                <li key={category.id}>
                  <button
                    onClick={() => updateFilter('category', category.slug)}
                    className={cn(
                      "text-sm hover:text-blue-600 transition-colors text-left w-full flex items-center justify-between",
                      selectedCategorySlug === category.slug ? "text-blue-600 font-medium" : "text-gray-700"
                    )}
                  >
                    <span>{category.name}</span>
                    <span className="text-gray-400 text-xs">({count})</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </FilterSection>

        {/* Condição */}
        <FilterSection title="Condição">
          <ul className="space-y-2">
            {conditionCount.novo > 0 && (
              <li>
                <button
                  onClick={() => updateFilter('condition', selectedCondition === 'novo' ? null : 'novo')}
                  className={cn(
                    "text-sm hover:text-blue-600 transition-colors text-left w-full flex items-center justify-between",
                    selectedCondition === 'novo' ? "text-blue-600 font-medium" : "text-gray-700"
                  )}
                >
                  <span>Novo</span>
                  <span className="text-gray-400 text-xs">({conditionCount.novo})</span>
                </button>
              </li>
            )}
            {conditionCount.usado > 0 && (
              <li>
                <button
                  onClick={() => updateFilter('condition', selectedCondition === 'usado' ? null : 'usado')}
                  className={cn(
                    "text-sm hover:text-blue-600 transition-colors text-left w-full flex items-center justify-between",
                    selectedCondition === 'usado' ? "text-blue-600 font-medium" : "text-gray-700"
                  )}
                >
                  <span>Usado</span>
                  <span className="text-gray-400 text-xs">({conditionCount.usado})</span>
                </button>
              </li>
            )}
            {conditionCount.no_estado > 0 && (
              <li>
                <button
                  onClick={() => updateFilter('condition', selectedCondition === 'no_estado' ? null : 'no_estado')}
                  className={cn(
                    "text-sm hover:text-blue-600 transition-colors text-left w-full flex items-center justify-between",
                    selectedCondition === 'no_estado' ? "text-blue-600 font-medium" : "text-gray-700"
                  )}
                >
                  <span>No Estado</span>
                  <span className="text-gray-400 text-xs">({conditionCount.no_estado})</span>
                </button>
              </li>
            )}
          </ul>
        </FilterSection>

        {/* Preço */}
        <FilterSection title="Preço">
          <ul className="space-y-2 mb-3">
            {priceRanges.map((range, idx) => (
              <li key={idx}>
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('minPrice', range.min.toString());
                    if (range.max !== Infinity) {
                      newParams.set('maxPrice', range.max.toString());
                    } else {
                      newParams.delete('maxPrice');
                    }
                    setSearchParams(newParams);
                  }}
                  className="text-sm text-gray-700 hover:text-blue-600 transition-colors text-left w-full flex items-center justify-between"
                >
                  <span>{range.label}</span>
                  <span className="text-gray-400 text-xs">({range.count})</span>
                </button>
              </li>
            ))}
          </ul>

          {/* Input de preço personalizado */}
          <div className="flex items-center gap-2 mt-3">
            <input
              type="number"
              placeholder="Mínimo"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-gray-400">—</span>
            <input
              type="number"
              placeholder="Máximo"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={applyPriceFilter}
              className="p-1.5 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-gray-600 -rotate-90" />
            </button>
          </div>
        </FilterSection>

        {/* Descontos */}
        {discountRanges.length > 0 && (
          <FilterSection title="Descontos">
            <ul className="space-y-2">
              {discountRanges.map((range, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => updateFilter('discount', selectedDiscount === range.min.toString() ? null : range.min.toString())}
                    className={cn(
                      "text-sm hover:text-blue-600 transition-colors text-left w-full flex items-center justify-between",
                      selectedDiscount === range.min.toString() ? "text-blue-600 font-medium" : "text-gray-700"
                    )}
                  >
                    <span className="text-green-600">{range.label}</span>
                    <span className="text-gray-400 text-xs">({range.count})</span>
                  </button>
                </li>
              ))}
            </ul>
          </FilterSection>
        )}
      </div>

      {/* Footer Mobile - Aplicar */}
      {isMobile && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver {totalResults} resultados
          </button>
        </div>
      )}
    </aside>
  );
}
