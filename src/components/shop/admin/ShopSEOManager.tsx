import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { RefreshCw, Send, ExternalLink, Search, Globe, CheckCircle2, XCircle, Copy, Zap } from 'lucide-react';

export function ShopSEOManager() {
  const qc = useQueryClient();
  const [isPinging, setIsPinging] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['shop-seo-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('shop_seo_settings').select('*').limit(1).maybeSingle();
      return data;
    }
  });

  const { data: products } = useQuery({
    queryKey: ['shop-seo-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('shop_products')
        .select('id, name, slug, allow_indexing, sitemap_priority, sitemap_changefreq, is_active, is_visible, updated_at')
        .order('updated_at', { ascending: false })
        .limit(200);
      return data || [];
    }
  });

  const { data: pings } = useQuery({
    queryKey: ['shop-seo-pings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('shop_seo_ping_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    }
  });

  const updateSettings = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await supabase.from('shop_seo_settings').update(patch).eq('id', settings!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop-seo-settings'] });
      toast.success('Configurações salvas');
    }
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from('shop_products').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shop-seo-products'] })
  });

  const handlePing = async () => {
    setIsPinging(true);
    try {
      const { data, error } = await supabase.functions.invoke('ping-search-engines', { body: { force: true } });
      if (error) throw error;
      toast.success('Sitemap enviado ao Google e Bing!');
      qc.invalidateQueries({ queryKey: ['shop-seo-pings'] });
      qc.invalidateQueries({ queryKey: ['shop-seo-settings'] });
    } catch (e: any) {
      toast.error('Falha ao notificar buscadores: ' + e.message);
    } finally {
      setIsPinging(false);
    }
  };

  const baseUrl = settings?.base_url || 'https://xlata.site';
  const indexed = (products || []).filter(p => p.allow_indexing && p.is_active && p.is_visible).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--shop-text-primary))]">SEO da Loja</h1>
        <p className="text-sm text-[hsl(var(--shop-text-muted))]">Indexação, sitemap e ping para buscadores</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="text-2xl font-bold">{indexed}</div>
              <div className="text-xs text-muted-foreground">Produtos indexáveis</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm font-semibold">{settings?.last_ping_at ? new Date(settings.last_ping_at).toLocaleString('pt-BR') : 'Nunca'}</div>
              <div className="text-xs text-muted-foreground">Último ping</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-2">
          <a href={`${baseUrl}/sitemap-shop.xml`} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-2 text-emerald-600 hover:underline text-sm font-medium">
            <ExternalLink className="w-4 h-4" /> Ver sitemap-shop.xml
          </a>
        </Card>
      </div>

      {/* Auto indexação ativa */}
      <Card className="p-5 border-emerald-500/30 bg-emerald-500/5">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">Indexação automática ativa</h3>
            <p className="text-sm text-muted-foreground mt-1">
              A cada produto criado ou atualizado, a URL é enviada automaticamente via <strong>IndexNow</strong> ao Bing, Yandex, Seznam e Naver — indexação em minutos.
              O Google detecta as mudanças no <code>sitemap-shop.xml</code> automaticamente (até 24h).
            </p>
            {settings?.indexnow_key && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Chave IndexNow:</span>
                <code className="px-2 py-1 bg-background rounded border">{settings.indexnow_key}</code>
                <Button variant="ghost" size="sm" onClick={() => {
                  navigator.clipboard.writeText(settings.indexnow_key);
                  toast.success('Chave copiada');
                }}>
                  <Copy className="w-3 h-3" />
                </Button>
                <a href={`${baseUrl}/${settings.indexnow_key}.txt`} target="_blank" rel="noopener noreferrer"
                   className="text-emerald-600 hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Verificar arquivo público
                </a>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Settings */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Configurações Globais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Base URL</Label>
            <Input defaultValue={settings?.base_url} onBlur={(e) => updateSettings.mutate({ base_url: e.target.value })} className="h-12" />
          </div>
          <div>
            <Label>Imagem OG padrão</Label>
            <Input defaultValue={settings?.default_og_image || ''} placeholder="https://..." onBlur={(e) => updateSettings.mutate({ default_og_image: e.target.value })} className="h-12" />
          </div>
          <div>
            <Label>Prioridade padrão (0.0 - 1.0)</Label>
            <Input type="number" step="0.1" min="0" max="1" defaultValue={settings?.default_priority}
              onBlur={(e) => updateSettings.mutate({ default_priority: parseFloat(e.target.value) })} className="h-12" />
          </div>
          <div>
            <Label>Frequência padrão</Label>
            <Select defaultValue={settings?.default_changefreq} onValueChange={(v) => updateSettings.mutate({ default_changefreq: v })}>
              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['always','hourly','daily','weekly','monthly','yearly','never'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <Label>Ping automático aos buscadores</Label>
            <p className="text-xs text-muted-foreground">Envia o sitemap ao Google/Bing a cada produto criado/atualizado.</p>
          </div>
          <Switch checked={!!settings?.auto_ping_enabled} onCheckedChange={(v) => updateSettings.mutate({ auto_ping_enabled: v })} />
        </div>
        <Button onClick={handlePing} disabled={isPinging} className="bg-emerald-600 hover:bg-emerald-700">
          {isPinging ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          Enviar sitemap agora
        </Button>
      </Card>

      {/* Products */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Indexação de Produtos ({products?.length || 0})</h2>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {(products || []).map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 border rounded-xl">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{p.name}</span>
                  {(!p.is_active || !p.is_visible) && <Badge variant="secondary" className="text-xs">Oculto</Badge>}
                </div>
                <div className="text-xs text-muted-foreground truncate">/shop/{p.slug}</div>
              </div>
              <Input type="number" step="0.1" min="0" max="1" className="w-20 h-9"
                defaultValue={p.sitemap_priority ?? 0.7}
                onBlur={(e) => updateProduct.mutate({ id: p.id, patch: { sitemap_priority: parseFloat(e.target.value) } })} />
              <Select defaultValue={p.sitemap_changefreq || 'weekly'}
                onValueChange={(v) => updateProduct.mutate({ id: p.id, patch: { sitemap_changefreq: v } })}>
                <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['daily','weekly','monthly','yearly'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <Switch checked={!!p.allow_indexing}
                onCheckedChange={(v) => updateProduct.mutate({ id: p.id, patch: { allow_indexing: v } })} />
            </div>
          ))}
        </div>
      </Card>

      {/* Ping log */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Histórico de Pings</h2>
        <div className="space-y-2">
          {(pings || []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum ping registrado ainda.</p>}
          {(pings || []).map(p => (
            <div key={p.id} className="flex items-center gap-3 text-sm p-2 border-b last:border-b-0">
              {p.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
              <span className="font-medium capitalize w-16">{p.search_engine}</span>
              <span className="text-muted-foreground">{p.status_code || '-'}</span>
              <span className="text-xs text-muted-foreground ml-auto">{new Date(p.created_at).toLocaleString('pt-BR')}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
