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
import { BookOpen, Plus, Edit, Trash2, Search, Eye, ImageIcon, Shield, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AIImageGenerator } from './AIImageGenerator';

interface GlossaryTerm {
  id: string;
  term: string;
  slug: string;
  short_definition: string;
  long_definition: string | null;
  examples: string | null;
  status: 'draft' | 'published';
  seo_title: string | null;
  seo_description: string | null;
  allow_indexing: boolean | null;
  canonical_url: string | null;
  view_count: number | null;
  created_at: string;
}

export const GlossaryManagement = () => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [form, setForm] = useState({
    term: '',
    slug: '',
    short_definition: '',
    long_definition: '',
    examples: '',
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
        .from('glossary_terms')
        .select('*')
        .order('term', { ascending: true });

      if (error) throw error;

      const typedTerms = (data || []).map(t => ({
        ...t,
        status: (t.status === 'draft' || t.status === 'published') ? t.status : 'draft'
      })) as GlossaryTerm[];

      setTerms(typedTerms);
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

  const handleSave = async () => {
    try {
      const data = {
        term: form.term,
        slug: form.slug || generateSlug(form.term),
        short_definition: form.short_definition,
        long_definition: form.long_definition || null,
        examples: form.examples || null,
        status: form.status as 'draft' | 'published',
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        allow_indexing: form.allow_indexing,
        canonical_url: form.canonical_url || null
      };

      if (editingTerm) {
        const { error } = await supabase.from('glossary_terms').update(data).eq('id', editingTerm.id);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Termo atualizado" });
      } else {
        const { error } = await supabase.from('glossary_terms').insert([data]);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Termo criado" });
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
    if (!confirm('Excluir este termo?')) return;
    try {
      const { error } = await supabase.from('glossary_terms').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Termo excluído" });
      loadData();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir", variant: "destructive" });
    }
  };

  const editTermFn = (term: GlossaryTerm) => {
    setEditingTerm(term);
    setForm({
      term: term.term,
      slug: term.slug,
      short_definition: term.short_definition,
      long_definition: term.long_definition || '',
      examples: term.examples || '',
      status: term.status,
      seo_title: term.seo_title || '',
      seo_description: term.seo_description || '',
      og_image: '',
      allow_indexing: term.allow_indexing !== false,
      canonical_url: term.canonical_url || ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTerm(null);
    setForm({
      term: '', slug: '', short_definition: '', long_definition: '', examples: '',
      status: 'draft', seo_title: '', seo_description: '', og_image: '',
      allow_indexing: true, canonical_url: ''
    });
  };

  const filteredTerms = terms.filter(t =>
    t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.short_definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by first letter
  const groupedTerms = filteredTerms.reduce((acc, term) => {
    const letter = term.term.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(term);
    return acc;
  }, {} as Record<string, GlossaryTerm[]>);

  if (loading) {
    return <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div></div>;
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Glossário ({terms.length} termos)
        </CardTitle>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar termos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-700 border-gray-600 text-white w-48"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Termo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>{editingTerm ? 'Editar Termo' : 'Novo Termo'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Termo *</Label>
                    <Input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} className="bg-gray-700 border-gray-600" />
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
                  <Label>Definição Curta *</Label>
                  <Textarea value={form.short_definition} onChange={(e) => setForm({ ...form, short_definition: e.target.value })} className="bg-gray-700 border-gray-600" rows={2} />
                </div>
                <div>
                  <Label>Definição Completa</Label>
                  <Textarea value={form.long_definition} onChange={(e) => setForm({ ...form, long_definition: e.target.value })} className="bg-gray-700 border-gray-600" rows={4} />
                </div>
                <div>
                  <Label>Exemplos</Label>
                  <Textarea value={form.examples} onChange={(e) => setForm({ ...form, examples: e.target.value })} className="bg-gray-700 border-gray-600" rows={3} placeholder="Exemplos de uso do termo..." />
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">SEO & Imagem</h4>
                  <div className="grid gap-3">
                    <div><Label>Título SEO</Label><Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} className="bg-gray-700 border-gray-600" /></div>
                    <div><Label>Meta Descrição</Label><Textarea value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} className="bg-gray-700 border-gray-600" rows={2} /></div>
                    <div>
                      <Label className="flex items-center gap-2 mb-2"><ImageIcon className="h-4 w-4" />Imagem Ilustrativa</Label>
                      <div className="flex gap-2">
                        <Input value={form.og_image} onChange={(e) => setForm({ ...form, og_image: e.target.value })} placeholder="URL da imagem (opcional)" className="bg-gray-700 border-gray-600 flex-1" />
                        <AIImageGenerator title={form.term} content={form.short_definition} articleType="glossary" currentImage={form.og_image} onImageGenerated={(url) => setForm({ ...form, og_image: url })} />
                      </div>
                      {form.og_image && <img src={form.og_image} alt="Preview" className="mt-2 w-full h-24 object-cover rounded-lg" onError={(e) => (e.currentTarget.style.display = 'none')} />}
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
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">{editingTerm ? 'Atualizar' : 'Criar'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.keys(groupedTerms).sort().map(letter => (
            <div key={letter}>
              <h3 className="text-lg font-bold text-red-500 mb-3 border-b border-gray-700 pb-2">{letter}</h3>
              <div className="grid gap-2">
                {groupedTerms[letter].map(term => (
                  <div key={term.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white">{term.term}</h4>
                        <Badge className={term.status === 'published' ? 'bg-green-600' : 'bg-yellow-600'}>
                          {term.status === 'published' ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-1">{term.short_definition}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Eye className="h-3 w-3" />{term.view_count || 0}</span>
                      <Button variant="ghost" size="icon" onClick={() => editTermFn(term)} className="text-gray-400 hover:text-white"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(term.id)} className="text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredTerms.length === 0 && <div className="text-center py-8 text-gray-400">Nenhum termo encontrado</div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default GlossaryManagement;
