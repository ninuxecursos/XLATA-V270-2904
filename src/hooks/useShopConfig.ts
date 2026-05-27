import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HeaderConfig, HeaderTemplate, DEFAULT_HEADER_CONFIG, DEFAULT_HEADER_TEMPLATES } from '@/components/shop/templates/headerTemplates';

export interface HeroSlide {
  id: string;
  image_url: string;
  title?: string;
  subtitle?: string;
  link?: string;
  is_active: boolean;
}

// Sistema de cores expandido
export interface ShopColors {
  // Cores principais
  primary: string;
  primary_hover: string;
  secondary: string;
  secondary_hover: string;
  
  // Cores de fundo
  background: string;
  background_alt: string;
  surface: string;
  
  // Cores de texto
  text_primary: string;
  text_secondary: string;
  text_muted: string;
  
  // Cores de destaque
  accent: string;
  success: string;
  warning: string;
  error: string;
  
  // Cores de borda
  border: string;
  border_hover: string;

  // Botões específicos
  button_login_bg: string;
  button_login_text: string;
  button_buy_bg: string;
  
  // Botões secundários/outline
  button_secondary_bg: string;
  button_secondary_text: string;
  button_secondary_border: string;
  button_cart_bg: string;
  button_cart_text: string;
  button_cart_border: string;

  // Header/Menu
  header_bg: string;
  header_border: string;

  // Cards Interativos
  interactive_card_bg: string;
  interactive_card_border: string;
  interactive_glow_color: string;

  // Container de Vendas Interativas
  interactive_section_bg: string;
  interactive_section_gradient_enabled: boolean;
  interactive_section_title_color: string;
  interactive_section_subtitle_color: string;
  interactive_section_badge_bg: string;
  interactive_section_badge_text: string;
  interactive_section_icon_bg: string;
  interactive_section_icon_color: string;
  interactive_section_border_enabled: boolean;
  interactive_section_border_color: string;

  // Container de Categorias
  categories_section_bg: string;
  categories_section_gradient_enabled: boolean;
  categories_section_title_color: string;
  categories_section_subtitle_color: string;
  categories_section_badge_bg: string;
  categories_section_badge_text: string;
  categories_section_icon_bg: string;
  categories_section_icon_color: string;
  categories_section_border_enabled: boolean;
  categories_section_border_color: string;
  categories_section_particles_enabled: boolean;
  categories_section_particles_color: string;
  categories_section_particles_color_secondary: string;
  categories_section_particles_mix: boolean;

  // Footer
  footer_bg: string;
  footer_text: string;

  // Animações
  enable_border_animation: boolean;
  enable_particles: boolean;
  particles_color: string;
  
  // Configurações avançadas de partículas
  particles_color_secondary: string;
  particles_color_mix: boolean;
  particles_intensity: 'low' | 'medium' | 'high';
  particles_size: 'small' | 'medium' | 'large';
  particles_speed: 'slow' | 'medium' | 'fast';
  particles_style: 'circles' | 'stars' | 'sparkles' | 'mixed';
  
  // Configurações avançadas de glow
  glow_intensity: 'subtle' | 'medium' | 'strong';
  glow_animation_speed: 'slow' | 'medium' | 'fast';
  enable_shimmer: boolean;
  shimmer_color: string;
}

// Configuração do Footer
export interface FooterConfig {
  // Localização
  address: string;
  city: string;
  neighborhood: string;
  opening_hours: string;
  google_maps_embed: string;
  google_maps_link: string;
  
  // Contato
  whatsapp: string;
  email: string;
  phone: string;
  show_whatsapp_in_footer: boolean;
  
  // Redes Sociais
  instagram: string;
  facebook: string;
  
  // Textos
  about_text: string;
  trust_text: string;
  copyright_text: string;
  
  // Títulos das colunas
  col_title_institutional: string;
  col_title_shop: string;
  col_title_contact: string;
  col_title_location: string;
  
  // Links da coluna Institucional
  link_about_text: string;
  link_privacy_text: string;
  link_terms_text: string;
  show_link_about: boolean;
  show_link_privacy: boolean;
  show_link_terms: boolean;
  
