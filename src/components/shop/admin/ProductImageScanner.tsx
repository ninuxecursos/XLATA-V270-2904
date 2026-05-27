import { useRef, useState } from 'react';
import {
  Camera, Upload, Loader2, RefreshCw, Sparkles, X, Check, AlertTriangle,
  ChevronDown, ChevronUp, Plus, ImageIcon, Tag, Wand2, Store, Copy, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import heic2any from 'heic2any';
import { compressAdaptiveWebp } from '@/utils/imageCompression';

export interface SpecItem { label: string; value: string }

export interface ScanResult {
  name: string;
  brand?: string;
  model?: string;
  variant?: string;
  category: string;
  subcategory?: string;
  condition: 'novo' | 'usado' | 'no_estado';
  short_description?: string;
  // structured description
  description_about?: string;
  description_condition?: string;
  description_highlights?: string[];
  specs?: SpecItem[];
  // legacy markdown (kept for backwards compat)
  description?: string;
  key_features?: string[];
  suggested_price_min?: number;
  suggested_price_max?: number;
  tags?: string[];
  confidence: number;
  // standardized images (base64) returned from image-edit pass
  edited_images?: { base64: string; mime_type: string }[];
  // Permanent URLs (uploaded to storage) — applied to product on Apply
  image_urls?: string[];
  // Auto-generated SKU (editable)
  sku?: string;
  // Final price chosen by user from suggested range
  selected_price?: number;
  // Optimized marketplace texts (admin only — for copy/paste)
  marketplace_data?: MarketplaceVariant | null;
  // Sale config carried from the draft card (Normal vs Interactive)
  sale_type?: 'normal' | 'interactive';
  interactive_settings?: {
    durationMinutes: number;
    minimumIncrement: number;
    autoRepost: boolean;
    repostDelayDays: number;
    maxRepostCount: number;
    startImmediately: boolean;
  };
}

function generateSku(brand?: string, model?: string): string {
  const slug = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '').slice(0, 6).toUpperCase();
  const b = brand ? slug(brand) : 'PRD';
  const m = model ? slug(model) : '';
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return [b, m, date, rand].filter(Boolean).join('-');
}

export interface MarketplaceVariant {
  mercado_livre?: { title: string; description: string; keywords?: string[] };
  shopee?: { title: string; description: string; hashtags?: string[] };
  olx?: { title: string; description: string };
}

interface ProductImageScannerProps {
  open: boolean;
  onClose: () => void;
  onApply: (data: ScanResult) => void;
}

type ScanState = 'idle' | 'preparing' | 'preview' | 'scanning' | 'editing-image' | 'optimizing' | 'result' | 'error';
interface PreparedImage { previewUrl: string; base64: string; mime_type: string; sizeKb: number; original?: { previewUrl: string; base64: string; mime_type: string } }
interface FunctionErrorWithContext extends Error { context?: Response }

const MAX_IMAGES = 10;
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif', 'image/bmp', 'image/tiff']);

