import { useState, useEffect } from 'react';
import { Save, Store, Power, Palette, Image as ImageIcon, MapPin, Layout, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useShopConfig, useUpdateShopConfig, HeroSlide, ShopColors, getDefaultColors, FooterConfig, getDefaultFooterConfig, ShopReview, HeaderConfig, DEFAULT_HEADER_CONFIG, InstitutionalPages, getDefaultInstitutionalPages } from '@/hooks/useShopConfig';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { HeroSlidesManager } from './HeroSlidesManager';
import { ShopColorsEditor } from './ShopColorsEditor';
import { ShopFooterManager } from './ShopFooterManager';
import { HeaderTemplateManager } from './HeaderTemplateManager';
import { ShopInstitutionalPagesEditor } from './ShopInstitutionalPagesEditor';

export function ShopSettings() {
  const { data: config, isLoading } = useShopConfig();
  const updateConfig = useUpdateShopConfig();
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState({
    store_name: 'Loja XLata',
    store_logo: null as string | null,
    primary_color: '#10B981',
    secondary_color: '#059669',
    tagline: '',
    is_open: true,
    show_store_name: true,
    hero_slides: [] as HeroSlide[],
    colors: getDefaultColors() as ShopColors,
    footer_config: getDefaultFooterConfig() as FooterConfig,
    reviews: [] as ShopReview[],
    header_config: DEFAULT_HEADER_CONFIG as HeaderConfig,
    institutional_pages: getDefaultInstitutionalPages() as InstitutionalPages,
    show_buy_now_button: true,
    show_interest_button: true,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        store_name: config.store_name,
        store_logo: config.store_logo,
        primary_color: config.primary_color,
        secondary_color: config.secondary_color,
        tagline: config.tagline || '',
        is_open: config.is_open,
        show_store_name: config.show_store_name ?? true,
        hero_slides: config.hero_slides || [],
        colors: config.colors || getDefaultColors(),
        footer_config: config.footer_config || getDefaultFooterConfig(),
        reviews: config.reviews || [],
        header_config: config.header_config || DEFAULT_HEADER_CONFIG,
        institutional_pages: config.institutional_pages || getDefaultInstitutionalPages(),
        show_buy_now_button: config.show_buy_now_button ?? true,
        show_interest_button: config.show_interest_button ?? true,
      });
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync(formData);
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center shop-cms">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[hsl(var(--shop-primary))] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-[hsl(var(--shop-text-muted))] text-sm">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col shop-cms">
      {/* Header Compacto */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[hsl(var(--shop-border-default))] bg-[hsl(var(--shop-bg-card))] shrink-0">
        <div>
          <h1 className="text-lg font-bold text-[hsl(var(--shop-text-primary))]">Configurações</h1>
          <p className="text-sm text-[hsl(var(--shop-text-muted))]">Personalize sua loja</p>
        </div>
        
        <Button 
          onClick={handleSave} 
          size="sm"
          className="shop-btn-primary h-11 min-h-[44px]"
          disabled={updateConfig.isPending}
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          {updateConfig.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      {/* Content com Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b border-[hsl(var(--shop-border-default))] bg-[hsl(var(--shop-bg-elevated))] px-4 shrink-0 overflow-x-auto">
            <TabsList className="h-12 bg-transparent p-0 gap-1 md:gap-2 flex-nowrap">
              <TabsTrigger 
                value="general" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--shop-primary))] data-[state=active]:text-[hsl(var(--shop-primary))] rounded-none px-3 pb-3 text-sm font-medium whitespace-nowrap min-h-[44px]"
              >
                <Store className="w-4 h-4 mr-1.5" />
                Geral
              </TabsTrigger>
              <TabsTrigger 
                value="colors" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--shop-primary))] data-[state=active]:text-[hsl(var(--shop-primary))] rounded-none px-3 pb-3 text-sm font-medium whitespace-nowrap min-h-[44px]"
              >
                <Palette className="w-4 h-4 mr-1.5" />
                Cores
              </TabsTrigger>
              <TabsTrigger 
                value="banners" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--shop-primary))] data-[state=active]:text-[hsl(var(--shop-primary))] rounded-none px-3 pb-3 text-sm font-medium whitespace-nowrap min-h-[44px]"
              >
                <ImageIcon className="w-4 h-4 mr-1.5" />
                Banners
              </TabsTrigger>
              <TabsTrigger 
                value="header" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--shop-primary))] data-[state=active]:text-[hsl(var(--shop-primary))] rounded-none px-3 pb-3 text-sm font-medium whitespace-nowrap min-h-[44px]"
              >
                <Layout className="w-4 h-4 mr-1.5" />
                Header
              </TabsTrigger>
              <TabsTrigger 
                value="footer" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--shop-primary))] data-[state=active]:text-[hsl(var(--shop-primary))] rounded-none px-3 pb-3 text-sm font-medium whitespace-nowrap min-h-[44px]"
              >
                <MapPin className="w-4 h-4 mr-1.5" />
                Footer
              </TabsTrigger>
              <TabsTrigger 
                value="pages" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--shop-primary))] data-[state=active]:text-[hsl(var(--shop-primary))] rounded-none px-3 pb-3 text-sm font-medium whitespace-nowrap min-h-[44px]"
              >
                <FileText className="w-4 h-4 mr-1.5" />
                Páginas
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Tab: Geral */}
            <TabsContent value="general" className="m-0 p-4 space-y-4 bg-[hsl(var(--shop-bg-page))]">
              {/* Status da Loja - Destaque */}
              <div className="shop-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.is_open ? 'bg-[hsl(var(--shop-success)/0.15)]' : 'bg-[hsl(var(--shop-bg-elevated))]'}`}>
                      <Power className={`w-5 h-5 ${formData.is_open ? 'text-[hsl(var(--shop-success))]' : 'text-[hsl(var(--shop-text-muted))]'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-[hsl(var(--shop-text-primary))]">
                        {formData.is_open ? 'Loja Aberta' : 'Loja Fechada'}
                      </p>
                      <p className="text-sm text-[hsl(var(--shop-text-muted))]">
                        {formData.is_open 
                          ? 'Clientes podem fazer compras normalmente'
                          : 'Clientes verão uma mensagem de indisponível'
                        }
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.is_open}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_open: checked }))}
                  />
                </div>
              </div>

              {/* Identidade da Loja */}
              <div className="shop-card p-4 space-y-4">
                <h3 className="font-semibold text-[hsl(var(--shop-text-primary))] flex items-center gap-2">
                  <Store className="w-4 h-4 text-[hsl(var(--shop-text-muted))]" />
                  Identidade da Loja
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="store_name" className="text-sm font-medium text-[hsl(var(--shop-text-primary))]">
                      Nome da Loja
                    </Label>
                    <Input
                      id="store_name"
                      value={formData.store_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
                      placeholder="Minha Loja"
                      className="shop-input h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[hsl(var(--shop-text-primary))]">Logo</Label>
                    <ImageUploader
                      value={formData.store_logo}
                      onChange={(url) => setFormData(prev => ({ ...prev, store_logo: url }))}
                      bucket="landing-images"
                      folder="shop-logo"
                      showPreview={false}
                      placeholder="URL da logo ou upload"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline" className="text-sm font-medium text-[hsl(var(--shop-text-primary))]">
                    Slogan / Texto Institucional
                  </Label>
                  <Textarea
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="Sua loja de confiança"
                    rows={2}
                    className="shop-input resize-none min-h-[80px]"
                  />
                </div>

                {/* Exibir Nome da Loja no Header */}
                <div className="pt-4 border-t border-[hsl(var(--shop-border-light))]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[hsl(var(--shop-text-primary))]">
                        Exibir nome ao lado do logo
                      </p>
                      <p className="text-sm text-[hsl(var(--shop-text-muted))]">
                        Mostra o nome da loja no menu superior
                      </p>
                    </div>
                    <Switch
                      checked={formData.show_store_name}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_store_name: checked }))}
                    />
                  </div>
                </div>

                {/* Botões do Produto */}
                <div className="pt-4 border-t border-[hsl(var(--shop-border-light))]">
                  <h4 className="font-medium text-[hsl(var(--shop-text-primary))] mb-3">Botões do Produto</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[hsl(var(--shop-text-primary))]">
                          Exibir botão "Comprar Agora"
                        </p>
                        <p className="text-sm text-[hsl(var(--shop-text-muted))]">
                          Botão de compra direta na página do produto
                        </p>
                      </div>
                      <Switch
                        checked={formData.show_buy_now_button}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_buy_now_button: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[hsl(var(--shop-text-primary))]">
                          Exibir botão "Tenho Interesse" (WhatsApp)
                        </p>
                        <p className="text-sm text-[hsl(var(--shop-text-muted))]">
                          Encaminha o cliente para o WhatsApp com dados do produto
                        </p>
                      </div>
                      <Switch
                        checked={formData.show_interest_button}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_interest_button: checked }))}
                      />
                    </div>

                    {/* Preview da mensagem WhatsApp */}
                    {formData.show_interest_button && (
                      <div className="mt-4 rounded-xl border-l-4 border-[#25D366] bg-[hsl(var(--shop-bg-elevated))] p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white fill-current">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.347 0-4.518-.809-6.237-2.16l-.436-.348-3.2 1.073 1.073-3.2-.348-.436A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[hsl(var(--shop-text-primary))]">Preview da mensagem</p>
                            <p className="text-xs text-[hsl(var(--shop-text-muted))]">Exemplo de como o cliente verá ao clicar</p>
                          </div>
                        </div>
                        <div className="bg-[hsl(var(--shop-bg-page))] rounded-lg p-3 text-sm text-[hsl(var(--shop-text-secondary))] whitespace-pre-line leading-relaxed">
{`Olá! Tenho interesse neste produto:

📦 Produto: Camiseta Básica Preta
💰 Preço: R$ 49,90
🏷️ Condição: Novo
📋 SKU: XL-20260227-A1B2
🔗 Link: https://xlata.site/shop/camiseta-basica-preta

Gostaria de mais informações!`}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview da Logo */}
                {formData.store_logo && (
                  <div className="pt-4 border-t border-[hsl(var(--shop-border-light))]">
                    <p className="text-sm text-[hsl(var(--shop-text-muted))] mb-3">Preview da Logo:</p>
                    <div className="inline-flex items-center gap-3 bg-[hsl(var(--shop-bg-elevated))] rounded-xl p-4">
                      <img 
                        src={formData.store_logo} 
                        alt="Logo" 
                        className="h-10 w-auto object-contain"
                      />
                      {formData.show_store_name && (
                        <span className="font-semibold text-[hsl(var(--shop-text-primary))]">{formData.store_name}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Cores */}
            <TabsContent value="colors" className="m-0 p-4 bg-[hsl(var(--shop-bg-page))]">
              <ShopColorsEditor
                colors={formData.colors}
                onChange={(colors) => setFormData(prev => ({ 
                  ...prev, 
                  colors,
                  primary_color: colors.primary,
                  secondary_color: colors.secondary,
                }))}
                onSave={handleSave}
                isSaving={updateConfig.isPending}
              />
            </TabsContent>

            {/* Tab: Banners */}
            <TabsContent value="banners" className="m-0 p-4 bg-[hsl(var(--shop-bg-page))]">
              <HeroSlidesManager 
                slides={formData.hero_slides}
                onChange={(slides) => setFormData(prev => ({ ...prev, hero_slides: slides }))}
              />
            </TabsContent>

            {/* Tab: Header */}
            <TabsContent value="header" className="m-0 p-4 bg-[hsl(var(--shop-bg-page))]">
              <HeaderTemplateManager
                config={formData.header_config}
                onChange={(header_config) => setFormData(prev => ({ ...prev, header_config }))}
              />
            </TabsContent>

            {/* Tab: Footer */}
            <TabsContent value="footer" className="m-0 p-4 bg-[hsl(var(--shop-bg-page))]">
              <ShopFooterManager
                footerConfig={formData.footer_config}
                reviews={formData.reviews}
                onChangeFooter={(footer_config) => setFormData(prev => ({ ...prev, footer_config }))}
                onChangeReviews={(reviews) => setFormData(prev => ({ ...prev, reviews }))}
              />
            </TabsContent>

            {/* Tab: Páginas Institucionais */}
            <TabsContent value="pages" className="m-0 p-4 bg-[hsl(var(--shop-bg-page))]">
              <ShopInstitutionalPagesEditor
                pages={formData.institutional_pages}
                onChange={(institutional_pages) => setFormData(prev => ({ ...prev, institutional_pages }))}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
