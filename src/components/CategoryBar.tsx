import React, { useRef, useEffect, memo } from 'react';
import { MaterialCategory } from '@/types/pdv';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CategoryBarProps {
  categories: MaterialCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  materialCountByCategory?: Record<string, number>;
}

// Cores pré-definidas para categorias (fallback)
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-400' },
  purple: { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-400' },
  orange: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-400' },
  red: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-400' },
  yellow: { bg: 'bg-yellow-500', text: 'text-black', border: 'border-yellow-400' },
  pink: { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-400' },
  gray: { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-400' },
  brown: { bg: 'bg-amber-700', text: 'text-white', border: 'border-amber-500' },
  black: { bg: 'bg-gray-900', text: 'text-white', border: 'border-gray-600' },
  sky: { bg: 'bg-sky-400', text: 'text-white', border: 'border-sky-300' },
  green: { bg: 'bg-green-600', text: 'text-white', border: 'border-green-400' },
  beige: { bg: 'bg-amber-100', text: 'text-black', border: 'border-amber-200' },
};

export const CATEGORY_COLOR_OPTIONS = [
  { value: 'blue', label: 'Azul' },
  { value: 'purple', label: 'Roxo' },
  { value: 'orange', label: 'Laranja' },
  { value: 'red', label: 'Vermelho' },
  { value: 'yellow', label: 'Amarelo' },
  { value: 'pink', label: 'Rosa' },
  { value: 'gray', label: 'Cinza' },
  { value: 'brown', label: 'Marrom' },
  { value: 'black', label: 'Preto' },
  { value: 'sky', label: 'Azul Claro' },
  { value: 'green', label: 'Verde' },
];

// Helper to determine if a hex color is light
const isLightColor = (hex: string): boolean => {
  if (!hex || !hex.startsWith('#')) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  materialCountByCategory = {}
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();

  // Filter only active categories
  const activeCategories = categories.filter(c => c.is_active !== false);

  // Auto-scroll para manter o botão selecionado visível
  useEffect(() => {
    if (selectedButtonRef.current && scrollContainerRef.current) {
      selectedButtonRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedCategoryId]);

  const getCategoryStyle = (category: MaterialCategory) => {
    // Use hex_color if available
    if (category.hex_color) {
      const isLight = isLightColor(category.hex_color);
      return {
        style: {
          backgroundColor: category.hex_color,
        },
        isLight
      };
    }
    
    // Fallback to predefined colors
    const colors = CATEGORY_COLORS[category.color] || CATEGORY_COLORS.blue;
    return {
      className: colors.bg,
      style: {},
      isLight: category.color === 'yellow' || category.color === 'beige'
    };
  };

  // Tamanhos dos botões - mais profissionais
  const buttonSize = isMobile 
    ? 'min-w-[90px] min-h-[65px]' 
    : 'min-w-[120px] min-h-[75px]';

  return (
    <div className="bg-slate-800 p-1">
      <div
        ref={scrollContainerRef}
        className="flex gap-1 overflow-x-auto scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Botão "Todos" */}
        <button
          ref={selectedCategoryId === null ? selectedButtonRef : undefined}
          onClick={() => onSelectCategory(null)}
          className={cn(
            'flex-shrink-0 flex flex-col items-center justify-center relative px-3 py-[7px]',
            buttonSize,
            'rounded-md font-bold transition-all duration-200',
            selectedCategoryId === null
              ? 'bg-slate-600 ring-2 ring-white ring-offset-1 ring-offset-slate-800'
              : 'bg-slate-700 hover:bg-slate-600'
          )}
        >
          <span className="text-white font-bold text-sm text-center">Todos</span>
          {selectedCategoryId === null && (
            <div className="absolute top-1.5 right-1.5 bg-white rounded-full p-0.5 shadow-lg">
              <Check className="h-3 w-3 text-slate-900" />
            </div>
          )}
        </button>

        {/* Botões de categorias */}
        {activeCategories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          const { className, style } = getCategoryStyle(category);
          const count = materialCountByCategory[category.id] || 0;

          return (
            <button
              key={category.id}
              ref={isSelected ? selectedButtonRef : undefined}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                'flex-shrink-0 flex flex-col items-center justify-center relative px-3 py-[7px]',
                buttonSize,
                'rounded-md font-bold transition-all duration-200',
                className,
                isSelected && 'ring-2 ring-white ring-offset-1 ring-offset-slate-800'
              )}
              style={style}
            >
              {/* Nome da categoria - centralizado */}
              <span 
                className="font-bold text-sm text-center leading-tight line-clamp-2 text-white"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.9)' }}
              >
                {category.name}
              </span>
              
              {/* Badge de quantidade - sempre abaixo do nome */}
              {count > 0 && (
                <span 
                  className="mt-1.5 px-2 py-0.5 text-[11px] font-bold rounded-full bg-white/20 text-white"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                >
                  {count}
                </span>
              )}
              
              {/* Indicador de seleção */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 bg-white rounded-full p-0.5 shadow-lg">
                  <Check className="h-3 w-3 text-slate-900" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(CategoryBar);