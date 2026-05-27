import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAIAutomation } from '@/hooks/useAIAutomation';
import { 
  Sparkles, 
  Loader2, 
  FileText, 
  CheckCircle, 
  Copy,
  ExternalLink,
  Wand2
} from 'lucide-react';

export const ArticleReconstructor: React.FC = () => {
  const { categories } = useAIAutomation();
  const [sourceText, setSourceText] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    id: string;
    title: string;
    slug: string;
    wordCount: number;
    generationTime: number;
  } | null>(null);

  const charCount = sourceText.length;
  const wordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0;

  const handleGenerate = async () => {
    if (sourceText.trim().length < 100) {
      toast({
        title: 'Texto insuficiente',
        description: 'Cole pelo menos 100 caracteres de texto fonte.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('reconstruct-article', {
        body: {
          sourceText,
          targetKeyword: targetKeyword || undefined,
          categoryId: categoryId || undefined,
        },
      });

      if (error) throw error;

      if (data.success) {
        setResult(data.article);
        toast({
          title: 'Artigo reconstruído!',
          description: `"${data.article.title}" — ${data.article.wordCount} palavras em ${(data.article.generationTime / 1000).toFixed(1)}s`,
        });
      } else {
        toast({
          title: 'Erro na geração',
          description: data.error || 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error reconstructing article:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao reconstruir artigo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleClear = () => {
    setSourceText('');
    setTargetKeyword('');
    setCategoryId('');
    setResult(null);
  };

  return (
    <div className="space-y-4">
      {/* Input Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-red-400" />
            Reconstrutor de Artigos
          </CardTitle>
          <CardDescription className="text-gray-400">
            Cole um artigo existente e o sistema criará um conteúdo 100% original, superior e otimizado para SEO.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Source Text */}
          <div className="space-y-2">
            <Label className="text-gray-300">Texto Fonte</Label>
            <Textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Cole aqui o artigo ou trecho que deseja reconstruir..."
              className="min-h-[200px] bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 resize-y"
              disabled={generating}
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{charCount} caracteres · {wordCount} palavras</span>
              <span className={charCount < 100 ? 'text-red-400' : 'text-green-400'}>
                {charCount < 100 ? `Mínimo: 100 chars (faltam ${100 - charCount})` : '✓ Texto suficiente'}
              </span>
            </div>
          </div>

          {/* Keyword + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Palavra-chave Alvo (opcional)</Label>
              <Input
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                placeholder="Ex: preço sucata hoje"
                className="bg-gray-900 border-gray-600 text-white"
                disabled={generating}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Categoria (opcional)</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={generating}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleGenerate}
              disabled={generating || charCount < 100}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reconstruindo...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Reconstruir Artigo
                </>
              )}
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              disabled={generating}
            >
              Limpar
            </Button>
          </div>

          {/* Progress indicator */}
          {generating && (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-red-400" />
                <div>
                  <p className="text-white text-sm font-medium">Reconstruindo artigo...</p>
                  <p className="text-gray-400 text-xs">
                    Analisando tema → Identificando tópicos → Gerando conteúdo original → Otimizando SEO
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Card */}
      {result && (
        <Card className="bg-gray-800 border-green-600/50">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Artigo Reconstruído com Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
              <h3 className="text-white font-semibold text-lg">{result.title}</h3>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-600">{result.wordCount} palavras</Badge>
                <Badge className="bg-blue-600">{(result.generationTime / 1000).toFixed(1)}s</Badge>
                <Badge className="bg-yellow-600">Rascunho</Badge>
              </div>
              <p className="text-gray-400 text-sm">
                Slug: <code className="text-gray-300">/blog/{result.slug}</code>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(`/blog/${result.slug}`);
                  toast({ title: 'Link copiado!' });
                }}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </Button>
              <Button
                onClick={() => window.open(`/blog/${result.slug}`, '_blank')}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button
                onClick={() => {
                  setResult(null);
                  setSourceText('');
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Novo Artigo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <h4 className="text-gray-300 font-medium mb-2 text-sm">Como funciona:</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-gray-400">
            <div className="flex items-start gap-2">
              <Badge className="bg-red-600 shrink-0">1</Badge>
              <span>Cole o texto original (artigo, trecho ou referência)</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="bg-red-600 shrink-0">2</Badge>
              <span>A IA extrai tema e tópicos (sem copiar)</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="bg-red-600 shrink-0">3</Badge>
              <span>Gera conteúdo 100% original e superior</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="bg-red-600 shrink-0">4</Badge>
              <span>Salva como rascunho otimizado para SEO</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticleReconstructor;
