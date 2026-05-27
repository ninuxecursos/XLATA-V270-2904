import { useState } from 'react';
import { Check, Plus, Trash2, Copy, Palette, Layout, Eye, Search, User, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { HeaderTemplate, HeaderConfig, DEFAULT_HEADER_TEMPLATES } from '../templates/headerTemplates';
import { toast } from 'sonner';

interface HeaderTemplateManagerProps {
  config: HeaderConfig;
  onChange: (config: HeaderConfig) => void;
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="color"
        value={value || '#FFFFFF'}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 p-0.5 cursor-pointer border-gray-300 rounded"
      />
      <div className="flex-1">
        <Label className="text-xs text-gray-700">{label}</Label>
      </div>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="transparent"
        className="w-24 h-7 text-xs font-mono bg-white text-gray-900 border-gray-300"
      />
    </div>
  );
}

export function HeaderTemplateManager({ config, onChange }: HeaderTemplateManagerProps) {
  const [editingTemplate, setEditingTemplate] = useState<HeaderTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [baseTemplateId, setBaseTemplateId] = useState('classic');

  const allTemplates = [...config.templates, ...config.customTemplates];
  const selectedTemplate = allTemplates.find(t => t.id === config.selectedTemplate) || config.templates[0];

  const handleSelectTemplate = (templateId: string) => {
    onChange({ ...config, selectedTemplate: templateId });
    toast.success('Template selecionado!');
  };

  const handleUpdateTemplateColors = (template: HeaderTemplate, colors: HeaderTemplate['customColors']) => {
    const isCustom = config.customTemplates.some(t => t.id === template.id);
    
    if (isCustom) {
      const updatedCustom = config.customTemplates.map(t => 
        t.id === template.id ? { ...t, customColors: colors } : t
      );
      onChange({ ...config, customTemplates: updatedCustom });
    } else {
      // Para templates padrão, criar uma versão customizada
      const updatedTemplates = config.templates.map(t => 
        t.id === template.id ? { ...t, customColors: colors } : t
      );
      onChange({ ...config, templates: updatedTemplates });
    }
  };

  const handleUpdateTemplateShowStoreName = (template: HeaderTemplate, showStoreName: boolean) => {
    const isCustom = config.customTemplates.some(t => t.id === template.id);
    
    if (isCustom) {
      const updatedCustom = config.customTemplates.map(t => 
        t.id === template.id ? { ...t, showStoreName } : t
      );
      onChange({ ...config, customTemplates: updatedCustom });
    } else {
      const updatedTemplates = config.templates.map(t => 
        t.id === template.id ? { ...t, showStoreName } : t
      );
      onChange({ ...config, templates: updatedTemplates });
    }
  };

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error('Digite um nome para o template');
      return;
    }

    const baseTemplate = allTemplates.find(t => t.id === baseTemplateId) || config.templates[0];
    const newId = `custom-${Date.now()}`;
    
    const newTemplate: HeaderTemplate = {
      ...baseTemplate,
      id: newId,
      name: newTemplateName.trim(),
      description: `Template customizado baseado em ${baseTemplate.name}`,
    };

    onChange({
      ...config,
      customTemplates: [...config.customTemplates, newTemplate],
      selectedTemplate: newId,
    });

    setShowCreateDialog(false);
    setNewTemplateName('');
    toast.success('Template criado com sucesso!');
  };

  const handleDeleteTemplate = (templateId: string) => {
    const isDefault = config.templates.some(t => t.id === templateId);
    if (isDefault) {
      toast.error('Não é possível excluir templates padrão');
      return;
    }

    const updatedCustom = config.customTemplates.filter(t => t.id !== templateId);
    const newSelected = config.selectedTemplate === templateId ? 'classic' : config.selectedTemplate;
    
    onChange({
      ...config,
      customTemplates: updatedCustom,
      selectedTemplate: newSelected,
    });

    setShowDeleteDialog(null);
    toast.success('Template excluído!');
  };

  const TemplatePreview = ({ template, isSelected }: { template: HeaderTemplate; isSelected: boolean }) => {
    const colors = template.customColors;
    const isCustom = config.customTemplates.some(t => t.id === template.id);

    return (
      <div 
        className={`relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
          isSelected 
            ? 'border-emerald-500 ring-2 ring-emerald-200' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => handleSelectTemplate(template.id)}
      >
        {/* Selected badge */}
        {isSelected && (
          <div className="absolute top-2 right-2 z-10 bg-emerald-500 text-white rounded-full p-1">
            <Check className="w-3 h-3" />
          </div>
        )}

        {/* Custom badge */}
        {isCustom && (
          <div className="absolute top-2 left-2 z-10 bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded">
            Custom
          </div>
        )}

        {/* Mini Preview */}
        <div className="bg-white p-2 border-b border-gray-100">
          <div className="flex flex-col gap-1">
            {/* Header principal */}
            <div className="flex items-center justify-between gap-2 h-8">
              {template.layout === 'professional' ? (
                <>
                  {/* Professional: Header escuro com busca central */}
                  <div 
                    className="flex-1 flex items-center justify-between gap-2 px-2 py-1 rounded"
                    style={{ backgroundColor: template.secondaryHeaderBg || '#1e3a5f' }}
                  >
                    <div className="w-6 h-6 bg-gray-300 rounded" />
                    <div className="flex-1 h-5 bg-white rounded-full mx-2" />
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ border: `1px solid ${colors.loginButtonBg}` }}
                      >
                        <span className="text-[6px]" style={{ color: colors.loginButtonBg }}>👤</span>
                      </div>
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ border: `1px solid ${colors.loginButtonBg}` }}
                      >
                        <span className="text-[6px]" style={{ color: colors.loginButtonBg }}>🛒</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : template.layout === 'centered' ? (
                <>
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: colors.cartButtonBg || '#F3F4F6', border: colors.cartButtonBorder ? `1px solid ${colors.cartButtonBorder}` : undefined }}
                    >
                      <span className="text-[8px]" style={{ color: colors.cartButtonText }}>🛒</span>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="w-8 h-8 bg-gray-200 rounded" />
                  </div>
                  <div 
                    className="px-2 py-1 rounded text-[10px] font-medium"
                    style={{ backgroundColor: colors.loginButtonBg, color: colors.loginButtonText }}
                  >
                    Entrar
                  </div>
                </>
              ) : template.layout === 'minimal' ? (
                <>
                  <div className="w-8 h-8 bg-gray-200 rounded" />
                  <div className="flex-1" />
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center border"
                      style={{ borderColor: colors.cartButtonBorder || '#E5E7EB', color: colors.cartButtonText }}
                    >
                      <span className="text-[8px]">🛒</span>
                    </div>
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center border"
                      style={{ borderColor: colors.loginButtonBorder || '#E5E7EB', color: colors.loginButtonText }}
                    >
                      <span className="text-[8px]">👤</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 bg-gray-200 rounded" />
                  <div className="flex-1 h-6 bg-gray-100 rounded mx-2" />
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded bg-gray-50 flex items-center justify-center">
                      <span className="text-[8px]">🛒</span>
                    </div>
                    <div 
                      className="px-2 py-1 rounded text-[10px] font-medium"
                      style={{ backgroundColor: colors.loginButtonBg, color: colors.loginButtonText }}
                    >
                      Entrar
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Barra de navegação secundária (apenas para professional) */}
            {template.layout === 'professional' && (
              <div 
                className="flex items-center gap-2 px-2 py-0.5 rounded text-[7px]"
                style={{ 
                  backgroundColor: `${template.secondaryHeaderBg || '#1e3a5f'}dd`,
                  color: template.secondaryHeaderText || '#FFFFFF'
                }}
              >
                <span>Início</span>
                <span>Categorias</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-2 bg-gray-50">
          <p className="font-medium text-gray-900 text-xs">{template.name}</p>
          <p className="text-[10px] text-gray-500 line-clamp-1">{template.description}</p>
        </div>

        {/* Actions */}
        <div className="flex border-t border-gray-100">
          <button 
            className="flex-1 py-1.5 text-[10px] text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              setEditingTemplate(template);
            }}
          >
            <Palette className="w-3 h-3" />
            Cores
          </button>
          {isCustom && (
            <button 
              className="flex-1 py-1.5 text-[10px] text-red-600 hover:bg-red-50 flex items-center justify-center gap-1 border-l border-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(template.id);
              }}
            >
              <Trash2 className="w-3 h-3" />
              Excluir
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-900 text-sm">Templates do Header</span>
        </div>
        <Button 
          variant="outline"
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          className="h-7 text-xs border-gray-300 text-gray-700"
        >
          <Plus className="w-3 h-3 mr-1" />
          Novo Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {allTemplates.map(template => (
          <TemplatePreview 
            key={template.id} 
            template={template} 
            isSelected={template.id === config.selectedTemplate}
          />
        ))}
      </div>

      {/* Preview do template selecionado */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">Template Ativo: {selectedTemplate.name}</span>
        </div>
        <p className="text-xs text-gray-500">{selectedTemplate.description}</p>
      </div>

      {/* Dialog: Editar Cores */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Editar Cores - {editingTemplate?.name}</DialogTitle>
            <DialogDescription className="text-gray-600">
              Personalize todas as cores dos elementos do header
            </DialogDescription>
          </DialogHeader>

          {editingTemplate && (
            <div className="space-y-4 py-4">
              {/* Preview Real do Header */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700 flex items-center gap-2">
                  <Eye className="w-3 h-3" />
                  Preview em Tempo Real
                </p>
                <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  {/* Header Principal */}
                  <div 
                    className="px-4 py-3"
                    style={{ backgroundColor: editingTemplate.customColors.headerBg || editingTemplate.secondaryHeaderBg || '#1e3a5f' }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Logo */}
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ 
                            backgroundColor: editingTemplate.customColors.accentColor || editingTemplate.customColors.loginButtonBg,
                            color: editingTemplate.customColors.headerBg || '#1e3a5f'
                          }}
                        >
                          XL
                        </div>
                        <span 
                          className="font-bold text-sm"
                          style={{ color: editingTemplate.customColors.headerText || '#FFFFFF' }}
                        >
                          Loja
                        </span>
                      </div>
                      
                      {/* Search */}
                      <div className="flex-1 max-w-[200px]">
                        <div 
                          className="flex items-center h-8 rounded-full overflow-hidden"
                          style={{ backgroundColor: editingTemplate.customColors.searchInputBg || '#FFFFFF' }}
                        >
                          <span 
                            className="flex-1 px-3 text-[10px]"
                            style={{ color: editingTemplate.customColors.searchInputText || '#6B7280' }}
                          >
                            Buscar...
                          </span>
                          <div 
                            className="h-6 w-6 rounded-full flex items-center justify-center mx-1"
                            style={{ 
                              backgroundColor: editingTemplate.customColors.searchButtonBg,
                              color: editingTemplate.customColors.searchButtonText
                            }}
                          >
                            <Search className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Buttons */}
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ 
                            backgroundColor: editingTemplate.customColors.loginButtonBg === 'transparent' ? 'transparent' : editingTemplate.customColors.loginButtonBg,
                            color: editingTemplate.customColors.loginButtonText,
                            border: editingTemplate.customColors.loginButtonBorder ? `2px solid ${editingTemplate.customColors.loginButtonBorder}` : undefined
                          }}
                        >
                          <User className="w-4 h-4" />
                        </div>
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ 
                            backgroundColor: editingTemplate.customColors.cartButtonBg === 'transparent' ? 'transparent' : editingTemplate.customColors.cartButtonBg,
                            color: editingTemplate.customColors.cartButtonText,
                            border: editingTemplate.customColors.cartButtonBorder ? `2px solid ${editingTemplate.customColors.cartButtonBorder}` : undefined
                          }}
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Nav Bar */}
                  {editingTemplate.layout === 'professional' && (
                    <div 
                      className="px-4 py-2 flex items-center gap-4"
                      style={{ backgroundColor: editingTemplate.customColors.navBg || '#2d4a6f' }}
                    >
                      <span 
                        className="text-[10px] font-medium"
                        style={{ color: editingTemplate.customColors.navText || '#FFFFFF' }}
                      >
                        Início
                      </span>
                      <span 
                        className="text-[10px]"
                        style={{ color: editingTemplate.customColors.navText || '#FFFFFF' }}
                      >
                        Categorias
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coluna 1: Cores do Header */}
                <div className="space-y-4">
                  {/* Cores do Header (para template profissional) */}
                  {editingTemplate.layout === 'professional' && (
                    <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs font-medium text-slate-700 mb-2">🎨 Cores do Header</p>
                      <ColorField
                        label="Fundo Principal"
                        value={editingTemplate.customColors.headerBg || editingTemplate.secondaryHeaderBg || '#1e3a5f'}
                        onChange={(v) => {
                          const updated = { ...editingTemplate.customColors, headerBg: v };
                          handleUpdateTemplateColors(editingTemplate, updated);
                          setEditingTemplate({ ...editingTemplate, customColors: updated });
                        }}
                      />
                      <ColorField
                        label="Texto Principal"
                        value={editingTemplate.customColors.headerText || '#FFFFFF'}
                        onChange={(v) => {
                          const updated = { ...editingTemplate.customColors, headerText: v };
                          handleUpdateTemplateColors(editingTemplate, updated);
                          setEditingTemplate({ ...editingTemplate, customColors: updated });
                        }}
                      />
                      <ColorField
                        label="Fundo Navegação"
                        value={editingTemplate.customColors.navBg || '#2d4a6f'}
                        onChange={(v) => {
                          const updated = { ...editingTemplate.customColors, navBg: v };
                          handleUpdateTemplateColors(editingTemplate, updated);
                          setEditingTemplate({ ...editingTemplate, customColors: updated });
                        }}
                      />
                      <ColorField
                        label="Texto Navegação"
                        value={editingTemplate.customColors.navText || '#FFFFFF'}
                        onChange={(v) => {
                          const updated = { ...editingTemplate.customColors, navText: v };
                          handleUpdateTemplateColors(editingTemplate, updated);
                          setEditingTemplate({ ...editingTemplate, customColors: updated });
                        }}
                      />
                      <ColorField
                        label="Cor de Destaque"
                        value={editingTemplate.customColors.accentColor || editingTemplate.customColors.loginButtonBg}
                        onChange={(v) => {
                          const updated = { ...editingTemplate.customColors, accentColor: v };
                          handleUpdateTemplateColors(editingTemplate, updated);
                          setEditingTemplate({ ...editingTemplate, customColors: updated });
                        }}
                      />
                    </div>
                  )}

                  {/* Campo de Busca */}
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-2">🔍 Campo de Busca</p>
                    <ColorField
                      label="Fundo do Input"
                      value={editingTemplate.customColors.searchInputBg || '#FFFFFF'}
                      onChange={(v) => {
                        const updated = { ...editingTemplate.customColors, searchInputBg: v };
                        handleUpdateTemplateColors(editingTemplate, updated);
                        setEditingTemplate({ ...editingTemplate, customColors: updated });
                      }}
                    />
                    <ColorField
                      label="Texto do Input"
                      value={editingTemplate.customColors.searchInputText || '#111827'}
                      onChange={(v) => {
                        const updated = { ...editingTemplate.customColors, searchInputText: v };
                        handleUpdateTemplateColors(editingTemplate, updated);
                        setEditingTemplate({ ...editingTemplate, customColors: updated });
                      }}
                    />
                    <ColorField
                      label="Fundo do Botão"
                      value={editingTemplate.customColors.searchButtonBg}
                      onChange={(v) => {
                        const updated = { ...editingTemplate.customColors, searchButtonBg: v };
                        handleUpdateTemplateColors(editingTemplate, updated);
                        setEditingTemplate({ ...editingTemplate, customColors: updated });
                      }}
                    />
                    <ColorField
                      label="Ícone do Botão"
                      value={editingTemplate.customColors.searchButtonText}
                      onChange={(v) => {
                        const updated = { ...editingTemplate.customColors, searchButtonText: v };
                        handleUpdateTemplateColors(editingTemplate, updated);
                        setEditingTemplate({ ...editingTemplate, customColors: updated });
                      }}
                    />
                  </div>
                </div>

                {/* Coluna 2: Botões */}
                <div className="space-y-4">
                  {/* Botão Conta/Entrar */}
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-2">👤 Botão Conta</p>
                    <ColorField
                      label="Fundo"
                      value={editingTemplate.customColors.loginButtonBg}
                      onChange={(v) => {
                        const updated = { ...editingTemplate.customColors, loginButtonBg: v };
                        handleUpdateTemplateColors(editingTemplate, updated);
                        setEditingTemplate({ ...editingTemplate, customColors: updated });
                      }}
                    />
                    <ColorField
                      label="Texto/Ícone"
                      value={editingTemplate.customColors.loginButtonText}
                      onChange={(v) => {
                        const updated = { ...editingTemplate.customColors, loginButtonText: v };
                        handleUpdateTemplateColors(editingTemplate, updated);
                        setEditingTemplate({ ...editingTemplate, customColors: updated });
                      }}
                    />
                    <ColorField
                      label="Borda"
                      value={editingTemplate.customColors.loginButtonBorder || 'transparent'}
                      onChange={(v) => {
                        const updated = { ...editingTemplate.customColors, loginButtonBorder: v };
                        handleUpdateTemplateColors(editingTemplate, updated);
                        setEditingTemplate({ ...editingTemplate, customColors: updated });
                      }}
                    />
                  </div>

                  {/* Botão Carrinho */}
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-2">🛒 Botão Carrinho</p>
                    <ColorField
                      label="Fundo"
                      value={editingTemplate.customColors.cartButtonBg}
                      onChange={(v) => {
                        const updated = { ...editingTemplate.customColors, cartButtonBg: v };
                        handleUpdateTemplateColors(editingTemplate, updated);
                        setEditingTemplate({ ...editingTemplate, customColors: updated });
                      }}
                    />
                    <ColorField
                      label="Texto/Ícone"
                      value={editingTemplate.customColors.cartButtonText}
                      onChange={(v) => {
                        const updated = { ...editingTemplate.customColors, cartButtonText: v };
                        handleUpdateTemplateColors(editingTemplate, updated);
                        setEditingTemplate({ ...editingTemplate, customColors: updated });
                      }}
                    />
                    <ColorField
                      label="Borda"
                      value={editingTemplate.customColors.cartButtonBorder || 'transparent'}
                      onChange={(v) => {
                        const updated = { ...editingTemplate.customColors, cartButtonBorder: v };
                        handleUpdateTemplateColors(editingTemplate, updated);
                        setEditingTemplate({ ...editingTemplate, customColors: updated });
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Seção de Gradiente */}
              <div className="space-y-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-xs font-medium text-purple-700 mb-2">✨ Gradiente do Botão Principal</p>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-700">Usar gradiente</Label>
                  <Switch
                    checked={editingTemplate.customColors.useGradient ?? false}
                    onCheckedChange={(checked) => {
                      const updated = { ...editingTemplate.customColors, useGradient: checked };
                      handleUpdateTemplateColors(editingTemplate, updated);
                      setEditingTemplate({ ...editingTemplate, customColors: updated });
                    }}
                  />
                </div>
                
                {editingTemplate.customColors.useGradient && (
                  <div className="grid grid-cols-2 gap-3">
                    <ColorField
                      label="Cor Inicial"
                      value={editingTemplate.customColors.loginButtonGradientStart || '#8B5CF6'}
                      onChange={(v) => {
                        const updated = { ...editingTemplate.customColors, loginButtonGradientStart: v };
                        handleUpdateTemplateColors(editingTemplate, updated);
                        setEditingTemplate({ ...editingTemplate, customColors: updated });
                      }}
                    />
                    <ColorField
                      label="Cor Final"
                      value={editingTemplate.customColors.loginButtonGradientEnd || '#06B6D4'}
                      onChange={(v) => {
                        const updated = { ...editingTemplate.customColors, loginButtonGradientEnd: v };
                        handleUpdateTemplateColors(editingTemplate, updated);
                        setEditingTemplate({ ...editingTemplate, customColors: updated });
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Opções de Exibição */}
              <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-blue-700 mb-2">⚙️ Opções de Exibição</p>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-700">Exibir nome da loja</Label>
                  <Switch
                    checked={editingTemplate.showStoreName}
                    onCheckedChange={(checked) => {
                      const updatedTemplate = { ...editingTemplate, showStoreName: checked };
                      handleUpdateTemplateShowStoreName(editingTemplate, checked);
                      setEditingTemplate(updatedTemplate);
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-500">
                  {editingTemplate.showStoreName 
                    ? 'Logo + Nome da Loja serão exibidos' 
                    : 'Apenas o Logo será exibido'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)} className="border-gray-300">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Criar Template */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Criar Novo Template</DialogTitle>
            <DialogDescription className="text-gray-600">
              Baseie seu template em um dos existentes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Nome do Template</Label>
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Meu Template Customizado"
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Basear em</Label>
              <div className="grid grid-cols-3 gap-2">
                {DEFAULT_HEADER_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setBaseTemplateId(t.id)}
                    className={`p-2 rounded-lg border text-center text-xs transition-all ${
                      baseTemplateId === t.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-gray-300">
              Cancelar
            </Button>
            <Button onClick={handleCreateTemplate} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1" />
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Exclusão */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Excluir Template?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Esta ação não pode ser desfeita. O template será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => showDeleteDialog && handleDeleteTemplate(showDeleteDialog)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
