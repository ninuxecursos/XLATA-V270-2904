import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Send, Image, Loader2, X, RefreshCw, MessageSquare, Camera, Mic, Square, Maximize2, Minimize2, AlertTriangle, ArrowLeft, Trash2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useShopCategories } from '@/hooks/useShopCategories';
import { useAIAutomation } from '@/hooks/useAIAutomation';
import { isMobileDevice, isIOSDevice } from '@/utils/mobileDetection';
import { generateSeoFileName } from '@/utils/seoFileName';

// =====================================================
// TYPES
// =====================================================

interface MessageButton {
  label: string;
  value: string;
  variant?: 'primary' | 'danger' | 'default';
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  photos?: string[];
  studioImage?: boolean;
  buttons?: MessageButton[];
}

interface BufferState {
  messages: string[];
  photos: string[];  // Base64 data URLs for preview
  photoFiles: File[];
  status: 'collecting' | 'awaiting_confirm' | 'idle' | 'awaiting_studio_choice' | 'awaiting_pinterest_choice';
  draftProduct?: any;
  studioImageUrl?: string;
  originalImageUrls?: string[];
  generateStudioImage?: boolean;
  aiMetadata?: {
    sale_type: string;
    interactive_duration_minutes: number | null;
    interactive_increment: number | null;
    interactive_repost_count: number | null;
    interactive_repost_delay_days: number | null;
    is_featured: boolean;
  };
}

// =====================================================
// AUDIO RECORDING TYPES
// =====================================================

type RecordingState = 'idle' | 'recording' | 'transcribing';

type MicPermissionState = 'checking' | 'granted' | 'denied' | 'prompt';

// =====================================================
// CATEGORIES (same as backend)
// =====================================================

