
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, Save, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';

interface SEOConfig {
  title: string;
  description: string;
  author: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  robots: string;
  canonical: string;
}

interface SEOConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEOConfigModal: React.FC<SEOConfigModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { updateMetaTags } = useSEO();
  const [seoConfig, setSeoConfig] = useState<SEOConfig>({
    title: 'XLata Gestor - Sistema para Sucata, Ferro Velho e Reciclagem',
    description: 'XLata Gestor é a solução completa para depósitos de ferros-velhos e sucata: PDV, Impressão de Comprovantes, Controle de Estoque, Relatórios, Compras e Vendas no mesmo lugar.',
    author: 'Rick Costa',
    keywords: 'xlata gestor, sistema para sucata, sistema para ferro velho, sistema PDV sucata, controle de estoque sucata, sistema de compra e venda sucata',
    ogTitle: 'XLata Gestor - Sistema para Sucata, Ferro Velho e Reciclagem',
    ogDescription: 'XLata Gestor é a solução completa para depósitos de ferros-velhos e sucata: PDV, Impressão de Comprovantes, Controle de Estoque, Relatórios, Compras e Vendas no mesmo lugar.',
    ogImage: '/lovable-uploads/9cb14a9f-019f-4ecf-8d1d-28f3edcb5faa.png',
    twitterCard: 'summary_large_image',
    robots: 'index, follow',
    canonical: 'https://xlata.lovable.app'
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: keyof SEOConfig, value: string) => {
    setSeoConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const loadSEOConfig = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('seo_config')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações SEO:', error);
        return;
      }

      if (data && data.seo_config) {
        // Safely cast the Json to SEOConfig
        const seoData = data.seo_config as unknown as SEOConfig;
        setSeoConfig(seoData);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações SEO:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: "❌ Erro",
        description: "Usuário não identificado. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      // Verificar se já existe configuração para este usuário
      const { data: existingSettings } = await supabase
        .from('system_settings')
        .select('id, seo_config')
        .eq('user_id', user.id)
        .maybeSingle();

      let error;

      if (existingSettings) {
        // Atualizar configurações existentes
        const { error: updateError } = await supabase
          .from('system_settings')
          .update({ 
            seo_config: seoConfig as any,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        error = updateError;
      } else {
        // Criar novas configurações
        const { error: insertError } = await supabase
          .from('system_settings')
          .insert({
            user_id: user.id,
            seo_config: seoConfig as any
          });
        error = insertError;
      }

      if (error) {
        console.error('Erro ao salvar configurações SEO:', error);
        toast({
          title: "❌ Erro ao salvar",
          description: "Erro ao salvar configurações de SEO no servidor.",
          variant: "destructive"
        });
        return;
      }

      // Aplicar meta tags dinamicamente usando o hook
      updateMetaTags(seoConfig);
      
      toast({
        title: "✅ Configurações SEO salvas",
        description: "As configurações de SEO foram aplicadas globalmente no site e estão ativas.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar configurações SEO:', error);
      toast({
        title: "❌ Erro ao salvar",
        description: "Erro ao salvar configurações de SEO.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (user && open) {
      loadSEOConfig();
    }
  }, [user, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-400" />
            Configurações de SEO
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-2 text-white">Carregando configurações...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Meta Tags Básicas */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Meta Tags Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-gray-300">Título da Página</Label>
                  <Input
                    id="title"
                    value={seoConfig.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="XLata Gestor - Sistema para Sucata, Ferro Velho e Reciclagem"
                  />
                  <p className="text-xs text-gray-400 mt-1">Recomendado: 50-60 caracteres</p>
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-300">Descrição</Label>
                  <Textarea
                    id="description"
                    value={seoConfig.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Descrição clara e atrativa do seu sistema"
                    rows={3}
                  />
                  <p className="text-xs text-gray-400 mt-1">Recomendado: 150-160 caracteres</p>
                </div>

                <div>
                  <Label htmlFor="author" className="text-gray-300">Autor</Label>
                  <Input
                    id="author"
                    value={seoConfig.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Rick Costa"
                  />
                </div>

                <div>
                  <Label htmlFor="keywords" className="text-gray-300">Palavras-chave</Label>
                  <Input
                    id="keywords"
                    value={seoConfig.keywords}
                    onChange={(e) => handleInputChange('keywords', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="xlata gestor, sistema para sucata, sistema para ferro velho"
                  />
                  <p className="text-xs text-gray-400 mt-1">Separe por vírgulas</p>
                </div>
              </CardContent>
            </Card>

            {/* Open Graph / Facebook */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Open Graph (Facebook/LinkedIn)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ogTitle" className="text-gray-300">Título OG</Label>
                  <Input
                    id="ogTitle"
                    value={seoConfig.ogTitle}
                    onChange={(e) => handleInputChange('ogTitle', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Título para redes sociais"
                  />
                </div>

                <div>
                  <Label htmlFor="ogDescription" className="text-gray-300">Descrição OG</Label>
                  <Textarea
                    id="ogDescription"
                    value={seoConfig.ogDescription}
                    onChange={(e) => handleInputChange('ogDescription', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Descrição para redes sociais"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="ogImage" className="text-gray-300">Imagem OG</Label>
                  <Input
                    id="ogImage"
                    value={seoConfig.ogImage}
                    onChange={(e) => handleInputChange('ogImage', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="URL da imagem para compartilhamento"
                  />
                  <p className="text-xs text-gray-400 mt-1">Recomendado: 1200x630px</p>
                </div>
              </CardContent>
            </Card>

            {/* Twitter */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Twitter Cards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="twitterCard" className="text-gray-300">Tipo de Card</Label>
                  <select
                    id="twitterCard"
                    value={seoConfig.twitterCard}
                    onChange={(e) => handleInputChange('twitterCard', e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded-md"
                  >
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary Large Image</option>
                    <option value="app">App</option>
                    <option value="player">Player</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Configurações Técnicas */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Configurações Técnicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="robots" className="text-gray-300">Robots</Label>
                  <select
                    id="robots"
                    value={seoConfig.robots}
                    onChange={(e) => handleInputChange('robots', e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded-md"
                  >
                    <option value="index, follow">Index, Follow</option>
                    <option value="noindex, follow">No Index, Follow</option>
                    <option value="index, nofollow">Index, No Follow</option>
                    <option value="noindex, nofollow">No Index, No Follow</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="canonical" className="text-gray-300">URL Canônica</Label>
                  <Input
                    id="canonical"
                    value={seoConfig.canonical}
                    onChange={(e) => handleInputChange('canonical', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="https://xlata.lovable.app"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SEOConfigModal;
