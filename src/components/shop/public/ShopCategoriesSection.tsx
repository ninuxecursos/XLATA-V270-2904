import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useShopCategories, ShopCategory } from '@/hooks/useShopCategories';
import { useShopConfig } from '@/hooks/useShopConfig';
import { cn } from '@/lib/utils';
import { 
  Sofa,
  Wrench,
  Building2,
  Monitor,
  Car,
  Dumbbell,
  TreePine,
  Clock,
  Briefcase,
  Package,
  Grid3X3,
  Sparkles,
  LucideIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mapeamento de ícones por slug da categoria
const categoryIconMap: Record<string, LucideIcon> = {
  'moveis-decoracao': Sofa,
  'maquinas-ferramentas': Wrench,
  'materiais-construcao': Building2,
  'eletronicos-informatica': Monitor,
  'veiculos-pecas': Car,
  'esporte-lazer': Dumbbell,
  'casa-jardim': TreePine,
  'antiguidades-colecoes': Clock,
  'comercial-escritorio': Briefcase,
  'outros': Package,
};

function getCategoryIcon(slug: string): LucideIcon {
  return categoryIconMap[slug] || Package;
}

export function ShopCategoriesSection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: categories = [], isLoading } = useShopCategories();
  const { data: config } = useShopConfig();
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  
  const selectedCategory = searchParams.get('category');
  const colors = config?.colors;
  
  // Cores configuráveis (mesmo padrão do container interativo)
  const sectionBg = colors?.categories_section_bg || colors?.background_alt || '#F3F4F6';
  const gradientEnabled = colors?.categories_section_gradient_enabled ?? false;
  const titleColor = colors?.categories_section_title_color || colors?.text_primary || '#111827';
  const subtitleColor = colors?.categories_section_subtitle_color || colors?.text_secondary || '#6B7280';
  const iconBg = colors?.categories_section_icon_bg || colors?.primary || '#10B981';
  const iconColor = colors?.categories_section_icon_color || '#FFFFFF';
  const badgeBg = colors?.categories_section_badge_bg || `${iconBg}20`;
  const badgeText = colors?.categories_section_badge_text || iconBg;
  const borderEnabled = colors?.categories_section_border_enabled ?? false;
  const borderColor = colors?.categories_section_border_color || `${iconBg}30`;
  const particlesEnabled = colors?.categories_section_particles_enabled ?? colors?.enable_particles ?? false;
  const particlesColor = colors?.categories_section_particles_color || colors?.particles_color || iconBg;
  const particlesSecondary = colors?.categories_section_particles_color_secondary || colors?.particles_color_secondary || '#EC4899';
  const particlesMix = colors?.categories_section_particles_mix ?? colors?.particles_color_mix ?? false;

  // Configurações de partículas
  const particlesIntensity = colors?.particles_intensity || 'medium';
  const particlesSize = colors?.particles_size || 'medium';
  const particlesSpeed = colors?.particles_speed || 'medium';
  
  const particleCount = particlesIntensity === 'low' ? 5 : particlesIntensity === 'high' ? 20 : 10;
  const baseSize = particlesSize === 'small' ? 3 : particlesSize === 'large' ? 8 : 5;
  const animSpeed = particlesSpeed === 'slow' ? 4 : particlesSpeed === 'fast' ? 1.5 : 2.5;

  // Gerar partículas
  const particles = useMemo(() => {
    if (!particlesEnabled) return [];
    return Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      useSecondary: particlesMix && i % 2 === 0,
      size: baseSize + (Math.random() * baseSize * 0.4),
      delay: Math.random() * 2,
      duration: animSpeed + (Math.random() * 1.5),
      left: 5 + (Math.random() * 90),
      top: 5 + (Math.random() * 90),
      opacity: 0.2 + (Math.random() * 0.4)
    }));
  }, [particlesEnabled, particleCount, baseSize, animSpeed, particlesMix]);

  // Auto-scroll para categoria selecionada
  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const selectedButton = selectedRef.current;
      
      // Use scrollIntoView for reliable centering
      selectedButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedCategory]);

  // Handler de seleção
  const handleCategoryClick = useCallback((category: ShopCategory | null) => {
    if (category === null) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category.slug);
    }
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  if (isLoading || categories.length === 0) {
    return null;
  }

  return (
    <section 
      className="relative overflow-hidden px-3 py-4 mx-2 my-3 rounded-xl"
      style={{
        backgroundColor: sectionBg,
        background: gradientEnabled 
          ? `linear-gradient(180deg, ${iconBg}15 0%, ${sectionBg} 100%)`
          : sectionBg,
        border: borderEnabled ? `1px solid ${borderColor}` : undefined,
      }}
    >
      {/* Particles Background */}
      {particlesEnabled && particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute pointer-events-none rounded-full"
          style={{ 
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.useSecondary ? particlesSecondary : particlesColor,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            opacity: particle.opacity,
            animation: `shop-float ${particle.duration}s ease-in-out infinite ${particle.delay}s`,
          }}
        />
      ))}

      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1 relative z-10">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: iconBg }}
          >
            <Grid3X3 className="w-5 h-5" style={{ color: iconColor }} />
          </div>
          <div>
            <h2 
              className="text-base font-bold"
              style={{ color: titleColor }}
            >
              Categorias
            </h2>
            <p 
              className="text-xs"
              style={{ color: subtitleColor }}
            >
              Navegue por departamento
            </p>
          </div>
        </div>
        
        <Badge 
          className="text-[10px]"
          style={{ backgroundColor: badgeBg, color: badgeText }}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          {categories.length} categorias
        </Badge>
      </div>

      {/* Categories Scroll */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 px-1 relative z-10 lg:justify-center"
        style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Botão "Todos" */}
        <button
          ref={selectedCategory === null ? selectedRef : undefined}
          onClick={() => handleCategoryClick(null)}
          className={cn(
            'flex-shrink-0 flex flex-col items-center gap-1.5 p-2.5 rounded-xl min-w-[70px] md:min-w-[85px]',
            'transition-all duration-200 relative group'
          )}
          style={{
            backgroundColor: selectedCategory === null 
              ? iconBg 
              : 'rgba(255,255,255,0.9)',
            boxShadow: selectedCategory === null 
              ? `0 4px 14px ${iconBg}40` 
              : '0 2px 8px rgba(0,0,0,0.06)',
            border: selectedCategory === null 
              ? `2px solid ${iconBg}` 
              : '2px solid rgba(0,0,0,0.05)'
          }}
        >
          <div 
            className={cn(
              'w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center',
              'transition-transform duration-200 group-hover:scale-105'
            )}
            style={{ 
              backgroundColor: selectedCategory === null 
                ? 'rgba(255,255,255,0.25)' 
                : `${iconBg}15`
            }}
          >
            <Package 
              className="w-5 h-5 md:w-5.5 md:h-5.5" 
              style={{ 
                color: selectedCategory === null ? '#FFFFFF' : iconBg 
              }}
            />
          </div>
          <span 
            className={cn(
              'text-xs font-semibold text-center leading-tight',
              'line-clamp-2 max-w-[60px] md:max-w-[75px]'
            )}
            style={{ 
              color: selectedCategory === null ? '#FFFFFF' : titleColor 
            }}
          >
            Todos
          </span>
        </button>

        {/* Categorias */}
        {categories.map((category) => {
          const isSelected = selectedCategory === category.slug;
          const IconComponent = getCategoryIcon(category.slug);
          
          return (
            <button
              key={category.id}
              ref={isSelected ? selectedRef : undefined}
              onClick={() => handleCategoryClick(category)}
              className={cn(
                'flex-shrink-0 flex flex-col items-center gap-1.5 p-2.5 rounded-xl min-w-[70px] md:min-w-[85px]',
                'transition-all duration-200 relative group'
              )}
              style={{
                backgroundColor: isSelected 
                  ? iconBg 
                  : 'rgba(255,255,255,0.9)',
                boxShadow: isSelected 
                  ? `0 4px 14px ${iconBg}40` 
                  : '0 2px 8px rgba(0,0,0,0.06)',
                border: isSelected 
                  ? `2px solid ${iconBg}` 
                  : '2px solid rgba(0,0,0,0.05)'
              }}
            >
              <div 
                className={cn(
                  'w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center',
                  'transition-transform duration-200 group-hover:scale-105'
                )}
                style={{ 
                  backgroundColor: isSelected 
                    ? 'rgba(255,255,255,0.25)' 
                    : `${iconBg}15`
                }}
              >
                <IconComponent 
                  className="w-5 h-5 md:w-5.5 md:h-5.5" 
                  style={{ 
                    color: isSelected ? '#FFFFFF' : iconBg 
                  }}
                />
              </div>
              <span 
                className={cn(
                  'text-xs font-semibold text-center leading-tight',
                  'line-clamp-2 max-w-[60px] md:max-w-[75px]'
                )}
                style={{ 
                  color: isSelected ? '#FFFFFF' : titleColor 
                }}
              >
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
