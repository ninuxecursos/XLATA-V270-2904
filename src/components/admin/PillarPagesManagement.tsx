import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Layers, Plus, Edit, Trash2, Search, Eye, ExternalLink, ImageIcon, Shield, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AIImageGenerator } from './AIImageGenerator';

interface PillarPage {
  id: string;
  slug: string;
  headline: string | null;
  subheadline: string | null;
  features: any;
  how_it_works: any;
  benefits: any;
  faq: any;
  status: 'draft' | 'published';
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  allow_indexing: boolean | null;
  canonical_url: string | null;
  view_count: number | null;
  created_at: string;
}

export const PillarPagesManagement = () => {
  const [pages, setPages] = useState<PillarPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPage, setEditingPage] = useState<PillarPage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [form, setForm] = useState({
    slug: '',
    headline: '',
    subheadline: '',
    features: '',
    how_it_works: '',
    benefits: '',
    faq: '',
    status: 'draft' as 'draft' | 'published',
    seo_title: '',
    seo_description: '',
    og_image: '',
    allow_indexing: true,
    canonical_url: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pillar_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedPages = (data || []).map(p => ({
        ...p,
        status: (p.status === 'draft' || p.status === 'published') ? p.status : 'draft'
      })) as PillarPage[];

      setPages(typedPages);
    } catch (error) {
      console.error('Erro:', error);
      toast({ title: "Erro", description: "Falha ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  };

  const parseJSON = (str: string) => {
    try {
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  };

  const handleSave = async () => {
    try {
      const data = {
        slug: form.slug || generateSlug(form.headline),
        headline: form.headline || null,
        subheadline: form.subheadline || null,
        features: parseJSON(form.features),
        how_it_works: parseJSON(form.how_it_works),
        benefits: parseJSON(form.benefits),
        faq: parseJSON(form.faq),
        status: form.status,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        og_image: form.og_image || null,
        allow_indexing: form.allow_indexing,
        canonical_url: form.canonical_url || null
      };

      if (editingPage) {
        const { error } = await supabase.from('pillar_pages').update(data).eq('id', editingPage.id);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Página atualizada" });
      } else {
        const { error } = await supabase.from('pillar_pages').insert([data]);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Página criada" });
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro:', error);
      toast({ title: "Erro", description: "Falha ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta página?')) return;
    try {
      const { error } = await supabase.from('pillar_pages').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Página excluída" });
      loadData();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir", variant: "destructive" });
    }
  };

  const editPageFn = (page: PillarPage) => {
    setEditingPage(page);
    setForm({
      slug: page.slug,
      headline: page.headline || '',
      subheadline: page.subheadline || '',
      features: page.features ? JSON.stringify(page.features, null, 2) : '',
      how_it_works: page.how_it_works ? JSON.stringify(page.how_it_works, null, 2) : '',
      benefits: page.benefits ? JSON.stringify(page.benefits, null, 2) : '',
      faq: page.faq ? JSON.stringify(page.faq, null, 2) : '',
      status: page.status,
      seo_title: page.seo_title || '',
      seo_description: page.seo_description || '',
      og_image: page.og_image || '',
      allow_indexing: page.allow_indexing !== false,
      canonical_url: page.canonical_url || ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPage(null);
    setForm({
      slug: '', headline: '', subheadline: '', features: '', how_it_works: '',
      benefits: '', faq: '', status: 'draft', seo_title: '', seo_description: '', og_image: '',
      allow_indexing: true, canonical_url: ''
    });
  };

  const filteredPages = pages.filter(p =>
    (p.headline || p.slug).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div></div>;
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Páginas de Soluções ({pages.length})
        </CardTitle>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-700 border-gray-600 text-white w-48"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova Página
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>{editingPage ? 'Editar Página' : 'Nova Página'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Headline *</Label>
                    <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} className="bg-gray-700 border-gray-600" placeholder="Título principal" />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v: 'draft' | 'published') => setForm({ ...form, status: v })}>
                      <SelectTrigger className="bg-gray-700 border-gray-600"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="bg-gray-700 border-gray-600" placeholder="Gerado do headline" />
                </div>
                <div>
                  <Label>Subheadline</Label>
                  <Textarea value={form.subheadline} onChange={(e) => setForm({ ...form, subheadline: e.target.value })} className="bg-gray-700 border-gray-600" rows={2} />
                </div>
                <div>
                  <Label>Features (JSON)</Label>
                  <Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className="bg-gray-700 border-gray-600 font-mono text-sm" rows={4} placeholder='[{"title": "...", "description": "..."}]' />
                </div>
                <div>
                  <Label>Como Funciona (JSON)</Label>
                  <Textarea value={form.how_it_works} onChange={(e) => setForm({ ...form, how_it_works: e.target.value })} className="bg-gray-700 border-gray-600 font-mono text-sm" rows={4} placeholder='[{"step": 1, "title": "...", "description": "..."}]' />
                </div>
                <div>
                  <Label>Benefícios (JSON)</Label>
                  <Textarea value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} className="bg-gray-700 border-gray-600 font-mono text-sm" rows={4} />
                </div>
                <div>
                  <Label>FAQ (JSON)</Label>
                  <Textarea value={form.faq} onChange={(e) => setForm({ ...form, faq: e.target.value })} className="bg-gray-700 border-gray-600 font-mono text-sm" rows={4} placeholder='[{"question": "...", "answer": "..."}]' />
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">SEO & Imagem</h4>
                  <div className="grid gap-3">
                    <div><Label>Título SEO</Label><Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} className="bg-gray-700 border-gray-600" /></div>
                    <div><Label>Meta Descrição</Label><Textarea value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} className="bg-gray-700 border-gray-600" rows={2} /></div>
                    <div>
                      <Label className="flex items-center gap-2 mb-2"><ImageIcon className="h-4 w-4" />Imagem Hero (OG Image)</Label>
                      <div className="flex gap-2">
                        <Input value={form.og_image} onChange={(e) => setForm({ ...form, og_image: e.target.value })} placeholder="URL da imagem" className="bg-gray-700 border-gray-600 flex-1" />
                        <AIImageGenerator title={form.headline} content={form.subheadline} articleType="pillar" currentImage={form.og_image} onImageGenerated={(url) => setForm({ ...form, og_image: url })} />
                      </div>
                      {form.og_image && <img src={form.og_image} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                    </div>
                  </div>
                </div>
                
                {/* SEO Avançado */}
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    SEO Avançado
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <Label className="text-white">Permitir indexação no Google</Label>
                        <p className="text-xs text-gray-400 mt-1">
                          Quando desativado, esta página não aparecerá nos resultados de busca
                        </p>
                      </div>
                      <Switch
                        checked={form.allow_indexing}
                        onCheckedChange={(v) => setForm({ ...form, allow_indexing: v })}
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Canonical URL (opcional)
                      </Label>
                      <Input
                        value={form.canonical_url}
                        onChange={(e) => setForm({ ...form, canonical_url: e.target.value })}
                        placeholder="https://xlata.site/..."
                        className="bg-gray-700 border-gray-600 mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Deixe vazio para usar a URL padrão. Use para evitar duplicidade de conteúdo.
                      </p>
                    </div>
                    {!form.allow_indexing && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm text-yellow-300">
                          Esta página NÃO será indexada pelo Google
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">{editingPage ? 'Atualizar' : 'Criar'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredPages.map(page => (
            <div key={page.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-white">{page.headline || page.slug}</h4>
                  <Badge className={page.status === 'published' ? 'bg-green-600' : 'bg-yellow-600'}>
                    {page.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400">/solucoes/{page.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 flex items-center gap-1"><Eye className="h-3 w-3" />{page.view_count || 0}</span>
                <Button variant="ghost" size="icon" onClick={() => window.open(`/solucoes/${page.slug}`, '_blank')} className="text-gray-400 hover:text-white"><ExternalLink className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => editPageFn(page)} className="text-gray-400 hover:text-white"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(page.id)} className="text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          {filteredPages.length === 0 && <div className="text-center py-8 text-gray-400">Nenhuma página encontrada</div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default PillarPagesManagement;
