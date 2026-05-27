import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const sortOptions = [
  { value: 'relevance', label: 'Mais relevantes' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'newest', label: 'Mais recentes' },
  { value: 'discount', label: 'Maior desconto' }
];

export function ShopSortDropdown() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentSort = searchParams.get('sort') || 'relevance';
  const currentLabel = sortOptions.find(o => o.value === currentSort)?.label || 'Mais relevantes';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'relevance') {
      newParams.delete('sort');
    } else {
      newParams.set('sort', value);
    }
    setSearchParams(newParams);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
      >
        <span className="text-gray-500">Ordenar por</span>
        <span className="font-medium text-blue-600">{currentLabel}</span>
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-500 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <ul className="py-1">
            {sortOptions.map(option => (
              <li key={option.value}>
                <button
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center justify-between",
                    currentSort === option.value && "text-blue-600 font-medium"
                  )}
                >
                  <span>{option.label}</span>
                  {currentSort === option.value && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
