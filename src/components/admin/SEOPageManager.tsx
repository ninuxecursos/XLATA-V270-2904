import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Globe, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  HelpCircle,
  Layers,
  BookOpen,
  Home,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  Link2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PageSEO {
  id: string;
  path: string;
  page_name: string;
  type: 'static' | 'blog' | 'help' | 'pillar' | 'glossary';
  allow_indexing: boolean;
  include_in_sitemap?: boolean;
  is_protected: boolean;
  status?: string;
  view_count?: number;
}

const SITE_URL = 'https://xlata.site';

export const SEOPageManager = () => {
  const [pages, setPages] = useState<PageSEO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadAllPages();
  }, []);

  const loadAllPages = async () => {
    setLoading(true);
    try {
      // Fetch all pages in parallel
      const [staticPages, blogPosts, helpArticles, pillarPages, glossaryTerms] = await Promise.all([
        supabase.from('static_pages_seo').select('*').order('path'),
        supabase.from('blog_posts').select('id, slug, title, status, allow_indexing, view_count').order('created_at', { ascending: false }),
        supabase.from('help_articles').select('id, slug, title, status, allow_indexing, view_count').order('created_at', { ascending: false }),
        supabase.from('pillar_pages').select('id, slug, headline, status, allow_indexing, view_count').order('created_at', { ascending: false }),
        supabase.from('glossary_terms').select('id, slug, term, status, allow_indexing, view_count').order('term')
      ]);

      const allPages: PageSEO[] = [];

      // Static pages
      (staticPages.data || []).forEach(page => {
        allPages.push({
          id: page.id,
          path: page.path,
          page_name: page.page_name,
          type: 'static',
          allow_indexing: page.allow_indexing,
          include_in_sitemap: page.include_in_sitemap,
          is_protected: page.is_protected
        });
      });

      // Blog posts
      (blogPosts.data || []).forEach(post => {
        allPages.push({
          id: post.id,
          path: `/blog/${post.slug}`,
          page_name: post.title,
          type: 'blog',
          allow_indexing: post.allow_indexing ?? true,
          is_protected: false,
          status: post.status,
          view_count: post.view_count
        });
      });

      // Help articles
      (helpArticles.data || []).forEach(article => {
        allPages.push({
          id: article.id,
          path: `/ajuda/artigo/${article.slug}`,
          page_name: article.title,
          type: 'help',
          allow_indexing: article.allow_indexing ?? true,
          is_protected: false,
          status: article.status,
          view_count: article.view_count
        });
      });

      // Pillar pages
      (pillarPages.data || []).forEach(page => {
        allPages.push({
          id: page.id,
          path: `/solucoes/${page.slug}`,
          page_name: page.headline || page.slug,
          type: 'pillar',
          allow_indexing: page.allow_indexing ?? true,
          is_protected: false,
          status: page.status,
          view_count: page.view_count
        });
      });

      // Glossary terms
      (glossaryTerms.data || []).forEach(term => {
        allPages.push({
          id: term.id,
          path: `/glossario/${term.slug}`,
          page_name: term.term,
          type: 'glossary',
          allow_indexing: term.allow_indexing ?? true,
          is_protected: false,
          status: term.status,
          view_count: term.view_count
        });
      });

      setPages(allPages);
    } catch (error) {
      console.error('Error loading pages:', error);
      toast({ title: "Erro", description: "Falha ao carregar páginas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleIndexing = async (page: PageSEO) => {
    setSaving(page.id);
    try {
      const newValue = !page.allow_indexing;
      
      const updateData: Record<string, boolean> = { allow_indexing: newValue };
      if (page.type === 'static') {
        updateData.include_in_sitemap = newValue;
      }

      let error: Error | null = null;
      
      switch (page.type) {
        case 'static':
          const staticRes = await supabase.from('static_pages_seo').update(updateData).eq('id', page.id);
          error = staticRes.error;
          break;
        case 'blog':
          const blogRes = await supabase.from('blog_posts').update({ allow_indexing: newValue }).eq('id', page.id);
          error = blogRes.error;
          break;
        case 'help':
          const helpRes = await supabase.from('help_articles').update({ allow_indexing: newValue }).eq('id', page.id);
          error = helpRes.error;
          break;
        case 'pillar':
          const pillarRes = await supabase.from('pillar_pages').update({ allow_indexing: newValue }).eq('id', page.id);
          error = pillarRes.error;
          break;
        case 'glossary':
          const glossaryRes = await supabase.from('glossary_terms').update({ allow_indexing: newValue }).eq('id', page.id);
          error = glossaryRes.error;
          break;
      }

      if (error) throw error;

      setPages(prev => prev.map(p => 
        p.id === page.id ? { ...p, allow_indexing: newValue, include_in_sitemap: newValue } : p
      ));

      toast({ 
        title: newValue ? "Indexação ativada" : "Indexação desativada", 
        description: `${page.page_name} ${newValue ? 'será indexado' : 'não será indexado'} pelo Google` 
      });
    } catch (error) {
      console.error('Error toggling indexing:', error);
      toast({ title: "Erro", description: "Falha ao atualizar", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'static': return <Home className="h-4 w-4" />;
      case 'blog': return <FileText className="h-4 w-4" />;
      case 'help': return <HelpCircle className="h-4 w-4" />;
      case 'pillar': return <Layers className="h-4 w-4" />;
      case 'glossary': return <BookOpen className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'static': return 'Estática';
      case 'blog': return 'Blog';
      case 'help': return 'Ajuda';
      case 'pillar': return 'Solução';
      case 'glossary': return 'Glossário';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'static': return 'bg-gray-600';
      case 'blog': return 'bg-blue-600';
      case 'help': return 'bg-amber-600';
      case 'pillar': return 'bg-purple-600';
      case 'glossary': return 'bg-cyan-600';
      default: return 'bg-gray-600';
    }
  };

  const copyUrl = (path: string) => {
    const fullUrl = `${SITE_URL}${path}`;
    navigator.clipboard.writeText(fullUrl);
    toast({ title: "URL Copiada!", description: fullUrl });
  };

  const copyAllIndexableUrls = () => {
    const urls = pages
      .filter(p => p.allow_indexing && !p.is_protected)
      .map(p => `${SITE_URL}${p.path}`)
      .join('\n');
    navigator.clipboard.writeText(urls);
    toast({ title: "Todas as URLs copiadas!", description: `${pages.filter(p => p.allow_indexing && !p.is_protected).length} URLs indexáveis copiadas` });
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.page_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || page.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: pages.length,
    indexable: pages.filter(p => p.allow_indexing && !p.is_protected).length,
    protected: pages.filter(p => p.is_protected).length,
    noindex: pages.filter(p => !p.allow_indexing && !p.is_protected).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[hsl(220,13%,22%)] rounded-lg p-3 border border-[hsl(220,13%,26%)]">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-gray-400">Total de URLs</p>
        </div>
        <div className="bg-[hsl(220,13%,22%)] rounded-lg p-3 border border-[hsl(220,13%,26%)]">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <p className="text-2xl font-bold text-emerald-400">{stats.indexable}</p>
          </div>
          <p className="text-xs text-gray-400">Indexáveis</p>
        </div>
        <div className="bg-[hsl(220,13%,22%)] rounded-lg p-3 border border-[hsl(220,13%,26%)]">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <p className="text-2xl font-bold text-red-400">{stats.protected}</p>
          </div>
          <p className="text-xs text-gray-400">Protegidas</p>
        </div>
        <div className="bg-[hsl(220,13%,22%)] rounded-lg p-3 border border-[hsl(220,13%,26%)]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <p className="text-2xl font-bold text-amber-400">{stats.noindex}</p>
          </div>
          <p className="text-xs text-gray-400">Noindex Manual</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por URL ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-[hsl(220,13%,22%)] border-[hsl(220,13%,26%)] text-white"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 bg-[hsl(220,13%,22%)] border-[hsl(220,13%,26%)] text-white">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="static">Estáticas</SelectItem>
            <SelectItem value="blog">Blog</SelectItem>
            <SelectItem value="help">Ajuda</SelectItem>
            <SelectItem value="pillar">Soluções</SelectItem>
            <SelectItem value="glossary">Glossário</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={copyAllIndexableUrls}
          className="border-[hsl(220,13%,26%)] text-gray-300 hover:bg-[hsl(220,13%,22%)]"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copiar Todas URLs
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadAllPages}
          className="border-[hsl(220,13%,26%)] text-gray-300 hover:bg-[hsl(220,13%,22%)]"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Pages List */}
      <ScrollArea className="h-[500px] rounded-lg border border-[hsl(220,13%,26%)]">
        <div className="divide-y divide-[hsl(220,13%,26%)]">
          {filteredPages.map(page => (
            <div 
              key={page.id} 
              className="flex items-center justify-between p-3 hover:bg-[hsl(220,13%,22%)] transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-1.5 rounded ${getTypeColor(page.type)}`}>
                  {getTypeIcon(page.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-white truncate">{page.page_name}</p>
                    <Badge className={`${getTypeColor(page.type)} text-white text-xs`}>
                      {getTypeLabel(page.type)}
                    </Badge>
                    {page.status && (
                      <Badge className={page.status === 'published' ? 'bg-emerald-600' : 'bg-amber-600'}>
                        {page.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Link2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                    <p className="text-xs text-emerald-400 truncate font-mono">{SITE_URL}{page.path}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-2">
                {page.view_count !== undefined && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {page.view_count}
                  </span>
                )}

                {/* Indexing Status */}
                {page.is_protected ? (
                  <Badge className="bg-red-600/20 text-red-400 border border-red-600/30">
                    <XCircle className="h-3 w-3 mr-1" />
                    Protegida
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={page.allow_indexing}
                      onCheckedChange={() => toggleIndexing(page)}
                      disabled={saving === page.id}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                    {page.allow_indexing ? (
                      <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-600/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Indexável
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-600/20 text-amber-400 border border-amber-600/30">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Noindex
                      </Badge>
                    )}
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyUrl(page.path)}
                  className="text-gray-400 hover:text-emerald-400 h-8 w-8"
                  title="Copiar URL"
                >
                  <Copy className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(`${SITE_URL}${page.path}`, '_blank')}
                  className="text-gray-400 hover:text-white h-8 w-8"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {filteredPages.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              Nenhuma página encontrada
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SEOPageManager;