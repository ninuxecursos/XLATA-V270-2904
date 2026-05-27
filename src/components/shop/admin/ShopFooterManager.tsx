import { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Share2, 
  Star, 
  Plus, 
  Trash2, 
  MessageCircle,
  Type,
  Link2,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FooterConfig, ShopReview } from '@/hooks/useShopConfig';
import { toast } from 'sonner';

interface ShopFooterManagerProps {
  footerConfig: FooterConfig;
  reviews: ShopReview[];
  onChangeFooter: (config: FooterConfig) => void;
  onChangeReviews: (reviews: ShopReview[]) => void;
}

export function ShopFooterManager({ 
  footerConfig, 
  reviews, 
  onChangeFooter,
  onChangeReviews
}: ShopFooterManagerProps) {
  const [activeTab, setActiveTab] = useState('location');

  const updateFooter = (key: keyof FooterConfig, value: string | boolean) => {
    let processedValue = value;
    if (key === 'google_maps_embed' && typeof value === 'string' && value.includes('<iframe')) {
      const srcMatch = value.match(/src=["']([^"']+)["']/);
      if (srcMatch && srcMatch[1]) {
        processedValue = srcMatch[1];
      }
    }
    onChangeFooter({ ...footerConfig, [key]: processedValue });
  };

  const addReview = () => {
    const newReview: ShopReview = {
      id: crypto.randomUUID(),
      name: '',
      rating: 5,
      comment: '',
      date: new Date().toLocaleDateString('pt-BR'),
    };
    onChangeReviews([...reviews, newReview]);
  };

  const updateReview = (id: string, updates: Partial<ShopReview>) => {
    onChangeReviews(
      reviews.map(r => r.id === id ? { ...r, ...updates } : r)
    );
  };

  const removeReview = (id: string) => {
    onChangeReviews(reviews.filter(r => r.id !== id));
    toast.success('Avaliação removida');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-900 text-sm">Gerenciar Footer</span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-gray-200 overflow-x-auto">
          <TabsList className="h-9 bg-transparent p-0 gap-0">
            <TabsTrigger 
              value="location" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 rounded-none px-3 pb-2 text-xs font-medium"
            >
              <MapPin className="w-3.5 h-3.5 mr-1.5" />
              Localização
            </TabsTrigger>
            <TabsTrigger 
              value="contact" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 rounded-none px-3 pb-2 text-xs font-medium"
            >
              <Phone className="w-3.5 h-3.5 mr-1.5" />
              Contato
            </TabsTrigger>
            <TabsTrigger 
              value="social" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 rounded-none px-3 pb-2 text-xs font-medium"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              Redes
            </TabsTrigger>
            <TabsTrigger 
              value="texts" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 rounded-none px-3 pb-2 text-xs font-medium"
            >
              <Type className="w-3.5 h-3.5 mr-1.5" />
              Textos
            </TabsTrigger>
            <TabsTrigger 
              value="links" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 rounded-none px-3 pb-2 text-xs font-medium"
            >
              <Link2 className="w-3.5 h-3.5 mr-1.5" />
              Links
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 rounded-none px-3 pb-2 text-xs font-medium"
            >
              <Star className="w-3.5 h-3.5 mr-1.5" />
              Avaliações
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Localização */}
        <TabsContent value="location" className="mt-4 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Endereço</Label>
                <Input
                  value={footerConfig.address}
                  onChange={(e) => updateFooter('address', e.target.value)}
                  placeholder="Rua, número"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Bairro</Label>
                <Input
                  value={footerConfig.neighborhood}
                  onChange={(e) => updateFooter('neighborhood', e.target.value)}
                  placeholder="Bairro"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Cidade</Label>
                <Input
                  value={footerConfig.city}
                  onChange={(e) => updateFooter('city', e.target.value)}
                  placeholder="Cidade - UF"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Horário de Funcionamento</Label>
                <Input
                  value={footerConfig.opening_hours}
                  onChange={(e) => updateFooter('opening_hours', e.target.value)}
                  placeholder="Seg-Sex: 9h às 18h"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">URL do Google Maps (Embed)</Label>
              <Input
                value={footerConfig.google_maps_embed}
                onChange={(e) => updateFooter('google_maps_embed', e.target.value)}
                placeholder="https://www.google.com/maps/embed?pb=..."
                className="h-9 bg-white text-gray-900 border-gray-300 font-mono text-xs"
              />
              <p className="text-[10px] text-gray-500">Cole a URL do iframe do Google Maps</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Link do Google Maps</Label>
              <Input
                value={footerConfig.google_maps_link}
                onChange={(e) => updateFooter('google_maps_link', e.target.value)}
                placeholder="https://maps.google.com/..."
                className="h-9 bg-white text-gray-900 border-gray-300 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Texto do link Google Maps</Label>
              <Input
                value={footerConfig.google_maps_label || ''}
                onChange={(e) => updateFooter('google_maps_label', e.target.value)}
                placeholder="Ver no Google Maps →"
                className="h-9 bg-white text-gray-900 border-gray-300"
              />
            </div>
          </div>
        </TabsContent>

        {/* Contato */}
        <TabsContent value="contact" className="mt-4 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">WhatsApp</Label>
                <Input
                  value={footerConfig.whatsapp}
                  onChange={(e) => updateFooter('whatsapp', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Telefone</Label>
                <Input
                  value={footerConfig.phone}
                  onChange={(e) => updateFooter('phone', e.target.value)}
                  placeholder="(11) 3333-3333"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Exibir WhatsApp no Footer</p>
                  <p className="text-xs text-gray-500">Mostra o número e ícone do WhatsApp no rodapé</p>
                </div>
              </div>
              <Switch
                checked={footerConfig.show_whatsapp_in_footer !== false}
                onCheckedChange={(checked) => updateFooter('show_whatsapp_in_footer', checked)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">E-mail</Label>
              <Input
                type="email"
                value={footerConfig.email}
                onChange={(e) => updateFooter('email', e.target.value)}
                placeholder="contato@loja.com"
                className="h-9 bg-white text-gray-900 border-gray-300"
              />
            </div>
          </div>
        </TabsContent>

        {/* Redes Sociais */}
        <TabsContent value="social" className="mt-4 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Instagram</Label>
              <Input
                value={footerConfig.instagram}
                onChange={(e) => updateFooter('instagram', e.target.value)}
                placeholder="https://instagram.com/sualoja"
                className="h-9 bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Facebook</Label>
              <Input
                value={footerConfig.facebook}
                onChange={(e) => updateFooter('facebook', e.target.value)}
                placeholder="https://facebook.com/sualoja"
                className="h-9 bg-white text-gray-900 border-gray-300"
              />
            </div>
          </div>
        </TabsContent>

        {/* Textos */}
        <TabsContent value="texts" className="mt-4 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Sobre a Loja</Label>
              <Textarea
                value={footerConfig.about_text}
                onChange={(e) => updateFooter('about_text', e.target.value)}
                placeholder="Breve descrição da loja..."
                rows={2}
                className="bg-white text-gray-900 border-gray-300 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Selo de Confiança</Label>
              <Input
                value={footerConfig.trust_text}
                onChange={(e) => updateFooter('trust_text', e.target.value)}
                placeholder="Loja física • Produtos revisados..."
                className="h-9 bg-white text-gray-900 border-gray-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Texto de Copyright</Label>
              <Input
                value={footerConfig.copyright_text || ''}
                onChange={(e) => updateFooter('copyright_text', e.target.value)}
                placeholder="© 2026 Nome da Loja — Todos os direitos reservados"
                className="h-9 bg-white text-gray-900 border-gray-300"
              />
              <p className="text-[10px] text-gray-500">Deixe vazio para usar o padrão automático</p>
            </div>

            <p className="text-xs font-medium text-gray-700 pt-2 border-t border-gray-100">Títulos das Colunas</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Coluna 1</Label>
                <Input
                  value={footerConfig.col_title_institutional || ''}
                  onChange={(e) => updateFooter('col_title_institutional', e.target.value)}
                  placeholder="Institucional"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Coluna 2</Label>
                <Input
                  value={footerConfig.col_title_shop || ''}
                  onChange={(e) => updateFooter('col_title_shop', e.target.value)}
                  placeholder="Loja"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Coluna 3</Label>
                <Input
                  value={footerConfig.col_title_contact || ''}
                  onChange={(e) => updateFooter('col_title_contact', e.target.value)}
                  placeholder="Atendimento"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Coluna 4</Label>
                <Input
                  value={footerConfig.col_title_location || ''}
                  onChange={(e) => updateFooter('col_title_location', e.target.value)}
                  placeholder="Localização"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Links */}
        <TabsContent value="links" className="mt-4 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <p className="text-xs font-medium text-gray-700">Links Institucionais</p>
            {[
              { key: 'link_about_text' as const, showKey: 'show_link_about' as const, defaultText: 'Sobre Nós' },
              { key: 'link_privacy_text' as const, showKey: 'show_link_privacy' as const, defaultText: 'Política de Privacidade' },
              { key: 'link_terms_text' as const, showKey: 'show_link_terms' as const, defaultText: 'Termos de Uso' },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-3">
                <Switch
                  checked={footerConfig[item.showKey] !== false}
                  onCheckedChange={(checked) => updateFooter(item.showKey, checked)}
                />
                <Input
                  value={footerConfig[item.key] || ''}
                  onChange={(e) => updateFooter(item.key, e.target.value)}
                  placeholder={item.defaultText}
                  className="h-9 bg-white text-gray-900 border-gray-300 flex-1"
                  disabled={footerConfig[item.showKey] === false}
                />
              </div>
            ))}

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-700 mb-3">Links da Loja</p>
              {[
                { key: 'link_products_text' as const, showKey: 'show_link_products' as const, defaultText: 'Todos os Produtos' },
                { key: 'link_offers_text' as const, showKey: 'show_link_offers' as const, defaultText: 'Ofertas Interativas' },
                { key: 'link_how_to_buy_text' as const, showKey: 'show_link_how_to_buy' as const, defaultText: 'Como Comprar' },
                { key: 'link_faq_text' as const, showKey: 'show_link_faq' as const, defaultText: 'Perguntas Frequentes' },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-3 mb-3">
                  <Switch
                    checked={footerConfig[item.showKey] !== false}
                    onCheckedChange={(checked) => updateFooter(item.showKey, checked)}
                  />
                  <Input
                    value={footerConfig[item.key] || ''}
                    onChange={(e) => updateFooter(item.key, e.target.value)}
                    placeholder={item.defaultText}
                    className="h-9 bg-white text-gray-900 border-gray-300 flex-1"
                    disabled={footerConfig[item.showKey] === false}
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Avaliações */}
        <TabsContent value="reviews" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {reviews.length} avaliação(ões) cadastrada(s)
            </p>
            <Button
              size="sm"
              onClick={addReview}
              className="bg-emerald-600 hover:bg-emerald-700 h-8"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {reviews.map((review, index) => (
              <div 
                key={review.id}
                className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Avaliação #{index + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeReview(review.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Nome do Cliente</Label>
                    <Input
                      value={review.name}
                      onChange={(e) => updateReview(review.id, { name: e.target.value })}
                      placeholder="Maria Silva"
                      className="h-8 bg-white text-gray-900 border-gray-300 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Avaliação (1-5)</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => updateReview(review.id, { rating: star })}
                          className="p-1"
                        >
                          <Star
                            className={`w-5 h-5 transition-colors ${
                              star <= review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300 hover:text-yellow-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Comentário</Label>
                  <Textarea
                    value={review.comment}
                    onChange={(e) => updateReview(review.id, { comment: e.target.value })}
                    placeholder="Excelente loja, produtos de qualidade..."
                    rows={2}
                    className="bg-white text-gray-900 border-gray-300 resize-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Data</Label>
                    <Input
                      value={review.date}
                      onChange={(e) => updateReview(review.id, { date: e.target.value })}
                      placeholder="15/01/2026"
                      className="h-8 bg-white text-gray-900 border-gray-300 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Avatar (opcional)</Label>
                    <Input
                      value={review.avatar || ''}
                      onChange={(e) => updateReview(review.id, { avatar: e.target.value })}
                      placeholder="URL da imagem"
                      className="h-8 bg-white text-gray-900 border-gray-300 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}

            {reviews.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Star className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhuma avaliação cadastrada</p>
                <p className="text-xs">Adicione avaliações para exibir na loja</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
