import { useEffect } from 'react';
import { ShopColors } from '@/hooks/useShopConfig';

interface ShopThemeProviderProps {
  colors?: ShopColors;
  children: React.ReactNode;
}

export function ShopThemeProvider({ colors, children }: ShopThemeProviderProps) {
  useEffect(() => {
    if (!colors) return;

    const root = document.documentElement;
    
    // Aplicar cores como CSS variables
    root.style.setProperty('--shop-primary', colors.primary);
    root.style.setProperty('--shop-primary-hover', colors.primary_hover);
    root.style.setProperty('--shop-secondary', colors.secondary);
    root.style.setProperty('--shop-secondary-hover', colors.secondary_hover);
    root.style.setProperty('--shop-background', colors.background);
    root.style.setProperty('--shop-background-alt', colors.background_alt);
    root.style.setProperty('--shop-surface', colors.surface);
    root.style.setProperty('--shop-text-primary', colors.text_primary);
    root.style.setProperty('--shop-text-secondary', colors.text_secondary);
    root.style.setProperty('--shop-text-muted', colors.text_muted);
    root.style.setProperty('--shop-accent', colors.accent);
    root.style.setProperty('--shop-success', colors.success);
    root.style.setProperty('--shop-warning', colors.warning);
    root.style.setProperty('--shop-error', colors.error);
    root.style.setProperty('--shop-border', colors.border);
    root.style.setProperty('--shop-border-hover', colors.border_hover);

    // Novas variáveis - Botões
    root.style.setProperty('--shop-button-login-bg', colors.button_login_bg);
    root.style.setProperty('--shop-button-login-text', colors.button_login_text);
    root.style.setProperty('--shop-button-buy-bg', colors.button_buy_bg);

    // Header
    root.style.setProperty('--shop-header-bg', colors.header_bg);
    root.style.setProperty('--shop-header-border', colors.header_border);

    // Cards Interativos
    root.style.setProperty('--shop-interactive-card-bg', colors.interactive_card_bg);
    root.style.setProperty('--shop-interactive-card-border', colors.interactive_card_border);
    root.style.setProperty('--shop-interactive-glow-color', colors.interactive_glow_color);

    // Footer
    root.style.setProperty('--shop-footer-bg', colors.footer_bg);
    root.style.setProperty('--shop-footer-text', colors.footer_text);

    // Partículas
    root.style.setProperty('--shop-particles-color', colors.particles_color);

    // Animações
    root.style.setProperty('--shop-enable-border-animation', colors.enable_border_animation ? '1' : '0');
    root.style.setProperty('--shop-enable-particles', colors.enable_particles ? '1' : '0');

    // Cleanup
    return () => {
      root.style.removeProperty('--shop-primary');
      root.style.removeProperty('--shop-primary-hover');
      root.style.removeProperty('--shop-secondary');
      root.style.removeProperty('--shop-secondary-hover');
      root.style.removeProperty('--shop-background');
      root.style.removeProperty('--shop-background-alt');
      root.style.removeProperty('--shop-surface');
      root.style.removeProperty('--shop-text-primary');
      root.style.removeProperty('--shop-text-secondary');
      root.style.removeProperty('--shop-text-muted');
      root.style.removeProperty('--shop-accent');
      root.style.removeProperty('--shop-success');
      root.style.removeProperty('--shop-warning');
      root.style.removeProperty('--shop-error');
      root.style.removeProperty('--shop-border');
      root.style.removeProperty('--shop-border-hover');
      root.style.removeProperty('--shop-button-login-bg');
      root.style.removeProperty('--shop-button-login-text');
      root.style.removeProperty('--shop-button-buy-bg');
      root.style.removeProperty('--shop-header-bg');
      root.style.removeProperty('--shop-header-border');
      root.style.removeProperty('--shop-interactive-card-bg');
      root.style.removeProperty('--shop-interactive-card-border');
      root.style.removeProperty('--shop-interactive-glow-color');
      root.style.removeProperty('--shop-footer-bg');
      root.style.removeProperty('--shop-footer-text');
      root.style.removeProperty('--shop-particles-color');
      root.style.removeProperty('--shop-enable-border-animation');
      root.style.removeProperty('--shop-enable-particles');
    };
  }, [colors]);

  return <>{children}</>;
}