const CATEGORIES = [
  { id: '3b05a7fa-d478-408b-aa69-e5f5981df99b', name: 'Antiguidades e Coleções', keywords: ['antigo', 'antiguidade', 'coleção', 'vintage', 'retrô', 'raro'] },
  { id: 'b9790bb0-fb00-45f6-88ec-a208d89b290e', name: 'Casa e Jardim', keywords: ['jardim', 'planta', 'vaso', 'decoração', 'casa', 'quintal'] },
  { id: 'b794d863-d8b2-4015-9ead-169168dcc41e', name: 'Comercial e Escritório', keywords: ['escritório', 'comercial', 'loja', 'vitrine', 'balcão'] },
  { id: '7f6c70e7-ca6d-4714-88e4-97e142c0a459', name: 'Eletrônicos e Informática', keywords: ['computador', 'eletrônico', 'placa', 'monitor', 'notebook', 'celular'] },
  { id: '15b4d9dc-cec9-46ae-b081-7d83d4c384fe', name: 'Esporte e Lazer', keywords: ['esporte', 'bicicleta', 'academia', 'esteira', 'peso', 'lazer'] },
  { id: '88b9db73-56f0-4652-8d93-39cdf9122981', name: 'Máquinas e Ferramentas', keywords: ['máquina', 'ferramenta', 'solda', 'motor', 'compressor', 'torno', 'furadeira'] },
  { id: '08c70716-33d5-4e22-b460-e1154e3e0edf', name: 'Materiais de Construção', keywords: ['construção', 'tijolo', 'cimento', 'escada', 'tubo', 'porta', 'janela', 'telha'] },
  { id: 'c5f61fef-b7d6-4e75-9331-5c74ba387fe5', name: 'Móveis e Decoração', keywords: ['mesa', 'cadeira', 'sofá', 'estante', 'armário', 'móvel', 'decoração', 'rack'] },
  { id: 'fbf5f829-516a-4b76-9b0c-2f0764ccff3c', name: 'Outros', keywords: [] },
  { id: '494d6e91-0241-4c0b-b01a-54493ed118ee', name: 'Veículos e Peças', keywords: ['moto', 'carro', 'veículo', 'peça', 'pneu', 'motor', 'caminhão'] },
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function isTerminei(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return ['terminei', 'pronto', 'fim', 'done', 'finalizar'].includes(normalized);
}

function isOk(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return ['ok', 'sim', 's', 'yes', 'y', 'confirmar', 'publicar'].includes(normalized);
}

function isCancelar(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return ['cancelar', 'cancel', 'não', 'nao', 'n', 'no', 'descartar'].includes(normalized);
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

// =====================================================
// MAIN COMPONENT
// =====================================================

interface TelegramChatSimulatorProps {
  onClose?: () => void;
}

export function TelegramChatSimulator({ onClose }: TelegramChatSimulatorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      role: 'bot',
      content: '👋 Olá! Sou o bot de cadastro rápido do XLata.\n\n📦 Envie tudo sobre o produto:\n• Fotos\n• Nome e descrição\n• Preços (custo e venda)\n• Dimensões e peso\n• Qualquer informação relevante\n• Tipo de venda: Normal ou Interativa;\n• Se interativa, quanto tempo anunciado - Período para renovação automática\n• Novo, estado de novo, usado, no estado ou sucata\n• Categoria sugerida para o produto(opcional)\n• Entrega ou só retirada?\n• Forma de pagamento: Dinheiro, Pix, Débito ou crédito(só online);\n\nQuando terminar, digite: Terminei',
      timestamp: new Date(),
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [buffer, setBuffer] = useState<BufferState>({
    messages: [],
    photos: [],
    photoFiles: [],
    status: 'collecting'
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { data: categories } = useShopCategories();
  const { config: aiConfig } = useAIAutomation();
  const queryClient = useQueryClient();

  // Mobile detection
  const isMobile = useMemo(() => isMobileDevice(), []);
  const isIOS = useMemo(() => isIOSDevice(), []);
  
  // Audio recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  
  // Microphone permission state
  const [micPermission, setMicPermission] = useState<MicPermissionState>('checking');
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clickedMessageIds, setClickedMessageIds] = useState<Set<string>>(new Set());

  // AI Model selector
  const [selectedModel, setSelectedModel] = useState('google/gemini-3-flash-preview');

  // Sync selectedModel with AI config
  useEffect(() => {
    if (aiConfig?.ai_model) {
      if (aiConfig.ai_provider === 'google_gemini') {
        // Map direct Gemini model name to gateway format: gemini-2.5-flash → google/gemini-2.5-flash
        setSelectedModel(`google/${aiConfig.ai_model}`);
      } else {
        // lovable_cloud models are already in gateway format
        setSelectedModel(aiConfig.ai_model);
      }
    }
  }, [aiConfig]);

  const AI_MODELS = [
    { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', desc: 'Mais rápido' },
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: 'Equilibrado' },
    { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash', desc: 'Padrão' },
    { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', desc: 'Alta qualidade' },
    { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro', desc: 'Próxima geração' },
    { value: 'openai/gpt-5-nano', label: 'GPT-5 Nano', desc: 'Rápido' },
    { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini', desc: 'Intermediário' },
    { value: 'openai/gpt-5', label: 'GPT-5', desc: 'Alta qualidade' },
    { value: 'openai/gpt-5.2', label: 'GPT-5.2', desc: 'Mais recente' },
  ];

  // Check microphone permission on mount
  useEffect(() => {
    const checkMicPermission = async () => {
      // On mobile, navigator.permissions.query for microphone is unreliable
      // (can return 'denied' even when permission hasn't been asked yet)
      // Skip it and default to 'prompt' so the native dialog triggers correctly
      if (isMobileDevice()) {
        console.log('[TelegramSimulator] Mobile detected, skipping Permissions API (unreliable), defaulting to prompt');
        setMicPermission('prompt');
        return;
      }

      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setMicPermission(result.state as MicPermissionState);
          
          result.onchange = () => {
            setMicPermission(result.state as MicPermissionState);
          };
          return;
        }
      } catch (e) {
        console.log('[TelegramSimulator] Permissions API not supported, assuming prompt state');
      }
      setMicPermission('prompt');
    };
    
    checkMicPermission();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addBotMessage = (content: string, extra?: Partial<Message>) => {
    const msg: Message = {
      id: generateId(),
      role: 'bot',
      content,
      timestamp: new Date(),
      ...extra
    };
    setMessages(prev => [...prev, msg]);
    return msg.id;
  };

  const handleButtonClick = (msgId: string, button: MessageButton) => {
    if (clickedMessageIds.has(msgId) || isProcessing) return;
    setClickedMessageIds(prev => new Set(prev).add(msgId));
    handleUserInput(button.value);
  };

  const addUserMessage = (content: string, photos?: string[]) => {
    setMessages(prev => [...prev, {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
      photos
    }]);
  };

  // =====================================================
  // AI PROCESSING (Block Mode)
  // =====================================================

  const processWithAI = async (generateStudio: boolean = false) => {
    // Guard: prevent duplicate product creation
    if (isProcessing || buffer.draftProduct) {
      console.warn('[TelegramChat] processWithAI blocked: already processing or draft exists');
      return;
    }
    setIsProcessing(true);
    addBotMessage(`⏳ Processando...\n\nAnalisando ${buffer.messages.length} mensagem(s) e ${buffer.photos.length} foto(s).`);

    try {
      // 1. Upload images to storage
      const imageUrls: string[] = [];
      const productSlug = `produto-${Date.now()}`;
      
      for (let i = 0; i < buffer.photoFiles.length; i++) {
        const file = buffer.photoFiles[i];
        const fileName = `${productSlug}/${String(i + 1).padStart(3, '0')}.jpg`;
        const filePath = `products/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('shop-product-images')
          .upload(filePath, file);
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('shop-product-images')
          .getPublicUrl(filePath);
        
        if (urlData.publicUrl) {
          imageUrls.push(urlData.publicUrl);
        }
      }

      if (imageUrls.length === 0 && buffer.photoFiles.length > 0) {
        throw new Error('Erro ao fazer upload das imagens');
      }

      // 2. Image Studio: Generate professional image
      let finalImageUrls = [...imageUrls];
      const productTitleForSeo: string | null = null; // Will be set after AI returns title
      if (generateStudio && imageUrls.length > 0) {
        try {
          // Fetch active prompt
          const { data: activePromptData } = await supabase
            .from('image_studio_prompts')
            .select('prompt')
            .eq('is_active', true)
            .maybeSingle();

          if (activePromptData?.prompt) {
            addBotMessage('🎨 Gerando imagem profissional do produto...');

            const { data: studioData, error: studioError } = await supabase.functions.invoke('generate-product-studio-image', {
              body: {
                imageUrls: imageUrls.slice(0, 5),
                prompt: activePromptData.prompt,
              }
            });

            if (studioError) {
              console.error('[ImageStudio] Edge function error:', studioError);
              toast.info('Não foi possível gerar imagem profissional. Usando imagens originais.');
            } else if (studioData?.success && studioData?.imageUrl) {
              finalImageUrls = [studioData.imageUrl, ...imageUrls];
              // Save studio image state for later delete/regenerate
              setBuffer(prev => ({
                ...prev,
                studioImageUrl: studioData.imageUrl,
                originalImageUrls: [...imageUrls],
              }));
              // Show generated image in chat
              addBotMessage('✨ Imagem profissional gerada com sucesso!', {
                photos: [studioData.imageUrl],
                studioImage: true,
              });
              console.log('[ImageStudio] Professional image generated successfully');
            } else {
              console.warn('[ImageStudio] Generation failed:', studioData?.error);
              toast.info('Não foi possível gerar imagem profissional. Usando imagens originais.');
            }
          }
        } catch (studioErr) {
          console.error('[ImageStudio] Unexpected error:', studioErr);
          toast.info('Não foi possível gerar imagem profissional. Usando imagens originais.');
        }
      }

      // 2. Call AI to extract structured data
      const { data: aiData, error: aiError } = await supabase.functions.invoke('process-telegram-block', {
        body: {
          messages: buffer.messages,
          photo_count: imageUrls.length,
          categories: CATEGORIES.map(c => ({ id: c.id, name: c.name })),
          model: selectedModel
        }
      });

      if (aiError) {
        console.error('AI error:', aiError);
        throw new Error('Erro ao processar com IA');
      }

      // Validate price
      if (!aiData || aiData.price <= 0) {
        addBotMessage(
          `⚠️ <b>Preço não detectado!</b>\n\n` +
          `A IA não conseguiu identificar o preço de venda.\n\n` +
          `Envie uma mensagem com o preço (ex: "Vendo por R$ 850") e digite <b>Terminei</b> novamente.`
        );
        setIsProcessing(false);
        return;
      }

      // 3. Rename images with SEO-friendly names
      if (aiData.name && finalImageUrls.length > 0) {
        const renamedUrls: string[] = [];
        for (let i = 0; i < finalImageUrls.length; i++) {
          const url = finalImageUrls[i];
          try {
            // Extract the current path from the URL
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/object/public/');
            if (pathParts.length < 2) {
              renamedUrls.push(url);
              continue;
            }
            const bucketAndPath = pathParts[1];
            const slashIndex = bucketAndPath.indexOf('/');
            const bucketName = bucketAndPath.substring(0, slashIndex);
            const oldPath = decodeURIComponent(bucketAndPath.substring(slashIndex + 1));
            
            const ext = url.includes('.webp') ? 'webp' : 'jpg';
            const newPath = generateSeoFileName(aiData.name, i, ext);

            const { error: copyError } = await supabase.storage
              .from(bucketName)
              .copy(oldPath, newPath);

            if (copyError) {
              console.warn('[SEO Rename] Copy failed, keeping original:', copyError);
              renamedUrls.push(url);
              continue;
            }

            // Get new public URL
            const { data: newUrlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(newPath);
            
            renamedUrls.push(newUrlData.publicUrl);

            // Remove original file (fire and forget)
            supabase.storage.from(bucketName).remove([oldPath]).catch(() => {});
          } catch (renameErr) {
            console.warn('[SEO Rename] Error renaming image:', renameErr);
            renamedUrls.push(url);
          }
        }
        finalImageUrls = renamedUrls;
      }

      // 4. Ensure unique slug
      let slug = aiData.slug || generateSlug(aiData.name);
      let counter = 0;
      while (true) {
        const { data: existing } = await supabase
          .from('shop_products')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();
        
        if (!existing) break;
        counter++;
        slug = `${aiData.slug}-${counter}`;
      }

      // Generate unique SKU
      const generateUniqueSKU = async (): Promise<string> => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        for (let attempt = 0; attempt < 10; attempt++) {
          const random = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
          const sku = `XL-${date}-${random}`;
          const { data } = await supabase
            .from('shop_products')
            .select('id')
            .eq('sku', sku)
            .maybeSingle();
          if (!data) return sku;
        }
        return `XL-${Date.now()}`;
      };

      // 4. Create product as DRAFT
      const generatedSku = await generateUniqueSKU();
      const { data: product, error: productError } = await supabase
        .from('shop_products')
        .insert({
          name: aiData.name,
          slug,
          sku: generatedSku,
          description: aiData.description,
          short_description: aiData.short_description,
          price: aiData.price,
          sale_price: aiData.sale_price,
          cost_price: aiData.cost_price,
          sale_type: aiData.sale_type || 'normal',
          condition: aiData.condition || 'usado',
          category_id: aiData.category_id || CATEGORIES[8].id,
          tags: aiData.tags || [],
          seo_title: aiData.seo_title,
          seo_description: aiData.seo_description,
          images: finalImageUrls,
          weight: aiData.weight,
          dimensions: aiData.dimensions,
          stock_quantity: aiData.stock_quantity || 1,
          is_active: false,  // DRAFT
          is_visible: false, // DRAFT
          is_featured: aiData.is_featured || false,
        })
        .select()
        .single();

      if (productError) {
        console.error('Product error:', productError);
        throw new Error('Erro ao criar produto');
      }

      // 5. Update buffer state
      setBuffer(prev => ({
        ...prev,
        status: 'awaiting_confirm',
        draftProduct: { ...product, category_name: aiData.category_name },
        aiMetadata: {
          sale_type: aiData.sale_type || 'normal',
          interactive_duration_minutes: aiData.interactive_duration_minutes || null,
          interactive_increment: aiData.interactive_increment || null,
          interactive_repost_count: aiData.interactive_repost_count || null,
          interactive_repost_delay_days: aiData.interactive_repost_delay_days || null,
          is_featured: aiData.is_featured || false,
        }
      }));

      // 6. Show preview
      const dimensionsText = aiData.dimensions && (aiData.dimensions.width || aiData.dimensions.height || aiData.dimensions.depth)
        ? `📏 Dimensões: ${aiData.dimensions.width || '-'}x${aiData.dimensions.height || '-'}x${aiData.dimensions.depth || '-'} cm\n`
        : '';
      
      const weightText = aiData.weight ? `⚖️ Peso: ${aiData.weight} kg\n` : '';
      const costText = aiData.cost_price ? `💵 Custo: R$ ${aiData.cost_price.toFixed(2)}\n` : '';
      
      // Format short description for preview
      const shortDescText = aiData.short_description 
        ? `📄 Resumo: ${aiData.short_description}\n\n` 
        : '';
      
      // Format description for preview (first 200 chars)
      const descriptionPreview = aiData.description 
        ? `💬 Descrição:\n${aiData.description.substring(0, 200)}${aiData.description.length > 200 ? '...' : ''}\n\n`
        : '';
      
      // Interactive sale config text
      const interactiveText = aiData.sale_type === 'interactive'
        ? `\n⚡ CONFIGURAÇÃO INTERATIVA:\n` +
          `⏱️ Duração: ${aiData.interactive_duration_minutes || 'Padrão'} min\n` +
          `📈 Lance mínimo: R$ ${aiData.interactive_increment?.toFixed(2) || 'Padrão'}\n` +
          `🔄 Reposts: ${aiData.interactive_repost_count || 0}x\n\n`
        : '';

      addBotMessage(
        `📦 PREVIEW DO PRODUTO\n\n` +
        `📝 Nome: ${aiData.name}\n` +
        `${shortDescText}` +
        `${descriptionPreview}` +
        `💰 Preço: R$ ${aiData.price.toFixed(2)}\n` +
        `${costText}` +
        `${dimensionsText}` +
        `${weightText}` +
        `📁 Categoria: ${aiData.category_name || 'Outros'}\n` +
        `🏷️ Condição: ${aiData.condition === 'novo' ? 'Novo / Estado de novo' : aiData.condition === 'no_estado' ? 'No estado / Sucata' : 'Usado'}\n` +
        `📸 Fotos: ${imageUrls.length} imagens\n` +
        `🛒 Tipo: ${aiData.sale_type === 'interactive' ? 'Venda Interativa' : 'Venda Normal'}\n` +
        `${aiData.is_featured ? '⭐ DESTAQUE ATIVADO\n' : ''}` +
        `${interactiveText}` +
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        {
          buttons: [
            { label: '✅ Publicar', value: 'ok', variant: 'primary' },
            { label: '❌ Cancelar', value: 'cancelar', variant: 'danger' },
          ]
        }
      );

    } catch (error: any) {
      console.error('Error processing:', error);
      addBotMessage(`❌ Erro ao processar: ${error.message}\n\nEnvie mais informações e digite Terminei novamente.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // =====================================================
  // STUDIO IMAGE ACTIONS
  // =====================================================

  const deleteStudioImage = async () => {
    if (!buffer.studioImageUrl || !buffer.draftProduct) return;
    setIsProcessing(true);
    try {
      const path = buffer.studioImageUrl.split('/shop-product-images/')[1];
      if (path) {
        await supabase.storage.from('shop-product-images').remove([path]);
      }
      const updatedImages = (buffer.draftProduct.images || []).filter(
        (url: string) => url !== buffer.studioImageUrl
      );
      await supabase
        .from('shop_products')
        .update({ images: updatedImages })
        .eq('id', buffer.draftProduct.id);

      setBuffer(prev => ({
        ...prev,
        studioImageUrl: undefined,
        draftProduct: { ...prev.draftProduct, images: updatedImages },
      }));
      setMessages(prev => prev.filter(m => !m.studioImage));
      addBotMessage('🗑️ Imagem profissional removida. O produto usará apenas as fotos originais.');
    } catch (error: any) {
      console.error('[ImageStudio] Error deleting:', error);
      toast.error('Erro ao excluir imagem gerada');
    } finally {
      setIsProcessing(false);
    }
  };

  const regenerateStudioImage = async () => {
    if (!buffer.originalImageUrls?.length || !buffer.draftProduct) return;
    setIsProcessing(true);
    try {
      const { data: activePromptData } = await supabase
        .from('image_studio_prompts')
        .select('prompt')
        .eq('is_active', true)
        .maybeSingle();

      if (!activePromptData?.prompt) {
        toast.error('Nenhum prompt ativo encontrado no Image Studio');
        setIsProcessing(false);
        return;
      }

      addBotMessage('🎨 Regenerando imagem profissional...');

      if (buffer.studioImageUrl) {
        const oldPath = buffer.studioImageUrl.split('/shop-product-images/')[1];
        if (oldPath) {
          await supabase.storage.from('shop-product-images').remove([oldPath]);
        }
      }

      const { data: studioData, error: studioError } = await supabase.functions.invoke('generate-product-studio-image', {
        body: {
          imageUrls: buffer.originalImageUrls.slice(0, 5),
          prompt: activePromptData.prompt,
        }
      });

      if (studioError || !studioData?.success || !studioData?.imageUrl) {
        console.error('[ImageStudio] Regeneration failed:', studioError || studioData?.error);
        toast.error('Não foi possível regenerar a imagem. Tente novamente.');
        setIsProcessing(false);
        return;
      }

      const newImages = [studioData.imageUrl, ...buffer.originalImageUrls];
      await supabase
        .from('shop_products')
        .update({ images: newImages })
        .eq('id', buffer.draftProduct.id);

      setMessages(prev => prev.filter(m => !m.studioImage));

      setBuffer(prev => ({
        ...prev,
        studioImageUrl: studioData.imageUrl,
        draftProduct: { ...prev.draftProduct, images: newImages },
      }));

      addBotMessage('✨ Nova imagem profissional gerada!', {
        photos: [studioData.imageUrl],
        studioImage: true,
      });

      toast.success('Imagem regenerada com sucesso!');
    } catch (error: any) {
      console.error('[ImageStudio] Regeneration error:', error);
      toast.error('Erro ao regenerar imagem');
    } finally {
      setIsProcessing(false);
    }
  };

  const publishProduct = async (postToPinterest: boolean = false) => {
    if (!buffer.draftProduct || isProcessing) return;

    // Guard: check product is still a draft before publishing
    const { data: currentProduct } = await supabase
      .from('shop_products')
      .select('is_active')
      .eq('id', buffer.draftProduct.id)
      .single();
    
    if (currentProduct?.is_active) {
      addBotMessage(`⚠️ Este produto já foi publicado!`);
      resetSimulator();
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Ativar produto
      const { data: product, error } = await supabase
        .from('shop_products')
        .update({
          is_active: true,
          is_visible: true
        })
        .eq('id', buffer.draftProduct.id)
        .select()
        .single();

      if (error) throw error;

      // Pinterest autopost only if user chose to
      if (postToPinterest) {
        supabase.functions.invoke('pinterest-publish-pin', {
          body: { product_id: product.id }
        }).then(res => {
          if (res.data?.success) {
            console.log('[Pinterest] Pin publicado:', res.data.pin_url);
          } else {
            console.warn('[Pinterest] Falha no autopost:', res.data?.error || res.error);
          }
        }).catch(err => console.error('[Pinterest] Erro:', err));
      }

      // 2. Se for venda interativa, criar evento
      if (product.sale_type === 'interactive') {
        // Buscar config padrão
        const { data: interactiveConfig } = await supabase
          .from('shop_interactive_config')
          .select('*')
          .limit(1)
          .maybeSingle();

        // Usar parâmetros da IA ou fallback para config padrão
        const aiMeta = buffer.aiMetadata;
        const durationMinutes = aiMeta?.interactive_duration_minutes || 
          interactiveConfig?.default_duration_minutes || 60;
        const minimumIncrement = aiMeta?.interactive_increment || 
          interactiveConfig?.default_increment || 5;
        const autoRepostCount = aiMeta?.interactive_repost_count || 0;
        const autoRepostDelayDays = aiMeta?.interactive_repost_delay_days || 3;

        const now = new Date();
        const endAt = new Date(now.getTime() + durationMinutes * 60000);

        const { error: eventError } = await supabase
          .from('shop_interactive_events')
          .insert({
            product_id: product.id,
            initial_value: product.price,
            current_value: product.price,
            minimum_increment: minimumIncrement,
            start_at: now.toISOString(),
            end_at: endAt.toISOString(),
            status: 'active',
            auto_repost_count: autoRepostCount,
            auto_repost_delay_days: autoRepostDelayDays,
            current_repost_number: 0
          });

        if (eventError) {
          console.error('Error creating interactive event:', eventError);
          toast.error('Produto publicado, mas erro ao criar evento interativo');
        } else {
          console.log('Interactive event created successfully');
        }
      }

      // 3. Mensagem de sucesso
      if (product.sale_type === 'interactive') {
        const aiMeta = buffer.aiMetadata;
        const durationMinutes = aiMeta?.interactive_duration_minutes || 5;
        const minimumIncrement = aiMeta?.interactive_increment || 5;

        addBotMessage(
          `✅ Produto publicado em VENDA INTERATIVA!\n\n` +
          `📦 ${product.name}\n` +
          `💰 Valor inicial: R$ ${product.price.toFixed(2)}\n` +
          `⏱️ Duração: ${durationMinutes} minutos\n` +
          `📈 Lance mínimo: R$ ${minimumIncrement.toFixed(2)}\n` +
          `⚡ Evento ativo agora!\n\n` +
          `🔗 Ver: https://xlata.site/shop/${product.slug}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `📦 Envie mais produtos quando quiser!`
        );
      } else {
        addBotMessage(
          `✅ Produto publicado com sucesso!\n\n` +
          `📦 ${product.name}\n` +
          `💰 R$ ${product.price.toFixed(2)}\n\n` +
          `🔗 Ver: https://xlata.site/shop/${product.slug}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `📦 Envie mais produtos quando quiser!`
        );
      }

      toast.success('Produto publicado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      resetSimulator();
    } catch (error: any) {
      console.error('Error publishing:', error);
      addBotMessage(`❌ Erro ao publicar: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelProduct = async () => {
    if (buffer.draftProduct) {
      // Delete images
      if (buffer.draftProduct.images && Array.isArray(buffer.draftProduct.images)) {
        for (const imageUrl of buffer.draftProduct.images) {
          try {
            const path = imageUrl.split('/shop-product-images/')[1];
            if (path) {
              await supabase.storage.from('shop-product-images').remove([path]);
            }
          } catch (e) {
            console.error('Error deleting image:', e);
          }
        }
      }

      // Delete draft product
      await supabase
        .from('shop_products')
        .delete()
        .eq('id', buffer.draftProduct.id);
    }

    addBotMessage(
      `❌ Produto descartado.\n\n📦 Envie novos dados quando quiser cadastrar outro.`
    );

    resetSimulator();
  };

  // =====================================================
  // USER INPUT HANDLER (Block Mode)
  // =====================================================

  const handleUserInput = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    
    addUserMessage(text);
    setInputValue('');

    // Case 1: Awaiting studio image choice
    if (buffer.status === 'awaiting_studio_choice') {
      const normalized = text.trim().toLowerCase();
      const wantsStudio = ['sim', 's', 'yes', 'y', 'ok', 'gerar', 'quero'].includes(normalized);
      const skipsStudio = ['não', 'nao', 'n', 'no', 'pular', 'sem'].includes(normalized);
      
      if (wantsStudio) {
        setBuffer(prev => ({ ...prev, status: 'collecting', generateStudioImage: true }));
        await processWithAI(true);
      } else if (skipsStudio) {
        setBuffer(prev => ({ ...prev, status: 'collecting', generateStudioImage: false }));
        await processWithAI(false);
      } else {
        addBotMessage(`❓ Responda SIM para gerar imagem ilustrativa ou NÃO para pular.`, {
          buttons: [
            { label: '✅ Gerar imagem', value: 'sim', variant: 'primary' },
            { label: '❌ Usar fotos originais', value: 'não', variant: 'default' },
          ]
        });
      }
      return;
    }

    // Case 2: Awaiting Pinterest choice
    if (buffer.status === 'awaiting_pinterest_choice') {
      const normalized = text.trim().toLowerCase();
      const wantsPinterest = ['sim', 's', 'yes', 'y', 'ok', 'postar', 'pinterest'].includes(normalized);
      const skipsPinterest = ['não', 'nao', 'n', 'no', 'pular', 'sem'].includes(normalized);
      
      if (wantsPinterest) {
        await publishProduct(true);
      } else if (skipsPinterest) {
        await publishProduct(false);
      } else {
        addBotMessage(`❓ Deseja postar no Pinterest?`, {
          buttons: [
            { label: '📌 Sim, postar', value: 'sim', variant: 'primary' },
            { label: '❌ Não postar', value: 'não', variant: 'default' },
          ]
        });
      }
      return;
    }

    // Case 3: Awaiting confirmation
    if (buffer.status === 'awaiting_confirm') {
      if (isOk(text)) {
        // Instead of publishing directly, ask about Pinterest
        setBuffer(prev => ({ ...prev, status: 'awaiting_pinterest_choice' }));
        addBotMessage(`📌 Deseja postar no Pinterest também?`, {
          buttons: [
            { label: '📌 Sim, postar', value: 'sim', variant: 'primary' },
            { label: '❌ Não postar', value: 'não', variant: 'default' },
          ]
        });
      } else if (isCancelar(text)) {
        await cancelProduct();
      } else {
        addBotMessage(`❓ Confirme a publicação:`, {
          buttons: [
            { label: '✅ Publicar', value: 'ok', variant: 'primary' },
            { label: '❌ Cancelar', value: 'cancelar', variant: 'danger' },
          ]
        });
      }
      return;
    }

    // Case 3: "Terminei" - ask about studio image before processing
    if (isTerminei(text)) {
      if (buffer.messages.length === 0 && buffer.photos.length === 0) {
        addBotMessage(
          `⚠️ Você ainda não enviou nenhuma informação!\n\n` +
          `📦 Envie fotos, descrição, preço e outras informações do produto.\n\n` +
          `Quando terminar, digite: Terminei`
        );
        return;
      }
      
      // If there are photos, ask about studio image
      if (buffer.photos.length > 0) {
        setBuffer(prev => ({ ...prev, status: 'awaiting_studio_choice' }));
        addBotMessage(
          `🎨 Deseja gerar uma imagem ilustrativa profissional com IA?\n\n` +
          `A IA criará uma foto de capa com fundo limpo e iluminação profissional.`,
          {
            buttons: [
              { label: '✅ Gerar imagem', value: 'sim', variant: 'primary' },
              { label: '❌ Usar fotos originais', value: 'não', variant: 'default' },
            ]
          }
        );
        return;
      }
      
      // No photos, skip studio choice
      await processWithAI(false);
      return;
    }

    // Case 3: Add text to buffer (silently - just visual feedback)
    setBuffer(prev => ({
      ...prev,
      messages: [...prev.messages, text]
    }));
    
    // Check message limit
    if (buffer.messages.length >= 49) {
      addBotMessage(`📝 Limite de 50 mensagens atingido!\n\nDigite Terminei quando estiver pronto.`);
    }
  };

  // =====================================================
  // PHOTO HANDLING
  // =====================================================

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (buffer.status === 'awaiting_confirm') {
      toast.error('Finalize o produto atual primeiro');
      return;
    }

    const currentCount = buffer.photos.length;
    const remaining = 10 - currentCount;

    if (remaining <= 0) {
      toast.error('Limite de 10 fotos atingido!');
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remaining);
    const newPhotos: string[] = [];
    const newFiles: File[] = [];

    for (const file of filesToAdd) {
      if (!file.type.startsWith('image/')) continue;
      
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      
      newPhotos.push(dataUrl);
      newFiles.push(file);
    }

    if (newPhotos.length > 0) {
      setBuffer(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos],
        photoFiles: [...prev.photoFiles, ...newFiles]
      }));

      addUserMessage(`📷 ${newPhotos.length} foto(s) enviada(s)`, newPhotos);
      
      const totalPhotos = currentCount + newPhotos.length;
      if (totalPhotos >= 10) {
        addBotMessage(`📸 Limite de 10 fotos atingido!\n\nDigite Terminei quando estiver pronto.`);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // =====================================================
  // AUDIO RECORDING & TRANSCRIPTION
  // =====================================================

  const getSupportedMimeType = (): string | null => {
    // Guard: MediaRecorder may not exist on all browsers
    if (typeof MediaRecorder === 'undefined') {
      return null;
    }
    // Safari/iOS prefers mp4
    if (isIOS) {
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        return 'audio/mp4';
      }
    }
    // Chrome/Firefox prefer webm
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      return 'audio/webm;codecs=opus';
    }
    if (MediaRecorder.isTypeSupported('audio/webm')) {
      return 'audio/webm';
    }
    if (MediaRecorder.isTypeSupported('audio/mp4')) {
      return 'audio/mp4';
    }
    // Fallback - let browser pick
    return null;
  };

  const startRecording = async () => {
    try {
      // Check secure context (HTTPS required for getUserMedia)
      if (!window.isSecureContext) {
        toast.error('Gravação de áudio requer HTTPS. Acesse o site via https://');
        return;
      }

      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Seu navegador não suporta gravação de áudio. Use Chrome, Firefox ou Safari atualizado.');
        return;
      }

      // Check MediaRecorder availability BEFORE requesting mic access
      if (typeof MediaRecorder === 'undefined') {
        toast.error('Seu navegador não suporta gravação de áudio. Tente usar o Chrome ou Safari atualizado.');
        return;
      }

      // Check if audio input devices exist
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        console.log('[TelegramSimulator] Audio input devices found:', audioInputs.length, audioInputs.map(d => d.label || d.deviceId));
        
        // If no audio inputs found AND labels are empty (permission not yet granted), we still proceed
        // because enumerateDevices may return empty labels before permission is granted
        if (audioInputs.length === 0) {
          console.warn('[TelegramSimulator] No audio input devices detected by enumerateDevices');
        }
      } catch (enumError) {
        console.warn('[TelegramSimulator] enumerateDevices failed:', enumError);
        // Continue anyway - some browsers don't support it well
      }
      
      // Request mic access - try simple constraint first (more compatible), then detailed
      let stream: MediaStream;
      try {
        // Simple constraint first - most compatible across browsers and devices
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[TelegramSimulator] getUserMedia succeeded with simple constraints');
      } catch (simpleError: any) {
        console.warn('[TelegramSimulator] Simple getUserMedia failed:', simpleError.name, simpleError.message);
        
        // On NotFoundError, try with explicit device selection
        if (simpleError.name === 'NotFoundError' || simpleError.name === 'OverconstrainedError') {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioDevice = devices.find(d => d.kind === 'audioinput');
            if (audioDevice) {
              console.log('[TelegramSimulator] Trying with specific device:', audioDevice.deviceId);
              stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: audioDevice.deviceId } }
              });
            } else {
              throw simpleError;
            }
          } catch (deviceError: any) {
            console.error('[TelegramSimulator] Device-specific getUserMedia also failed:', deviceError.name);
            throw simpleError; // throw original error for better messaging
          }
        } else {
          throw simpleError;
        }
      }
      
      // If we got here, permission was granted
      setMicPermission('granted');
      
      const mimeType = getSupportedMimeType();
      console.log('[TelegramSimulator] Starting recording with mimeType:', mimeType || 'browser-default');
      
      // Try creating MediaRecorder with specific mimeType, fallback to no mimeType
      let mediaRecorder: MediaRecorder;
      try {
        if (mimeType) {
          mediaRecorder = new MediaRecorder(stream, { mimeType });
        } else {
          mediaRecorder = new MediaRecorder(stream);
        }
      } catch (recorderError) {
        console.warn('[TelegramSimulator] MediaRecorder with mimeType failed, trying without:', recorderError);
        try {
          mediaRecorder = new MediaRecorder(stream);
        } catch (fallbackError) {
          console.error('[TelegramSimulator] MediaRecorder creation failed entirely:', fallbackError);
          stream.getTracks().forEach(track => track.stop());
          toast.error('Erro ao iniciar gravação. Tente usar outro navegador.');
          return;
        }
      }

      const actualMimeType = mediaRecorder.mimeType || mimeType || 'audio/webm';
      console.log('[TelegramSimulator] MediaRecorder created with actual mimeType:', actualMimeType);
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        handleAudioRecorded(actualMimeType);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setRecordingState('recording');
      toast.info('🎤 Gravando... Clique novamente para parar');
    } catch (error: any) {
      console.error('[TelegramSimulator] Microphone error:', error.name, error.message, error);
      
      const isMob = isMobileDevice();
      
      if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
        if (isMob) {
          toast.error('Microfone não encontrado. Verifique: 1) Permissões do navegador (ícone de cadeado), 2) Permissões do app nas Configurações do celular, 3) Nenhum outro app usando o microfone.', { duration: 8000 });
        } else {
          toast.error('Microfone não encontrado. Verifique: 1) Se um microfone está conectado, 2) Permissões do navegador (ícone de cadeado na barra de endereço), 3) Configurações de áudio do sistema.', { duration: 8000 });
        }
      } else if (error.name === 'NotAllowedError') {
        setMicPermission('denied');
        if (isMob) {
          toast.error('Permissão de microfone negada. Toque no ícone de cadeado (🔒) na barra de endereço do navegador → Permissões → Microfone → Permitir. Depois recarregue a página.', { duration: 10000 });
        } else {
          toast.error('Permissão de microfone negada. Clique no ícone de cadeado (🔒) na barra de endereço → Permissões do site → Microfone → Permitir. Depois recarregue a página.', { duration: 10000 });
        }
      } else if (error.name === 'NotReadableError') {
        toast.error('Microfone está em uso por outro aplicativo. Feche outros apps que usam microfone e tente novamente.');
      } else if (error.name === 'AbortError') {
        toast.error('Acesso ao microfone foi cancelado. Tente novamente.');
      } else {
        toast.error(`Erro ao acessar microfone: ${error.message || 'Verifique as permissões do navegador e tente novamente.'}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      setRecordingState('transcribing');
    }
  };

  const handleAudioRecorded = async (mimeType: string) => {
    if (audioChunksRef.current.length === 0) {
      setRecordingState('idle');
      return;
    }
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      console.log('[TelegramSimulator] Audio recorded, size:', audioBlob.size, 'bytes');
      
      // Convert to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data:audio/...;base64, prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      
      console.log('[TelegramSimulator] Sending audio for transcription...');
      
      // Send to Edge Function for transcription
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: {
          audio_base64: base64Audio,
          mime_type: mimeType
        }
      });
      
      if (error) {
        console.error('[TelegramSimulator] Transcription error:', error);
        throw error;
      }
      
      if (data?.transcription) {
        const transcribedText = data.transcription.trim();
        console.log('[TelegramSimulator] Transcription received:', transcribedText);
        
        // Add transcription to buffer as if user typed it
        addUserMessage(`🎤 ${transcribedText}`);
        setBuffer(prev => ({
          ...prev,
          messages: [...prev.messages, transcribedText]
        }));
        toast.success('Áudio transcrito com sucesso!');
      } else {
        throw new Error('Transcrição vazia');
      }
    } catch (error: any) {
      console.error('[TelegramSimulator] Error processing audio:', error);
      toast.error('Erro ao transcrever áudio: ' + (error.message || 'Tente novamente'));
    } finally {
      setRecordingState('idle');
      audioChunksRef.current = [];
    }
  };

  const toggleRecording = () => {
    if (recordingState === 'recording') {
      stopRecording();
    } else if (recordingState === 'idle') {
      startRecording();
    }
    // If transcribing, do nothing (button should be disabled)
  };

  // =====================================================
  // RESET
  // =====================================================

  const resetSimulator = () => {
    setBuffer({
      messages: [],
      photos: [],
      photoFiles: [],
      status: 'collecting'
    });
    setClickedMessageIds(new Set());
    setMessages([{
      id: generateId(),
      role: 'bot',
      content: '👋 Olá! Sou o bot de cadastro rápido do XLata.\n\n📦 Envie tudo sobre o produto:\n• Fotos\n• Nome e descrição\n• Preços (custo e venda)\n• Dimensões e peso\n• Qualquer informação relevante\n• Tipo de venda: Normal ou Interativa;\n• Se interativa, quanto tempo anunciado - Período para renovação automática\n• Novo, estado de novo, usado, no estado ou sucata\n• Categoria sugerida para o produto(opcional)\n• Entrega ou só retirada?\n• Forma de pagamento: Dinheiro, Pix, Débito ou crédito(só online);\n\nQuando terminar, digite: Terminei',
      timestamp: new Date(),
    }]);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className={cn(
      "flex flex-col bg-gradient-to-b from-[#0e1621] to-[#17212b] overflow-hidden transition-all duration-300",
      isFullscreen 
         ? "fixed inset-0 z-50 rounded-none border-0" 
         : onClose
           ? "h-full min-h-0 flex-1 rounded-none border-0"
           : "h-[500px] sm:h-[600px] rounded-xl border border-gray-700"
    )}>
      {/* Header */}
      <div className="bg-[#17212b] px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between border-b border-gray-700 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-700 h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">X</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm sm:text-base truncate">XLata Bot</p>
            <p className="text-[10px] sm:text-xs text-gray-400 truncate">
              {buffer.status === 'awaiting_confirm' 
                ? 'Aguardando confirmação...' 
                : buffer.status === 'awaiting_pinterest_choice'
                  ? 'Pinterest?'
                  : buffer.status === 'awaiting_studio_choice'
                    ? 'Imagem Studio?'
                    : buffer.status === 'collecting' 
                      ? 'Bloco Único' 
                      : 'Pronto'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="h-7 sm:h-8 w-auto min-w-0 max-w-[120px] sm:max-w-[160px] bg-purple-500/20 border-purple-500/50 text-purple-300 text-[10px] sm:text-xs px-1.5 sm:px-2 gap-1">
              <Bot className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#17212b] border-gray-600 max-h-[300px]">
              {AI_MODELS.map(m => (
                <SelectItem key={m.value} value={m.value} className="text-gray-200 text-xs focus:bg-gray-700 focus:text-white">
                  <span className="font-medium">{m.label}</span>
                  <span className="text-gray-400 ml-1">· {m.desc}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/50 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
            <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
            {buffer.messages.length}
          </Badge>
          <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/50 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
            <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
            {buffer.photos.length}/10
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={resetSimulator}
            className="text-gray-400 hover:text-white hover:bg-gray-700 h-7 w-7 sm:h-8 sm:w-8"
            title="Reiniciar"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(prev => !prev)}
            className="text-gray-400 hover:text-white hover:bg-gray-700 h-7 w-7 sm:h-8 sm:w-8"
            title={isFullscreen ? 'Sair do modo tela cheia' : 'Modo tela cheia'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3">
        {/* Microphone permission denied banner */}
        {micPermission === 'denied' && (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 mx-0 mb-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-200 text-sm font-medium">Permissão de microfone negada</p>
                <p className="text-amber-300/80 text-xs mt-1">
                  Para usar gravação de voz:
                  <br />• Clique no ícone de cadeado na barra de endereço
                  <br />• Permita acesso ao microfone
                  <br />• Recarregue a página
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-amber-300 border-amber-500/50 hover:bg-amber-500/20 bg-transparent"
                  onClick={() => startRecording()}
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 shadow-sm',
                msg.role === 'user'
                  ? 'bg-[#2b5278] text-white rounded-br-md'
                  : 'bg-[#182533] text-gray-100 rounded-bl-md'
              )}
            >
              {msg.photos && msg.photos.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {msg.photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt={`Foto ${i + 1}`}
                      className={cn(
                        'object-cover rounded-lg',
                        msg.studioImage ? 'w-full max-w-[240px] h-auto' : 'w-12 h-12 sm:w-16 sm:h-16'
                      )}
                    />
                  ))}
                </div>
              )}
              {msg.studioImage && buffer.status === 'awaiting_confirm' && (
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={deleteStudioImage}
                    variant="destructive"
                    size="sm"
                    disabled={isProcessing}
                    className="text-xs h-7"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Excluir
                  </Button>
                  <Button
                    onClick={regenerateStudioImage}
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    className="text-xs h-7 border-blue-500/50 text-blue-300 hover:bg-blue-500/20 bg-transparent"
                  >
                    <RefreshCw className={cn("w-3 h-3 mr-1", isProcessing && "animate-spin")} /> Gerar novamente
                  </Button>
                </div>
              )}
              <p className="whitespace-pre-wrap text-xs sm:text-sm">{msg.content}</p>
              {/* Interactive buttons (Telegram-style inline keyboard) */}
              {msg.buttons && msg.buttons.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.buttons.map((btn, btnIdx) => (
                    <button
                      key={btnIdx}
                      onClick={() => handleButtonClick(msg.id, btn)}
                      disabled={clickedMessageIds.has(msg.id) || isProcessing}
                      className={cn(
                        'flex-1 min-w-[120px] py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-all border',
                        clickedMessageIds.has(msg.id)
                          ? 'opacity-50 cursor-not-allowed border-gray-600 bg-gray-700/30 text-gray-400'
                          : btn.variant === 'primary'
                            ? 'border-blue-500/60 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 active:scale-[0.97]'
                            : btn.variant === 'danger'
                              ? 'border-red-500/60 bg-red-500/20 text-red-300 hover:bg-red-500/30 active:scale-[0.97]'
                              : 'border-gray-500/60 bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 active:scale-[0.97]'
                      )}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-gray-400 mt-1 text-right">
                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* "Terminei" quick action button */}
      {buffer.status === 'collecting' && (buffer.messages.length > 0 || buffer.photos.length > 0) && (
        <div className="px-2 sm:px-4 py-1.5 bg-[#0e1621] border-t border-gray-700">
          <button
            onClick={() => handleUserInput('Terminei')}
            disabled={isProcessing}
            className="w-full py-2 px-3 rounded-md text-xs sm:text-sm font-medium border border-green-500/60 bg-green-500/20 text-green-300 hover:bg-green-500/30 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            Terminei ✅
          </button>
        </div>
      )}

      {/* Photo preview */}
      {buffer.photos.length > 0 && buffer.status === 'collecting' && (
        <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-[#0e1621] border-t border-gray-700">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
            <span className="text-[10px] sm:text-xs text-gray-400 shrink-0">{buffer.photos.length}/10:</span>
            {buffer.photos.map((photo, i) => (
              <div key={i} className="relative shrink-0">
                <img src={photo} alt={`Foto ${i + 1}`} className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded" />
                <button
                  onClick={() => {
                    setBuffer(prev => ({
                      ...prev,
                      photos: prev.photos.filter((_, idx) => idx !== i),
                      photoFiles: prev.photoFiles.filter((_, idx) => idx !== i)
                    }));
                  }}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
       <div className={cn(
         "bg-[#17212b] px-2 sm:px-4 py-2 sm:py-3 border-t border-gray-700",
         (isFullscreen || onClose) && "pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
       )}>
        <div className="flex items-center gap-1 sm:gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || buffer.status === 'awaiting_confirm' || recordingState !== 'idle'}
            className="text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 h-8 w-8 sm:h-10 sm:w-10"
          >
            <Image className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          
          {/* Camera button - Mobile only */}
          {isMobile && (
            <>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessing || buffer.status === 'awaiting_confirm' || recordingState !== 'idle'}
                className="text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 h-8 w-8 sm:h-10 sm:w-10"
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </>
          )}
          
          {/* Audio recording button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRecording}
            disabled={isProcessing || buffer.status === 'awaiting_confirm' || recordingState === 'transcribing'}
            className={cn(
              "text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 transition-all h-8 w-8 sm:h-10 sm:w-10",
              recordingState === 'recording' && "bg-red-500/20 text-red-400 animate-pulse",
              micPermission === 'denied' && recordingState === 'idle' && "text-amber-400 hover:text-amber-300"
            )}
            title={
              micPermission === 'denied'
                ? 'Clique para tentar solicitar permissão novamente'
                : recordingState === 'recording'
                  ? 'Parar gravação'
                  : 'Gravar áudio'
            }
          >
            {recordingState === 'transcribing' ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : recordingState === 'recording' ? (
              <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
            ) : (
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>
          
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleUserInput(inputValue)}
            placeholder={
              recordingState === 'recording' 
                ? '🔴 Gravando...' 
                : recordingState === 'transcribing'
                  ? 'Transcrevendo...'
                  : buffer.status === 'awaiting_confirm' 
                    ? 'Publicar ou Cancelar...' 
                    : buffer.status === 'awaiting_pinterest_choice'
                      ? 'Sim ou Não...'
                      : 'Mensagem...'
            }
            disabled={isProcessing || recordingState !== 'idle'}
            className="flex-1 min-w-0 bg-[#242f3d] border-0 text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-blue-500 h-8 sm:h-10 text-sm"
          />
          
          <Button
            onClick={() => handleUserInput(inputValue)}
            disabled={isProcessing || !inputValue.trim() || recordingState !== 'idle'}
            size="icon"
            className="bg-[#2b5278] hover:bg-[#3a6a9a] text-white h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
