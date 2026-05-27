import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

export function AdminLandingSEO() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    id: '',
    seo_title: 'Sistema para Depósito de Reciclagem e Ferro Velho | XLata.site',
    seo_description: 'O XLata.site é o sistema que para de perder dinheiro no seu depósito.',
    seo_keywords: 'sistema para depósito de reciclagem, pdv para ferro velho',
    og_title: '',
    og_description: '',
    og_image: '',
    twitter_card: 'summary_large_image',
    canonical_url: 'https://xlata.site',
    robots_directive: 'index, follow',
    favicon_url: '',
    author: 'XLata.site',
    json_ld_data: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('landing_page_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings.id) {
        const { error } = await supabase
          .from('landing_page_settings')
          .update({
            seo_title: settings.seo_title,
            seo_description: settings.seo_description,
            seo_keywords: settings.seo_keywords,
            og_title: settings.og_title,
            og_description: settings.og_description,
            og_image: settings.og_image,
            twitter_card: settings.twitter_card,
            canonical_url: settings.canonical_url,
            robots_directive: settings.robots_directive,
            favicon_url: settings.favicon_url,
            author: settings.author,
            json_ld_data: settings.json_ld_data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);

        if (error) throw error;
      }

      toast.success('SEO salvo com sucesso!');
      window.dispatchEvent(new CustomEvent('landingConfigUpdated'));
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">SEO Básico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Título da Página (60 caracteres)</label>
            <Input
              value={settings.seo_title}
              onChange={(e) => setSettings(prev => ({ ...prev, seo_title: e.target.value }))}
              maxLength={60}
              className="bg-slate-700 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-500">{settings.seo_title.length}/60 caracteres</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Descrição (160 caracteres)</label>
            <Textarea
              value={settings.seo_description}
              onChange={(e) => setSettings(prev => ({ ...prev, seo_description: e.target.value }))}
              maxLength={160}
              className="bg-slate-700 border-slate-600 text-white"
              rows={3}
            />
            <p className="text-xs text-slate-500">{settings.seo_description.length}/160 caracteres</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Palavras-chave (separadas por vírgula)</label>
            <Input
              value={settings.seo_keywords}
              onChange={(e) => setSettings(prev => ({ ...prev, seo_keywords: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Open Graph (Redes Sociais)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">OG Title</label>
              <Input
                value={settings.og_title}
                onChange={(e) => setSettings(prev => ({ ...prev, og_title: e.target.value }))}
                placeholder="Usa o título SEO se vazio"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Twitter Card</label>
              <Input
                value={settings.twitter_card}
                onChange={(e) => setSettings(prev => ({ ...prev, twitter_card: e.target.value }))}
                placeholder="summary_large_image"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">OG Description</label>
            <Textarea
              value={settings.og_description}
              onChange={(e) => setSettings(prev => ({ ...prev, og_description: e.target.value }))}
              placeholder="Usa a descrição SEO se vazio"
              className="bg-slate-700 border-slate-600 text-white"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">OG Image URL</label>
            <Input
              value={settings.og_image}
              onChange={(e) => setSettings(prev => ({ ...prev, og_image: e.target.value }))}
              placeholder="https://..."
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">SEO Avançado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">URL Canônica</label>
              <Input
                value={settings.canonical_url}
                onChange={(e) => setSettings(prev => ({ ...prev, canonical_url: e.target.value }))}
                placeholder="https://xlata.site"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Robots Directive</label>
              <Input
                value={settings.robots_directive}
                onChange={(e) => setSettings(prev => ({ ...prev, robots_directive: e.target.value }))}
                placeholder="index, follow"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Favicon URL</label>
              <Input
                value={settings.favicon_url}
                onChange={(e) => setSettings(prev => ({ ...prev, favicon_url: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Autor</label>
              <Input
                value={settings.author}
                onChange={(e) => setSettings(prev => ({ ...prev, author: e.target.value }))}
                placeholder="XLata.site"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">JSON-LD (Schema.org)</label>
            <Textarea
              value={settings.json_ld_data}
              onChange={(e) => setSettings(prev => ({ ...prev, json_ld_data: e.target.value }))}
              placeholder='{"@context": "https://schema.org", ...}'
              className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
              rows={5}
            />
          </div>
        </CardContent>
      </Card>

      <div className="pt-4">
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar SEO
        </Button>
      </div>
    </div>
  );
}