  // Links da coluna Loja
  link_products_text: string;
  link_offers_text: string;
  link_how_to_buy_text: string;
  link_faq_text: string;
  show_link_products: boolean;
  show_link_offers: boolean;
  show_link_how_to_buy: boolean;
  show_link_faq: boolean;
  
  // Texto Google Maps
  google_maps_label: string;
}

// Review/Avaliação
export interface ShopReview {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  comment: string;
  date: string;
}

// Re-export header types
export type { HeaderConfig, HeaderTemplate };
export { DEFAULT_HEADER_CONFIG, DEFAULT_HEADER_TEMPLATES };

// Páginas Institucionais
export interface AboutPageValue {
  icon: string;
  title: string;
  description: string;
}

export interface AboutPage {
  title: string;
  subtitle: string;
  content: string;
  values: AboutPageValue[];
}

export interface PrivacySection {
  icon: string;
  title: string;
  content: string;
}

export interface PrivacyPage {
  title: string;
  subtitle: string;
  last_update: string;
  sections: PrivacySection[];
}

export interface TermsSection {
  icon: string;
  title: string;
  content: string;
}

export interface TermsPage {
  title: string;
  subtitle: string;
  last_update: string;
  sections: TermsSection[];
}

export interface HowToBuyStep {
  icon: string;
  title: string;
  description: string;
}

export interface HowToBuyPage {
  title: string;
  subtitle: string;
  steps: HowToBuyStep[];
}

export interface FAQQuestion {
  question: string;
  answer: string;
}

export interface FAQPage {
  title: string;
  subtitle: string;
  questions: FAQQuestion[];
}

export interface InstitutionalPages {
  about?: AboutPage;
  privacy?: PrivacyPage;
  terms?: TermsPage;
  how_to_buy?: HowToBuyPage;
  faq?: FAQPage;
}

export interface ShopConfigData {
  store_name: string;
  store_logo: string | null;
  primary_color: string;
  secondary_color: string;
  tagline: string | null;
  is_open: boolean;
  show_store_name: boolean; // Controle global para exibir nome ao lado do logo
  hero_slides?: HeroSlide[];
  colors?: ShopColors;
  footer_config?: FooterConfig;
  reviews?: ShopReview[];
  header_config?: HeaderConfig;
  institutional_pages?: InstitutionalPages;
  show_buy_now_button?: boolean;
  show_interest_button?: boolean;
}

const DEFAULT_COLORS: ShopColors = {
  primary: '#10B981',
  primary_hover: '#059669',
  secondary: '#6366F1',
  secondary_hover: '#4F46E5',
  background: '#F9FAFB',
  background_alt: '#F3F4F6',
  surface: '#FFFFFF',
  text_primary: '#111827',
  text_secondary: '#4B5563',
  text_muted: '#9CA3AF',
  accent: '#F59E0B',
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
  border: '#E5E7EB',
  border_hover: '#D1D5DB',
  // Botões específicos
  button_login_bg: '#10B981',
  button_login_text: '#FFFFFF',
  button_buy_bg: '#10B981',
  // Botões secundários/outline
  button_secondary_bg: '#FFFFFF',
  button_secondary_text: '#111827',
  button_secondary_border: '#E5E7EB',
  button_cart_bg: '#FFFFFF',
  button_cart_text: '#111827',
  button_cart_border: '#E5E7EB',
  // Header
  header_bg: '#FFFFFF',
  header_border: '#E5E7EB',
  // Cards Interativos
  interactive_card_bg: '#FFFFFF',
  interactive_card_border: '#A855F7',
  interactive_glow_color: '#A855F7',
  // Container de Vendas Interativas
  interactive_section_bg: '#FAFBFC',
  interactive_section_gradient_enabled: true,
  interactive_section_title_color: '#111827',
  interactive_section_subtitle_color: '#6B7280',
  interactive_section_badge_bg: '#A855F720',
  interactive_section_badge_text: '#A855F7',
  interactive_section_icon_bg: '#A855F7',
  interactive_section_icon_color: '#FFFFFF',
  interactive_section_border_enabled: false,
  interactive_section_border_color: '#A855F730',
  // Container de Categorias
  categories_section_bg: '#F3F4F6',
  categories_section_gradient_enabled: false,
  categories_section_title_color: '#111827',
  categories_section_subtitle_color: '#6B7280',
  categories_section_badge_bg: '#10B98120',
  categories_section_badge_text: '#10B981',
  categories_section_icon_bg: '#10B981',
  categories_section_icon_color: '#FFFFFF',
  categories_section_border_enabled: false,
  categories_section_border_color: '#10B98130',
  categories_section_particles_enabled: false,
  categories_section_particles_color: '#10B981',
  categories_section_particles_color_secondary: '#EC4899',
  categories_section_particles_mix: false,
  // Footer
  footer_bg: '#1F2937',
  footer_text: '#F9FAFB',
  // Animações
  enable_border_animation: true,
  enable_particles: false,
  particles_color: '#A855F7',
  
  // Configurações avançadas de partículas
  particles_color_secondary: '#EC4899',
  particles_color_mix: false,
  particles_intensity: 'medium' as const,
  particles_size: 'medium' as const,
  particles_speed: 'medium' as const,
  particles_style: 'circles' as const,
  
  // Configurações avançadas de glow
  glow_intensity: 'medium' as const,
  glow_animation_speed: 'medium' as const,
  enable_shimmer: false,
  shimmer_color: '#FFFFFF',
};

