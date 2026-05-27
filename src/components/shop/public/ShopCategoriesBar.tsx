import { Link } from 'react-router-dom';
import { useShopCategories } from '@/hooks/useShopCategories';
import { useShopConfig } from '@/hooks/useShopConfig';
import { 
  Smartphone, 
  Wrench, 
  Home, 
  Package, 
  Zap, 
  ShoppingBag,
  Car,
  Shirt,
  Gamepad,
  Heart,
  LucideIcon
} from 'lucide-react';

// Mapeamento de ícones por nome
const iconMap: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  wrench: Wrench,
  home: Home,
  package: Package,
  zap: Zap,
  shopping: ShoppingBag,
  car: Car,
  shirt: Shirt,
  gamepad: Gamepad,
  heart: Heart,
};

function getCategoryIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return Package;
  return iconMap[iconName.toLowerCase()] || Package;
}

export function ShopCategoriesBar() {
  const { data: categories = [], isLoading } = useShopCategories();
  const { data: config } = useShopConfig();
  
  const primaryColor = config?.primary_color || '#10B981';

  // Only show parent categories (no parent_id)
  const parentCategories = categories.filter(c => !c.parent_id);

  if (isLoading || parentCategories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex gap-2 md:gap-4 overflow-x-auto scrollbar-hide pb-1">
          {parentCategories.map((category) => {
            const IconComponent = getCategoryIcon(category.icon);
            
            return (
              <Link
                key={category.id}
                to={`/shop?category=${category.slug}`}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[70px] md:min-w-[80px] transition-all hover:bg-gray-50 group"
              >
                <div 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors group-hover:scale-105"
                  style={{ 
                    backgroundColor: `${primaryColor}15`,
                  }}
                >
                  <IconComponent 
                    className="w-5 h-5 md:w-6 md:h-6 transition-colors" 
                    style={{ color: primaryColor }}
                  />
                </div>
                <span className="text-xs md:text-sm text-gray-700 font-medium text-center whitespace-nowrap">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
