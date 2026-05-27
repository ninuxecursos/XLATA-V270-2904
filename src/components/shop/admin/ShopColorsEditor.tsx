import { useState, useMemo } from 'react';
import { Palette, RotateCcw, Eye, Zap, Sparkles, Star, Circle, Hexagon, Grid3X3, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ShopColors, getDefaultColors } from '@/hooks/useShopConfig';
import { toast } from 'sonner';

interface ShopColorsEditorProps {
  colors: ShopColors;
  onChange: (colors: ShopColors) => void;
  onSave: () => void;
  isSaving?: boolean;
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

function ColorField({ label, value, onChange, description }: ColorFieldProps) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="relative shrink-0">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 p-0.5 cursor-pointer border-gray-300 bg-white rounded-lg overflow-hidden"
        />
      </div>
      <div className="flex-1 min-w-0">
        <Label className="text-gray-900 text-sm font-medium block">{label}</Label>
        {description && (
          <p className="text-[11px] text-gray-500 truncate">{description}</p>
        )}
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 h-8 bg-white text-gray-900 border-gray-300 font-mono text-xs text-center"
      />
    </div>
  );
}

// Componente de preview de efeitos
function EffectsPreview({ colors }: { colors: ShopColors }) {
  const particleCount = colors.particles_intensity === 'low' ? 5 : colors.particles_intensity === 'high' ? 20 : 10;
  const baseSize = colors.particles_size === 'small' ? 4 : colors.particles_size === 'large' ? 10 : 6;
  const animSpeed = colors.particles_speed === 'slow' ? 4 : colors.particles_speed === 'fast' ? 1.5 : 2.5;
  const glowIntensity = colors.glow_intensity === 'subtle' ? 15 : colors.glow_intensity === 'strong' ? 40 : 25;
  const glowSpeed = colors.glow_animation_speed === 'slow' ? 3 : colors.glow_animation_speed === 'fast' ? 1 : 2;

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => {
      const useSecondary = colors.particles_color_mix && i % 2 === 0;
      const size = baseSize + (Math.random() * baseSize * 0.5);
      const delay = Math.random() * 2;
      const duration = animSpeed + (Math.random() * 1.5);
      const left = 5 + (Math.random() * 90);
      const top = 5 + (Math.random() * 90);
      
      return { 
        id: i, 
        useSecondary, 
        size, 
        delay, 
        duration, 
        left, 
        top,
        opacity: 0.3 + (Math.random() * 0.5)
      };
    });
  }, [particleCount, baseSize, animSpeed, colors.particles_color_mix]);

  const getParticleShape = (style: string, id: number): string => {
    switch (style) {
      case 'stars': return '0%'; // quadrado rotacionado vira estrela com clip-path
      case 'sparkles': return '25%';
      case 'mixed': return id % 2 === 0 ? '50%' : '25%';
      default: return '50%'; // circles
    }
  };

  return (
    <div 
      className="h-48 rounded-lg relative overflow-hidden flex items-center justify-center"
      style={{ backgroundColor: colors.background_alt }}
    >
      {/* Particles Effect */}
      {colors.enable_particles && particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute pointer-events-none"
          style={{ 
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.useSecondary 
              ? (colors.particles_color_secondary || '#EC4899') 
              : (colors.particles_color || '#A855F7'),
            borderRadius: getParticleShape(colors.particles_style || 'circles', particle.id),
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            opacity: particle.opacity,
            animation: `shop-float-particle ${particle.duration}s ease-in-out infinite ${particle.delay}s`,
          }}
        />
      ))}
      
      {/* Interactive Card Preview */}
      <div 
        className="relative z-10 px-8 py-5 rounded-xl overflow-hidden"
        style={{ 
          backgroundColor: colors.interactive_card_bg || '#FFFFFF',
          border: `2px solid ${colors.interactive_card_border || '#A855F7'}`,
          boxShadow: colors.enable_border_animation 
            ? `0 0 ${glowIntensity}px ${colors.interactive_glow_color || '#A855F7'}60` 
            : `0 4px 12px rgba(0,0,0,0.1)`,
          animation: colors.enable_border_animation 
            ? `shop-pulse-glow ${glowSpeed}s ease-in-out infinite`
            : 'none'
        }}
      >
        {/* Shimmer Effect */}
        {colors.enable_shimmer && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${colors.shimmer_color || '#FFFFFF'}40 50%, transparent 100%)`,
              backgroundSize: '200% 100%',
              animation: 'shop-shimmer 2s ease-in-out infinite',
            }}
          />
        )}
        
        <div className="text-center relative z-10">
          <div 
            className="w-12 h-12 rounded-lg mx-auto mb-2 flex items-center justify-center"
            style={{ backgroundColor: `${colors.interactive_card_border || '#A855F7'}20` }}
          >
            <Zap 
              className="w-6 h-6" 
              style={{ 
                color: colors.interactive_card_border || '#A855F7',
                animation: colors.enable_border_animation 
                  ? `pulse ${glowSpeed * 0.75}s ease-in-out infinite`
                  : 'none'
              }} 
            />
          </div>
          <span 
            className="text-sm font-semibold block"
            style={{ color: colors.text_primary || '#111827' }}
          >
            Card Interativo
          </span>
          <span 
            className="text-xs"
            style={{ color: colors.text_muted || '#9CA3AF' }}
          >
            Valor atual: R$ 150,00
          </span>
        </div>
      </div>
    </div>
  );
}

export function ShopColorsEditor({ colors, onChange, onSave, isSaving }: ShopColorsEditorProps) {
  const [activeTab, setActiveTab] = useState('main');

  const updateColor = (key: keyof ShopColors, value: string | boolean) => {
    onChange({ ...colors, [key]: value });
  };

  const resetToDefaults = () => {
    onChange(getDefaultColors());
    toast.success('Cores restauradas para o padrão');
  };

  const ColorPreview = () => (
    <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Header Preview */}
      <div 
        className="p-3 flex items-center justify-between"
        style={{ 
          backgroundColor: colors.header_bg,
          borderBottom: `1px solid ${colors.header_border}`
        }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ 
              backgroundColor: colors.primary,
              color: '#FFFFFF'
            }}
          >
            L
          </div>
          <span style={{ color: colors.text_primary }} className="font-medium text-sm">
            Loja
          </span>
        </div>
        <button
          className="px-2.5 py-1 rounded-lg text-xs font-medium"
          style={{ 
            backgroundColor: colors.button_login_bg,
            color: colors.button_login_text
          }}
        >
          Entrar
        </button>
      </div>

      {/* Content Preview */}
      <div className="p-3" style={{ backgroundColor: colors.background }}>
        <div className="space-y-2">
          {/* Product Card Preview */}
          <div 
            className="p-2.5 rounded-lg"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <div 
              className="w-full h-12 rounded mb-2"
              style={{ backgroundColor: colors.background_alt }}
            />
            <p style={{ color: colors.text_primary }} className="font-medium text-xs">
              Produto
            </p>
            <div className="flex items-center justify-between mt-1">
              <span style={{ color: colors.success }} className="font-bold text-xs">
                R$ 99,90
              </span>
              <button
                className="px-2 py-0.5 rounded text-[10px] text-white"
                style={{ backgroundColor: colors.button_buy_bg }}
              >
                Comprar
              </button>
            </div>
          </div>

          {/* Interactive Card Preview */}
          <div 
            className="p-2.5 rounded-lg relative"
            style={{ 
              backgroundColor: colors.interactive_card_bg, 
              border: `2px solid ${colors.interactive_card_border}`,
              boxShadow: colors.enable_border_animation 
                ? `0 0 20px ${colors.interactive_glow_color}40`
                : 'none'
            }}
          >
            <div className="flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3" style={{ color: colors.interactive_card_border }} />
              <span className="text-[10px] font-medium" style={{ color: colors.interactive_card_border }}>
                Interativo
              </span>
            </div>
            <p style={{ color: colors.text_primary }} className="font-medium text-xs">
              Produto Especial
            </p>
          </div>

          {/* Badges */}
          <div className="flex gap-1.5 flex-wrap">
            <span 
              className="px-1.5 py-0.5 rounded text-[10px] text-white"
              style={{ backgroundColor: colors.success }}
            >
              Sucesso
            </span>
            <span 
              className="px-1.5 py-0.5 rounded text-[10px] text-white"
              style={{ backgroundColor: colors.warning }}
            >
              Aviso
            </span>
            <span 
              className="px-1.5 py-0.5 rounded text-[10px] text-white"
              style={{ backgroundColor: colors.error }}
            >
              Erro
            </span>
          </div>
        </div>
      </div>

      {/* Footer Preview */}
      <div 
        className="p-2 text-center"
        style={{ backgroundColor: colors.footer_bg }}
      >
        <span className="text-[10px]" style={{ color: colors.footer_text }}>
          © 2026 Loja
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-900 text-sm">Editor de Cores</span>
        </div>
        <Button 
          variant="ghost"
          size="sm"
          onClick={resetToDefaults}
          className="text-gray-500 hover:text-gray-700 h-7 text-xs"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Restaurar
        </Button>
      </div>

      {/* Layout Responsivo - Full Width */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Editor de Cores - Ocupa 2 colunas no XL */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-200 px-3 overflow-x-auto">
              <TabsList className="h-10 bg-transparent p-0 gap-1 flex-nowrap">
                <TabsTrigger 
                  value="main" 
                  className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-t-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors"
                >
                  Principais
                </TabsTrigger>
                <TabsTrigger 
                  value="background" 
                  className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-t-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors"
                >
                  Fundos
                </TabsTrigger>
                <TabsTrigger 
                  value="text" 
                  className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-t-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors"
                >
                  Textos
                </TabsTrigger>
                <TabsTrigger 
                  value="components" 
                  className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-t-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors"
                >
                  Componentes
                </TabsTrigger>
                <TabsTrigger 
                  value="interactive" 
                  className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-t-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Interativo
                </TabsTrigger>
                <TabsTrigger 
                  value="categories" 
                  className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-500 rounded-t-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors"
                >
                  <Grid3X3 className="w-3 h-3 mr-1" />
                  Categorias
                </TabsTrigger>
                <TabsTrigger 
                  value="animations" 
                  className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-t-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Efeitos
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-3 max-h-[450px] overflow-y-auto">
              <TabsContent value="main" className="m-0 space-y-1">
                <ColorField
                  label="Cor Primária"
                  value={colors.primary}
                  onChange={(v) => updateColor('primary', v)}
                  description="Botões, links, destaques"
                />
                <ColorField
                  label="Primária (Hover)"
                  value={colors.primary_hover}
                  onChange={(v) => updateColor('primary_hover', v)}
                  description="Ao passar o mouse"
                />
                <ColorField
                  label="Cor Secundária"
                  value={colors.secondary}
                  onChange={(v) => updateColor('secondary', v)}
                  description="Ações alternativas"
                />
                <ColorField
                  label="Secundária (Hover)"
                  value={colors.secondary_hover}
                  onChange={(v) => updateColor('secondary_hover', v)}
                />
                <ColorField
                  label="Cor de Destaque"
                  value={colors.accent}
                  onChange={(v) => updateColor('accent', v)}
                  description="Promoções, ofertas"
                />
                <ColorField
                  label="Sucesso"
                  value={colors.success}
                  onChange={(v) => updateColor('success', v)}
                  description="Preços, confirmações"
                />
                <ColorField
                  label="Aviso"
                  value={colors.warning}
                  onChange={(v) => updateColor('warning', v)}
                  description="Alertas, atenção"
                />
                <ColorField
                  label="Erro"
                  value={colors.error}
                  onChange={(v) => updateColor('error', v)}
                  description="Erros, cancelamentos"
                />
              </TabsContent>

              <TabsContent value="background" className="m-0 space-y-1">
                <ColorField
                  label="Fundo Principal"
                  value={colors.background}
                  onChange={(v) => updateColor('background', v)}
                  description="Cor de fundo geral"
                />
                <ColorField
                  label="Fundo Alternativo"
                  value={colors.background_alt}
                  onChange={(v) => updateColor('background_alt', v)}
                  description="Seções alternadas"
                />
                <ColorField
                  label="Superfície"
                  value={colors.surface}
                  onChange={(v) => updateColor('surface', v)}
                  description="Cards, modais"
                />
                <ColorField
                  label="Borda"
                  value={colors.border}
                  onChange={(v) => updateColor('border', v)}
                />
                <ColorField
                  label="Borda (Hover)"
                  value={colors.border_hover}
                  onChange={(v) => updateColor('border_hover', v)}
                />
                <ColorField
                  label="Fundo do Footer"
                  value={colors.footer_bg}
                  onChange={(v) => updateColor('footer_bg', v)}
                  description="Rodapé da loja"
                />
                <ColorField
                  label="Texto do Footer"
                  value={colors.footer_text}
                  onChange={(v) => updateColor('footer_text', v)}
                />
              </TabsContent>

              <TabsContent value="text" className="m-0 space-y-1">
                <ColorField
                  label="Texto Principal"
                  value={colors.text_primary}
                  onChange={(v) => updateColor('text_primary', v)}
                  description="Títulos, textos importantes"
                />
                <ColorField
                  label="Texto Secundário"
                  value={colors.text_secondary}
                  onChange={(v) => updateColor('text_secondary', v)}
                  description="Descrições"
                />
                <ColorField
                  label="Texto Discreto"
                  value={colors.text_muted}
                  onChange={(v) => updateColor('text_muted', v)}
                  description="Legendas, datas"
                />
              </TabsContent>

              <TabsContent value="components" className="m-0 space-y-1">
                <p className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded mb-2">
                  Botão Entrar
                </p>
                <ColorField
                  label="Fundo"
                  value={colors.button_login_bg}
                  onChange={(v) => updateColor('button_login_bg', v)}
                  description="Cor do botão de login"
                />
                <ColorField
                  label="Texto"
                  value={colors.button_login_text}
                  onChange={(v) => updateColor('button_login_text', v)}
                />

                <p className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded mt-3 mb-2">
                  Botão Carrinho
                </p>
                <ColorField
                  label="Fundo"
                  value={colors.button_cart_bg}
                  onChange={(v) => updateColor('button_cart_bg', v)}
                  description="Cor do botão carrinho"
                />
                <ColorField
                  label="Texto/Ícone"
                  value={colors.button_cart_text}
                  onChange={(v) => updateColor('button_cart_text', v)}
                />
                <ColorField
                  label="Borda"
                  value={colors.button_cart_border}
                  onChange={(v) => updateColor('button_cart_border', v)}
                />

                <p className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded mt-3 mb-2">
                  Botões Secundários/Outline
                </p>
                <ColorField
                  label="Fundo"
                  value={colors.button_secondary_bg}
                  onChange={(v) => updateColor('button_secondary_bg', v)}
                  description="Botões com estilo outline"
                />
                <ColorField
                  label="Texto"
                  value={colors.button_secondary_text}
                  onChange={(v) => updateColor('button_secondary_text', v)}
                />
                <ColorField
                  label="Borda"
                  value={colors.button_secondary_border}
                  onChange={(v) => updateColor('button_secondary_border', v)}
                />

                <p className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded mt-3 mb-2">
                  Botão Comprar
                </p>
                <ColorField
                  label="Fundo"
                  value={colors.button_buy_bg}
                  onChange={(v) => updateColor('button_buy_bg', v)}
                  description="Cor do botão de compra"
                />

                <p className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded mt-3 mb-2">
                  Header/Menu
                </p>
                <ColorField
                  label="Fundo do Header"
                  value={colors.header_bg}
                  onChange={(v) => updateColor('header_bg', v)}
                  description="Menu superior"
                />
                <ColorField
                  label="Borda do Header"
                  value={colors.header_border}
                  onChange={(v) => updateColor('header_border', v)}
                />
              </TabsContent>

              <TabsContent value="interactive" className="m-0 space-y-2">
                <p className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded mb-2">
                  Cards de Produtos Interativos
                </p>
                <ColorField
                  label="Fundo do Card"
                  value={colors.interactive_card_bg}
                  onChange={(v) => updateColor('interactive_card_bg', v)}
                  description="Cor de fundo dos cards"
                />
                <ColorField
                  label="Borda do Card"
                  value={colors.interactive_card_border}
                  onChange={(v) => updateColor('interactive_card_border', v)}
                  description="Cor da borda e destaques"
                />
                <ColorField
                  label="Cor do Glow"
                  value={colors.interactive_glow_color}
                  onChange={(v) => updateColor('interactive_glow_color', v)}
                  description="Efeito de brilho"
                />

                <p className="text-xs text-gray-500 px-2 py-1 bg-purple-50 rounded mt-3 mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-purple-500" />
                  Seção/Container
                </p>
                <ColorField
                  label="Fundo da Seção"
                  value={colors.interactive_section_bg}
                  onChange={(v) => updateColor('interactive_section_bg', v)}
                  description="Cor de fundo do container"
                />
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div>
                    <Label className="text-gray-900 text-sm font-medium">Gradiente Ativo</Label>
                    <p className="text-[11px] text-gray-500">Aplica gradiente suave no fundo</p>
                  </div>
                  <Switch
                    checked={colors.interactive_section_gradient_enabled}
                    onCheckedChange={(v) => updateColor('interactive_section_gradient_enabled', v)}
                  />
                </div>
                <ColorField
                  label="Cor do Título"
                  value={colors.interactive_section_title_color}
                  onChange={(v) => updateColor('interactive_section_title_color', v)}
                  description="Ex: Ofertas Interativas"
                />
                <ColorField
                  label="Cor do Subtítulo"
                  value={colors.interactive_section_subtitle_color}
                  onChange={(v) => updateColor('interactive_section_subtitle_color', v)}
                  description="Texto descritivo"
                />
                <ColorField
                  label="Fundo do Badge"
                  value={colors.interactive_section_badge_bg}
                  onChange={(v) => updateColor('interactive_section_badge_bg', v)}
                  description="Ex: X ativos"
                />
                <ColorField
                  label="Texto do Badge"
                  value={colors.interactive_section_badge_text}
                  onChange={(v) => updateColor('interactive_section_badge_text', v)}
                />
                <ColorField
                  label="Fundo do Ícone"
                  value={colors.interactive_section_icon_bg}
                  onChange={(v) => updateColor('interactive_section_icon_bg', v)}
                  description="Ícone de raio"
                />
                <ColorField
                  label="Cor do Ícone"
                  value={colors.interactive_section_icon_color}
                  onChange={(v) => updateColor('interactive_section_icon_color', v)}
                />
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div>
                    <Label className="text-gray-900 text-sm font-medium">Borda da Seção</Label>
                    <p className="text-[11px] text-gray-500">Adiciona borda ao redor</p>
                  </div>
                  <Switch
                    checked={colors.interactive_section_border_enabled}
                    onCheckedChange={(v) => updateColor('interactive_section_border_enabled', v)}
                  />
                </div>
                {colors.interactive_section_border_enabled && (
                  <ColorField
                    label="Cor da Borda"
                    value={colors.interactive_section_border_color}
                    onChange={(v) => updateColor('interactive_section_border_color', v)}
                  />
                )}

                {/* Preview do Container */}
                <div className="p-3 rounded-lg border border-gray-200 bg-white mt-3">
                  <p className="text-xs text-gray-500 mb-2">Preview da Seção:</p>
                  <div 
                    className="rounded-lg p-3 relative overflow-hidden"
                    style={{ 
                      backgroundColor: colors.interactive_section_bg,
                      background: colors.interactive_section_gradient_enabled
                        ? `linear-gradient(180deg, ${colors.interactive_section_icon_bg}15 0%, ${colors.interactive_section_bg} 100%)`
                        : colors.interactive_section_bg,
                      border: colors.interactive_section_border_enabled 
                        ? `1px solid ${colors.interactive_section_border_color}` 
                        : '1px solid transparent',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ backgroundColor: colors.interactive_section_icon_bg }}
                      >
                        <Zap className="w-3 h-3" style={{ color: colors.interactive_section_icon_color }} />
                      </div>
                      <div>
                        <p 
                          className="text-xs font-semibold"
                          style={{ color: colors.interactive_section_title_color }}
                        >
                          Ofertas Interativas
                        </p>
                        <p 
                          className="text-[9px]"
                          style={{ color: colors.interactive_section_subtitle_color }}
                        >
                          Participe em tempo real
                        </p>
                      </div>
                      <span 
                        className="text-[9px] px-1.5 py-0.5 rounded font-medium ml-auto"
                        style={{ 
                          backgroundColor: colors.interactive_section_badge_bg,
                          color: colors.interactive_section_badge_text 
                        }}
                      >
                        3 ativos
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2].map(i => (
                        <div 
                          key={i} 
                          className="flex-1 rounded p-2"
                          style={{ 
                            backgroundColor: colors.interactive_card_bg,
                            border: `1px solid ${colors.interactive_card_border}30`
                          }}
                        >
                          <div 
                            className="w-full h-8 rounded mb-1"
                            style={{ backgroundColor: colors.background_alt }}
                          />
                          <p className="text-[8px] font-medium" style={{ color: colors.text_primary }}>
                            Produto {i}
                          </p>
                          <p className="text-[10px] font-bold" style={{ color: colors.interactive_card_border }}>
                            R$ 150
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="categories" className="m-0 space-y-2">
                <p className="text-xs text-gray-500 px-2 py-1 bg-green-50 rounded mb-2 flex items-center gap-1">
                  <Grid3X3 className="w-3 h-3 text-green-600" />
                  Container de Categorias
                </p>
                <ColorField
                  label="Fundo da Seção"
                  value={colors.categories_section_bg || '#F3F4F6'}
                  onChange={(v) => updateColor('categories_section_bg', v)}
                  description="Cor de fundo do container"
                />
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div>
                    <Label className="text-gray-900 text-sm font-medium">Gradiente Ativo</Label>
                    <p className="text-[11px] text-gray-500">Aplica gradiente suave no fundo</p>
                  </div>
                  <Switch
                    checked={colors.categories_section_gradient_enabled || false}
                    onCheckedChange={(v) => updateColor('categories_section_gradient_enabled', v)}
                  />
                </div>
                <ColorField
                  label="Cor do Título"
                  value={colors.categories_section_title_color || '#111827'}
                  onChange={(v) => updateColor('categories_section_title_color', v)}
                  description="Ex: Categorias"
                />
                <ColorField
                  label="Cor do Subtítulo"
                  value={colors.categories_section_subtitle_color || '#6B7280'}
                  onChange={(v) => updateColor('categories_section_subtitle_color', v)}
                  description="Texto descritivo"
                />
                <ColorField
                  label="Fundo do Badge"
                  value={colors.categories_section_badge_bg || '#10B98120'}
                  onChange={(v) => updateColor('categories_section_badge_bg', v)}
                  description="Ex: X categorias"
                />
                <ColorField
                  label="Texto do Badge"
                  value={colors.categories_section_badge_text || '#10B981'}
                  onChange={(v) => updateColor('categories_section_badge_text', v)}
                />
                <ColorField
                  label="Cor Principal (Ícones/Seleção)"
                  value={colors.categories_section_icon_bg || '#10B981'}
                  onChange={(v) => updateColor('categories_section_icon_bg', v)}
                  description="Cor dos ícones e itens selecionados"
                />
                <ColorField
                  label="Cor do Ícone"
                  value={colors.categories_section_icon_color || '#FFFFFF'}
                  onChange={(v) => updateColor('categories_section_icon_color', v)}
                />
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div>
                    <Label className="text-gray-900 text-sm font-medium">Borda da Seção</Label>
                    <p className="text-[11px] text-gray-500">Adiciona borda ao redor</p>
                  </div>
                  <Switch
                    checked={colors.categories_section_border_enabled || false}
                    onCheckedChange={(v) => updateColor('categories_section_border_enabled', v)}
                  />
                </div>
                {colors.categories_section_border_enabled && (
                  <ColorField
                    label="Cor da Borda"
                    value={colors.categories_section_border_color || '#10B98130'}
                    onChange={(v) => updateColor('categories_section_border_color', v)}
                  />
                )}

                <p className="text-xs text-gray-500 px-2 py-1 bg-pink-50 rounded mt-3 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-pink-500" />
                  Partículas do Container
                </p>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div>
                    <Label className="text-gray-900 text-sm font-medium">Ativar Partículas</Label>
                    <p className="text-[11px] text-gray-500">Efeito flutuante no container</p>
                  </div>
                  <Switch
                    checked={colors.categories_section_particles_enabled || false}
                    onCheckedChange={(v) => updateColor('categories_section_particles_enabled', v)}
                  />
                </div>
                {colors.categories_section_particles_enabled && (
                  <>
                    <ColorField
                      label="Cor Primária"
                      value={colors.categories_section_particles_color || colors.particles_color || '#10B981'}
                      onChange={(v) => updateColor('categories_section_particles_color', v)}
                      description="Cor principal das partículas"
                    />
                    <ColorField
                      label="Cor Secundária"
                      value={colors.categories_section_particles_color_secondary || '#EC4899'}
                      onChange={(v) => updateColor('categories_section_particles_color_secondary', v)}
                      description="Cor alternada (se mix ativo)"
                    />
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div>
                        <Label className="text-gray-900 text-sm font-medium">Misturar Cores</Label>
                        <p className="text-[11px] text-gray-500">Alterna entre as duas cores</p>
                      </div>
                      <Switch
                        checked={colors.categories_section_particles_mix || false}
                        onCheckedChange={(v) => updateColor('categories_section_particles_mix', v)}
                      />
                    </div>
                  </>
                )}

                {/* Preview do Container de Categorias */}
                <div className="p-3 rounded-lg border border-gray-200 bg-white mt-3">
                  <p className="text-xs text-gray-500 mb-2">Preview da Seção:</p>
                  <div 
                    className="rounded-lg p-3 relative overflow-hidden"
                    style={{ 
                      backgroundColor: colors.categories_section_bg || '#F3F4F6',
                      background: colors.categories_section_gradient_enabled
                        ? `linear-gradient(180deg, ${colors.categories_section_icon_bg || '#10B981'}15 0%, ${colors.categories_section_bg || '#F3F4F6'} 100%)`
                        : colors.categories_section_bg || '#F3F4F6',
                      border: colors.categories_section_border_enabled 
                        ? `1px solid ${colors.categories_section_border_color || '#10B98130'}` 
                        : '1px solid transparent',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ backgroundColor: colors.categories_section_icon_bg || '#10B981' }}
                      >
                        <Grid3X3 className="w-3 h-3" style={{ color: colors.categories_section_icon_color || '#FFFFFF' }} />
                      </div>
                      <div>
                        <p 
                          className="text-xs font-semibold"
                          style={{ color: colors.categories_section_title_color || '#111827' }}
                        >
                          Categorias
                        </p>
                        <p 
                          className="text-[9px]"
                          style={{ color: colors.categories_section_subtitle_color || '#6B7280' }}
                        >
                          Navegue por departamento
                        </p>
                      </div>
                      <span 
                        className="text-[9px] px-1.5 py-0.5 rounded font-medium ml-auto"
                        style={{ 
                          backgroundColor: colors.categories_section_badge_bg || '#10B98120',
                          color: colors.categories_section_badge_text || '#10B981'
                        }}
                      >
                        10 categorias
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {['Móveis', 'Eletro', 'Outros'].map((name, i) => (
                        <div 
                          key={i} 
                          className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg"
                          style={{ 
                            backgroundColor: i === 0 
                              ? (colors.categories_section_icon_bg || '#10B981')
                              : 'rgba(255,255,255,0.9)',
                            boxShadow: i === 0 
                              ? `0 2px 8px ${colors.categories_section_icon_bg || '#10B981'}40` 
                              : '0 1px 4px rgba(0,0,0,0.06)'
                          }}
                        >
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ 
                              backgroundColor: i === 0 
                                ? 'rgba(255,255,255,0.25)' 
                                : `${colors.categories_section_icon_bg || '#10B981'}15`
                            }}
                          >
                            <Package 
                              className="w-3 h-3" 
                              style={{ 
                                color: i === 0 ? '#FFFFFF' : (colors.categories_section_icon_bg || '#10B981')
                              }}
                            />
                          </div>
                          <p 
                            className="text-[8px] font-semibold"
                            style={{ 
                              color: i === 0 ? '#FFFFFF' : (colors.categories_section_title_color || '#111827')
                            }}
                          >
                            {name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="animations" className="m-0 space-y-3">
                {/* Seção Glow */}
                <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-100 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <Label className="text-purple-900 text-sm font-semibold">Efeito Glow/Brilho</Label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-900 text-sm font-medium">Brilho Pulsante</Label>
                      <p className="text-xs text-gray-500">Efeito glow animado nos cards</p>
                    </div>
                    <Switch
                      checked={colors.enable_border_animation}
                      onCheckedChange={(v) => updateColor('enable_border_animation', v)}
                    />
                  </div>

                  {colors.enable_border_animation && (
                    <>
                      <ColorField
                        label="Cor do Glow"
                        value={colors.interactive_glow_color}
                        onChange={(v) => updateColor('interactive_glow_color', v)}
                        description="Cor principal do brilho"
                      />

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-gray-700 text-sm">Intensidade do Glow</Label>
                          <span className="text-xs text-purple-600 font-medium capitalize">
                            {colors.glow_intensity === 'subtle' ? 'Suave' : colors.glow_intensity === 'medium' ? 'Médio' : 'Forte'}
                          </span>
                        </div>
                        <Select 
                          value={colors.glow_intensity || 'medium'} 
                          onValueChange={(v) => updateColor('glow_intensity', v as 'subtle' | 'medium' | 'strong')}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="subtle">Suave</SelectItem>
                            <SelectItem value="medium">Médio</SelectItem>
                            <SelectItem value="strong">Forte</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-gray-700 text-sm">Velocidade da Animação</Label>
                          <span className="text-xs text-purple-600 font-medium capitalize">
                            {colors.glow_animation_speed === 'slow' ? 'Lenta' : colors.glow_animation_speed === 'medium' ? 'Média' : 'Rápida'}
                          </span>
                        </div>
                        <Select 
                          value={colors.glow_animation_speed || 'medium'} 
                          onValueChange={(v) => updateColor('glow_animation_speed', v as 'slow' | 'medium' | 'fast')}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slow">Lenta (3s)</SelectItem>
                            <SelectItem value="medium">Média (2s)</SelectItem>
                            <SelectItem value="fast">Rápida (1s)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Shimmer Effect */}
                  <div className="pt-2 border-t border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-900 text-sm font-medium">Efeito Shimmer</Label>
                        <p className="text-xs text-gray-500">Brilho deslizante sobre os cards</p>
                      </div>
                      <Switch
                        checked={colors.enable_shimmer || false}
                        onCheckedChange={(v) => updateColor('enable_shimmer', v)}
                      />
                    </div>
                    {colors.enable_shimmer && (
                      <div className="mt-2">
                        <ColorField
                          label="Cor do Shimmer"
                          value={colors.shimmer_color || '#FFFFFF'}
                          onChange={(v) => updateColor('shimmer_color', v)}
                          description="Cor do efeito de brilho deslizante"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Seção Partículas */}
                <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Circle className="w-4 h-4 text-amber-600" />
                    <Label className="text-amber-900 text-sm font-semibold">Partículas Flutuantes</Label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-900 text-sm font-medium">Ativar Partículas</Label>
                      <p className="text-xs text-gray-500">Efeito visual animado no fundo</p>
                    </div>
                    <Switch
                      checked={colors.enable_particles}
                      onCheckedChange={(v) => updateColor('enable_particles', v)}
                    />
                  </div>

                  {colors.enable_particles && (
                    <>
                      {/* Cores das Partículas */}
                      <div className="grid grid-cols-2 gap-2">
                        <ColorField
                          label="Cor Primária"
                          value={colors.particles_color}
                          onChange={(v) => updateColor('particles_color', v)}
                          description="Cor principal"
                        />
                        <ColorField
                          label="Cor Secundária"
                          value={colors.particles_color_secondary || '#EC4899'}
                          onChange={(v) => updateColor('particles_color_secondary', v)}
                          description="Cor de mistura"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-900 text-sm font-medium">Misturar Cores</Label>
                          <p className="text-xs text-gray-500">Alterna entre as duas cores</p>
                        </div>
                        <Switch
                          checked={colors.particles_color_mix || false}
                          onCheckedChange={(v) => updateColor('particles_color_mix', v)}
                        />
                      </div>

                      {/* Estilo das Partículas */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 text-sm">Estilo das Partículas</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { value: 'circles', icon: Circle, label: 'Círculos' },
                            { value: 'stars', icon: Star, label: 'Estrelas' },
                            { value: 'sparkles', icon: Sparkles, label: 'Brilhos' },
                            { value: 'mixed', icon: Hexagon, label: 'Misto' },
                          ].map(({ value, icon: Icon, label }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => updateColor('particles_style', value as 'circles' | 'stars' | 'sparkles' | 'mixed')}
                              className={`p-2 rounded-lg border text-center transition-all ${
                                (colors.particles_style || 'circles') === value
                                  ? 'border-amber-500 bg-amber-100 text-amber-700'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-amber-300'
                              }`}
                            >
                              <Icon className="w-4 h-4 mx-auto mb-1" />
                              <span className="text-[10px] block">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Intensidade */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-gray-700 text-sm">Quantidade</Label>
                          <span className="text-xs text-amber-600 font-medium capitalize">
                            {colors.particles_intensity === 'low' ? 'Poucas' : colors.particles_intensity === 'medium' ? 'Moderadas' : 'Muitas'}
                          </span>
                        </div>
                        <Select 
                          value={colors.particles_intensity || 'medium'} 
                          onValueChange={(v) => updateColor('particles_intensity', v as 'low' | 'medium' | 'high')}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Poucas (5)</SelectItem>
                            <SelectItem value="medium">Moderadas (10)</SelectItem>
                            <SelectItem value="high">Muitas (20)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Tamanho */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-gray-700 text-sm">Tamanho</Label>
                          <span className="text-xs text-amber-600 font-medium capitalize">
                            {colors.particles_size === 'small' ? 'Pequenas' : colors.particles_size === 'medium' ? 'Médias' : 'Grandes'}
                          </span>
                        </div>
                        <Select 
                          value={colors.particles_size || 'medium'} 
                          onValueChange={(v) => updateColor('particles_size', v as 'small' | 'medium' | 'large')}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Pequenas</SelectItem>
                            <SelectItem value="medium">Médias</SelectItem>
                            <SelectItem value="large">Grandes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Velocidade */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-gray-700 text-sm">Velocidade</Label>
                          <span className="text-xs text-amber-600 font-medium capitalize">
                            {colors.particles_speed === 'slow' ? 'Lenta' : colors.particles_speed === 'medium' ? 'Média' : 'Rápida'}
                          </span>
                        </div>
                        <Select 
                          value={colors.particles_speed || 'medium'} 
                          onValueChange={(v) => updateColor('particles_speed', v as 'slow' | 'medium' | 'fast')}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slow">Lenta</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="fast">Rápida</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>

                {/* Preview Section with Real Animations */}
                <div className="p-3 rounded-lg border border-gray-200 bg-white">
                  <p className="text-xs text-gray-500 mb-3">Preview dos Efeitos:</p>
                  
                  {/* Preview Container */}
                  <EffectsPreview colors={colors} />

                  {/* Effect Status */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span 
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        colors.enable_border_animation 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {colors.enable_border_animation ? '✓' : '○'} Glow
                    </span>
                    <span 
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        colors.enable_shimmer 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {colors.enable_shimmer ? '✓' : '○'} Shimmer
                    </span>
                    <span 
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        colors.enable_particles 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {colors.enable_particles ? '✓' : '○'} Partículas
                    </span>
                    {colors.enable_particles && colors.particles_color_mix && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                        ✓ Mistura de Cores
                      </span>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Preview - Coluna Lateral */}
        <div className="xl:col-span-1">
          <div className="sticky top-4">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Pré-visualização</span>
            </div>
            <div className="transform scale-100 origin-top">
              <ColorPreview />
            </div>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                💡 As cores são aplicadas após salvar
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
