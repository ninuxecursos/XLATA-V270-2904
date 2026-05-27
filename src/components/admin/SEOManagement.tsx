import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Globe, 
  FileCode, 
  Image,
  Save,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Copy,
  FileText,
  BookOpen,
  Layers,
  HelpCircle,
  BarChart3,
  ListTree
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { SEOPageManager } from './SEOPageManager';

interface SEOSettings {
  site_title: string;
  site_description: string;
  site_keywords: string;
  og_image: string;
  twitter_handle: string;
  favicon_url: string;
  robots_txt: string;
  sitemap_url: string;
  google_analytics_id: string;
  google_search_console_id: string;
}

interface ContentStats {
  blogPosts: number;
  helpArticles: number;
  pillarPages: number;
  glossaryTerms: number;
  totalPages: number;
}

export const SEOManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regeneratingSitemap, setRegeneratingSitemap] = useState(false);
  const [contentStats, setContentStats] = useState<ContentStats>({ blogPosts: 0, helpArticles: 0, pillarPages: 0, glossaryTerms: 0, totalPages: 0 });
  const [settings, setSettings] = useState<SEOSettings>({
    site_title: 'XLata - Sistema para Depósito de Reciclagem',
    site_description: 'Sistema completo de gestão para ferro velho e depósitos de reciclagem. Controle estoque, vendas e compras com facilidade.',
    site_keywords: 'sistema reciclagem, ferro velho, pdv reciclagem, gestão depósito, controle estoque reciclagem, software reciclagem',
    og_image: '/lovable-uploads/XLATALOGO.png',
    twitter_handle: '@xlatasite',
    favicon_url: '/favicon.ico',
    robots_txt: `User-agent: *
Allow: /

# Impede indexação de arquivos internos
Disallow: /src/
Disallow: /node_modules/
Disallow: /api/

# Sitemap
Sitemap: https://xlata.site/sitemap.xml`,
    sitemap_url: 'https://xlata.site/sitemap.xml',
    google_analytics_id: '',
    google_search_console_id: ''
  });

  useEffect(() => {
    loadSettings();
    loadContentStats();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.seo_config) {
        const seoConfig = typeof data.seo_config === 'string' 
          ? JSON.parse(data.seo_config) 
          : data.seo_config;
        setSettings(prev => ({ ...prev, ...seoConfig }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações SEO:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContentStats = async () => {
    try {
      const [blogResult, helpResult, pillarResult, glossaryResult] = await Promise.all([
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('help_articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('pillar_pages').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('glossary_terms').select('id', { count: 'exact', head: true }).eq('status', 'published')
      ]);

      const blogPosts = blogResult.count || 0;
      const helpArticles = helpResult.count || 0;
      const pillarPages = pillarResult.count || 0;
      const glossaryTerms = glossaryResult.count || 0;
      const staticPages = 10; // Landing, Login, Register, Planos, Termos, Blog, Ajuda, Soluções, Glossário, etc.

      setContentStats({
        blogPosts,
        helpArticles,
        pillarPages,
        glossaryTerms,
        totalPages: blogPosts + helpArticles + pillarPages + glossaryTerms + staticPages
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('system_settings')
          .update({ seo_config: JSON.parse(JSON.stringify(settings)), updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_settings')
          .insert([{ user_id: user.id, seo_config: JSON.parse(JSON.stringify(settings)) }]);
        if (error) throw error;
      }

      toast({ title: "Sucesso", description: "Configurações SEO salvas" });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({ title: "Erro", description: "Falha ao salvar configurações", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateSitemap = async () => {
    setRegeneratingSitemap(true);
    try {
      // Use the Supabase edge function directly to avoid CORS issues
      const response = await fetch('https://oxawvjcckmbevjztyfgp.supabase.co/functions/v1/generate-sitemap');
      if (response.ok) {
        const xmlText = await response.text();
        const urlCount = (xmlText.match(/<url>/g) || []).length;
        const sitemapCount = (xmlText.match(/<sitemap>/g) || []).length;
        const displayCount = urlCount > 0 ? urlCount : sitemapCount;
        const displayType = urlCount > 0 ? 'URLs' : 'sub-sitemaps';
        toast({ 
          title: "✅ Sitemap Ativo", 
          description: `O sitemap dinâmico está funcionando com ${displayCount} ${displayType} indexáveis.` 
        });
        loadContentStats();
      } else {
        // Fallback: try static sitemap.xml
        const staticResponse = await fetch('/sitemap.xml');
        if (staticResponse.ok) {
          const xmlText = await staticResponse.text();
          const sitemapCount = (xmlText.match(/<sitemap>/g) || []).length;
          toast({ 
            title: "✅ Sitemap Index Ativo", 
            description: `Sitemap index estático com ${sitemapCount} sub-sitemaps detectados.` 
          });
          loadContentStats();
        } else {
          throw new Error('Falha ao verificar sitemap');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar sitemap:', error);
      toast({ title: "Erro", description: "Falha ao verificar sitemap. Verifique se a Edge Function está ativa.", variant: "destructive" });
    } finally {
      setRegeneratingSitemap(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Texto copiado para a área de transferência" });
  };

  const seoScore = () => {
    let score = 0;
    if (settings.site_title && settings.site_title.length >= 30 && settings.site_title.length <= 60) score += 20;
    if (settings.site_description && settings.site_description.length >= 120 && settings.site_description.length <= 160) score += 20;
    if (settings.site_keywords && settings.site_keywords.split(',').length >= 5) score += 15;
    if (settings.og_image) score += 15;
    if (settings.robots_txt) score += 15;
    if (settings.sitemap_url) score += 15;
    return score;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Content Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span className="text-gray-400 text-sm">Blog</span>
            </div>
            <p className="text-2xl font-bold text-white">{contentStats.blogPosts}</p>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-4 w-4 text-blue-400" />
              <span className="text-gray-400 text-sm">Ajuda</span>
            </div>
            <p className="text-2xl font-bold text-white">{contentStats.helpArticles}</p>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-purple-400" />
              <span className="text-gray-400 text-sm">Soluções</span>
            </div>
            <p className="text-2xl font-bold text-white">{contentStats.pillarPages}</p>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-amber-400" />
              <span className="text-gray-400 text-sm">Glossário</span>
            </div>
            <p className="text-2xl font-bold text-white">{contentStats.glossaryTerms}</p>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <span className="text-gray-400 text-sm">Total URLs</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{contentStats.totalPages}</p>
          </CardContent>
        </Card>
      </div>

      {/* SEO Score Card */}
      <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Pontuação SEO</h3>
              <p className="text-gray-400 text-sm">Baseado nas configurações atuais</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${seoScore() >= 80 ? 'text-emerald-400' : seoScore() >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {seoScore()}%
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRegenerateSitemap} disabled={regeneratingSitemap} className="bg-gray-700 hover:bg-gray-600 text-white border border-gray-600">
                  {regeneratingSitemap ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
                  Verificar Sitemap
                </Button>
                <Button 
                  onClick={() => window.open('https://xlata.site/sitemap.xml', '_blank')} 
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver XML
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="bg-[hsl(220,13%,18%)] border border-[hsl(220,13%,26%)]">
          <TabsTrigger value="pages" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
            <ListTree className="h-4 w-4 mr-2" />
            Páginas
          </TabsTrigger>
          <TabsTrigger value="meta" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
            <Search className="h-4 w-4 mr-2" />
            Meta Tags
          </TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
            <Globe className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
          <TabsTrigger value="technical" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
            <FileCode className="h-4 w-4 mr-2" />
            Técnico
          </TabsTrigger>
        </TabsList>

        {/* Pages Tab - NEW */}
        <TabsContent value="pages" className="mt-4">
          <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ListTree className="h-5 w-5 text-emerald-400" />
                Gerenciador de Páginas SEO
              </CardTitle>
              <p className="text-sm text-gray-400">
                Controle quais páginas devem ser indexadas pelo Google e incluídas no sitemap.
              </p>
            </CardHeader>
            <CardContent>
              <SEOPageManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meta Tags Tab */}
        <TabsContent value="meta" className="mt-4">
          <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-5 w-5 text-emerald-400" />
                Meta Tags Principais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-300">Título do Site</Label>
                  <Badge className={settings.site_title.length >= 30 && settings.site_title.length <= 60 ? 'bg-emerald-600 text-white border-0' : 'bg-amber-600 text-white border-0'}>
                    {settings.site_title.length}/60 caracteres
                  </Badge>
                </div>
                <Input
                  value={settings.site_title}
                  onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                  className="bg-[hsl(220,13%,22%)] border-[hsl(220,13%,26%)] text-white"
                  placeholder="Título do site para SEO"
                />
                <p className="text-xs text-gray-500 mt-1">Recomendado: 30-60 caracteres</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-300">Meta Descrição</Label>
                  <Badge className={settings.site_description.length >= 120 && settings.site_description.length <= 160 ? 'bg-emerald-600 text-white border-0' : 'bg-amber-600 text-white border-0'}>
                    {settings.site_description.length}/160 caracteres
                  </Badge>
                </div>
                <Textarea
                  value={settings.site_description}
                  onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                  className="bg-[hsl(220,13%,22%)] border-[hsl(220,13%,26%)] text-white"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">Recomendado: 120-160 caracteres</p>
              </div>

              <div>
                <Label className="text-gray-300">Palavras-chave</Label>
                <Textarea
                  value={settings.site_keywords}
                  onChange={(e) => setSettings({ ...settings, site_keywords: e.target.value })}
                  className="bg-[hsl(220,13%,22%)] border-[hsl(220,13%,26%)] text-white mt-2"
                  placeholder="palavra1, palavra2, palavra3"
                  rows={2}
                />
                <p className="text-xs text-gray-500 mt-1">Separe as palavras-chave por vírgula. Recomendado: 5-10 palavras-chave</p>
              </div>

              {/* Preview */}
              <div className="border border-[hsl(220,13%,26%)] rounded-lg p-4 bg-[hsl(220,13%,13%)]">
                <p className="text-xs text-gray-500 mb-2">Prévia no Google:</p>
                <div className="space-y-1">
                  <p className="text-blue-400 text-lg hover:underline cursor-pointer">{settings.site_title || 'Título do Site'}</p>
                  <p className="text-emerald-500 text-sm">https://xlata.site</p>
                  <p className="text-gray-300 text-sm">{settings.site_description || 'Descrição do site aparecerá aqui...'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="mt-4">
          <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-400" />
                Open Graph & Social
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-gray-300">Imagem OG (Open Graph)</Label>
                <Input
                  value={settings.og_image}
                  onChange={(e) => setSettings({ ...settings, og_image: e.target.value })}
                  className="bg-[hsl(220,13%,22%)] border-[hsl(220,13%,26%)] text-white mt-2"
                  placeholder="URL da imagem para compartilhamento"
                />
                <p className="text-xs text-gray-500 mt-1">Tamanho recomendado: 1200x630 pixels</p>
                {settings.og_image && (
                  <div className="mt-2 border border-[hsl(220,13%,26%)] rounded p-2">
                    <img src={settings.og_image} alt="OG Preview" className="max-h-32 object-cover rounded" />
                  </div>
                )}
              </div>

              <div>
                <Label className="text-gray-300">Twitter Handle</Label>
                <Input
                  value={settings.twitter_handle}
                  onChange={(e) => setSettings({ ...settings, twitter_handle: e.target.value })}
                  className="bg-[hsl(220,13%,22%)] border-[hsl(220,13%,26%)] text-white mt-2"
                  placeholder="@seuhandle"
                />
              </div>

              <div>
                <Label className="text-gray-300">Favicon URL</Label>
                <Input
                  value={settings.favicon_url}
                  onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                  className="bg-[hsl(220,13%,22%)] border-[hsl(220,13%,26%)] text-white mt-2"
                  placeholder="/favicon.ico"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="mt-4">
          <div className="grid gap-6">
            <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-emerald-400" />
                  robots.txt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings.robots_txt}
                  onChange={(e) => setSettings({ ...settings, robots_txt: e.target.value })}
                  className="bg-[hsl(220,13%,13%)] border-[hsl(220,13%,26%)] text-emerald-400 font-mono text-sm"
                  rows={10}
                />
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(settings.robots_txt)} className="border-[hsl(220,13%,26%)] text-gray-300 hover:bg-[hsl(220,13%,22%)]">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open('/robots.txt', '_blank')} className="border-[hsl(220,13%,26%)] text-gray-300 hover:bg-[hsl(220,13%,22%)]">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Atual
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-400" />
                  Sitemap
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">URL do Sitemap</Label>
                  <Input
                    value={settings.sitemap_url}
                    onChange={(e) => setSettings({ ...settings, sitemap_url: e.target.value })}
                    className="bg-[hsl(220,13%,22%)] border-[hsl(220,13%,26%)] text-white mt-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('https://oxawvjcckmbevjztyfgp.supabase.co/functions/v1/generate-sitemap', '_blank')} className="border-[hsl(220,13%,26%)] text-gray-300 hover:bg-[hsl(220,13%,22%)]">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Sitemap
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRegenerateSitemap} disabled={regeneratingSitemap} className="border-[hsl(220,13%,26%)] text-gray-300 hover:bg-[hsl(220,13%,22%)]">
                    {regeneratingSitemap ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Regenerar
                  </Button>
                </div>
                <div className="p-3 bg-[hsl(220,13%,13%)] rounded-lg border border-[hsl(220,13%,26%)]">
                  <p className="text-sm text-gray-400 mb-2">
                    <CheckCircle className="h-4 w-4 inline mr-2 text-emerald-400" />
                    O sitemap é gerado automaticamente com todas as páginas publicadas.
                  </p>
                  <p className="text-xs text-gray-500">
                    Inclui: {contentStats.blogPosts} posts do blog, {contentStats.helpArticles} artigos de ajuda, {contentStats.pillarPages} páginas de soluções e {contentStats.glossaryTerms} termos do glossário.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Search className="h-5 w-5 text-emerald-400" />
                  Integrações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">Google Analytics ID</Label>
                  <Input
                    value={settings.google_analytics_id}
                    onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                    className="bg-[hsl(220,13%,22%)] border-[hsl(220,13%,26%)] text-white mt-2"
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Google Search Console ID</Label>
                  <Input
                    value={settings.google_search_console_id}
                    onChange={(e) => setSettings({ ...settings, google_search_console_id: e.target.value })}
                    className="bg-[hsl(220,13%,22%)] border-[hsl(220,13%,26%)] text-white mt-2"
                    placeholder="Código de verificação"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SEOManagement;