// Definição dos templates de header disponíveis para a loja

export interface HeaderTemplate {
  id: string;
  name: string;
  description: string;
  preview: string; // Descrição visual
  layout: 'classic' | 'centered' | 'minimal' | 'modern' | 'professional';
  // Cores do header secundário (para layout professional)
  secondaryHeaderBg?: string;
  secondaryHeaderText?: string;
  showNavigation?: boolean;
  showSearch: boolean;
  searchPosition: 'center' | 'right' | 'hidden';
  logoPosition: 'left' | 'center';
  actionsPosition: 'right' | 'left';
  showStoreName: boolean;
  showTagline: boolean;
  borderStyle: 'none' | 'solid' | 'shadow';
  // Cores customizáveis por template
  customColors: {
    loginButtonBg: string;
    loginButtonText: string;
    loginButtonBorder?: string;
    cartButtonBg: string;
    cartButtonText: string;
    cartButtonBorder?: string;
    searchButtonBg: string;
    searchButtonText: string;
    // Campos para gradiente
    loginButtonGradientStart?: string;
    loginButtonGradientEnd?: string;
    useGradient?: boolean;
    // Cores do header (para template profissional)
    headerBg?: string;
    headerText?: string;
    navBg?: string;
    navText?: string;
    searchInputBg?: string;
    searchInputText?: string;
    accentColor?: string;
  };
}

export interface HeaderConfig {
  selectedTemplate: string;
  templates: HeaderTemplate[];
  customTemplates: HeaderTemplate[];
}

// Templates padrão profissionais
export const DEFAULT_HEADER_TEMPLATES: HeaderTemplate[] = [
  {
    id: 'classic',
    name: 'Clássico',
    description: 'Layout tradicional com logo à esquerda, busca no centro e ações à direita',
    preview: 'Logo | ===== Busca ===== | Carrinho | Entrar',
    layout: 'classic',
    showSearch: true,
    searchPosition: 'center',
    logoPosition: 'left',
    actionsPosition: 'right',
    showStoreName: true,
    showTagline: false,
    borderStyle: 'shadow',
    customColors: {
      loginButtonBg: '#10B981',
      loginButtonText: '#FFFFFF',
      cartButtonBg: 'transparent',
      cartButtonText: '#4B5563',
      searchButtonBg: '#10B981',
      searchButtonText: '#FFFFFF',
    },
  },
  {
    id: 'centered',
    name: 'Centralizado',
    description: 'Logo centralizada com busca expandida e ações em destaque',
    preview: 'Ações | ===== Logo ===== | Ações',
    layout: 'centered',
    showSearch: true,
    searchPosition: 'center',
    logoPosition: 'center',
    actionsPosition: 'right',
    showStoreName: true,
    showTagline: true,
    borderStyle: 'solid',
    customColors: {
      loginButtonBg: '#6366F1',
      loginButtonText: '#FFFFFF',
      loginButtonBorder: '#6366F1',
      cartButtonBg: '#F3F4F6',
      cartButtonText: '#374151',
      cartButtonBorder: '#E5E7EB',
      searchButtonBg: '#6366F1',
      searchButtonText: '#FFFFFF',
    },
  },
  {
    id: 'minimal',
    name: 'Minimalista',
    description: 'Design limpo e moderno com elementos essenciais',
    preview: 'Logo | Espaço | Ícones minimalistas',
    layout: 'minimal',
    showSearch: true,
    searchPosition: 'right',
    logoPosition: 'left',
    actionsPosition: 'right',
    showStoreName: false,
    showTagline: false,
    borderStyle: 'none',
    customColors: {
      loginButtonBg: 'transparent',
      loginButtonText: '#111827',
      loginButtonBorder: '#E5E7EB',
      cartButtonBg: 'transparent',
      cartButtonText: '#111827',
      cartButtonBorder: '#E5E7EB',
      searchButtonBg: '#111827',
      searchButtonText: '#FFFFFF',
    },
  },
  {
    id: 'modern',
    name: 'Moderno',
    description: 'Design contemporâneo com botões gradiente e visual limpo',
    preview: 'Logo | Espaço | Busca | Carrinho | Gradiente',
    layout: 'modern',
    showSearch: true,
    searchPosition: 'right',
    logoPosition: 'left',
    actionsPosition: 'right',
    showStoreName: true,
    showTagline: false,
    borderStyle: 'shadow',
    customColors: {
      loginButtonBg: '#8B5CF6',
      loginButtonText: '#FFFFFF',
      loginButtonBorder: undefined,
      cartButtonBg: 'transparent',
      cartButtonText: '#111827',
      cartButtonBorder: '#E5E7EB',
      searchButtonBg: '#8B5CF6',
      searchButtonText: '#FFFFFF',
      loginButtonGradientStart: '#8B5CF6',
      loginButtonGradientEnd: '#06B6D4',
      useGradient: true,
    },
  },
  {
    id: 'professional',
    name: 'Profissional',
    description: 'Header duplo com navegação, menu de categorias e visual corporativo',
    preview: 'Logo | Busca | Ações || Início | Categorias | Links',
    layout: 'professional',
    showSearch: true,
    searchPosition: 'center',
    logoPosition: 'left',
    actionsPosition: 'right',
    showStoreName: true,
    showTagline: false,
    borderStyle: 'none',
    showNavigation: true,
    secondaryHeaderBg: '#1e3a5f',
    secondaryHeaderText: '#FFFFFF',
    customColors: {
      loginButtonBg: '#C9A86C',
      loginButtonText: '#1e3a5f',
      loginButtonBorder: '#C9A86C',
      cartButtonBg: 'transparent',
      cartButtonText: '#C9A86C',
      cartButtonBorder: '#C9A86C',
      searchButtonBg: '#C9A86C',
      searchButtonText: '#1e3a5f',
      loginButtonGradientStart: '#C9A86C',
      loginButtonGradientEnd: '#E8D5B0',
      useGradient: false,
      // Cores específicas do header profissional
      headerBg: '#1e3a5f',
      headerText: '#FFFFFF',
      navBg: '#2d4a6f',
      navText: '#FFFFFF',
      searchInputBg: '#FFFFFF',
      searchInputText: '#111827',
      accentColor: '#C9A86C',
    },
  },
];

export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  selectedTemplate: 'classic',
  templates: DEFAULT_HEADER_TEMPLATES,
  customTemplates: [],
};

export function getTemplateById(config: HeaderConfig, id: string): HeaderTemplate | undefined {
  return [...config.templates, ...config.customTemplates].find(t => t.id === id);
}

export function createCustomTemplate(baseTemplate: HeaderTemplate, customId: string, customName: string): HeaderTemplate {
  return {
    ...baseTemplate,
    id: customId,
    name: customName,
    description: `Template customizado baseado em ${baseTemplate.name}`,
  };
}
