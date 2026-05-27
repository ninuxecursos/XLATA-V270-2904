import { Plus, Trash2, GripVertical, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { HeroSlide } from '@/hooks/useShopConfig';

interface HeroSlidesManagerProps {
  slides: HeroSlide[];
  onChange: (slides: HeroSlide[]) => void;
}

function generateSlideId() {
  return `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function HeroSlidesManager({ slides, onChange }: HeroSlidesManagerProps) {
  const addSlide = () => {
    const newSlide: HeroSlide = {
      id: generateSlideId(),
      image_url: '',
      title: '',
      subtitle: '',
      link: '',
      is_active: true
    };
    onChange([...slides, newSlide]);
  };

  const removeSlide = (id: string) => {
    onChange(slides.filter(s => s.id !== id));
  };

  const updateSlide = (id: string, updates: Partial<HeroSlide>) => {
    onChange(slides.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const moveSlide = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= slides.length) return;
    const newSlides = [...slides];
    const [removed] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, removed);
    onChange(newSlides);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900 text-sm">Slides do Banner</h3>
          <p className="text-xs text-gray-500">Banners rotativos no topo da loja</p>
        </div>
        <Button 
          onClick={addSlide}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 h-8"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Adicionar
        </Button>
      </div>

      {/* Slides List */}
      {slides.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Plus className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-gray-600 text-sm font-medium">Nenhum banner</p>
          <p className="text-gray-500 text-xs">Clique em "Adicionar" para criar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <div 
              key={slide.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Slide Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-600">
                    Slide {index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSlide(index, index - 1)}
                    disabled={index === 0}
                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSlide(index, index + 1)}
                    disabled={index === slides.length - 1}
                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                  <div className="w-px h-4 bg-gray-200 mx-1" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500">Ativo</span>
                    <Switch
                      checked={slide.is_active}
                      onCheckedChange={(checked) => updateSlide(slide.id, { is_active: checked })}
                      className="scale-75"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSlide(slide.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Slide Content */}
              <div className="p-3">
                <div className="flex gap-3">
                  {/* Image */}
                  <div className="w-28 shrink-0">
                    <ImageUploader
                      value={slide.image_url}
                      onChange={(url) => updateSlide(slide.id, { image_url: url })}
                      bucket="landing-images"
                      folder="shop-hero"
                      compact
                      aspectRatio="video"
                    />
                  </div>

                  {/* Fields */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-500 uppercase tracking-wide">Título</Label>
                      <Input
                        value={slide.title || ''}
                        onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                        placeholder="Promoção de Janeiro"
                        className="h-8 text-sm bg-white border-gray-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-500 uppercase tracking-wide">Subtítulo</Label>
                      <Input
                        value={slide.subtitle || ''}
                        onChange={(e) => updateSlide(slide.id, { subtitle: e.target.value })}
                        placeholder="Até 50% de desconto"
                        className="h-8 text-sm bg-white border-gray-300"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <ExternalLink className="w-2.5 h-2.5" />
                        Link de destino
                      </Label>
                      <Input
                        value={slide.link || ''}
                        onChange={(e) => updateSlide(slide.id, { link: e.target.value })}
                        placeholder="/shop?promo=janeiro"
                        className="h-8 text-sm bg-white border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {slides.length > 0 && (
        <p className="text-[10px] text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          💡 Slides ativos rotacionam a cada 5 segundos. Use imagens 21:9 (banner) para melhor visualização.
        </p>
      )}
    </div>
  );
}
