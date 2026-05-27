import { useState } from 'react';
import { LayoutDashboard, Package, Users, ShoppingCart, Settings, ArrowLeft, Store, Zap, ExternalLink, Menu, X, Send, Trash2, Sparkles, Brain, PinIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ShopAdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onBack: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'interactive', label: 'Interativas', icon: Zap },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
  { id: 'telegram', label: 'Telegram', icon: Send },
  { id: 'image-studio', label: 'Prompts', icon: Sparkles },
  { id: 'ai-config', label: 'Config. IA', icon: Brain },
  { id: 'pinterest', label: 'Pinterest', icon: PinIcon },
  { id: 'seo', label: 'SEO & Sitemap', icon: Search },
  { id: 'cleanup', label: 'Exclusão e Backup', icon: Trash2 },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export function ShopAdminSidebar({ activeSection, onSectionChange, onBack }: ShopAdminSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[hsl(var(--shop-bg-card))] backdrop-blur-lg border-b border-[hsl(var(--shop-border-default))] px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="h-10 w-10 p-0 rounded-xl bg-[hsl(var(--shop-bg-elevated))] hover:bg-[hsl(var(--shop-bg-page))] min-h-[44px]"
          >
            {isMobileOpen ? <X className="w-5 h-5 text-[hsl(var(--shop-text-primary))]" /> : <Menu className="w-5 h-5 text-[hsl(var(--shop-text-primary))]" />}
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[hsl(var(--shop-primary))] to-[hsl(var(--shop-primary-hover))] rounded-xl flex items-center justify-center shadow-sm">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-[hsl(var(--shop-text-primary))] text-sm block leading-tight">CMS Loja</span>
              <span className="text-[11px] text-[hsl(var(--shop-text-muted))]">Gerenciamento</span>
            </div>
          </div>
        </div>
        <a 
          href="/shop" 
          target="_blank"
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-[hsl(var(--shop-primary)/0.1)] text-[hsl(var(--shop-primary))] hover:bg-[hsl(var(--shop-primary)/0.15)] transition-colors min-h-[44px]"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-[hsl(var(--shop-bg-card))] backdrop-blur-lg border-r border-[hsl(var(--shop-border-default))] flex flex-col",
        // Mobile: fixed for menu overlay
        "fixed z-50",
        // Desktop: sticky to stay in place on scroll
        "lg:sticky lg:top-0 lg:h-screen",
        "h-screen",
        "w-[280px] lg:w-60",
        "transition-transform duration-200 ease-in-out",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        // Offset for mobile header
        "pt-16 lg:pt-0"
      )}>
        {/* Desktop Header */}
        <div className="hidden lg:block p-4 border-b border-[hsl(var(--shop-border-default))]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[hsl(var(--shop-primary))] to-[hsl(var(--shop-primary-hover))] rounded-xl flex items-center justify-center shadow-sm">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-[hsl(var(--shop-text-primary))] text-sm leading-tight">CMS Loja</h1>
              <p className="text-[11px] text-[hsl(var(--shop-text-muted))] leading-tight">Gerenciamento</p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="w-full justify-start text-[hsl(var(--shop-text-secondary))] hover:text-[hsl(var(--shop-text-primary))] hover:bg-[hsl(var(--shop-bg-elevated))] h-10 text-xs rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            Voltar ao Admin
          </Button>
        </div>

        {/* Mobile Back Button */}
        <div className="lg:hidden px-4 py-3 border-b border-[hsl(var(--shop-border-default))]">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="w-full justify-start text-[hsl(var(--shop-text-secondary))] hover:text-[hsl(var(--shop-text-primary))] hover:bg-[hsl(var(--shop-bg-elevated))] h-11 text-sm rounded-xl min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            Voltar ao Admin
          </Button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px]",
                  isActive 
                    ? "bg-gradient-to-r from-[hsl(var(--shop-primary))] to-[hsl(var(--shop-primary-hover))] text-white shadow-md" 
                    : "text-[hsl(var(--shop-text-secondary))] hover:bg-[hsl(var(--shop-bg-elevated))] hover:text-[hsl(var(--shop-text-primary))] active:scale-[0.98]"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5",
                  isActive ? "text-white" : "text-[hsl(var(--shop-text-muted))]"
                )} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[hsl(var(--shop-border-default))]">
          <a 
            href="/shop" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-medium text-[hsl(var(--shop-primary))] bg-[hsl(var(--shop-primary)/0.1)] hover:bg-[hsl(var(--shop-primary)/0.15)] transition-all duration-200 active:scale-[0.98] min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Ver Loja
            </div>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </aside>
    </>
  );
}
