 // ============================================
 // MOBILE NATIVE DESIGN SYSTEM TOKENS
 // XLata - iOS/Android Native App Experience
 // ============================================
 
 export const mobileDesignTokens = {
   // Border Radius
   radius: {
     xs: '6px',
     sm: '8px',
     md: '12px',
     lg: '16px',
     xl: '20px',
     full: '9999px',
   },
 
   // Shadows - iOS Style
   shadow: {
     sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
     md: '0 2px 8px rgba(0, 0, 0, 0.08)',
     lg: '0 4px 16px rgba(0, 0, 0, 0.12)',
     xl: '0 8px 32px rgba(0, 0, 0, 0.16)',
     float: '0 12px 40px rgba(0, 0, 0, 0.2)',
     inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
   },
 
   // Spacing
   spacing: {
     xs: '4px',
     sm: '8px',
     md: '12px',
     lg: '16px',
     xl: '20px',
     '2xl': '24px',
     '3xl': '32px',
     '4xl': '48px',
   },
 
   // Touch Targets
   touchTarget: {
     min: '44px',
     comfortable: '48px',
     large: '56px',
   },
 
   // Typography Scale
   fontSize: {
     xs: '11px',
     sm: '13px',
     base: '15px',
     lg: '17px',
     xl: '20px',
     '2xl': '24px',
     '3xl': '28px',
     '4xl': '34px',
   },
 
   // Animation Timings
   animation: {
     fast: '100ms',
     normal: '200ms',
     slow: '300ms',
     easing: {
       default: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
       spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
       smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
     },
   },
 
   // Z-Index Scale
   zIndex: {
     base: 0,
     dropdown: 10,
     sticky: 20,
     fixed: 30,
     modalBackdrop: 40,
     modal: 50,
     popover: 60,
     tooltip: 70,
   },
 } as const;
 
 // CSS Classes for mobile-native experience
 export const mobileClasses = {
   // Cards
   card: 'rounded-2xl bg-card shadow-md border border-border/50',
   cardPressed: 'active:scale-[0.98] transition-transform duration-100',
   
   // Inputs
   input: 'h-12 px-4 rounded-xl bg-muted/50 border-0 text-base focus:ring-2 focus:ring-primary/30',
   
   // Buttons
   buttonLarge: 'h-14 px-6 rounded-xl text-base font-semibold',
   buttonMedium: 'h-12 px-5 rounded-xl text-sm font-medium',
   buttonPressed: 'active:scale-[0.97] transition-transform duration-75',
   
   // Layout
   safeAreaTop: 'pt-[env(safe-area-inset-top)]',
   safeAreaBottom: 'pb-[env(safe-area-inset-bottom)]',
   touchTarget: 'min-h-[44px] min-w-[44px]',
   
   // Typography
   titleLarge: 'text-2xl font-bold tracking-tight',
   titleMedium: 'text-lg font-semibold',
   bodyLarge: 'text-base leading-relaxed',
   caption: 'text-xs text-muted-foreground',
 } as const;
 
 export default mobileDesignTokens;