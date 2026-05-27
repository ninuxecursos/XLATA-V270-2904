import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopAdminSidebar } from '@/components/shop/admin/ShopAdminSidebar';
import { ShopDashboard } from '@/components/shop/admin/ShopDashboard';
import { ShopProductsManager } from '@/components/shop/admin/ShopProductsManager';
import { ShopUsersManager } from '@/components/shop/admin/ShopUsersManager';
import { ShopOrdersManager } from '@/components/shop/admin/ShopOrdersManager';
import { ShopSettings } from '@/components/shop/admin/ShopSettings';
import { InteractiveEventsManager } from '@/components/shop/admin/InteractiveEventsManager';
import { TelegramBotManager } from '@/components/shop/admin/TelegramBotManager';
import { ImageStudioManager } from '@/components/shop/admin/ImageStudioManager';
import { ShopDataCleanup } from '@/components/shop/admin/ShopDataCleanup';
import { AIConfigManager } from '@/components/shop/admin/AIConfigManager';
import { PinterestManager } from '@/components/shop/admin/PinterestManager';
import { ShopSEOManager } from '@/components/shop/admin/ShopSEOManager';

export default function ShopCMS() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActiveSection('orders');
  };

  const handleBack = () => {
    navigate('/covildomal');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <ShopDashboard onViewOrder={handleViewOrder} onSectionChange={setActiveSection} />;
      case 'products':
        return <ShopProductsManager />;
      case 'interactive':
        return <InteractiveEventsManager />;
      case 'users':
        return <ShopUsersManager />;
      case 'orders':
        return <ShopOrdersManager initialOrderId={selectedOrderId} onOrderViewed={() => setSelectedOrderId(null)} />;
      case 'telegram':
        return <TelegramBotManager />;
      case 'image-studio':
        return <ImageStudioManager />;
      case 'cleanup':
        return <ShopDataCleanup />;
      case 'ai-config':
        return <AIConfigManager />;
      case 'pinterest':
        return <PinterestManager />;
      case 'seo':
        return <ShopSEOManager />;
      case 'settings':
        return <ShopSettings />;
      default:
        return <ShopDashboard />;
    }
  };

  return (
     <div className="flex min-h-screen bg-gray-50 light shop-cms" data-theme="light" data-shop-cms="true">
      <ShopAdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onBack={handleBack}
      />
       <main className="shop-cms-main pt-14 lg:pt-0">
         <div className="shop-cms-content min-h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