const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  address: '',
  city: '',
  neighborhood: '',
  opening_hours: 'Seg-Sex: 9h às 18h | Sáb: 9h às 13h',
  google_maps_embed: '',
  google_maps_link: '',
  whatsapp: '',
  email: '',
  phone: '',
  show_whatsapp_in_footer: true,
  instagram: '',
  facebook: '',
  about_text: 'Sua loja de confiança com produtos de qualidade.',
  trust_text: 'Loja física • Produtos revisados • Atendimento humano',
  copyright_text: '',
  col_title_institutional: 'Institucional',
  col_title_shop: 'Loja',
  col_title_contact: 'Atendimento',
  col_title_location: 'Localização',
  link_about_text: 'Sobre Nós',
  link_privacy_text: 'Política de Privacidade',
  link_terms_text: 'Termos de Uso',
  show_link_about: true,
  show_link_privacy: true,
  show_link_terms: true,
  link_products_text: 'Todos os Produtos',
  link_offers_text: 'Ofertas Interativas',
  link_how_to_buy_text: 'Como Comprar',
  link_faq_text: 'Perguntas Frequentes',
  show_link_products: true,
  show_link_offers: true,
  show_link_how_to_buy: true,
  show_link_faq: true,
  google_maps_label: 'Ver no Google Maps →',
};

