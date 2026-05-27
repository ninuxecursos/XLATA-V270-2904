import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Loader2, RefreshCw, Check, ImageIcon, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AIImageGeneratorProps {
  title: string;
  content?: string;
  articleType: 'blog' | 'help' | 'pillar' | 'glossary';
  keywords?: string;
  currentImage?: string;
  onImageGenerated: (imageUrl: string) => void;
}

export const AIImageGenerator: React.FC<AIImageGeneratorProps> = ({
  title,
  content,
  articleType,
  keywords,
  currentImage,
  onImageGenerated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [customKeywords, setCustomKeywords] = useState(keywords || '');
  const [promptPreview, setPromptPreview] = useState('');

  const typeLabels: Record<string, string> = {
    blog: 'Blog Post',
    help: 'Artigo de Ajuda',
    pillar: 'Página de Solução',
    glossary: 'Termo do Glossário'
  };

  const generatePromptPreview = () => {
    const typePrompts: Record<string, string> = {
      blog: 'Imagem profissional de header para blog',
      help: 'Ilustração limpa e educativa para tutorial',
      pillar: 'Banner hero impactante para landing page',
      glossary: 'Ilustração conceitual e educativa'
    };

    return `${typePrompts[articleType] || typePrompts.blog} sobre "${title}"
    
Contexto: Software XLATA para gestão de ferro velhos e centros de reciclagem.
Cores: Tons de verde esmeralda e cinza escuro.
Elementos: Reciclagem, materiais metálicos, tecnologia.
${customKeywords ? `Keywords adicionais: ${customKeywords}` : ''}

✅ Alta resolução, 16:9, sem texto na imagem
✅ Logo XLATA será adicionado automaticamente`;
  };

  const handleGenerate = async () => {
    if (!title) {
      toast({ 
        title: "Erro", 
        description: "Título é obrigatório para gerar a imagem", 
        variant: "destructive" 
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-article-image', {
        body: {
          title,
          content: content?.substring(0, 500),
          articleType,
          keywords: customKeywords
        }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast({ 
          title: "Imagem Gerada! 🎨", 
          description: "A imagem foi criada com sucesso." 
        });
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({ 
        title: "Erro ao gerar imagem", 
        description: error.message || "Falha na geração. Tente novamente.", 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseImage = () => {
    if (generatedImage) {
      onImageGenerated(generatedImage);
      setIsOpen(false);
      setGeneratedImage(null);
      toast({ 
        title: "Imagem Aplicada! ✅", 
        description: "A imagem foi definida para o artigo." 
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setPromptPreview(generatePromptPreview());
      setCustomKeywords(keywords || '');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          type="button"
          variant="outline" 
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 gap-2"
        >
          <Wand2 className="h-4 w-4" />
          Gerar com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            Gerar Imagem com IA - {typeLabels[articleType]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Image Preview */}
          {currentImage && (
            <div className="space-y-2">
              <Label className="text-gray-300">Imagem Atual</Label>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900 border border-gray-600">
                <img 
                  src={currentImage} 
                  alt="Imagem atual" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Title Preview */}
          <div className="space-y-2">
            <Label className="text-gray-300">Título do Artigo</Label>
            <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
              <p className="text-white font-medium">{title || 'Nenhum título definido'}</p>
            </div>
          </div>

          {/* Custom Keywords */}
          <div className="space-y-2">
            <Label className="text-gray-300">Keywords Adicionais (opcional)</Label>
            <Input
              value={customKeywords}
              onChange={(e) => {
                setCustomKeywords(e.target.value);
                setPromptPreview(generatePromptPreview());
              }}
              placeholder="Ex: balança digital, caminhão, software"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          {/* Prompt Preview */}
          <div className="space-y-2">
            <Label className="text-gray-300">Preview do Prompt</Label>
            <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-600 text-sm text-gray-400 whitespace-pre-wrap">
              {promptPreview}
            </div>
          </div>

          {/* Generated Image Preview */}
          {generatedImage && (
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                Imagem Gerada
              </Label>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900 border-2 border-emerald-500">
                <img 
                  src={generatedImage} 
                  alt="Imagem gerada" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-emerald-400">
                  ✨ Gerada por IA
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            {!generatedImage ? (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !title}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar Imagem
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Gerar Nova
                </Button>
                <Button
                  onClick={handleUseImage}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <Check className="h-4 w-4" />
                  Usar Esta Imagem
                </Button>
              </>
            )}
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 text-center pt-2">
            Powered by XLATA AI • Imagens geradas em alta qualidade 16:9
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIImageGenerator;
