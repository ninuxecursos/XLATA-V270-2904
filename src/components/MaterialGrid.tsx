
import React, { useState, useEffect } from 'react';
import { Material } from '@/types/pdv';
import MaterialConfigModal, { MaterialDisplayConfig } from './MaterialConfigModal';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';

interface MaterialGridProps {
  materials: Material[];
  onMaterialSelect: (material: Material) => void;
  onManualInsert: () => void;
  isSaleMode?: boolean;
  hasActiveOrder?: boolean;
  onNewOrderRequest?: () => void;
  selectedCategoryId?: string | null;
}

// Helper para indicador de variação de preço
const getPriceIndicator = (material: Material, isSaleMode: boolean) => {
  const currentPrice = isSaleMode ? material.salePrice : material.price;
  const previousPrice = isSaleMode ? material.previousSalePrice : material.previousPrice;
  
  if (previousPrice === null || previousPrice === undefined) return null;
  if (currentPrice > previousPrice) return { symbol: '▲', colorClass: 'text-red-400' };
  if (currentPrice < previousPrice) return { symbol: '▼', colorClass: 'text-green-400' };
  return null;
};

const MaterialGrid = React.memo(({ 
  materials, 
  onMaterialSelect, 
  isSaleMode = false, 
  hasActiveOrder = false,
  onNewOrderRequest,
  selectedCategoryId = null
}: MaterialGridProps) => {
  // Handler memoizado para cliques
  const handleClick = React.useCallback((material: Material) => {
    onMaterialSelect(material);
  }, [onMaterialSelect]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState<MaterialDisplayConfig>({
    fontSize: 'medium',
    showPricePerKg: true
  });

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  useEffect(() => {
    // Load configuration from localStorage
    const savedConfig = localStorage.getItem('material_display_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);


  const formatPrice = (material: Material) => {
    if (!config.showPricePerKg) return '';
    
    // Use sale price in sale mode, purchase price in purchase mode
    const price = isSaleMode ? material.salePrice : material.price;
    return `R$ ${price.toFixed(2)}/kg`;
  };

  const getFontSizeClass = () => {
    if (isMobile) {
      switch (config.fontSize) {
        case 'small':
          return 'text-[10px]';
        case 'large':
          return 'text-xs';
        default:
          return 'text-[11px]';
      }
    }
    
    switch (config.fontSize) {
      case 'small':
        return 'text-xs';
      case 'large':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  const getNameFontSizeClass = () => {
    if (isMobile) {
      switch (config.fontSize) {
        case 'small':
          return 'text-[10px]';
        case 'large':
          return 'text-sm';
        default:
          return 'text-xs';
      }
    }
    
    switch (config.fontSize) {
      case 'small':
        return 'text-xs';
      case 'large':
        return 'text-lg';
      default:
        return 'text-sm';
    }
  };

  const getMaterialButtonClass = () => {
    return isSaleMode ? 'material-btn-sale-mode' : 'material-btn';
  };

  // Determinar o número de colunas baseado no dispositivo
  const getGridCols = () => {
    if (isMobile) return 'grid-cols-3';
    if (isTablet) return 'grid-cols-4';
    return 'grid-cols-8';
  };

  // Determinar o número total de slots para preencher
  const getTotalSlots = () => {
    if (isMobile) return 15; // 3x5 grid
    if (isTablet) return 16; // 4x4 grid
    return 32; // 8x4 grid (desktop)
  };

  // Altura fixa dos slots vazios para manter consistência
  const getSlotHeight = () => {
    if (isMobile) return 'h-[60px]';
    if (isTablet) return 'h-[70px]';
    return 'h-[80px]';
  };

  // Filtrar materiais por categoria e ordenar alfabeticamente
  const filteredMaterials = React.useMemo(() => {
    let result = selectedCategoryId === null 
      ? materials 
      : materials.filter(m => m.category_id === selectedCategoryId);
    
    // Ordenar alfabeticamente
    return result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [materials, selectedCategoryId]);

  const totalSlots = getTotalSlots();

  return (
    <>
      <div data-tutorial="material-grid" className={`grid ${getGridCols()} gap-[2px] bg-slate-800 relative p-[2px]`}>
        {filteredMaterials.map((material) => (
          <button
            key={material.id}
            onClick={() => handleClick(material)}
            className={`${getMaterialButtonClass()} ${isMobile ? 'p-1' : 'p-2'} gpu-accelerated active:scale-95 transition-transform duration-50`}
          >
            <span className={`${getNameFontSizeClass()} font-bold text-center leading-tight block text-white`}>
              {material.name}
            </span>
            {config.showPricePerKg && (
              <span className={`${getFontSizeClass()} block mt-1 flex items-center justify-center gap-0.5`}>
                <span className={isSaleMode ? 'text-amber-200' : 'text-emerald-300'}>
                  {formatPrice(material)}
                </span>
                {getPriceIndicator(material, isSaleMode) && (
                  <span className={`${getPriceIndicator(material, isSaleMode)!.colorClass} font-bold`}>
                    {getPriceIndicator(material, isSaleMode)!.symbol}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
        
        {/* Preencher espaços vazios */}
        {Array.from({ length: Math.max(0, totalSlots - filteredMaterials.length) }).map((_, index) => (
          <div key={`empty-${index}`} className={`bg-slate-900 border border-slate-700 ${getSlotHeight()}`}></div>
        ))}
      </div>

      <MaterialConfigModal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </>
  );
}, (prevProps, nextProps) => {
  // Comparação otimizada - só re-renderiza se necessário
  return (
    prevProps.materials.length === nextProps.materials.length &&
    prevProps.isSaleMode === nextProps.isSaleMode &&
    prevProps.hasActiveOrder === nextProps.hasActiveOrder &&
    prevProps.selectedCategoryId === nextProps.selectedCategoryId
  );
});

MaterialGrid.displayName = 'MaterialGrid';

export default MaterialGrid;
