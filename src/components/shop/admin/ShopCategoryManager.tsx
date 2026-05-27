import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useShopCategories, ShopCategory } from '@/hooks/useShopCategories';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { IconSelector } from './IconSelector';

interface ShopCategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCategory?: (category: ShopCategory) => void;
}

export function ShopCategoryManager({ open, onOpenChange, onSelectCategory }: ShopCategoryManagerProps) {
  const { data: categories = [], isLoading } = useShopCategories();
  const queryClient = useQueryClient();
  
  const [editingCategory, setEditingCategory] = useState<ShopCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: 'folder', parent_id: '' });
  const [isSaving, setIsSaving] = useState(false);

  const parentCategories = categories.filter(c => !c.parent_id);

  const resetForm = () => {
    setFormData({ name: '', icon: 'folder', parent_id: '' });
    setEditingCategory(null);
    setIsCreating(false);
  };

  const handleEdit = (category: ShopCategory) => {
    setEditingCategory(category);
    setFormData({ name: category.name, icon: category.icon || 'folder', parent_id: category.parent_id || '' });
    setIsCreating(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingCategory(null);
    setFormData({ name: '', icon: 'folder', parent_id: '' });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('shop_categories')
          .update({
            name: formData.name,
            slug: generateSlug(formData.name),
            icon: formData.icon,
            parent_id: formData.parent_id || null
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Categoria atualizada!');
      } else {
        const { error } = await supabase
          .from('shop_categories')
          .insert({
            name: formData.name,
            slug: generateSlug(formData.name),
            icon: formData.icon,
            parent_id: formData.parent_id || null,
            is_active: true,
            display_order: categories.length
          });

        if (error) throw error;
        toast.success('Categoria criada!');
      }

      queryClient.invalidateQueries({ queryKey: ['shop-categories'] });
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Erro ao salvar categoria');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    // Check if it's a parent with subcategories
    const hasChildren = categories.some(c => c.parent_id === deletingId);
    if (hasChildren) {
      toast.error('Não é possível excluir uma categoria que possui subcategorias. Exclua as subcategorias primeiro.');
      setDeletingId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('shop_categories')
        .delete()
        .eq('id', deletingId);

      if (error) throw error;
      toast.success('Categoria excluída!');
      queryClient.invalidateQueries({ queryKey: ['shop-categories'] });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erro ao excluir categoria');
    } finally {
      setDeletingId(null);
    }
  };

  // Build hierarchical list: parent followed by its children
  const hierarchicalCategories = parentCategories.flatMap(parent => {
    const children = categories.filter(c => c.parent_id === parent.id);
    return [parent, ...children];
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Folder className="w-5 h-5 text-emerald-600" />
              Gerenciar Categorias
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add/Edit Form */}
            {(isCreating || editingCategory) && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                <div>
                  <Label className="text-gray-700 text-sm">Nome da Categoria</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Eletrônicos"
                    className="mt-1 bg-white text-gray-900 border-gray-300"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 text-sm">Categoria Pai (opcional)</Label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
                  >
                    <option value="">Nenhuma (categoria raiz)</option>
                    {parentCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-gray-700 text-sm">Ícone</Label>
                  <IconSelector
                    value={formData.icon}
                    onChange={(icon) => setFormData(prev => ({ ...prev, icon }))}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                    className="bg-white text-gray-700 border-gray-300"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {editingCategory ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </div>
            )}

            {/* Add Button */}
            {!isCreating && !editingCategory && (
              <Button
                variant="outline"
                onClick={handleCreate}
                className="w-full bg-white text-gray-700 border-dashed border-gray-300 hover:border-emerald-500 hover:text-emerald-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            )}

            {/* Categories List */}
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-4 text-gray-500">
                  <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2" />
                  Carregando...
                </div>
              ) : hierarchicalCategories.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Folder className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">Nenhuma categoria cadastrada</p>
                </div>
              ) : (
                hierarchicalCategories.map((category) => {
                  const isChild = !!category.parent_id;
                  return (
                    <div
                      key={category.id}
                      className={`flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors ${isChild ? 'ml-6 border-l-2 border-l-emerald-200' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isChild ? 'bg-emerald-50 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                        <Folder className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${isChild ? 'text-gray-700' : 'text-gray-900'}`}>
                          {isChild ? '↳ ' : ''}{category.name}
                        </p>
                        <p className="text-xs text-gray-400">/{category.slug}</p>
                      </div>

                      <Badge 
                        variant={category.is_active ? 'default' : 'secondary'}
                        className={category.is_active ? 'bg-emerald-100 text-emerald-700 text-[10px]' : 'text-[10px]'}
                      >
                        {isChild ? 'Sub' : category.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>

                      <div className="flex gap-1">
                        {onSelectCategory && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => {
                              onSelectCategory(category);
                              onOpenChange(false);
                            }}
                          >
                            Selecionar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeletingId(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Esta ação não pode ser desfeita. Produtos desta categoria ficarão sem categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
