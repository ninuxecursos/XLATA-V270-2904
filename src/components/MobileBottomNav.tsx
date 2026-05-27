import React from 'react';
import { Scale, Grid3X3, ShoppingCart, Menu, Settings } from 'lucide-react';

export type MobileTab = 'scale' | 'materials' | 'orders' | 'menu';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  orderCount?: number;
  isSaleMode?: boolean;
  pulseMaterials?: boolean;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  orderCount = 0,
  isSaleMode = false,
  pulseMaterials = false
}) => {
  const tabs = [
    { id: 'scale' as MobileTab, label: 'Balança', icon: Scale },
    { id: 'materials' as MobileTab, label: 'Materiais', icon: Grid3X3 },
    { id: 'orders' as MobileTab, label: 'Pedidos', icon: ShoppingCart, badge: orderCount },
    { id: 'menu' as MobileTab, label: 'Menu', icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const shouldPulse = tab.id === 'materials' && pulseMaterials && !isActive;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 px-1 transition-colors duration-75 relative active:scale-95 ${
                isActive 
                  ? 'text-emerald-400' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {/* Indicador ativo */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-emerald-500 rounded-b-full" />
              )}
              
              <div className={`flex flex-col items-center ${shouldPulse ? 'animate-scale-pulse-zoom' : ''}`}>
                <div className="relative">
                  <Icon className={`w-6 h-6 mb-1 transition-transform duration-75 ${isActive ? 'scale-110' : ''}`} />
                  
                  {/* Badge para pedidos */}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                
                <span className={`text-[10px] font-medium ${
                  isActive ? 'text-emerald-400 transition-colors duration-75' : shouldPulse ? '' : 'text-slate-500 transition-colors duration-75'
                }`}>
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
