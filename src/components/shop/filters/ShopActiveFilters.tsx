import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { ShopCategory } from '@/hooks/useShopCategories';

interface ShopActiveFiltersProps {
  categories: ShopCategory[];
}

export function ShopActiveFilters({ categories }: ShopActiveFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategorySlug = searchParams.get('category');
  const selectedCondition = searchParams.get('condition');
  const selectedDiscount = searchParams.get('discount');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const searchQuery = searchParams.get('q');

  const selectedCategory = categories.find(c => c.slug === selectedCategorySlug);

  const conditionLabels: Record<string, string> = {
    novo: 'Novo',
    usado: 'Usado',
    no_estado: 'No Estado'
  };

  const removeFilter = (key: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(key);
    setSearchParams(newParams);
  };

  const removeAllFilters = () => {
    const newParams = new URLSearchParams();
    // Preservar a busca se houver
    if (searchQuery) {
      newParams.set('q', searchQuery);
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
    filters.push({ key: 'discount', label: `${selectedDiscount}%+ OFF` });
  }
  if (minPrice || maxPrice) {
    const priceLabel = minPrice && maxPrice 
      ? `R$ ${minPrice} - R$ ${maxPrice}`
      : minPrice 
        ? `A partir de R$ ${minPrice}`
        : `Até R$ ${maxPrice}`;
    filters.push({ key: 'price', label: priceLabel });
  }

  if (filters.length === 0) return null;

  const handleRemovePrice = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('minPrice');
    newParams.delete('maxPrice');
    setSearchParams(newParams);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm text-gray-500">Filtros:</span>
      {filters.map(filter => (
        <button
          key={filter.key}
          onClick={() => filter.key === 'price' ? handleRemovePrice() : removeFilter(filter.key)}
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded hover:bg-blue-100 transition-colors"
        >
          <span>{filter.label}</span>
          <X className="w-3 h-3" />
        </button>
      ))}
      {filters.length > 1 && (
        <button
          onClick={removeAllFilters}
          className="text-sm text-blue-600 hover:underline ml-2"
        >
          Limpar todos
        </button>
      )}
    </div>
  );
}