// Valores padrão das páginas institucionais
const DEFAULT_INSTITUTIONAL_PAGES: InstitutionalPages = {
  about: {
    title: 'Sobre Nós',
    subtitle: 'Conheça nossa história e nossos valores',
    content: 'Somos uma empresa comprometida em oferecer os melhores produtos e serviços para nossos clientes.\n\nNossa missão é proporcionar uma experiência de compra única, com produtos de qualidade e atendimento excepcional.\n\nTrabalhamos diariamente para superar as expectativas de nossos clientes, mantendo sempre o compromisso com a excelência e a satisfação.',
    values: [
      { icon: 'quality', title: 'Qualidade', description: 'Produtos selecionados com rigor' },
      { icon: 'trust', title: 'Confiança', description: 'Transparência em todas as negociações' },
      { icon: 'service', title: 'Atendimento', description: 'Suporte humanizado e eficiente' },
      { icon: 'commitment', title: 'Compromisso', description: 'Entrega garantida e pontual' },
    ],
  },
  privacy: {
    title: 'Política de Privacidade',
    subtitle: 'Como protegemos seus dados',
    last_update: new Date().toLocaleDateString('pt-BR'),
    sections: [
      { icon: 'shield', title: 'Coleta de Dados', content: 'Coletamos apenas os dados necessários para processar suas compras e melhorar sua experiência em nossa loja.' },
      { icon: 'lock', title: 'Uso dos Dados', content: 'Seus dados são utilizados exclusivamente para fins de processamento de pedidos, comunicação e melhoria dos nossos serviços.' },
      { icon: 'eye', title: 'Compartilhamento', content: 'Não compartilhamos suas informações pessoais com terceiros, exceto quando necessário para a entrega dos produtos.' },
      { icon: 'key', title: 'Segurança', content: 'Utilizamos tecnologias avançadas de criptografia para proteger todas as suas informações pessoais e de pagamento.' },
    ],
  },
  terms: {
    title: 'Termos de Uso',
    subtitle: 'Condições para uso da nossa loja',
    last_update: new Date().toLocaleDateString('pt-BR'),
    sections: [
      { icon: 'file', title: 'Aceitação dos Termos', content: 'Ao acessar e utilizar nossa loja, você concorda com estes termos de uso e nossa política de privacidade.' },
      { icon: 'cart', title: 'Compras e Pagamentos', content: 'Todos os preços são exibidos em Reais (BRL). O pagamento pode ser realizado através dos métodos disponíveis na finalização da compra.' },
      { icon: 'truck', title: 'Entrega', content: 'O prazo de entrega varia de acordo com a localidade. Consulte o prazo estimado antes de finalizar sua compra.' },
      { icon: 'refresh', title: 'Trocas e Devoluções', content: 'Produtos podem ser trocados ou devolvidos em até 7 dias após o recebimento, conforme o Código de Defesa do Consumidor.' },
    ],
  },
  how_to_buy: {
    title: 'Como Comprar',
    subtitle: 'Guia passo a passo para suas compras',
    steps: [
      { icon: 'search', title: 'Encontre o Produto', description: 'Navegue pela nossa loja e encontre o produto desejado' },
      { icon: 'cart', title: 'Adicione ao Carrinho', description: 'Clique em "Adicionar ao Carrinho" e escolha a quantidade' },
      { icon: 'user', title: 'Faça Login', description: 'Entre na sua conta ou crie uma nova para continuar' },
      { icon: 'creditCard', title: 'Finalize a Compra', description: 'Escolha a forma de pagamento e confirme seu pedido' },
    ],
  },
  faq: {
    title: 'Perguntas Frequentes',
    subtitle: 'Tire suas dúvidas rapidamente',
    questions: [
      { question: 'Qual o prazo de entrega?', answer: 'O prazo de entrega varia de acordo com sua localização. Você pode consultar o prazo estimado na página do produto ou no carrinho.' },
      { question: 'Quais formas de pagamento vocês aceitam?', answer: 'Aceitamos pagamentos via PIX, cartão de crédito, cartão de débito e boleto bancário.' },
      { question: 'Como faço para trocar um produto?', answer: 'Entre em contato conosco através do WhatsApp ou e-mail em até 7 dias após o recebimento do produto.' },
      { question: 'Os produtos têm garantia?', answer: 'Nossos produtos são usados e não possuem garantia tradicional. O que garantimos é que o produto é exatamente o que está sendo anunciado - você compra totalmente ciente do estado, com todas as informações claras na descrição.' },
    ],
  },
};

const DEFAULT_CONFIG: ShopConfigData = {
  store_name: 'Loja XLata',
  store_logo: null,
  primary_color: '#10B981',
  secondary_color: '#059669',
  tagline: 'Sua loja de confiança',
  is_open: true,
  show_store_name: true,
  hero_slides: [],
  colors: DEFAULT_COLORS,
  footer_config: DEFAULT_FOOTER_CONFIG,
  reviews: [],
  header_config: DEFAULT_HEADER_CONFIG,
  institutional_pages: DEFAULT_INSTITUTIONAL_PAGES,
  show_buy_now_button: true,
  show_interest_button: true,
};