function isProbablyImage(file: File) {
  return file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|gif|bmp|tiff?)$/i.test(file.name);
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      if (base64) resolve(base64); else reject(new Error('Base64 vazio'));
    };
    reader.onerror = () => reject(reader.error || new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

async function normalizeHeicIfNeeded(file: File): Promise<File> {
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || /\.(heic|heif)$/i.test(file.name);
  if (!isHeic) return file;
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
}

async function prepareImage(file: File): Promise<{ base64: string; mimeType: string; sizeKb: number }> {
  try {
    const normalized = await normalizeHeicIfNeeded(file);
    const c = await compressAdaptiveWebp(normalized, 700 * 1024);
    return { base64: c.base64, mimeType: c.mimeType, sizeKb: c.sizeKb };
  } catch (err) {
    const mimeType = ACCEPTED_IMAGE_TYPES.has(file.type) ? file.type : 'image/jpeg';
    if ((file.type === 'image/heic' || file.type === 'image/heif') && file.size <= 4 * 1024 * 1024) {
      const base64 = await readFileAsBase64(file);
      return { base64, mimeType, sizeKb: Math.round(base64.length / 1024) };
    }
    throw err;
  }
}

async function extractFunctionError(error: unknown): Promise<{ msg: string; raw: string }> {
  const fe = error as FunctionErrorWithContext;
  const ctx = fe?.context;
  let msg = (error as Error)?.message || 'Falha ao processar';
  let raw = '';
  if (ctx) {
    try { const p = await ctx.clone().json(); if (p?.message) msg = p.message; raw = JSON.stringify(p, null, 2); }
    catch { try { raw = await ctx.text(); const j = JSON.parse(raw); if (j?.message) msg = j.message; } catch { /* */ } }
  }
  return { msg, raw };
}

export function ProductImageScanner({ open, onClose, onApply }: ProductImageScannerProps) {
  const [state, setState] = useState<ScanState>('idle');
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [marketplace, setMarketplace] = useState<MarketplaceVariant | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorDetail, setErrorDetail] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [userHint, setUserHint] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setState('idle'); setImages([]); setResult(null); setMarketplace(null);
    setErrorMsg(''); setErrorDetail(''); setShowDetail(false); setShowOriginal(false);
    setUserHint('');
  };
  const handleClose = () => { reset(); onClose(); };

  const addFiles = async (selectedFiles: File[]) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) { toast.error(`Máximo ${MAX_IMAGES} fotos`); return; }
    setState('preparing');
    const arr = selectedFiles.slice(0, room);
    const next: PreparedImage[] = [];
    const failed: string[] = [];
    for (const file of arr) {
      if (!isProbablyImage(file)) { failed.push(`${file.name}: não é imagem`); continue; }
      try {
        const c = await prepareImage(file);
        next.push({ previewUrl: URL.createObjectURL(file), base64: c.base64, mime_type: c.mimeType, sizeKb: c.sizeKb });
      } catch (e: unknown) {
        console.error('[scanner] compress failed:', file.name, e);
        failed.push(`${file.name}: ${e instanceof Error ? e.message : 'falha'}`);
      }
    }
    if (failed.length > 0) {
      toast.error(`Não foi possível processar ${failed.length} foto(s)`, { description: failed.join(' · ') });
    }
    if (next.length === 0) {
      if (images.length === 0) setState('idle');
      return;
    }
    setImages(prev => [...prev, ...next]);
    setState('preview');
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    await addFiles(files);
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    if (images.length <= 1) setState('idle');
  };

  // ---------- ACTION 1: Padronizar Imagens ----------
  const handleStandardizeImages = async () => {
    if (images.length === 0) return;
    setState('editing-image'); setErrorMsg(''); setErrorDetail('');
    try {
      const { data, error } = await supabase.functions.invoke('scan-product-image', {
        body: {
          mode: 'image',
          images: images.map(i => ({ base64: i.base64, mime_type: i.mime_type })),
          user_hint: userHint.trim() || undefined,
        },
      });
      if (error) {
        const { msg, raw } = await extractFunctionError(error);
        setErrorMsg(msg); setErrorDetail(raw); setState('error'); return;
      }
      const out = (data?.images || []) as { base64: string; mime_type: string }[];
      if (!out.length) { setErrorMsg('Nenhuma imagem retornada.'); setState('error'); return; }

      // Replace previews with edited versions, keep original for toggle
      const next: PreparedImage[] = images.map((img, i) => {
        const ed = out[i];
        if (!ed) return img;
        const blob = base64ToBlob(ed.base64, ed.mime_type);
        const newUrl = URL.createObjectURL(blob);
        return {
          previewUrl: newUrl,
          base64: ed.base64,
          mime_type: ed.mime_type,
          sizeKb: Math.round(ed.base64.length / 1024),
          original: { previewUrl: img.previewUrl, base64: img.base64, mime_type: img.mime_type },
        };
      });
      setImages(next);
      toast.success('Imagens padronizadas (1:1, fundo limpo).');
      setState('preview');
    } catch (e) {
      console.error(e);
      setErrorMsg(e instanceof Error ? e.message : 'Erro');
      setState('error');
    }
  };

  // ---------- ACTION 2: Analisar Produto ----------
  const handleAnalyzeContent = async () => {
    if (images.length === 0) return;
    setState('scanning'); setErrorMsg(''); setErrorDetail('');
    try {
      const { data, error } = await supabase.functions.invoke('scan-product-image', {
        body: {
          mode: 'content',
          images: images.map(i => ({ base64: i.base64, mime_type: i.mime_type })),
          user_hint: userHint.trim() || undefined,
        },
      });
      if (error) {
        const { msg, raw } = await extractFunctionError(error);
        setErrorMsg(msg); setErrorDetail(raw); setState('error'); return;
      }
      if (data?.needs_manual) {
        setErrorMsg(data.message || 'Confiança baixa.');
        setErrorDetail(JSON.stringify(data, null, 2));
        setState('error'); return;
      }
      const priceMin = Number(data.suggested_price_min) || 0;
      const priceMax = Number(data.suggested_price_max) || 0;
      const priceMid = priceMin && priceMax ? Math.round((priceMin + priceMax) / 2) : (priceMin || priceMax || 0);
      setResult({
        name: data.name || '',
        brand: data.brand || '',
        model: data.model || '',
        variant: data.variant || '',
        category: data.category || '',
        subcategory: data.subcategory || '',
        condition: data.condition || 'usado',
        short_description: data.short_description || '',
        description_about: data.description_about || '',
        description_condition: data.description_condition || '',
        description_highlights: Array.isArray(data.description_highlights) ? data.description_highlights : [],
        specs: Array.isArray(data.specs) ? data.specs : [],
        suggested_price_min: priceMin,
        suggested_price_max: priceMax,
        selected_price: priceMid,
        sku: generateSku(data.brand, data.model),
        tags: Array.isArray(data.tags) ? data.tags : [],
        confidence: data.confidence || 0,
        edited_images: images.some(i => i.original) ? images.map(i => ({ base64: i.base64, mime_type: i.mime_type })) : undefined,
      });
      setState('result');
    } catch (e) {
      console.error(e);
      setErrorMsg(e instanceof Error ? e.message : 'Erro');
      setState('error');
    }
  };

  // ---------- ACTION 3: Otimizar para Marketplace ----------
  const handleOptimizeMarketplace = async () => {
    if (!result) return;
    setState('optimizing'); setErrorMsg('');
    try {
      // Strip heavy fields (edited_images base64) from payload
      const { edited_images, image_urls, ...productLite } = result;
      const { data, error } = await supabase.functions.invoke('scan-product-image', {
        body: { mode: 'marketplace', product: productLite },
      });
      if (error) {
        const { msg } = await extractFunctionError(error);
        toast.error(msg);
        setState('result'); return;
      }
      setMarketplace(data?.result || null);
      toast.success('Variantes geradas para Mercado Livre, Shopee e OLX.');
      setState('result');
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Erro');
      setState('result');
    }
  };

  const handleApply = async () => {
    if (!result) return;
    // Upload all current scanner images (padronizadas ou originais) to storage
    // so they persist and can be applied to the product.
    const uploadedUrls: string[] = [];
    if (images.length > 0) {
      try {
        toast.info('Salvando imagens no produto...');
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const ext = (img.mime_type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
          const blob = base64ToBlob(img.base64, img.mime_type);
          const fileName = `products/scanner/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { data: up, error: upErr } = await supabase.storage
            .from('landing-images')
            .upload(fileName, blob, { contentType: img.mime_type, cacheControl: '3600' });
          if (upErr) throw upErr;
          const { data: urlData } = supabase.storage.from('landing-images').getPublicUrl(up.path);
          uploadedUrls.push(urlData.publicUrl);
        }
      } catch (e) {
        console.error('Failed uploading scanner images:', e);
        toast.error('Não foi possível salvar as imagens. O cadastro será aplicado sem fotos.');
      }
    }
    onApply({ ...result, image_urls: uploadedUrls, marketplace_data: marketplace });
    toast.success('Cadastro aplicado! Revise antes de salvar.');
    handleClose();
  };

  const confidenceBadge = (c: number) => {
    if (c >= 0.85) return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Alta {Math.round(c * 100)}%</Badge>;
    if (c >= 0.6) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Média {Math.round(c * 100)}%</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-red-200">Baixa {Math.round(c * 100)}%</Badge>;
  };

  const fmtBRL = (n: number) => n > 0 ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

  const updateHighlight = (i: number, v: string) => {
    if (!result) return;
    const arr = [...(result.description_highlights || [])];
    arr[i] = v;
    setResult({ ...result, description_highlights: arr });
  };
  const removeHighlight = (i: number) => {
    if (!result) return;
    setResult({ ...result, description_highlights: (result.description_highlights || []).filter((_, idx) => idx !== i) });
  };
  const addHighlight = () => {
    if (!result) return;
    setResult({ ...result, description_highlights: [...(result.description_highlights || []), ''] });
  };
  const updateSpec = (i: number, key: 'label' | 'value', v: string) => {
    if (!result) return;
    const arr = [...(result.specs || [])];
    arr[i] = { ...arr[i], [key]: v };
    setResult({ ...result, specs: arr });
  };
  const removeSpec = (i: number) => {
    if (!result) return;
    setResult({ ...result, specs: (result.specs || []).filter((_, idx) => idx !== i) });
  };
  const addSpec = () => {
    if (!result) return;
    setResult({ ...result, specs: [...(result.specs || []), { label: '', value: '' }] });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copiado!`),
      () => toast.error('Falha ao copiar'),
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col overflow-hidden">
      <section className="bg-white w-full h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 sm:px-6 py-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-gray-900 font-semibold text-base sm:text-lg">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Scanner de Produto com IA
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose} className="text-gray-500 hover:text-gray-900">
            <X className="w-4 h-4 mr-1" /> Fechar
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 pb-24 space-y-4">
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />
        <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif,.webp,.bmp,.tif,.tiff" multiple className="hidden" onChange={handleFileSelected} />

        {state === 'idle' && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-600">
              Tire ou envie até {MAX_IMAGES} fotos do mesmo produto (vários ângulos). Em seguida você pode <strong>padronizar imagens</strong>, <strong>gerar cadastro completo</strong> e <strong>otimizar para marketplaces</strong> — cada etapa é independente.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" onClick={() => cameraInputRef.current?.click()}
                className="h-24 flex flex-col gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200" variant="outline">
                <Camera className="w-6 h-6" /><span>Tirar Foto</span>
              </Button>
              <Button type="button" onClick={() => fileInputRef.current?.click()}
                className="h-24 flex flex-col gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200" variant="outline">
                <Upload className="w-6 h-6" /><span>Enviar Imagens</span>
              </Button>
            </div>
          </div>
        )}

        {state === 'preparing' && (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            <p className="text-sm text-gray-600">Preparando e comprimindo...</p>
          </div>
        )}

        {(state === 'preview' || state === 'editing-image' || state === 'scanning') && images.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {images.map((img, i) => {
                const showOrig = showOriginal && img.original;
                const url = showOrig ? img.original!.previewUrl : img.previewUrl;
                return (
                  <div key={i} className="relative group aspect-square bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                    <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    {img.original && !showOrig && (
                      <Badge className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] px-1.5 py-0">Padronizada</Badge>
                    )}
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">{img.sizeKb}KB</span>
                  </div>
                );
              })}
              {images.length < MAX_IMAGES && state === 'preview' && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-emerald-500 hover:text-emerald-600 transition-colors">
                  <Plus className="w-5 h-5" /><span className="text-xs mt-1">Adicionar</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{images.length} de {MAX_IMAGES} fotos</span>
              {images.some(i => i.original) && (
                <button type="button" onClick={() => setShowOriginal(s => !s)}
                  className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800">
                  <Eye className="w-3 h-3" />
                  {showOriginal ? 'Ver padronizada' : 'Ver original'}
                </button>
              )}
            </div>

            {(state === 'editing-image' || state === 'scanning') && (
              <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span className="text-sm text-emerald-700">
                  {state === 'editing-image' ? 'Padronizando imagens (Photoshop por IA)…' : 'Analisando produto e gerando cadastro…'}
                </span>
              </div>
            )}

            {state === 'preview' && (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <Label className="text-gray-700 text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Descrição breve do produto <span className="text-gray-400 font-normal">(opcional — ajuda a IA a identificar)</span>
                </Label>
                <Textarea
                  value={userHint}
                  onChange={(e) => setUserHint(e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder='Ex: "Forma de plástico para fabricar pisos de borracha 50x50cm" ou "Tênis Nike Air Max 90, tamanho 42, cor preta"'
                  className="bg-white text-gray-900 border-gray-300 resize-none text-sm"
                />
                <div className="text-[10px] text-gray-400 text-right">{userHint.length}/300</div>
              </div>
            )}

            {state === 'preview' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={handleStandardizeImages}
                  className="bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 justify-start">
                  <Wand2 className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate">1. Padronizar Imagens</span>
                </Button>
                <Button type="button" onClick={handleAnalyzeContent}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white justify-start">
                  <Sparkles className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate">2. Analisar Produto</span>
                </Button>
                <Button type="button" variant="outline" onClick={reset}
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 justify-center">
                  <RefreshCw className="w-4 h-4 mr-2" />Recomeçar
                </Button>
              </div>
            )}
            <p className="text-[11px] text-gray-500 text-center">
              💡 Dica: padronizar antes de analisar gera fotos limpas para o anúncio. Analisar direto também funciona.
            </p>
          </div>
        )}

        {state === 'optimizing' && (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            <p className="text-sm text-gray-600">Gerando variantes para Mercado Livre, Shopee e OLX…</p>
          </div>
        )}

        {state === 'result' && result && (
          <div className="space-y-5">
            {/* HEADER */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Confiança da IA:</span>
                {confidenceBadge(result.confidence)}
                {result.brand && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">Marca: {result.brand}</Badge>}
                {result.model && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">Modelo: {result.model}</Badge>}
                {result.variant && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">Variante: {result.variant}</Badge>}
              </div>
              {(result.suggested_price_min! > 0 || result.suggested_price_max! > 0) && (
                <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-right">
                  <p className="text-[10px] text-amber-700 font-medium uppercase tracking-wide">💡 Faixa sugerida</p>
                  <p className="text-sm font-semibold text-amber-900">
                    {fmtBRL(result.suggested_price_min || 0)} – {fmtBRL(result.suggested_price_max || 0)}
                  </p>
                </div>
              )}
            </div>

            <Tabs defaultValue="cadastro" className="w-full">
              <TabsList className="grid grid-cols-2 bg-gray-100">
                <TabsTrigger value="cadastro" className="data-[state=active]:bg-white">📦 Cadastro</TabsTrigger>
                <TabsTrigger value="marketplace" className="data-[state=active]:bg-white">
                  <Store className="w-3 h-3 mr-1" />Marketplaces
                </TabsTrigger>
              </TabsList>

              {/* TAB: CADASTRO */}
              <TabsContent value="cadastro" className="mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-5 max-w-[1600px] mx-auto">
                  {/* LEFT */}
                  <div className="space-y-4 xl:col-span-7">
                    <div>
                      <Label className="text-gray-700 text-sm">Nome (SEO)</Label>
                      <Input value={result.name} onChange={e => setResult({ ...result, name: e.target.value })}
                        className="mt-1 bg-white text-gray-900 border-gray-300" maxLength={80} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-700 text-sm">Categoria</Label>
                        <Input value={result.category} onChange={e => setResult({ ...result, category: e.target.value })}
                          className="mt-1 bg-white text-gray-900 border-gray-300" />
                      </div>
                      <div>
                        <Label className="text-gray-700 text-sm">Condição</Label>
                        <Select value={result.condition} onValueChange={(v: ScanResult['condition']) => setResult({ ...result, condition: v })}>
                          <SelectTrigger className="mt-1 bg-white text-gray-900 border-gray-300"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="novo">Novo</SelectItem>
                            <SelectItem value="usado">Usado</SelectItem>
                            <SelectItem value="no_estado">No estado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* SKU + Preço escolhido */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-700 text-sm">SKU / Código</Label>
                        <div className="flex gap-1 mt-1">
                          <Input value={result.sku || ''} onChange={e => setResult({ ...result, sku: e.target.value })}
                            className="bg-white text-gray-900 border-gray-300 font-mono text-xs" />
                          <Button type="button" variant="outline" size="sm"
                            onClick={() => setResult({ ...result, sku: generateSku(result.brand, result.model) })}
                            className="shrink-0 px-2 bg-white text-gray-700 border-gray-300">
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-700 text-sm">Preço final (R$)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={result.selected_price || 0}
                          onChange={e => setResult({ ...result, selected_price: Number(e.target.value) || 0 })}
                          className="mt-1 bg-white text-gray-900 border-gray-300"
                        />
                        {(result.suggested_price_min! > 0 || result.suggested_price_max! > 0) && (
                          <div className="flex gap-1 mt-1">
                            <button type="button" onClick={() => setResult({ ...result, selected_price: result.suggested_price_min || 0 })}
                              className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100">Mín</button>
                            <button type="button" onClick={() => setResult({ ...result, selected_price: Math.round(((result.suggested_price_min || 0) + (result.suggested_price_max || 0)) / 2) })}
                              className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100">Médio</button>
                            <button type="button" onClick={() => setResult({ ...result, selected_price: result.suggested_price_max || 0 })}
                              className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100">Máx</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-700 text-sm">Resumo</Label>
                      <Input value={result.short_description || ''} onChange={e => setResult({ ...result, short_description: e.target.value })}
                        className="mt-1 bg-white text-gray-900 border-gray-300" maxLength={150}
                        placeholder="1-2 linhas com palavra-chave + benefício" />
                    </div>

                    <div>
                      <Label className="text-gray-700 text-sm flex items-center gap-1">📦 Sobre o produto</Label>
                      <Textarea value={result.description_about || ''} onChange={e => setResult({ ...result, description_about: e.target.value })}
                        rows={4} className="mt-1 bg-white text-gray-900 border-gray-300 resize-none" />
                    </div>

                    <div>
                      <Label className="text-gray-700 text-sm flex items-center gap-1">⚙️ Estado / Condição</Label>
                      <Textarea value={result.description_condition || ''} onChange={e => setResult({ ...result, description_condition: e.target.value })}
                        rows={3} className="mt-1 bg-white text-gray-900 border-gray-300 resize-none" />
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="space-y-4 xl:col-span-5">
                    {/* Highlights */}
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <Label className="text-gray-700 text-sm flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1">✨ Destaques</span>
                        <button type="button" onClick={addHighlight} className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                          <Plus className="w-3 h-3" />Adicionar
                        </button>
                      </Label>
                      <div className="space-y-1.5">
                        {(result.description_highlights || []).map((h, i) => (
                          <div key={i} className="flex gap-1.5">
                            <Input value={h} onChange={e => updateHighlight(i, e.target.value)}
                              className="h-8 text-xs bg-white text-gray-900 border-gray-300" />
                            <button type="button" onClick={() => removeHighlight(i)}
                              className="px-2 text-gray-400 hover:text-red-600">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {(!result.description_highlights || result.description_highlights.length === 0) && (
                          <p className="text-xs text-gray-400 italic">Nenhum destaque ainda.</p>
                        )}
                      </div>
                    </div>

                    {/* Specs */}
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <Label className="text-gray-700 text-sm flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" />Características</span>
                        <button type="button" onClick={addSpec} className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                          <Plus className="w-3 h-3" />Adicionar
                        </button>
                      </Label>
                      <div className="space-y-1.5">
                        {(result.specs || []).map((s, i) => (
                          <div key={i} className="flex gap-1.5">
                            <Input value={s.label} placeholder="Rótulo" onChange={e => updateSpec(i, 'label', e.target.value)}
                              className="h-8 text-xs bg-white text-gray-900 border-gray-300 w-1/3" />
                            <Input value={s.value} placeholder="Valor" onChange={e => updateSpec(i, 'value', e.target.value)}
                              className="h-8 text-xs bg-white text-gray-900 border-gray-300 flex-1" />
                            <button type="button" onClick={() => removeSpec(i)} className="px-2 text-gray-400 hover:text-red-600">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {(!result.specs || result.specs.length === 0) && (
                          <p className="text-xs text-gray-400 italic">Sem ficha técnica ainda.</p>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {result.tags && result.tags.length > 0 && (
                      <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-lg">
                        <Label className="text-gray-700 text-sm flex items-center gap-1 mb-2"><Tag className="w-3 h-3" />Tags SEO</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {result.tags.map((t, i) => (
                            <Badge key={i} variant="outline" className="bg-white text-emerald-700 border-emerald-200 text-xs">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* TAB: MARKETPLACE */}
              <TabsContent value="marketplace" className="mt-4 space-y-3">
                {!marketplace ? (
                  <div className="py-8 text-center space-y-3">
                    <Store className="w-12 h-12 text-emerald-600 mx-auto" />
                    <p className="text-sm text-gray-600 max-w-md mx-auto">
                      Adapte automaticamente este cadastro para os 3 maiores marketplaces brasileiros:
                      <strong> Mercado Livre, Shopee e OLX</strong>.
                    </p>
                    <Button type="button" onClick={handleOptimizeMarketplace}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Sparkles className="w-4 h-4 mr-2" />Gerar Variantes
                    </Button>
                  </div>
                ) : (
                  <Tabs defaultValue="ml" className="w-full">
                    <TabsList className="grid grid-cols-3 bg-gray-100">
                      <TabsTrigger value="ml" className="data-[state=active]:bg-white">Mercado Livre</TabsTrigger>
                      <TabsTrigger value="shopee" className="data-[state=active]:bg-white">Shopee</TabsTrigger>
                      <TabsTrigger value="olx" className="data-[state=active]:bg-white">OLX</TabsTrigger>
                    </TabsList>
                    {(['mercado_livre', 'shopee', 'olx'] as const).map((key, idx) => {
                      const v = marketplace[key as keyof MarketplaceVariant] as any;
                      if (!v) return null;
                      const tabValue = ['ml', 'shopee', 'olx'][idx];
                      return (
                        <TabsContent key={key} value={tabValue} className="mt-3 space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <Label className="text-gray-700 text-sm">Título ({v.title?.length || 0} chars)</Label>
                              <button type="button" onClick={() => copyToClipboard(v.title || '', 'Título')}
                                className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                                <Copy className="w-3 h-3" />Copiar
                              </button>
                            </div>
                            <Input value={v.title || ''} readOnly className="bg-gray-50 text-gray-900 border-gray-300" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <Label className="text-gray-700 text-sm">Descrição</Label>
                              <button type="button" onClick={() => copyToClipboard(v.description || '', 'Descrição')}
                                className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                                <Copy className="w-3 h-3" />Copiar
                              </button>
                            </div>
                            <Textarea value={v.description || ''} readOnly rows={10}
                              className="bg-gray-50 text-gray-900 border-gray-300 text-sm resize-none font-mono" />
                          </div>
                          {(v.keywords || v.hashtags) && (
                            <div className="p-2 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                              <Label className="text-xs text-gray-700">{v.keywords ? 'Palavras-chave' : 'Hashtags'}</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(v.keywords || v.hashtags || []).map((k: string, i: number) => (
                                  <Badge key={i} variant="outline" className="bg-white text-emerald-700 border-emerald-200 text-[10px]">{k}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                )}
              </TabsContent>
            </Tabs>

            {/* FOOTER */}
            <div className="flex gap-2 pt-3 border-t border-gray-200 sticky bottom-0 bg-white -mx-4 sm:-mx-8 px-4 sm:px-8 -mb-24 pb-4 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)]">
              <Button type="button" variant="outline" onClick={handleClose}
                className="flex-1 bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
                <X className="w-4 h-4 mr-2" />Descartar
              </Button>
              <Button type="button" onClick={handleApply}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Check className="w-4 h-4 mr-2" />Aplicar ao Produto
              </Button>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{errorMsg}</p>
            </div>
            {errorDetail && (
              <div className="text-xs">
                <button type="button" onClick={() => setShowDetail(v => !v)}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                  {showDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showDetail ? 'Ocultar detalhes' : 'Ver detalhes técnicos'}
                </button>
                {showDetail && (
                  <pre className="mt-2 max-h-40 overflow-auto p-2 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-700 whitespace-pre-wrap break-all">{errorDetail}</pre>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose}
                className="flex-1 bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
                Fechar
              </Button>
              <Button type="button" onClick={() => setState(images.length > 0 ? 'preview' : 'idle')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                <RefreshCw className="w-4 h-4 mr-2" />Voltar
              </Button>
            </div>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}

function base64ToBlob(base64: string, mime: string): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  return new Blob([new Uint8Array(byteNumbers)], { type: mime });
}
