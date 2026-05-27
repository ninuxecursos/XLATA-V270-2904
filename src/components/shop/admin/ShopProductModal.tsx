import { useState, useEffect } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateProduct, useUpdateProduct, ShopProduct } from '@/hooks/useShopProducts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateSeoFileName } from '@/utils/seoFileName';

interface ShopProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ShopProduct | null;
}

const compressImage = async (file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        resolve(blob || file);
      }, 'image/webp', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export function ShopProductModal({ isOpen, onClose, product }: ShopProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    price: 0,
    sale_price: 0,
    sku: '',
    stock_quantity: 0,
    images: [] as string[],
    is_active: true,
    is_featured: false,
    is_visible: true,
    sale_type: 'normal' as 'normal' | 'interactive',
    seo_title: '',
    seo_description: ''
  });
  const [isUploading, setIsUploading] = useState(false);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        short_description: product.short_description || '',
        price: product.price,
        sale_price: product.sale_price || 0,
        sku: product.sku || '',
        stock_quantity: product.stock_quantity,
        images: product.images || [],
        is_active: product.is_active,
        is_featured: product.is_featured,
        is_visible: product.is_visible,
        sale_type: product.sale_type,
        seo_title: product.seo_title || '',
        seo_description: product.seo_description || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        short_description: '',
        price: 0,
        sale_price: 0,
        sku: '',
        stock_quantity: 0,
        images: [],
        is_active: true,
        is_featured: false,
        is_visible: true,
        sale_type: 'normal',
        seo_title: '',
        seo_description: ''
      });
    }
  }, [product, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (formData.images.length + files.length > 6) {
      toast.error('Máximo de 6 imagens por produto');
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of Array.from(files)) {
        // Comprimir imagem
        const compressedBlob = await compressImage(file);
        const currentIndex = formData.images.length + uploadedUrls.length;
        const fileName = formData.name.trim()
          ? generateSeoFileName(formData.name, currentIndex, 'webp')
          : `products/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
        
        const { data, error } = await supabase.storage
          .from('landing-images')
          .upload(fileName, compressedBlob, {
            contentType: 'image/webp',
            cacheControl: '3600'
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('landing-images')
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
      
      toast.success('Imagens enviadas com sucesso!');
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagens');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }
    
    if (formData.price <= 0) {
      toast.error('Preço deve ser maior que zero');
      return;
    }

    try {
      if (product) {
        await updateProduct.mutateAsync({
          id: product.id,
          ...formData,
          sale_price: formData.sale_price || undefined
        });
      } else {
        await createProduct.mutateAsync({
          ...formData,
          sale_price: formData.sale_price || undefined
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-900">Nome do Produto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Camiseta Premium"
              className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-900">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição completa do produto"
              rows={4}
              className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
            />
          </div>

          {/* Preços */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-gray-900">Preço *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_price" className="text-gray-900">Preço Promocional</Label>
              <Input
                id="sale_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.sale_price || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, sale_price: parseFloat(e.target.value) || 0 }))}
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>
          </div>

          {/* SKU e Estoque */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku" className="text-gray-900">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="Código do produto"
                className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock" className="text-gray-900">Estoque</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>
          </div>

          {/* Tipo de Venda */}
          <div className="space-y-2">
            <Label className="text-gray-900">Tipo de Venda</Label>
            <Select 
              value={formData.sale_type} 
              onValueChange={(value: 'normal' | 'interactive') => 
                setFormData(prev => ({ ...prev, sale_type: value }))
              }
            >
              <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="normal" className="text-gray-900">Normal</SelectItem>
                <SelectItem value="interactive" className="text-gray-900">Interativa (Em breve)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Imagens */}
          <div className="space-y-2">
            <Label className="text-gray-900">Imagens (máx. 6)</Label>
            <div className="grid grid-cols-3 gap-2">
              {formData.images.map((url, index) => (
                <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {formData.images.length < 6 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors">
                  {isUploading ? (
                    <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-400 mt-1">Upload</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Switches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-900">Produto Ativo</Label>
                <p className="text-sm text-gray-500">Produtos inativos não aparecem na loja</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-900">Visível na Vitrine</Label>
                <p className="text-sm text-gray-500">Controla a exibição na página principal</p>
              </div>
              <Switch
                checked={formData.is_visible}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-900">Produto em Destaque</Label>
                <p className="text-sm text-gray-500">Aparece com badge especial</p>
              </div>
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={createProduct.isPending || updateProduct.isPending}
            >
              {product ? 'Salvar Alterações' : 'Criar Produto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
