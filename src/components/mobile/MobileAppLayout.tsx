import React from 'react';
import { Outlet } from 'react-router-dom';
import MobileAppHeader from './MobileAppHeader';
import MobileAppNavigation from './MobileAppNavigation';

interface MobileAppLayoutProps {
  children?: React.ReactNode;
}

const MobileAppLayout: React.FC<MobileAppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0b1220] flex flex-col">
      {/* Header nativo fixo no topo */}
      <MobileAppHeader />
      
      {/* Conteúdo principal com scroll nativo */}
      <main className="flex-1 overflow-y-auto pb-mobile-nav hide-scrollbar momentum-scroll">
        {children || <Outlet />}
      </main>
      
      {/* Navegação inferior nativa */}
      <MobileAppNavigation />
    </div>
  );
};

export default MobileAppLayout;
