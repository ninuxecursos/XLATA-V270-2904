import { ReactNode } from 'react';
import { ShopHeader } from './ShopHeader';
import { ShopBottomNav } from '../mobile/ShopBottomNav';
import { ShopThemeProvider } from './ShopThemeProvider';
import { ShopFooter } from './ShopFooter';
import { ShopReviewsSection } from './ShopReviewsSection';
import { ShopLocationSection } from './ShopLocationSection';
import { useShopConfig } from '@/hooks/useShopConfig';

interface ShopLayoutProps {
  children: ReactNode;
  hideBottomNav?: boolean;
  showFooterSections?: boolean;
}

export function ShopLayout({ children, hideBottomNav = false, showFooterSections = false }: ShopLayoutProps) {
  const { data: config } = useShopConfig();

  const colors = config?.colors;

  return (
    <ShopThemeProvider colors={colors}>
      <div 
        className="min-h-screen light"
        data-theme="light"
        style={{ 
          backgroundColor: colors?.background || '#F9FAFB',
          color: colors?.text_primary || '#111827'
        }}
      >
        <ShopHeader />
        <main className="pb-20 lg:pb-0">
          {!config?.is_open && (
            <div 
              className="border-b px-4 py-3 text-center"
              style={{ 
                backgroundColor: colors?.warning ? `${colors.warning}15` : '#FEF3C7',
                borderColor: colors?.warning ? `${colors.warning}40` : '#F59E0B40'
              }}
            >
              <p 
                className="text-sm font-medium"
                style={{ color: colors?.warning || '#D97706' }}
              >
                🔒 A loja está temporariamente fechada. Volte em breve!
              </p>
            </div>
          )}
          {children}
        </main>
        
        {/* Footer Sections - Reviews & Location */}
        {showFooterSections && (
          <>
            <ShopReviewsSection 
              reviews={config?.reviews || []} 
              colors={colors}
            />
            <ShopLocationSection 
              footerConfig={config?.footer_config}
              colors={colors}
            />
          </>
        )}

        {/* Professional Footer */}
        <ShopFooter />
        
        {/* Bottom Navigation - Mobile Only */}
        {!hideBottomNav && <ShopBottomNav />}
      </div>
    </ShopThemeProvider>
  );
}
