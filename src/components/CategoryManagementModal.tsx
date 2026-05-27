import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Check, X, Shield, Loader2, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { MaterialCategory } from '@/types/pdv';
import { getMaterialCategories, saveMaterialCategory, removeMaterialCategory, toggleCategoryActive, seedDefaultCategoriesAndMaterials, resetAllCategories } from '@/utils/supabaseStorage';
import { CATEGORY_COLORS, CATEGORY_COLOR_OPTIONS } from './CategoryBar';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

interface CategoryManagementModalProps {
  open: boolean;
  onClose: () => void;
  onCategoriesChanged?: () => void;
}

// Helper to check if a hex color is light
const isLightColor = (hex: string): boolean => {
  if (!hex || !hex.startsWith('#')) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

// Helper to get the next available color that is not already in use
const getNextAvailableColor = (usedColors: string[]): string => {
  const availableColors = CATEGORY_COLOR_OPTIONS.map(opt => opt.value);
  const nextColor = availableColors.find(color => !usedColors.includes(color));
  return nextColor || 'blue'; // Fallback if all colors are used
};

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  open,
  onClose,
  onCategoriesChanged
}) => {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeedLoading, setIsSeedLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MaterialCategory | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('blue');
  const [newCategoryHexColor, setNewCategoryHexColor] = useState<string>('');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Calculate which colors are currently in use
  const usedColors = categories.map(c => c.color);

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const cats = await getMaterialCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar categorias",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    setIsSeedLoading(true);
    try {
      await seedDefaultCategoriesAndMaterials();
      await loadCategories();
      onCategoriesChanged?.();
      toast({
        title: "Sucesso",
        description: "Categorias e materiais padrão criados com sucesso!"
      });
    } catch (error) {
      console.error('Error seeding defaults:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar categorias padrão",
        variant: "destructive"
      });
    } finally {
      setIsSeedLoading(false);
    }
  };

  const handleResetCategories = async () => {
    setIsResetting(true);
    try {
      // Delete ALL categories (bypassing is_system check)
      await resetAllCategories();
      
      // Re-seed default categories with correct unique colors
      await seedDefaultCategoriesAndMaterials();
      await loadCategories();
      onCategoriesChanged?.();
      setShowResetConfirm(false);
      
      toast({
        title: "Sucesso",
        description: "Categorias resetadas para o padrão!"
      });
    } catch (error) {
      console.error('Error resetting categories:', error);
      toast({
        title: "Erro",
        description: "Erro ao resetar categorias",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicates
    if (categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast({
        title: "Erro",
        description: "Já existe uma categoria com este nome",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const newCategory = await saveMaterialCategory({
        id: crypto.randomUUID(),
        name: newCategoryName.trim(),
        color: newCategoryColor,
        hex_color: newCategoryHexColor || null,
        display_order: categories.length
      });

      setCategories(prev => [...prev, newCategory]);
      setNewCategoryName('');
      setNewCategoryColor('blue');
      setNewCategoryHexColor('');
      setIsAdding(false);
      onCategoriesChanged?.();

      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso"
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar categoria",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;

    setIsLoading(true);
    try {
      // System categories: only color can change, name stays original
      const original = categories.find(c => c.id === editingCategory.id);
      const finalName = editingCategory.is_system && original ? original.name : editingCategory.name.trim();

      const updated = await saveMaterialCategory({
        id: editingCategory.id,
        name: finalName,
        color: editingCategory.color,
        hex_color: editingCategory.hex_color ?? null,
        display_order: editingCategory.display_order
      });

      setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
      setEditingCategory(null);
      onCategoriesChanged?.();

      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso"
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar categoria",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (category: MaterialCategory) => {
    // Block deleting system categories
    if (category.is_system) {
      toast({
        title: "Bloqueado",
        description: "Categorias do sistema não podem ser excluídas",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await removeMaterialCategory(category.id);
      setCategories(prev => prev.filter(c => c.id !== category.id));
      onCategoriesChanged?.();

      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso"
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir categoria",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (category: MaterialCategory) => {
    // All categories can be toggled - no restrictions

    setIsLoading(true);
    try {
      const newActiveState = !category.is_active;
      await toggleCategoryActive(category.id, newActiveState);
      setCategories(prev => prev.map(c => 
        c.id === category.id ? { ...c, is_active: newActiveState } : c
      ));
      onCategoriesChanged?.();

      toast({
        title: "Sucesso",
        description: newActiveState ? "Categoria ativada" : "Categoria desativada"
      });
    } catch (error) {
      console.error('Error toggling category:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da categoria",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ColorPicker with used colors indication
  const ColorPicker: React.FC<{ 
    value: string; 
    onChange: (color: string) => void; 
    disabled?: boolean;
    excludeCategoryId?: string; // Exclude this category from "used" check (for editing)
  }> = ({ value, onChange, disabled, excludeCategoryId }) => {
    // Colors used by OTHER categories (excluding the one being edited)
    const colorsUsedByOthers = categories
      .filter(c => c.id !== excludeCategoryId)
      .map(c => c.color);

    return (
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_COLOR_OPTIONS.map((option) => {
          const colors = CATEGORY_COLORS[option.value];
          const isUsedByOther = colorsUsedByOthers.includes(option.value);
          const isCurrentValue = value === option.value;
          const isDisabled = disabled || (isUsedByOther && !isCurrentValue);
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !isDisabled && onChange(option.value)}
              disabled={isDisabled}
              className={cn(
                'w-7 h-7 rounded-full border-2 transition-all duration-200 flex items-center justify-center relative',
                colors.bg,
                isCurrentValue 
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 border-white' 
                  : 'border-transparent hover:scale-110',
                isDisabled && 'opacity-40 cursor-not-allowed',
                isUsedByOther && !isCurrentValue && 'after:content-[""] after:absolute after:w-full after:h-0.5 after:bg-white/70 after:rotate-45'
              )}
              title={isUsedByOther && !isCurrentValue ? `${option.label} (já em uso)` : option.label}
            >
              {isCurrentValue && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          );
        })}
      </div>
    );
  };

  // Get the color display for a category
  const getCategoryColorDisplay = (category: MaterialCategory) => {
    if (category.hex_color) {
      return {
        backgroundColor: category.hex_color,
        color: isLightColor(category.hex_color) ? '#000000' : '#FFFFFF'
      };
    }
    const colors = CATEGORY_COLORS[category.color] || CATEGORY_COLORS.blue;
    return { className: colors.bg };
  };

  // Separate system and user categories
  const systemCategories = categories.filter(c => c.is_system);
  const userCategories = categories.filter(c => !c.is_system);
  const hasSystemCategories = systemCategories.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="z-[60] bg-slate-900 border-slate-700 text-white w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] h-[90dvh] max-h-[90dvh] rounded-2xl mx-2 p-0 md:w-[92vw] md:max-w-3xl lg:max-w-4xl md:h-auto md:max-h-[88vh] md:p-6 md:rounded-2xl overflow-hidden flex flex-col">
        {/* Always-visible close button */}
        <button
          type="button"
          onClick={() => onClose()}
          aria-label="Fechar"
          className="absolute top-3 right-3 md:top-4 md:right-4 z-[100] h-9 w-9 flex items-center justify-center rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg ring-2 ring-slate-900/60 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        {/* Mobile-optimized header */}
        <div className="sticky top-0 z-10 bg-slate-900 px-4 pt-4 pb-3 border-b border-slate-700/50 md:p-0 md:border-0">
          <DialogHeader className="md:mb-4">
            <DialogTitle className="text-center md:text-left text-lg">Gerenciar Categorias</DialogTitle>
            <DialogDescription className="text-slate-400 text-center md:text-left text-sm">
              Crie, edite ou exclua categorias de materiais
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 md:px-0 space-y-3">
          {/* Seed default categories button */}
          {!hasSystemCategories && (
            <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-3">
              <p className="text-sm text-emerald-300 mb-2">
                Deseja criar as categorias padrão do sistema com materiais pré-cadastrados?
              </p>
              <Button
                onClick={handleSeedDefaults}
                disabled={isSeedLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
              >
                {isSeedLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...</>
                ) : (
                  <><Shield className="w-4 h-4 mr-2" /> Criar Categorias Padrão</>
                )}
              </Button>
            </div>
          )}

          {/* Add new category form */}
          {isAdding ? (
            <div className="bg-slate-800 rounded-xl p-4 space-y-3 border border-slate-700">
              <div className="space-y-2">
                <Label className="text-white text-sm">Nome da categoria</Label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Minha Categoria"
                  className="bg-slate-700 border-slate-600 text-white h-11 rounded-xl"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white text-sm">Cor predefinida</Label>
                <ColorPicker value={newCategoryColor} onChange={(c) => { setNewCategoryColor(c); setNewCategoryHexColor(''); }} />
              </div>
              <div className="space-y-2">
                <Label className="text-white text-sm">Cor personalizada (opcional)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCategoryHexColor || '#22c55e'}
                    onChange={(e) => setNewCategoryHexColor(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-slate-600 bg-slate-700 cursor-pointer"
                  />
                  <Input
                    value={newCategoryHexColor}
                    onChange={(e) => setNewCategoryHexColor(e.target.value)}
                    placeholder="#22c55e"
                    className="bg-slate-700 border-slate-600 text-white h-10 rounded-xl flex-1 font-mono text-sm"
                  />
                  {newCategoryHexColor && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setNewCategoryHexColor('')} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">Quando definida, sobrepõe a cor predefinida.</p>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleAddCategory}
                  disabled={isLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-11 rounded-xl"
                >
                  <Check className="w-4 h-4 mr-1" /> Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setNewCategoryName('');
                    setNewCategoryColor('blue');
                  }}
                  className="flex-1 bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700 hover:text-white h-11 rounded-xl"
                >
                  <X className="w-4 h-4 mr-1" /> Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => {
                const nextColor = getNextAvailableColor(usedColors);
                setNewCategoryColor(nextColor);
                setIsAdding(true);
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white h-12 rounded-xl border border-slate-700"
            >
              <Plus className="w-5 h-5 mr-2" /> Adicionar Categoria Personalizada
            </Button>
          )}

          {/* Categories list - mobile optimized */}
          <div className="space-y-3">
            {isLoading && categories.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Carregando...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                Nenhuma categoria cadastrada
              </div>
            ) : (
              <>
                {/* System Categories Section */}
                {systemCategories.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                        Categorias do Sistema
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {systemCategories.map((category) => {
                        const colorDisplay = getCategoryColorDisplay(category);

                        return (
                          <div
                            key={category.id}
                            className={cn(
                              'flex items-center gap-3 py-2.5 px-3 rounded-xl bg-slate-800/60 border border-slate-700/40 min-w-0',
                              !category.is_active && 'opacity-50'
                            )}
                          >
                            <label className="relative cursor-pointer flex-shrink-0" title="Trocar cor">
                              <div
                                className={cn(
                                  'w-5 h-5 rounded-full ring-2 ring-slate-700 hover:ring-emerald-500 transition',
                                  'className' in colorDisplay ? colorDisplay.className : ''
                                )}
                                style={'backgroundColor' in colorDisplay ? { backgroundColor: colorDisplay.backgroundColor } : {}}
                              />
                              <input
                                type="color"
                                value={category.hex_color || '#22c55e'}
                                onChange={async (e) => {
                                  const updated = { ...category, hex_color: e.target.value };
                                  setCategories(prev => prev.map(c => c.id === category.id ? updated : c));
                                  try {
                                    await saveMaterialCategory({
                                      id: category.id,
                                      name: category.name,
                                      color: category.color,
                                      hex_color: e.target.value,
                                      display_order: category.display_order,
                                    });
                                    onCategoriesChanged?.();
                                  } catch {
                                    toast({ title: 'Erro', description: 'Erro ao atualizar cor', variant: 'destructive' });
                                  }
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </label>

                            <div className="flex-1 min-w-0 flex flex-col">
                              <span className="text-white text-sm font-medium truncate leading-tight">
                                {category.name}
                              </span>
                              <span className="text-[10px] text-amber-400/80 uppercase tracking-wide leading-tight">
                                Sistema
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0 pl-1">
                              <span className="text-[11px] text-slate-500 hidden md:inline">
                                {category.is_active ? 'Ativa' : 'Inativa'}
                              </span>
                              <Switch
                                checked={category.is_active !== false}
                                onCheckedChange={() => handleToggleActive(category)}
                                disabled={isLoading}
                                className="scale-90"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* User Categories Section */}
                {userCategories.length > 0 && (
                  <div className="space-y-2">
                    <div className="px-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Suas Categorias
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {userCategories.map((category) => {
                        const colors = CATEGORY_COLORS[category.color] || CATEGORY_COLORS.blue;
                        const isEditing = editingCategory?.id === category.id;

                        return (
                          <div
                            key={category.id}
                            className={cn(
                              'rounded-xl transition-all border',
                              isEditing 
                                ? 'bg-slate-800 p-4 border-slate-600' 
                                : 'bg-slate-800/60 border-slate-700/40'
                            )}
                          >
                            {isEditing ? (
                              <div className="space-y-3 p-1">
                                <Input
                                  value={editingCategory.name}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                  className="bg-slate-700 border-slate-500 text-white h-11 rounded-xl"
                                  autoFocus
                                />
                                <div>
                                  <Label className="text-slate-300 text-xs mb-1.5 block">Cor predefinida</Label>
                                  <ColorPicker 
                                    value={editingCategory.color} 
                                    onChange={(color) => setEditingCategory({ ...editingCategory, color, hex_color: null })}
                                    excludeCategoryId={editingCategory.id}
                                  />
                                </div>
                                <div>
                                  <Label className="text-slate-300 text-xs mb-1.5 block">Cor personalizada</Label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={editingCategory.hex_color || '#22c55e'}
                                      onChange={(e) => setEditingCategory({ ...editingCategory, hex_color: e.target.value })}
                                      className="w-12 h-10 rounded-lg border border-slate-600 bg-slate-700 cursor-pointer"
                                    />
                                    <Input
                                      value={editingCategory.hex_color || ''}
                                      onChange={(e) => setEditingCategory({ ...editingCategory, hex_color: e.target.value || null })}
                                      placeholder="#22c55e"
                                      className="bg-slate-700 border-slate-600 text-white h-10 rounded-xl flex-1 font-mono text-sm"
                                    />
                                    {editingCategory.hex_color && (
                                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingCategory({ ...editingCategory, hex_color: null })} className="text-slate-400 hover:text-white">
                                        <X className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleUpdateCategory}
                                    disabled={isLoading}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-10 rounded-xl text-sm"
                                  >
                                    <Check className="w-4 h-4 mr-1" /> Salvar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setEditingCategory(null)}
                                    className="flex-1 bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700 hover:text-white h-10 rounded-xl text-sm"
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 py-3 px-3">
                                <div
                                  className={cn('w-4 h-4 rounded-full flex-shrink-0', !category.hex_color && colors.bg)}
                                  style={category.hex_color ? { backgroundColor: category.hex_color } : undefined}
                                />
                                <span className="flex-1 text-white text-sm font-medium truncate">
                                  {category.name}
                                </span>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => setEditingCategory(category)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(category)}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile-optimized footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700/50 px-4 py-3 space-y-2 safe-area-bottom md:p-0 md:border-0 md:mt-4">
          {showResetConfirm ? (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-amber-400 text-center">Confirmar reset? Todas as categorias serão restauradas ao padrão.</span>
              <div className="flex gap-2">
                <Button
                  onClick={handleResetCategories}
                  disabled={isResetting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white h-11 rounded-xl"
                >
                  {isResetting ? (
                    <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Resetando...</>
                  ) : (
                    'Sim, resetar'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700 hover:text-white h-11 rounded-xl"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(true)}
              className="w-full bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20 hover:text-amber-200 h-11 rounded-xl"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Resetar Categorias
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManagementModal;