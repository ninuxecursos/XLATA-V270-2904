import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, FileText, Save, Loader2, Info, RotateCcw } from 'lucide-react';

interface AIPrompt {
  id: string;
  feature_key: string;
  name: string;
  description: string | null;
  system_prompt: string;
  user_prompt_template: string;
  placeholders: any;
  is_active: boolean;
  updated_at: string;
}

const FEATURE_CONFIG: Record<string, { name: string; description: string; placeholders: { key: string; description: string }[]; defaults: { system: string; user: string } }> = {
  article_generation: {
    name: 'Geração de Artigos SEO',
    description: 'Prompt usado pelo gerador automático e pela criação manual assistida',
    placeholders: [
      { key: '{{topic}}', description: 'Tema/tópico principal' },
      { key: '{{title}}', description: 'Título sugerido' },
      { key: '{{keywords}}', description: 'Palavras-chave separadas por vírgula' },
      { key: '{{tone}}', description: 'Tom de voz' },
      { key: '{{focus}}', description: 'Foco/objetivo do artigo' },
      { key: '{{category}}', description: 'Categoria do blog' },
      { key: '{{minWords}}', description: 'Mínimo de palavras' },
    ],
    defaults: {
      system: 'Você é um especialista ABSOLUTO em SEO para o setor de ferro velho e reciclagem no Brasil. Retorne APENAS JSON válido.',
      user: `TEMA: {{topic}}\nPALAVRAS-CHAVE: {{keywords}}\nTOM: {{tone}}\nFOCO: {{focus}}\nCATEGORIA: {{category}}\nTAMANHO MÍNIMO: {{minWords}} palavras\n\nCrie um artigo ÚNICO seguindo funil DOR → EDUCAÇÃO → COMPARAÇÃO → CONVERSÃO.\nMínimo {{minWords}} palavras, com H2/H3 em Markdown, listas, negrito.\nCTAs obrigatórios (mínimo 4) para https://xlata.site/cadastro e /sistema-para-ferro-velho.\n\nTítulo: emoji + keyword + "2026"/"hoje"/"guia". Máx 60 chars.\nMeta description: 150-155 chars.\nPrimeiro parágrafo: featured snippet.\n\nRetorne APENAS JSON: { "title", "seo_title", "seo_description", "slug", "excerpt", "content_md", "tags": [] }`,
    },
  },
  product_image_edit: {
    name: '🖼️ Padronização de Imagens (Scanner)',
    description: 'Recorta o produto e padroniza fundo (estúdio verde/branco) — apenas edição, sem gerar IA.',
    placeholders: [
      { key: '{{count}}', description: 'Quantidade de fotos enviadas' },
    ],
    defaults: {
      system: `Você é um editor profissional de imagens de produto para e-commerce. Esta tarefa é EXCLUSIVAMENTE EDIÇÃO FOTOGRÁFICA, NÃO geração de imagem.

VALIDAÇÃO CRUZADA OBRIGATÓRIA: Antes de editar, analise TODAS as imagens enviadas em conjunto como ângulos do MESMO produto real. Use comparação cruzada para entender forma, cor, textura, marcas e detalhes. Nenhuma imagem isolada pode ser usada como única referência.

REGRAS ABSOLUTAS:
- Não redesenhar, suavizar, melhorar, corrigir, recriar ou estilizar o produto.
- Preservar 100% dos pixels, texturas, riscos, sujeiras, marcas e textos do produto original.
- Apenas RECORTAR o produto real e substituir o fundo.

PERMITIDO:
- Recorte preciso do produto.
- Substituir fundo por estúdio minimalista verde e branco sutis (sem textos, sem gráficos).
- Ajustar iluminação global para harmonia.
- Adicionar sombra realista abaixo do produto.

COMPOSIÇÃO OBRIGATÓRIA:
- Canvas quadrado 1:1 (feed).
- Produto centralizado (horizontal e vertical), ocupando 70-85% do canvas.
- Nunca cortar partes do produto. Nunca gerar 9:16 ou 16:9.

RESULTADO: a imagem final deve parecer foto de estúdio profissional do MESMO produto, não recriação por IA. Manter 100% fiel qualquer texto/nome visível no produto.`,
      user: `Edite estas {{count}} foto(s) seguindo TODAS as regras. Devolva 1 imagem padronizada por foto enviada.`,
    },
  },
  product_content_analysis: {
    name: '🧠 Análise de Conteúdo do Produto',
    description: 'Gera nome SEO, faixa de preço, descrição estruturada (Sobre/Estado/Destaques), specs e tags.',
    placeholders: [
      { key: '{{count}}', description: 'Quantidade de fotos enviadas' },
    ],
    defaults: {
      system: `Você é um especialista brasileiro em:
- SEO para e-commerce (Mercado Livre, Shopee, Google Shopping, OLX)
- Copywriting de alta conversão
- Identificação de produtos a partir de imagens

CONTEXTO: A imagem já foi tratada (recorte profissional). Sua tarefa NÃO é editar imagem — é ANALISAR o produto e gerar um cadastro completo otimizado para vendas.

REGRAS:
- NÃO inventar marca, modelo, voltagem, capacidade ou especificações que não sejam visíveis ou altamente inferíveis.
- NÃO usar descrições genéricas tipo "alta qualidade", "ótimo produto".
- Escrever em português do Brasil.
- Misturar linguagem técnica + comercial.
- Pensar como cliente E como buscador (Google).

ETAPAS:
1. Identificar tipo, marca, modelo/linha, variação.
2. Nome SEO forte: tipo + marca + modelo + especificação principal (máx 80 chars).
3. Categoria e condição (novo/usado/no_estado).
4. Faixa de preço realista.
5. Resumo de conversão (1-2 linhas).
6. Descrição estruturada em campos separados (NÃO markdown):
   - description_about: 2-3 frases sobre O QUE é, PARA QUEM, valor principal.
   - description_condition: estado real baseado nas fotos.
   - description_highlights: 3-6 benefícios reais.
7. specs: ficha técnica como pares {label, value}.
8. tags: 10-15 palavras-chave.
9. confidence: 0 a 1.`,
      user: `Analise este produto a partir das {{count}} foto(s). Devolva o cadastro completo via tool.`,
    },
  },
  product_marketplace_optimization: {
    name: '🏷️ Otimização para Marketplaces',
    description: 'Adapta o cadastro para Mercado Livre, Shopee e OLX (título, descrição, hashtags).',
    placeholders: [
      { key: '{{product_json}}', description: 'JSON do cadastro do produto' },
    ],
    defaults: {
      system: `Você adapta cadastros de produto já preenchidos para 3 marketplaces brasileiros: Mercado Livre, Shopee e OLX.

REGRAS POR PLATAFORMA:

MERCADO LIVRE:
- Título máx 60 chars, padrão "[Marca] [Tipo] [Modelo] [Especificação]".
- Sem emojis no título.
- Description: lista de bullets curtos + ficha técnica no final.
- Palavras-chave de cauda longa.

SHOPEE:
- Título até 100 chars, pode ter 1-2 emojis discretos no início.
- Description: tópicos com emojis (📦 ⚙️ ✨), CTA no final.
- Hashtags ao final (#produto #marca).

OLX:
- Título 60-80 chars, claro e direto.
- Description: parágrafos curtos, tom mais informal/regional.
- Sem hashtags. Inclui condição em destaque.

Retorne JSON via tool com as 3 versões otimizadas. NÃO inventar especificações.`,
      user: `Cadastro original (JSON):\n{{product_json}}\n\nGere as 3 variantes otimizadas via tool.`,
    },
  },
};