export function useShopConfig() {
  return useQuery({
    queryKey: ['shop-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_config')
        .select('*')
        .eq('key', 'main_config')
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        return DEFAULT_CONFIG;
      }
      
      const configValue = data.value as unknown as ShopConfigData;
      
      // Deep merge dos templates para preservar customColors
      const savedTemplates = configValue?.header_config?.templates || [];
      const mergedTemplates = DEFAULT_HEADER_TEMPLATES.map((defaultTemplate, index) => {
        const savedTemplate = savedTemplates.find(t => t.id === defaultTemplate.id) || savedTemplates[index];
        if (!savedTemplate) return defaultTemplate;
        return {
          ...defaultTemplate,
          ...savedTemplate,
          customColors: {
            ...defaultTemplate.customColors,
            ...savedTemplate.customColors,
          },
        };
      });

      // Merge das páginas institucionais
      const savedPages = configValue?.institutional_pages || {};
      const mergedInstitutionalPages: InstitutionalPages = {
        about: {
          ...DEFAULT_INSTITUTIONAL_PAGES.about,
          ...savedPages.about,
          values: savedPages.about?.values?.length ? savedPages.about.values : DEFAULT_INSTITUTIONAL_PAGES.about?.values,
        },
        privacy: {
          ...DEFAULT_INSTITUTIONAL_PAGES.privacy,
          ...savedPages.privacy,
          sections: savedPages.privacy?.sections?.length ? savedPages.privacy.sections : DEFAULT_INSTITUTIONAL_PAGES.privacy?.sections,
        },
        terms: {
          ...DEFAULT_INSTITUTIONAL_PAGES.terms,
          ...savedPages.terms,
          sections: savedPages.terms?.sections?.length ? savedPages.terms.sections : DEFAULT_INSTITUTIONAL_PAGES.terms?.sections,
        },
        how_to_buy: {
          ...DEFAULT_INSTITUTIONAL_PAGES.how_to_buy,
          ...savedPages.how_to_buy,
          steps: savedPages.how_to_buy?.steps?.length ? savedPages.how_to_buy.steps : DEFAULT_INSTITUTIONAL_PAGES.how_to_buy?.steps,
        },
        faq: {
          ...DEFAULT_INSTITUTIONAL_PAGES.faq,
          ...savedPages.faq,
          questions: savedPages.faq?.questions?.length ? savedPages.faq.questions : DEFAULT_INSTITUTIONAL_PAGES.faq?.questions,
        },
      };

      return {
        ...DEFAULT_CONFIG,
        ...configValue,
        colors: {
          ...DEFAULT_COLORS,
          ...configValue?.colors,
        },
        footer_config: {
          ...DEFAULT_FOOTER_CONFIG,
          ...configValue?.footer_config,
        },
        header_config: {
          ...DEFAULT_HEADER_CONFIG,
          ...configValue?.header_config,
          templates: mergedTemplates,
          customTemplates: configValue?.header_config?.customTemplates || [],
        },
        institutional_pages: mergedInstitutionalPages,
      };
    }
  });
}

export function getDefaultColors(): ShopColors {
  return DEFAULT_COLORS;
}

export function getDefaultFooterConfig(): FooterConfig {
  return DEFAULT_FOOTER_CONFIG;
}

export function getDefaultInstitutionalPages(): InstitutionalPages {
  return DEFAULT_INSTITUTIONAL_PAGES;
}

export function useUpdateShopConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<ShopConfigData>) => {
      // Verificar se já existe config
      const { data: existingRows, error: fetchError } = await supabase
        .from('shop_config')
        .select('*')
        .eq('key', 'main_config')
        .limit(1);

      if (fetchError) throw fetchError;
      
      const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;
      const currentConfig = existing?.value as unknown as ShopConfigData || DEFAULT_CONFIG;
      const newConfig = { ...currentConfig, ...config };

      if (existing) {
        // Atualizar
        const { data, error, count } = await supabase
          .from('shop_config')
          .update({ 
            value: newConfig as never,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        
        // Verificar se o update realmente aconteceu (RLS pode bloquear silenciosamente)
        if (!data) {
          throw new Error('Não foi possível salvar. Verifique se você tem permissão de administrador.');
        }
        
        return data;
      } else {
        // Criar
        const insertData = {
          key: 'main_config',
          value: newConfig,
          description: 'Configurações principais da loja'
        };
        
        const { data, error } = await supabase
          .from('shop_config')
          .insert(insertData as never)
          .select()
          .single();

        if (error) {
          if (error.code === '42501') {
            throw new Error('Sem permissão para criar configurações. Verifique seu nível de acesso.');
          }
          throw error;
        }
        
        if (!data) {
          throw new Error('Não foi possível criar a configuração. Verifique suas permissões.');
        }
        
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-config'] });
      toast.success('Configurações salvas!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar configurações: ${error.message}`);
    }
  });
}
