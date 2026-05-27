import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  X, Save, ImagePlus, ChevronDown, ChevronUp, Eye, EyeOff, Star,
  Package, Video, Trash2, GripVertical, Settings, FolderOpen, Plus,
  Clock, Zap, RefreshCw, Timer, TrendingUp, Sparkles
} from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useCreateProduct, useUpdateProduct, ShopProduct } from '@/hooks/useShopProducts';
import { useShopCategories, ShopCategory } from '@/hooks/useShopCategories';
import { useInteractiveConfig, useCreateInteractiveEvent, useInteractiveEvents } from '@/hooks/useInteractiveEvents';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ShopCategoryManager } from './ShopCategoryManager';
import { ProductImageScanner, type ScanResult } from './ProductImageScanner';
import { generateSeoFileName } from '@/utils/seoFileName';
import { compressImageToWebp } from '@/utils/imageCompression';
import { CopyButton } from './CopyButton';

interface ShopProductFormProps {
  product?: ShopProduct | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const MAX_IMAGES = 10;
const MAX_VIDEO_SIZE_MB = 50;

// Compress image to webp using shared utility (preserves quality, reduces size)
const compressImage = async (file: File): Promise<Blob> => {
  const result = await compressImageToWebp(file, { maxDim: 1600, quality: 0.85 });
  return result.blob;
};

// Simple video compression by re-encoding (reduces quality)
const compressVideo = async (file: File): Promise<Blob> => {
  // For now just return the file - true video compression requires ffmpeg.wasm
  // In production you'd use a server-side solution or ffmpeg.wasm
  return file;
};

// Currency formatting helpers
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const formatCurrencyInput = (value: string): string => {
  const numericValue = value.replace(/[^\d]/g, '');
  if (!numericValue) return 'R$ 0,00';
  const number = parseInt(numericValue) / 100;
  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

// Sortable image component for drag-and-drop reordering
function SortableImage({ url, index, onRemove }: { url: string; index: number; onRemove: (index: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group border border-gray-200"
    >
      <img src={url} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1.5 rounded-full transition-opacity"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      {index === 0 && (
        <Badge className="absolute bottom-1 left-1 text-[9px] px-1 py-0 bg-emerald-500">
          Principal
        </Badge>
      )}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 text-white cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-3 h-3" />
      </div>
    </div>
  );
}

export function ShopProductForm({ product, onClose, onSuccess }: ShopProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    price: 0,
    sale_price: 0,
    cost_price: 0,
    final_cost: 0,
    sku: '',
    stock_quantity: 0,
    images: [] as string[],
    video_url: '',
    category_id: '',
    is_active: true,
    is_featured: false,
    is_visible: true,
    sale_type: 'normal' as 'normal' | 'interactive',
    delivery_type: 'pickup' as 'pickup' | 'delivery' | 'both',
    condition: 'usado' as 'novo' | 'usado' | 'no_estado',
    weight: 0,
    dimensions: { width: 0, height: 0, depth: 0 },
    seo_title: '',
    seo_description: '',
    description_about: '',
    description_condition: '',
    description_highlights: [] as string[],
    specs: [] as { label: string; value: string }[],
    marketplace_data: null as null | {
      mercado_livre?: { title: string; description: string; keywords?: string[] };
      shopee?: { title: string; description: string; hashtags?: string[] };
      olx?: { title: string; description: string };
    },
  });
  const [aiBanner, setAiBanner] = useState(false);

  // Interactive sale settings
  const [interactiveSettings, setInteractiveSettings] = useState({
    durationMinutes: 60, // 1 hour default
    minimumIncrement: 5,
    autoRepost: true,
    repostDelayDays: 3,
    maxRepostCount: 5,
    startImmediately: true
  });

  // Display values for price inputs
  const [priceDisplay, setPriceDisplay] = useState('R$ 0,00');
  const [salePriceDisplay, setSalePriceDisplay] = useState('');
  const [costPriceDisplay, setCostPriceDisplay] = useState('R$ 0,00');
  const [finalCostDisplay, setFinalCostDisplay] = useState('R$ 0,00');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showScanner, setShowScanner] = useState(false);
  const [aiCategorySuggestion, setAiCategorySuggestion] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isApplyingSuggestion, setIsApplyingSuggestion] = useState(false);

  const queryClient = useQueryClient();
  const { data: categories = [] } = useShopCategories();
  const { data: interactiveConfig } = useInteractiveConfig();
  const { data: existingEvents = [] } = useInteractiveEvents();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createInteractiveEvent = useCreateInteractiveEvent();
  const isEditing = !!product;

  // Drag-and-drop sensors and handler
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = prev.images.indexOf(active.id as string);
        const newIndex = prev.images.indexOf(over.id as string);
        return { ...prev, images: arrayMove(prev.images, oldIndex, newIndex) };
      });
    }
  };

  // Check if this product already has an active or scheduled event
  const productHasActiveEvent = product 
    ? existingEvents.some(e => 
        e.product_id === product.id && 
        (e.status === 'active' || e.status === 'scheduled')
      )
    : false;

  useEffect(() => {
    if (product) {
      const dims = product.dimensions as { width?: number; height?: number; depth?: number } | null;
      const productAny = product as unknown as Record<string, unknown>;
      setFormData({
        name: product.name,
        description: product.description || '',
        short_description: product.short_description || '',
        price: product.price,
        sale_price: product.sale_price || 0,
        cost_price: (productAny.cost_price as number) || 0,
        final_cost: (productAny.final_cost as number) || 0,
        sku: product.sku || '',
        stock_quantity: product.stock_quantity,
        images: product.images || [],
        video_url: (productAny.video_url as string) || '',
        category_id: product.category_id || '',
        is_active: product.is_active,
        is_featured: product.is_featured,
        is_visible: product.is_visible,
        sale_type: product.sale_type,
        delivery_type: (productAny.delivery_type as 'pickup' | 'delivery' | 'both') || 'pickup',
        condition: product.condition || 'usado',
        weight: product.weight || 0,
        dimensions: { 
          width: dims?.width || 0, 
          height: dims?.height || 0, 
          depth: dims?.depth || 0 
        },
        seo_title: product.seo_title || '',
        seo_description: product.seo_description || '',
        description_about: (productAny.description_about as string) || '',
        description_condition: (productAny.description_condition as string) || '',
        description_highlights: Array.isArray(productAny.description_highlights) ? productAny.description_highlights as string[] : [],
        specs: Array.isArray(productAny.specs) ? productAny.specs as { label: string; value: string }[] : [],
        marketplace_data: (productAny.marketplace_data as any) || null,
      });
      // Set interactive settings from interactive config defaults
      if (interactiveConfig) {
        setInteractiveSettings(prev => ({
          ...prev,
          durationMinutes: interactiveConfig.default_duration_minutes || 60,
          minimumIncrement: interactiveConfig.default_increment || 5
        }));
      }
      // Set price display values
      setPriceDisplay(formatCurrency(product.price));
      if (product.sale_price && product.sale_price > 0) {
        setSalePriceDisplay(formatCurrency(product.sale_price));
      }
      setCostPriceDisplay(formatCurrency((productAny.cost_price as number) || 0));
      setFinalCostDisplay(formatCurrency((productAny.final_cost as number) || 0));
    }
  }, [product, interactiveConfig]);

  // Also update interactive settings when config loads and no product
  useEffect(() => {
    if (interactiveConfig && !product) {
      setInteractiveSettings(prev => ({
        ...prev,
        durationMinutes: interactiveConfig.default_duration_minutes || 60,
        minimumIncrement: interactiveConfig.default_increment || 5
      }));
    }
  }, [interactiveConfig, product]);

  // Track online status to enable/disable AI scanner button
  useEffect(() => {
    const onChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', onChange);
    window.addEventListener('offline', onChange);
    return () => {
      window.removeEventListener('online', onChange);
      window.removeEventListener('offline', onChange);
    };
  }, []);

  // Apply pending scan from Dashboard Quick Action (only on new product)
  useEffect(() => {
    if (product) return;
    try {
      const raw = sessionStorage.getItem('pending_product_scan_apply');
      if (!raw) return;
      sessionStorage.removeItem('pending_product_scan_apply');
      const scan = JSON.parse(raw) as Partial<ScanResult>;
      applyScanData(scan as ScanResult);
      setActiveTab('basic');
    } catch (e) {
      console.error('Failed to apply pending scan', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyScanData = (data: ScanResult) => {
    // Build a rich legacy markdown description as fallback (used by old viewers / SEO)
    const parts: string[] = [];
    if (data.description_about) parts.push(data.description_about.trim());
    if (data.description_condition) {
      parts.push(`\n\n⚙️ **Estado / Condição**\n${data.description_condition.trim()}`);
    }
    const highlights = (data.description_highlights || []).filter(Boolean);
    if (highlights.length > 0) {
      parts.push(`\n\n✨ **Destaques**\n${highlights.map(h => `• ${h}`).join('\n')}`);
    }
    const specs = (data.specs || []).filter(s => s.label || s.value);
    if (specs.length > 0) {
      parts.push(`\n\n📋 **Características**\n${specs.map(s => `• ${s.label}: ${s.value}`).join('\n')}`);
    }
    if (Array.isArray(data.key_features) && data.key_features.length > 0 && highlights.length === 0) {
      parts.push(`\n\n✨ **Características**\n${data.key_features.map(f => `• ${f}`).join('\n')}`);
    }
    const description = parts.join('').trim() || data.description || '';

    const seoTitleBase = data.name || '';
    const seoDescBase = (data.short_description || data.description_about || '').replace(/\s+/g, ' ').trim();

    setFormData(prev => ({
      ...prev,
      name: data.name || prev.name,
      sku: data.sku || prev.sku,
      short_description: data.short_description || prev.short_description,
      description: description || prev.description,
      condition: (data.condition as 'novo' | 'usado' | 'no_estado') || prev.condition,
      seo_title: seoTitleBase ? seoTitleBase.slice(0, 60) : prev.seo_title,
      seo_description: seoDescBase ? seoDescBase.slice(0, 160) : prev.seo_description,
      description_about: data.description_about || prev.description_about,
      description_condition: data.description_condition || prev.description_condition,
      description_highlights: highlights.length > 0 ? highlights : prev.description_highlights,
      specs: specs.length > 0 ? specs : prev.specs,
      images: (data.image_urls && data.image_urls.length > 0)
        ? [...prev.images, ...data.image_urls].slice(0, MAX_IMAGES)
        : prev.images,
      marketplace_data: data.marketplace_data || prev.marketplace_data,
      sale_type: data.sale_type || prev.sale_type,
    }));
    setAiBanner(true);
    if (data.category) setAiCategorySuggestion(data.category);

    // Apply interactive settings if scan brought them
    if (data.interactive_settings) {
      setInteractiveSettings(prev => ({ ...prev, ...data.interactive_settings! }));
    }

    // Apply chosen price (or suggested mid as fallback)
    const chosenPrice = data.selected_price && data.selected_price > 0
      ? data.selected_price
      : (data.suggested_price_min && data.suggested_price_max
          ? Math.round((data.suggested_price_min + data.suggested_price_max) / 2)
          : 0);
    if (chosenPrice > 0) {
      setFormData(prev => ({ ...prev, price: chosenPrice }));
      setPriceDisplay(formatCurrency(chosenPrice));
    }
  };

  const handleApplyScan = async (data: ScanResult) => {
    applyScanData(data);
    setActiveTab('basic');
    // Auto-apply suggested category: find existing or create new one.
    if (data.category && !formData.category_id) {
      const id = await findOrCreateCategoryByName(data.category);
      if (id) {
        setFormData(prev => ({ ...prev, category_id: id }));
        setAiCategorySuggestion('');
        toast.success(`Categoria "${data.category}" aplicada automaticamente`);
      }
    }
  };


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (formData.images.length + files.length > MAX_IMAGES) {
      toast.error(`Máximo de ${MAX_IMAGES} imagens por produto`);
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of Array.from(files)) {
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
      
      toast.success(`${uploadedUrls.length} imagem(ns) enviada(s)!`);
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagens');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      toast.error(`Vídeo muito grande. Máximo: ${MAX_VIDEO_SIZE_MB}MB`);
      return;
    }

    setIsUploadingVideo(true);
    
    try {
      const compressedBlob = await compressVideo(file);
      const fileName = `products/videos/${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;
      
      const { data, error } = await supabase.storage
        .from('landing-images')
        .upload(fileName, compressedBlob, {
          contentType: 'video/mp4',
          cacheControl: '3600'
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('landing-images')
        .getPublicUrl(data.path);

      setFormData(prev => ({
        ...prev,
        video_url: urlData.publicUrl
      }));
      
      toast.success('Vídeo enviado!');
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar vídeo');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const removeVideo = () => {
    setFormData(prev => ({ ...prev, video_url: '' }));
  };

  const handleSelectCategory = (category: ShopCategory) => {
    setFormData(prev => ({ ...prev, category_id: category.id }));
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-').replace(/-+/g, '-');

  const findOrCreateCategoryByName = async (suggestion: string): Promise<string | null> => {
    const trimmed = suggestion.trim();
    if (!trimmed) return null;
    const normalized = trimmed.toLowerCase();
    const existing = categories.find(c => c.name.toLowerCase().trim() === normalized);
    if (existing) return existing.id;
    try {
      const slug = generateSlug(trimmed);
      const { data, error } = await supabase
        .from('shop_categories')
        .insert({
          name: trimmed,
          slug,
          is_active: true,
          display_order: categories.length,
        })
        .select()
        .single();
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['shop-categories'] });
      return data.id;
    } catch (err: any) {
      console.error('Error creating category:', err);
      toast.error(err?.message || 'Erro ao criar categoria');
      return null;
    }
  };

  const handleApplyAiSuggestion = async () => {
    const suggestion = aiCategorySuggestion.trim();
    if (!suggestion) return;
    setIsApplyingSuggestion(true);
    try {
      const id = await findOrCreateCategoryByName(suggestion);
      if (id) {
        setFormData(prev => ({ ...prev, category_id: id }));
        toast.success(`Categoria "${suggestion}" aplicada`);
        setAiCategorySuggestion('');
      }
    } finally {
      setIsApplyingSuggestion(false);
    }
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
      // Remove video_url as it's not in the database schema
      const { video_url: _videoUrl, ...formDataWithoutVideo } = formData;
      
      const submitData = {
        ...formDataWithoutVideo,
        sale_price: formData.sale_price || undefined,
        cost_price: formData.cost_price || 0,
        final_cost: formData.final_cost || 0,
        category_id: formData.category_id || undefined,
        weight: formData.weight || undefined,
        dimensions: formData.dimensions.width ? formData.dimensions : undefined
      };

      let savedProductId: string | null = null;

      if (product) {
        await updateProduct.mutateAsync({
          id: product.id,
          ...submitData
        });
        savedProductId = product.id;
      } else {
        const newProduct = await createProduct.mutateAsync(submitData);
        savedProductId = newProduct?.id || null;
      }

      // Create interactive event if sale_type is interactive and creating new product
      // Also create if editing a product that doesn't have an active event
      const shouldCreateEvent = formData.sale_type === 'interactive' && savedProductId && (
        !product || // New product
        (product && !productHasActiveEvent) // Editing product without active event
      );

      if (shouldCreateEvent) {
        const now = new Date();
        const startAt = interactiveSettings.startImmediately
          ? now.toISOString()
          : new Date(now.getTime() + 60000).toISOString(); // 1 min delay if not immediate
        
        const endAt = new Date(
          new Date(startAt).getTime() + interactiveSettings.durationMinutes * 60000
        ).toISOString();

        try {
          await createInteractiveEvent.mutateAsync({
            product_id: savedProductId,
            initial_value: formData.price,
            minimum_increment: interactiveSettings.minimumIncrement,
            start_at: startAt,
            end_at: endAt
          });
        } catch (eventError) {
          console.error('Error creating interactive event:', eventError);
          toast.error('Produto salvo, mas erro ao criar evento interativo');
        }
      }

      // Clear scanner draft from Dashboard (if this product came from a scan)
      if (!isEditing) {
        try { localStorage.removeItem('shop_scanner_draft_v1'); } catch { /* noop */ }
        window.dispatchEvent(new Event('scanner-draft-consumed'));
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;
  const selectedCategory = categories.find(c => c.id === formData.category_id);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <span className="font-semibold">
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-4 bg-gray-100 p-1">
              <TabsTrigger value="basic" className="text-xs text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                Básico
              </TabsTrigger>
              <TabsTrigger value="media" className="text-xs text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                Mídia
              </TabsTrigger>
              <TabsTrigger value="details" className="text-xs text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                Detalhes
              </TabsTrigger>
              <TabsTrigger value="seo" className="text-xs text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                SEO
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="text-xs text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                Marketplaces
              </TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4">
              {/* AI Scan Product CTA */}
              <div className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium">Identifique o produto por foto</span>
                  <span className="hidden sm:inline text-emerald-700/80">— a IA preenche nome e descrição.</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowScanner(true)}
                  disabled={!isOnline}
                  title={!isOnline ? 'Requer internet' : 'Escanear produto com IA'}
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Escanear Produto
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="name" className="text-gray-700 text-sm">Nome *</Label>
                      <CopyButton value={formData.name} label="Nome" />
                    </div>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Camiseta Premium"
                      className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-700 text-sm">Descrição Curta</Label>
                      <CopyButton value={formData.short_description} label="Descrição curta" />
                    </div>
                    <Input
                      value={formData.short_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                      placeholder="Resumo do produto (aparece nos cards)"
                      className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-700 text-sm">Descrição Completa (legado / fallback)</Label>
                      <CopyButton value={formData.description} label="Descrição completa" />
                    </div>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição detalhada do produto..."
                      rows={3}
                      className="mt-1 bg-white text-gray-900 border-gray-300 text-sm resize-none"
                    />
                  </div>

                  {/* Structured AI description */}
                  <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-3 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" /> Descrição estruturada (preenchida pela IA)
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-700 text-sm">📦 Sobre o produto</Label>
                        <CopyButton value={formData.description_about} label="Sobre o produto" />
                      </div>
                      <Textarea
                        value={formData.description_about}
                        onChange={(e) => setFormData(prev => ({ ...prev, description_about: e.target.value }))}
                        placeholder="O que é, para quem, valor principal..."
                        rows={3}
                        className="mt-1 bg-white text-gray-900 border-gray-300 text-sm resize-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-700 text-sm">⚙️ Estado/Condição</Label>
                        <CopyButton value={formData.description_condition} label="Estado/Condição" />
                      </div>
                      <Textarea
                        value={formData.description_condition}
                        onChange={(e) => setFormData(prev => ({ ...prev, description_condition: e.target.value }))}
                        placeholder="Estado real do produto baseado nas fotos..."
                        rows={2}
                        className="mt-1 bg-white text-gray-900 border-gray-300 text-sm resize-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-700 text-sm">✨ Destaques</Label>
                        <Button type="button" size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => setFormData(prev => ({ ...prev, description_highlights: [...prev.description_highlights, ''] }))}>
                          <Plus className="w-3 h-3 mr-1" /> Adicionar
                        </Button>
                      </div>
                      <div className="mt-1 space-y-1.5">
                        {formData.description_highlights.map((h, i) => (
                          <div key={i} className="flex gap-1.5">
                            <Input value={h}
                              onChange={(e) => {
                                const arr = [...formData.description_highlights];
                                arr[i] = e.target.value;
                                setFormData(prev => ({ ...prev, description_highlights: arr }));
                              }}
                              placeholder={`Destaque ${i + 1}`}
                              className="h-9 bg-white text-gray-900 border-gray-300 text-sm" />
                            <CopyButton value={h} label={`Destaque ${i + 1}`} size="sm" />
                            <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0"
                              onClick={() => setFormData(prev => ({ ...prev, description_highlights: prev.description_highlights.filter((_, idx) => idx !== i) }))}>
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </Button>
                          </div>
                        ))}
                        {formData.description_highlights.length === 0 && (
                          <p className="text-xs text-gray-400 italic">Nenhum destaque. A IA pode gerar automaticamente.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-700 text-sm">📋 Características (ficha técnica)</Label>
                        <Button type="button" size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => setFormData(prev => ({ ...prev, specs: [...prev.specs, { label: '', value: '' }] }))}>
                          <Plus className="w-3 h-3 mr-1" /> Adicionar
                        </Button>
                      </div>
                      <div className="mt-1 space-y-1.5">
                        {formData.specs.map((s, i) => (
                          <div key={i} className="flex gap-1.5">
                            <Input value={s.label}
                              onChange={(e) => {
                                const arr = [...formData.specs];
                                arr[i] = { ...arr[i], label: e.target.value };
                                setFormData(prev => ({ ...prev, specs: arr }));
                              }}
                              placeholder="Marca"
                              className="h-9 bg-white text-gray-900 border-gray-300 text-sm w-1/3" />
                            <Input value={s.value}
                              onChange={(e) => {
                                const arr = [...formData.specs];
                                arr[i] = { ...arr[i], value: e.target.value };
                                setFormData(prev => ({ ...prev, specs: arr }));
                              }}
                              placeholder="Valor"
                              className="h-9 bg-white text-gray-900 border-gray-300 text-sm flex-1" />
                            <CopyButton value={s.value ? `${s.label}: ${s.value}` : s.label} label="Característica" size="sm" />
                            <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0"
                              onClick={() => setFormData(prev => ({ ...prev, specs: prev.specs.filter((_, idx) => idx !== i) }))}>
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </Button>
                          </div>
                        ))}
                        {formData.specs.length === 0 && (
                          <p className="text-xs text-gray-400 italic">Nenhuma característica. Use o scanner para gerar.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <Label className="text-gray-700 text-sm">Categoria</Label>
                    {aiCategorySuggestion && (
                      <div className="mt-1 mb-1 flex items-center gap-2 px-2 py-1.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span className="flex-1 min-w-0 truncate">
                          Sugestão IA: <strong>"{aiCategorySuggestion}"</strong>
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          className="h-6 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={handleApplyAiSuggestion}
                          disabled={isApplyingSuggestion}
                        >
                          {isApplyingSuggestion ? 'Aplicando...' : 'Usar sugestão'}
                        </Button>
                        <button
                          type="button"
                          onClick={() => setAiCategorySuggestion('')}
                          className="text-emerald-600 hover:text-emerald-800"
                          aria-label="Dispensar sugestão"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2 mt-1">
                      <Select 
                        value={formData.category_id || "none"} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value === "none" ? "" : value }))}
                      >
                        <SelectTrigger className="flex-1 h-9 bg-white text-gray-900 border-gray-300">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200">
                          <SelectItem value="none" className="text-gray-500">Sem categoria</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id} className="text-gray-900">
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        onClick={() => setShowCategoryManager(true)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                    {selectedCategory && (
                      <Badge className="mt-2 bg-emerald-100 text-emerald-700 text-xs">
                        <FolderOpen className="w-3 h-3 mr-1" />
                        {selectedCategory.name}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="price" className="text-gray-700 text-sm">Preço *</Label>
                        <CopyButton value={priceDisplay} label="Preço" />
                      </div>
                      <Input
                        id="price"
                        type="text"
                        inputMode="decimal"
                        value={priceDisplay}
                        onChange={(e) => {
                          const formatted = formatCurrencyInput(e.target.value);
                          setPriceDisplay(formatted);
                          setFormData(prev => ({ ...prev, price: parseCurrency(formatted) }));
                        }}
                        className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                        placeholder="R$ 0,00"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sale_price" className="text-gray-700 text-sm">Preço Promocional</Label>
                        <CopyButton value={salePriceDisplay} label="Preço promocional" />
                      </div>
                      <Input
                        id="sale_price"
                        type="text"
                        inputMode="decimal"
                        value={salePriceDisplay}
                        onChange={(e) => {
                          const formatted = e.target.value ? formatCurrencyInput(e.target.value) : '';
                          setSalePriceDisplay(formatted);
                          setFormData(prev => ({ ...prev, sale_price: formatted ? parseCurrency(formatted) : 0 }));
                        }}
                        className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>

                  {/* Cost fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="cost_price" className="text-gray-700 text-sm">Custo do Produto</Label>
                        <CopyButton value={costPriceDisplay} label="Custo" />
                      </div>
                      <Input
                        id="cost_price"
                        type="text"
                        inputMode="decimal"
                        value={costPriceDisplay}
                        onChange={(e) => {
                          const formatted = formatCurrencyInput(e.target.value);
                          setCostPriceDisplay(formatted);
                          setFormData(prev => ({ ...prev, cost_price: parseCurrency(formatted) }));
                        }}
                        className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                        placeholder="R$ 0,00"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="final_cost" className="text-gray-700 text-sm">Custo Final (c/ tributos)</Label>
                        <CopyButton value={finalCostDisplay} label="Custo final" />
                      </div>
                      <Input
                        id="final_cost"
                        type="text"
                        inputMode="decimal"
                        value={finalCostDisplay}
                        onChange={(e) => {
                          const formatted = formatCurrencyInput(e.target.value);
                          setFinalCostDisplay(formatted);
                          setFormData(prev => ({ ...prev, final_cost: parseCurrency(formatted) }));
                        }}
                        className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sku" className="text-gray-700 text-sm">SKU / Código</Label>
                        <CopyButton value={formData.sku} label="SKU" />
                      </div>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                        placeholder="SKU-001"
                        className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="stock" className="text-gray-700 text-sm">Estoque</Label>
                        <CopyButton value={formData.stock_quantity} label="Estoque" />
                      </div>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                        className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-gray-700 text-sm">Tipo de Venda</Label>
                      <Select 
                        value={formData.sale_type} 
                        onValueChange={(value: 'normal' | 'interactive') => 
                          setFormData(prev => ({ ...prev, sale_type: value }))
                        }
                      >
                        <SelectTrigger className="mt-1 h-9 bg-white text-gray-900 border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200">
                          <SelectItem value="normal" className="text-gray-900">Normal</SelectItem>
                          <SelectItem value="interactive" className="text-gray-900">Interativa (Oferta)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-700 text-sm">Condição</Label>
                      <Select 
                        value={formData.condition} 
                        onValueChange={(value: 'novo' | 'usado' | 'no_estado') => 
                          setFormData(prev => ({ ...prev, condition: value }))
                        }
                      >
                        <SelectTrigger className="mt-1 h-9 bg-white text-gray-900 border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200">
                          <SelectItem value="novo" className="text-gray-900">Novo</SelectItem>
                          <SelectItem value="usado" className="text-gray-900">Usado</SelectItem>
                          <SelectItem value="no_estado" className="text-gray-900">No Estado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-700 text-sm">Entrega</Label>
                      <Select 
                        value={formData.delivery_type} 
                        onValueChange={(value: 'pickup' | 'delivery' | 'both') => 
                          setFormData(prev => ({ ...prev, delivery_type: value }))
                        }
                      >
                        <SelectTrigger className="mt-1 h-9 bg-white text-gray-900 border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200">
                          <SelectItem value="pickup" className="text-gray-900">Somente Retirada</SelectItem>
                          <SelectItem value="delivery" className="text-gray-900">Entrega Disponível</SelectItem>
                          <SelectItem value="both" className="text-gray-900">Retirada e Entrega</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Interactive Sale Settings */}
                  {formData.sale_type === 'interactive' && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 space-y-3">
                      <div className="flex items-center gap-2 text-amber-700 font-medium text-sm">
                        <Zap className="w-4 h-4" />
                        Configurações da Oferta Interativa
                        {productHasActiveEvent && (
                          <Badge className="ml-auto bg-green-100 text-green-700 text-xs">
                            Evento Ativo
                          </Badge>
                        )}
                      </div>

                      {productHasActiveEvent && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-2 text-xs text-green-700">
                          ✅ Este produto já possui um evento ativo. As configurações abaixo serão usadas apenas para novos eventos.
                        </div>
                      )}

                      {!productHasActiveEvent && isEditing && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-xs text-blue-700">
                          ⚠️ Este produto não possui evento ativo. Ao salvar, um novo evento será criado automaticamente.
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-gray-700 text-xs">Duração do Evento</Label>
                          <Select 
                            value={String(interactiveSettings.durationMinutes)} 
                            onValueChange={(value) => 
                              setInteractiveSettings(prev => ({ ...prev, durationMinutes: parseInt(value) }))
                            }
                          >
                            <SelectTrigger className="mt-1 h-8 bg-white text-gray-900 border-gray-300 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-200">
                              <SelectItem value="5" className="text-gray-900 text-xs">5 minutos</SelectItem>
                              <SelectItem value="10" className="text-gray-900 text-xs">10 minutos</SelectItem>
                              <SelectItem value="15" className="text-gray-900 text-xs">15 minutos</SelectItem>
                              <SelectItem value="30" className="text-gray-900 text-xs">30 minutos</SelectItem>
                              <SelectItem value="60" className="text-gray-900 text-xs">1 hora</SelectItem>
                              <SelectItem value="120" className="text-gray-900 text-xs">2 horas</SelectItem>
                              <SelectItem value="180" className="text-gray-900 text-xs">3 horas</SelectItem>
                              <SelectItem value="360" className="text-gray-900 text-xs">6 horas</SelectItem>
                              <SelectItem value="720" className="text-gray-900 text-xs">12 horas</SelectItem>
                              <SelectItem value="1440" className="text-gray-900 text-xs">24 horas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-gray-700 text-xs">Incremento Mínimo</Label>
                          <Select 
                            value={String(interactiveSettings.minimumIncrement)} 
                            onValueChange={(value) => 
                              setInteractiveSettings(prev => ({ ...prev, minimumIncrement: parseFloat(value) }))
                            }
                          >
                            <SelectTrigger className="mt-1 h-8 bg-white text-gray-900 border-gray-300 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-200">
                              <SelectItem value="1" className="text-gray-900 text-xs">R$ 1,00</SelectItem>
                              <SelectItem value="2" className="text-gray-900 text-xs">R$ 2,00</SelectItem>
                              <SelectItem value="5" className="text-gray-900 text-xs">R$ 5,00</SelectItem>
                              <SelectItem value="10" className="text-gray-900 text-xs">R$ 10,00</SelectItem>
                              <SelectItem value="20" className="text-gray-900 text-xs">R$ 20,00</SelectItem>
                              <SelectItem value="50" className="text-gray-900 text-xs">R$ 50,00</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <Timer className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-xs text-gray-700">Iniciar imediatamente</span>
                        </div>
                        <Switch
                          checked={interactiveSettings.startImmediately}
                          onCheckedChange={(checked) => 
                            setInteractiveSettings(prev => ({ ...prev, startImmediately: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-xs text-gray-700">Repostar automaticamente se não vendido</span>
                        </div>
                        <Switch
                          checked={interactiveSettings.autoRepost}
                          onCheckedChange={(checked) => 
                            setInteractiveSettings(prev => ({ ...prev, autoRepost: checked }))
                          }
                        />
                      </div>

                      {interactiveSettings.autoRepost && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <Label className="text-gray-700 text-xs">Repostar após (dias)</Label>
                            <Select 
                              value={String(interactiveSettings.repostDelayDays)} 
                              onValueChange={(value) => 
                                setInteractiveSettings(prev => ({ ...prev, repostDelayDays: parseInt(value) }))
                              }
                            >
                              <SelectTrigger className="mt-1 h-8 bg-white text-gray-900 border-gray-300 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-200">
                                <SelectItem value="1" className="text-gray-900 text-xs">1 dia</SelectItem>
                                <SelectItem value="2" className="text-gray-900 text-xs">2 dias</SelectItem>
                                <SelectItem value="3" className="text-gray-900 text-xs">3 dias</SelectItem>
                                <SelectItem value="5" className="text-gray-900 text-xs">5 dias</SelectItem>
                                <SelectItem value="7" className="text-gray-900 text-xs">7 dias</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-gray-700 text-xs">Máx. de repostagens</Label>
                            <Select 
                              value={String(interactiveSettings.maxRepostCount)} 
                              onValueChange={(value) => 
                                setInteractiveSettings(prev => ({ ...prev, maxRepostCount: parseInt(value) }))
                              }
                            >
                              <SelectTrigger className="mt-1 h-8 bg-white text-gray-900 border-gray-300 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-200">
                                <SelectItem value="1" className="text-gray-900 text-xs">1 vez</SelectItem>
                                <SelectItem value="3" className="text-gray-900 text-xs">3 vezes</SelectItem>
                                <SelectItem value="5" className="text-gray-900 text-xs">5 vezes</SelectItem>
                                <SelectItem value="10" className="text-gray-900 text-xs">10 vezes</SelectItem>
                                <SelectItem value="0" className="text-gray-900 text-xs">Ilimitado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-amber-600/80 mt-1">
                        💡 O produto aparecerá na seção de Ofertas Interativas assim que o evento for criado.
                      </p>
                    </div>
                  )}

                  {/* Quick Toggles */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {formData.is_active ? (
                          <Eye className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-700">Produto Ativo</span>
                      </div>
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className={cn("w-4 h-4", formData.is_visible ? "text-blue-600" : "text-gray-400")} />
                        <span className="text-sm text-gray-700">Visível na Loja</span>
                      </div>
                      <Switch
                        checked={formData.is_visible}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className={cn("w-4 h-4", formData.is_featured ? "text-amber-500" : "text-gray-400")} />
                        <span className="text-sm text-gray-700">Produto Destaque</span>
                      </div>
                      <Switch
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-4">
              {/* Images */}
              <div>
                <Label className="text-gray-700 text-sm font-medium flex items-center gap-2">
                  <ImagePlus className="w-4 h-4" />
                  Imagens ({formData.images.length}/{MAX_IMAGES})
                </Label>
                <p className="text-xs text-gray-400 mb-2">A primeira imagem será a principal. Arraste para reordenar.</p>
                
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={formData.images} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-5 gap-2">
                      {formData.images.map((url, index) => (
                        <SortableImage key={url} url={url} index={index} onRemove={removeImage} />
                      ))}
                      
                      {formData.images.length < MAX_IMAGES && (
                        <label className={cn(
                          "aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors",
                          isUploading ? "border-emerald-400 bg-emerald-50" : "border-gray-300 hover:border-emerald-500 hover:bg-emerald-50"
                        )}>
                          {isUploading ? (
                            <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                          ) : (
                            <>
                              <Plus className="w-5 h-5 text-gray-400" />
                              <span className="text-[10px] text-gray-400 mt-1">Adicionar</span>
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
                  </SortableContext>
                </DndContext>
              </div>

              {/* Video */}
              <div className="pt-4 border-t border-gray-200">
                <Label className="text-gray-700 text-sm font-medium flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Vídeo do Produto
                </Label>
                <p className="text-xs text-gray-400 mb-2">Máximo de {MAX_VIDEO_SIZE_MB}MB. Formato MP4 recomendado.</p>
                
                {formData.video_url ? (
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-w-md">
                    <video
                      src={formData.video_url}
                      controls
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className={cn(
                    "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors max-w-md",
                    isUploadingVideo ? "border-emerald-400 bg-emerald-50" : "border-gray-300 hover:border-emerald-500 hover:bg-emerald-50"
                  )}>
                    {isUploadingVideo ? (
                      <>
                        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mb-2" />
                        <span className="text-sm text-emerald-600">Enviando vídeo...</span>
                      </>
                    ) : (
                      <>
                        <Video className="w-10 h-10 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Clique para enviar vídeo</span>
                        <span className="text-xs text-gray-400">ou arraste e solte aqui</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg"
                      onChange={handleVideoUpload}
                      className="hidden"
                      disabled={isUploadingVideo}
                    />
                  </label>
                )}
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Dimensions */}
                <div className="space-y-3">
                  <Label className="text-gray-700 text-sm font-medium">Dimensões (cm)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-gray-500 text-xs">Largura</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.dimensions.width || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          dimensions: { ...prev.dimensions, width: parseFloat(e.target.value) || 0 }
                        }))}
                        className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs">Altura</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.dimensions.height || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          dimensions: { ...prev.dimensions, height: parseFloat(e.target.value) || 0 }
                        }))}
                        className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs">Profundidade</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.dimensions.depth || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          dimensions: { ...prev.dimensions, depth: parseFloat(e.target.value) || 0 }
                        }))}
                        className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Weight */}
                <div>
                  <Label className="text-gray-700 text-sm font-medium">Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                    placeholder="Ex: 0.5"
                  />
                </div>
              </div>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                Configure as informações de SEO para melhorar o posicionamento nos buscadores.
              </div>

              {/* OG Image Preview */}
              <div>
                <Label className="text-gray-700 text-sm font-medium">Imagem OG (Open Graph)</Label>
                <p className="text-xs text-gray-500 mt-0.5 mb-2">
                  Automaticamente usa a primeira foto do produto para compartilhamento em redes sociais
                </p>
                {formData.images.length > 0 ? (
                  <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <img 
                      src={formData.images[0]} 
                      alt="OG Image Preview" 
                      className="w-32 h-20 object-cover rounded border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {formData.seo_title || formData.name || 'Título do Produto'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {formData.seo_description || formData.short_description || 'Descrição do produto...'}
                      </p>
                      <p className="text-xs text-green-600 mt-1 truncate">seusite.com/loja/produto</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-20 bg-gray-100 rounded-lg border border-dashed border-gray-300">
                    <p className="text-xs text-gray-400">Adicione imagens na aba Mídia para visualizar</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="seo_title" className="text-gray-700 text-sm">Título SEO</Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                  placeholder={formData.name || "Título para buscadores"}
                  className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                  maxLength={60}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className={cn(
                    "text-xs",
                    formData.seo_title.length === 0 ? "text-gray-400" :
                    formData.seo_title.length <= 50 ? "text-green-600" :
                    formData.seo_title.length <= 60 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {formData.seo_title.length}/60 caracteres
                  </p>
                  {formData.seo_title.length === 0 && formData.name && (
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, seo_title: prev.name.slice(0, 60) }))}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Usar nome do produto
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="seo_description" className="text-gray-700 text-sm">Meta Descrição</Label>
                <Textarea
                  id="seo_description"
                  value={formData.seo_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                  placeholder={formData.short_description || "Descrição para buscadores"}
                  className="mt-1 bg-white text-gray-900 border-gray-300 text-sm resize-none"
                  rows={3}
                  maxLength={160}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className={cn(
                    "text-xs",
                    formData.seo_description.length === 0 ? "text-gray-400" :
                    formData.seo_description.length <= 140 ? "text-green-600" :
                    formData.seo_description.length <= 160 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {formData.seo_description.length}/160 caracteres
                  </p>
                  {formData.seo_description.length === 0 && formData.short_description && (
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, seo_description: prev.short_description.slice(0, 160) }))}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Usar descrição curta
                    </button>
                  )}
                </div>
              </div>

              {/* SEO Preview */}
              <div>
                <Label className="text-gray-700 text-sm font-medium">Preview no Google</Label>
                <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-lg text-blue-700 hover:underline cursor-pointer truncate">
                    {formData.seo_title || formData.name || 'Título do Produto'}
                  </p>
                  <p className="text-xs text-green-700 mt-0.5 truncate">
                    seusite.com › loja › produto
                  </p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {formData.seo_description || formData.short_description || 'Descrição do produto aparecerá aqui...'}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Marketplaces Tab — admin only, for copy/paste into ML, Shopee, OLX */}
            <TabsContent value="marketplace" className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <strong>Privado (somente admin).</strong> Estes textos não aparecem para clientes — use para copiar e colar nos marketplaces.
              </div>

              {(['mercado_livre', 'shopee', 'olx'] as const).map((key) => {
                const labels = { mercado_livre: 'Mercado Livre', shopee: 'Shopee', olx: 'OLX' } as const;
                const v = formData.marketplace_data?.[key] as { title?: string; description?: string; keywords?: string[]; hashtags?: string[] } | undefined;
                const updateField = (field: 'title' | 'description', value: string) => {
                  setFormData(prev => ({
                    ...prev,
                    marketplace_data: {
                      ...(prev.marketplace_data || {}),
                      [key]: { ...(prev.marketplace_data?.[key] || { title: '', description: '' }), [field]: value },
                    },
                  }));
                };
                const tags = (v?.keywords || v?.hashtags || []) as string[];
                return (
                  <div key={key} className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">{labels[key]}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="bg-white text-gray-700 border-gray-300"
                        onClick={() => {
                          const text = `${v?.title || ''}\n\n${v?.description || ''}${tags.length ? '\n\n' + tags.map(t => key === 'shopee' ? `#${t}` : t).join(' ') : ''}`.trim();
                          navigator.clipboard.writeText(text);
                          toast.success(`${labels[key]} copiado!`);
                        }}
                        disabled={!v?.title && !v?.description}
                      >
                        Copiar
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-700">Título</Label>
                      <Input
                        value={v?.title || ''}
                        onChange={(e) => updateField('title', e.target.value)}
                        className="bg-white border-gray-300 text-gray-900"
                        placeholder={`Título otimizado para ${labels[key]}`}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-700">Descrição</Label>
                      <Textarea
                        value={v?.description || ''}
                        onChange={(e) => updateField('description', e.target.value)}
                        rows={6}
                        className="bg-white border-gray-300 text-gray-900 font-mono text-xs"
                        placeholder={`Descrição otimizada para ${labels[key]}`}
                      />
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tags.map((t, i) => (
                          <Badge key={i} className="bg-gray-100 text-gray-700 border border-gray-200">
                            {key === 'shopee' ? `#${t}` : t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {!formData.marketplace_data && (
                <div className="text-sm text-gray-500 text-center p-4">
                  Use o <strong>Scanner de Produto</strong> e clique em <em>"Otimizar para Marketplaces"</em> para preencher automaticamente.
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              disabled={isPending}
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Salvar Alterações' : 'Criar Produto'}
            </Button>
          </div>
        </form>
      </div>

      {/* Category Manager Modal */}
      <ShopCategoryManager
        open={showCategoryManager}
        onOpenChange={setShowCategoryManager}
        onSelectCategory={handleSelectCategory}
      />

      {/* AI Product Scanner Modal */}
      <ProductImageScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onApply={handleApplyScan}
      />
    </>
  );
}