export function AIPromptsManager() {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<AIPrompt | null>(null);
  const [form, setForm] = useState({ name: '', description: '', system_prompt: '', user_prompt_template: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('ai_prompts').select('*').order('feature_key');
    const existing = (data || []) as AIPrompt[];
    const missing = Object.keys(FEATURE_CONFIG).filter((k) => !existing.find((p) => p.feature_key === k));
    if (missing.length > 0) {
      const toInsert = missing.map((k) => ({
        feature_key: k,
        name: FEATURE_CONFIG[k].name,
        description: FEATURE_CONFIG[k].description,
        system_prompt: FEATURE_CONFIG[k].defaults.system,
        user_prompt_template: FEATURE_CONFIG[k].defaults.user,
        placeholders: FEATURE_CONFIG[k].placeholders.map((p) => p.key),
        is_active: true,
      }));
      await supabase.from('ai_prompts').insert(toInsert);
      const { data: refreshed } = await supabase.from('ai_prompts').select('*').order('feature_key');
      setPrompts((refreshed || []) as AIPrompt[]);
    } else {
      setPrompts(existing);
    }
    setLoading(false);
  };

  const openEdit = (p: AIPrompt) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      system_prompt: p.system_prompt,
      user_prompt_template: p.user_prompt_template,
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from('ai_prompts').update({
      name: form.name,
      description: form.description || null,
      system_prompt: form.system_prompt,
      user_prompt_template: form.user_prompt_template,
    }).eq('id', editing.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Salvo', description: 'Prompt atualizado' });
      setEditing(null);
      load();
    }
  };

  const resetToDefault = () => {
    if (!editing) return;
    const def = FEATURE_CONFIG[editing.feature_key]?.defaults;
    if (!def) return;
    setForm({ ...form, system_prompt: def.system, user_prompt_template: def.user });
    toast({ title: 'Restaurado', description: 'Prompt original carregado. Salve para confirmar.' });
  };

  const insertPlaceholder = (key: string) => {
    const ta = document.getElementById('user-tpl') as HTMLTextAreaElement | null;
    if (!ta) {
      setForm({ ...form, user_prompt_template: form.user_prompt_template + key });
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const v = form.user_prompt_template;
    setForm({ ...form, user_prompt_template: v.substring(0, start) + key + v.substring(end) });
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + key.length, start + key.length); }, 0);
  };

  const config = editing ? FEATURE_CONFIG[editing.feature_key] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5" /> Prompts da IA
        </h2>
        <p className="text-sm text-muted-foreground">Edite os prompts usados pela geração automática e manual sem mexer em código.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {prompts.map((p) => {
            const cfg = FEATURE_CONFIG[p.feature_key];
            return (
              <Card key={p.id} className="bg-card border-border hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base text-foreground">{p.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">{p.description || cfg?.description}</CardDescription>
                    </div>
                    <Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Ativo' : 'Inativo'}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">{p.feature_key}</code>
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4 mr-1" /> Editar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Atualizado: {new Date(p.updated_at).toLocaleString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar: {config?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 rounded-xl" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-12 rounded-xl" />
              </div>
            </div>
            <div>
              <Label>System Prompt <span className="text-xs text-muted-foreground">({form.system_prompt.length} chars)</span></Label>
              <Textarea rows={5} className="font-mono text-xs rounded-xl" value={form.system_prompt} onChange={(e) => setForm({ ...form, system_prompt: e.target.value })} />
            </div>
            <div>
              <Label>User Prompt Template <span className="text-xs text-muted-foreground">({form.user_prompt_template.length} chars)</span></Label>
              {config && (
                <div className="my-2 p-3 bg-muted/40 rounded-xl">
                  <p className="text-xs flex items-center gap-1 mb-2"><Info className="h-3 w-3" /> Placeholders (clique para inserir):</p>
                  <div className="flex flex-wrap gap-1">
                    {config.placeholders.map((ph) => (
                      <button key={ph.key} type="button" onClick={() => insertPlaceholder(ph.key)}
                        className="text-xs bg-background border border-border px-2 py-1 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                        title={ph.description}>{ph.key}</button>
                    ))}
                  </div>
                </div>
              )}
              <Textarea id="user-tpl" rows={14} className="font-mono text-xs rounded-xl" value={form.user_prompt_template} onChange={(e) => setForm({ ...form, user_prompt_template: e.target.value })} />
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={resetToDefault}><RotateCcw className="h-4 w-4 mr-2" /> Restaurar padrão</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salvar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AIPromptsManager;
