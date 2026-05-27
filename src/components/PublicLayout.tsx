import React from 'react';
import ResponsiveNavigation from './ResponsiveNavigation';
import { LandingFooter } from './landing/LandingFooter';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { BlogLeadPopup } from './BlogLeadPopup';
import { FloatingCTA } from './FloatingCTA';

interface PublicLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function PublicLayout({ children, showFooter = true }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <ResponsiveNavigation companyPhone="(11) 96351-2105" />
      <PWAInstallPrompt />
      <BlogLeadPopup />
      <FloatingCTA />
      <main>{children}</main>
      {showFooter && <LandingFooter />}
    </div>
  );
}

export default PublicLayout;
