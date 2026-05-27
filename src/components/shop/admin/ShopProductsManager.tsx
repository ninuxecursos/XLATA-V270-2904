import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Star, Tag, Package, Grid, List, Filter, CheckSquare, Square, X, Power, PowerOff, MoreHorizontal, ChevronLeft, ChevronRight, MessageSquare, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { TelegramChatSimulator } from './TelegramChatSimulator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useShopProducts, useDeleteProduct, useBulkUpdateProducts, useBulkDeleteProducts, ShopProduct } from '@/hooks/useShopProducts';
import { ShopProductForm } from './ShopProductForm';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function ShopProductsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'normal' | 'interactive'>('all');
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showChatSimulator, setShowChatSimulator] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isGeneratingSkus, setIsGeneratingSkus] = useState(false);

  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useShopProducts();
  const deleteProduct = useDeleteProduct();
  const bulkUpdate = useBulkUpdateProducts();
  const bulkDelete = useBulkDeleteProducts();

  const productsWithoutSku = products.filter(p => !p.sku || p.sku.trim() === '');

  const generateUniqueSKU = async (): Promise<string> => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    for (let attempt = 0; attempt < 10; attempt++) {
      const random = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const sku = `XL-${date}-${random}`;
      const { data } = await supabase.from('shop_products').select('id').eq('sku', sku).maybeSingle();
      if (!data) return sku;
    }
    return `XL-${Date.now()}`;
  };

  const handleGenerateSkus = async () => {
    if (productsWithoutSku.length === 0) return;
    setIsGeneratingSkus(true);
    try {
      let count = 0;
      for (const product of productsWithoutSku) {
        const sku = await generateUniqueSKU();
        const { error } = await supabase.from('shop_products').update({ sku }).eq('id', product.id);
        if (!error) count++;
      }
      queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      toast.success(`${count} SKU(s) gerado(s) com sucesso!`);
    } catch (err) {
      toast.error('Erro ao gerar SKUs');
    } finally {
      setIsGeneratingSkus(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || product.sale_type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, pageSize]);

  // Detect pending product scan from Dashboard Quick Action
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('pending_product_scan');
      if (!raw) return;
      const scan = JSON.parse(raw);
      sessionStorage.removeItem('pending_product_scan');
      // Pre-fill via a transient product object that the form recognises as "new"
      // (editingProduct stays null; form reads pending_product_scan on mount)
      sessionStorage.setItem('pending_product_scan_apply', JSON.stringify(scan));
      setEditingProduct(null);
      setShowForm(true);
      toast.success('Foto analisada! Revise e salve o produto.');
    } catch (e) {
      console.error('Failed to load pending scan', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredProducts.length);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  // Selection helpers
  const isAllSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id));
  const isSomeSelected = selectedIds.size > 0;
  const selectedCount = selectedIds.size;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk actions
  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    await bulkUpdate.mutateAsync({ ids: Array.from(selectedIds), updates: { is_active: true } });
    clearSelection();
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;
    await bulkUpdate.mutateAsync({ ids: Array.from(selectedIds), updates: { is_active: false } });
    clearSelection();
  };

  const handleBulkShow = async () => {
    if (selectedIds.size === 0) return;
    await bulkUpdate.mutateAsync({ ids: Array.from(selectedIds), updates: { is_visible: true } });
    clearSelection();
  };

  const handleBulkHide = async () => {
    if (selectedIds.size === 0) return;
    await bulkUpdate.mutateAsync({ ids: Array.from(selectedIds), updates: { is_visible: false } });
    clearSelection();
  };

  const handleBulkFeature = async () => {
    if (selectedIds.size === 0) return;
    await bulkUpdate.mutateAsync({ ids: Array.from(selectedIds), updates: { is_featured: true } });
    clearSelection();
  };

  const handleBulkUnfeature = async () => {
    if (selectedIds.size === 0) return;
    await bulkUpdate.mutateAsync({ ids: Array.from(selectedIds), updates: { is_featured: false } });
    clearSelection();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    await bulkDelete.mutateAsync(Array.from(selectedIds));
    clearSelection();
    setShowBulkDeleteConfirm(false);
  };

  const handleEdit = (product: ShopProduct) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleDelete = async () => {
    if (deleteProductId) {
      await deleteProduct.mutateAsync(deleteProductId);
      setDeleteProductId(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 shop-cms">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[hsl(var(--shop-text-primary))]">Produtos</h1>
          <p className="text-sm text-[hsl(var(--shop-text-muted))]">
            {products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {!showForm && (
          <div className="flex gap-2">
            {productsWithoutSku.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleGenerateSkus} 
                disabled={isGeneratingSkus}
                className="shop-btn-outline gap-2 h-11 min-h-[44px]"
              >
                {isGeneratingSkus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                <span className="hidden sm:inline">Gerar SKUs ({productsWithoutSku.length})</span>
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowChatSimulator(true)} className="shop-btn-outline gap-2 h-11 min-h-[44px]">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Cadastro Rápido</span>
            </Button>
            <Button onClick={handleNewProduct} className="shop-btn-primary gap-2 h-11 min-h-[44px]">
              <Plus className="w-4 h-4" />
              Novo Produto
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {isSomeSelected && (
        <div className="bg-emerald-600 text-white rounded-xl p-4 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200 shadow-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-10 px-3 text-white hover:bg-white/20 min-h-[44px]"
            >
              <X className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold">
              {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center gap-1 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkActivate}
              disabled={bulkUpdate.isPending}
             className="h-10 text-sm text-white hover:bg-white/20 gap-2 min-h-[44px]"
            >
              <Power className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ativar</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDeactivate}
              disabled={bulkUpdate.isPending}
             className="h-10 text-sm text-white hover:bg-white/20 gap-2 min-h-[44px]"
            >
              <PowerOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desativar</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkShow}
              disabled={bulkUpdate.isPending}
             className="h-10 text-sm text-white hover:bg-white/20 gap-2 min-h-[44px]"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mostrar</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkHide}
              disabled={bulkUpdate.isPending}
              className="h-10 text-sm text-white hover:bg-white/20 gap-2 min-h-[44px]"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ocultar</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                   className="h-10 text-sm text-white hover:bg-white/20 gap-2 min-h-[44px]"
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Mais</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-gray-200 text-gray-900 shadow-lg">
                <DropdownMenuItem 
                  onClick={handleBulkFeature}
                  className="text-gray-900 cursor-pointer hover:bg-gray-100"
                >
                  <Star className="w-4 h-4 mr-2 text-amber-500" />
                  Marcar como destaque
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleBulkUnfeature}
                  className="text-gray-900 cursor-pointer hover:bg-gray-100"
                >
                  <Star className="w-4 h-4 mr-2 text-gray-400" />
                  Remover destaque
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem 
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="text-red-600 cursor-pointer hover:bg-red-50 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir selecionados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Inline Form */}
      {showForm && (
        <ShopProductForm
          product={editingProduct}
          onClose={handleCloseForm}
        />
      )}

      {/* Filters & Search */}
      <div className="space-y-3">
        {/* Row 1: Search + Select All (mobile: full width search) */}
        <div className="flex gap-2 items-center">
          {!showForm && filteredProducts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className={cn(
                "h-11 w-11 p-0 flex-shrink-0 shop-btn-outline min-h-[44px]",
                isAllSelected && "bg-[hsl(var(--shop-primary)/0.1)] border-[hsl(var(--shop-primary)/0.4)] text-[hsl(var(--shop-primary))]"
              )}
            >
              {isAllSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            </Button>
          )}
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--shop-text-muted))] w-4 h-4" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 shop-input bg-white text-gray-900 border-gray-300"
            />
          </div>
        </div>

        {/* Row 2: Filter + PageSize + View Toggle (compact row) */}
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={(v: 'all' | 'normal' | 'interactive') => setFilterType(v)}>
            <SelectTrigger className="flex-1 sm:w-[140px] sm:flex-none h-10 shop-input bg-white text-gray-900 border-gray-300 text-sm">
              <Filter className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 text-gray-900">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="interactive">Interativo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className="w-[90px] sm:w-[110px] h-10 bg-white text-gray-900 border-gray-300 text-sm flex-shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 text-gray-900">
              <SelectItem value="20">20 / pág</SelectItem>
              <SelectItem value="50">50 / pág</SelectItem>
              <SelectItem value="100">100 / pág</SelectItem>
              <SelectItem value="200">200 / pág</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-9 w-9 p-0 rounded-md", viewMode === 'grid' ? "bg-white shadow-sm text-gray-900" : "text-gray-400")}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-9 w-9 p-0 rounded-md", viewMode === 'list' ? "bg-white shadow-sm text-gray-900" : "text-gray-400")}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Products */}
      {isLoading ? (
        <div className="text-center py-12 text-[hsl(var(--shop-text-muted))]">
          <div className="animate-spin w-8 h-8 border-2 border-[hsl(var(--shop-primary))] border-t-transparent rounded-full mx-auto mb-2" />
          Carregando produtos...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 shop-card">
          <Package className="w-12 h-12 text-[hsl(var(--shop-text-muted)/0.3)] mx-auto mb-3" />
          <p className="text-[hsl(var(--shop-text-muted))] mb-4">
            {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
          </p>
          {!showForm && (
           <Button onClick={handleNewProduct} variant="outline" className="shop-btn-outline">
              <Plus className="w-4 h-4 mr-2" />
              {searchTerm ? 'Criar produto' : 'Criar primeiro produto'}
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {paginatedProducts.map((product) => (
            <div 
              key={product.id} 
              className={cn(
                "shop-card overflow-hidden hover:shadow-lg transition-all group p-0",
                selectedIds.has(product.id) 
                  ? "border-[hsl(var(--shop-primary))] ring-2 ring-[hsl(var(--shop-primary)/0.2)]" 
                  : ""
              )}
            >
              {/* Image */}
              <div className="aspect-square bg-[hsl(var(--shop-bg-elevated))] relative overflow-hidden" onClick={() => toggleSelect(product.id)}>
                {/* Selection Checkbox */}
                <div 
                  className={cn(
                    "absolute top-2 left-2 z-10 transition-opacity",
                    selectedIds.has(product.id) || isSomeSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                  onClick={(e) => { e.stopPropagation(); toggleSelect(product.id); }}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-colors",
                    selectedIds.has(product.id) 
                      ? "bg-[hsl(var(--shop-primary))] text-white" 
                      : "bg-white/90 border border-[hsl(var(--shop-border-default))] text-[hsl(var(--shop-text-muted))] hover:border-[hsl(var(--shop-primary))]"
                  )}>
                    {selectedIds.has(product.id) && <CheckSquare className="w-4 h-4" />}
                  </div>
                </div>

                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[hsl(var(--shop-text-muted)/0.3)]">
                    <Tag className="w-10 h-10" />
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-2 left-10 flex flex-col gap-1">
                  {product.is_featured && (
                    <Badge className="bg-[hsl(var(--shop-warning))] text-white text-[10px] px-1.5 py-0.5">
                      <Star className="w-2.5 h-2.5 mr-0.5" />
                      Destaque
                    </Badge>
                  )}
                  {product.sale_type === 'interactive' && (
                    <Badge className="bg-[hsl(var(--shop-interactive))] text-white text-[10px] px-1.5 py-0.5">Interativo</Badge>
                  )}
                </div>
                
                {/* Visibility */}
                <div className="absolute top-2 right-2">
                  {!product.is_visible && (
                    <Badge variant="destructive" className="bg-[hsl(var(--shop-error))] text-white text-[10px] px-1.5 py-0.5">
                      <EyeOff className="w-2.5 h-2.5" />
                    </Badge>
                  )}
                </div>

                {/* Quick Actions Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <Button 
                    size="sm" 
                    className="h-10 bg-white text-[hsl(var(--shop-text-primary))] hover:bg-[hsl(var(--shop-bg-elevated))] border border-[hsl(var(--shop-border-default))] min-h-[44px]"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="h-10 bg-[hsl(var(--shop-error))] hover:bg-[hsl(var(--shop-error))/90] min-h-[44px]"
                    onClick={() => setDeleteProductId(product.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-medium text-[hsl(var(--shop-text-primary))] text-sm truncate">{product.name}</h3>
                <p className="text-xs text-[hsl(var(--shop-text-muted))] mt-0.5">
                  Estoque: {product.stock_quantity}
                </p>
                
                <div className="flex items-center gap-1.5 mt-2">
                  {product.sale_price ? (
                    <>
                      <span className="text-sm font-bold text-[hsl(var(--shop-primary))]">
                        {formatCurrency(product.sale_price)}
                      </span>
                      <span className="text-xs text-[hsl(var(--shop-text-muted))] line-through">
                        {formatCurrency(product.price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-[hsl(var(--shop-text-primary))]">
                      {formatCurrency(product.price)}
                    </span>
                  )}
                </div>

                <Badge 
                  variant={product.is_active ? 'default' : 'secondary'}
                  className={cn(
                    "mt-2 text-[10px]",
                    product.is_active && "bg-[hsl(var(--shop-success)/0.15)] text-[hsl(var(--shop-success-text))]"
                  )}
                >
                  {product.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="shop-card overflow-hidden divide-y divide-[hsl(var(--shop-border-light))] p-0">
          {paginatedProducts.map((product) => (
            <div 
              key={product.id} 
              className={cn(
                "flex items-center gap-4 p-4 transition-colors cursor-pointer",
                selectedIds.has(product.id) 
                  ? "bg-[hsl(var(--shop-primary)/0.05)] hover:bg-[hsl(var(--shop-primary)/0.1)]" 
                  : "hover:bg-[hsl(var(--shop-bg-elevated))]"
              )}
              onClick={() => toggleSelect(product.id)}
            >
              {/* Checkbox */}
              <div 
                className="flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); toggleSelect(product.id); }}
              >
                <div className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-colors border",
                  selectedIds.has(product.id) 
                    ? "bg-[hsl(var(--shop-primary))] border-[hsl(var(--shop-primary))] text-white" 
                    : "bg-[hsl(var(--shop-bg-card))] border-[hsl(var(--shop-border-default))] hover:border-[hsl(var(--shop-primary))]"
                )}>
                  {selectedIds.has(product.id) && <CheckSquare className="w-3.5 h-3.5" />}
                </div>
              </div>

              {/* Thumbnail */}
              <div className="w-14 h-14 bg-[hsl(var(--shop-bg-elevated))] rounded-xl overflow-hidden flex-shrink-0">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[hsl(var(--shop-text-muted)/0.3)]">
                    <Tag className="w-6 h-6" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-[hsl(var(--shop-text-primary))] text-sm truncate">{product.name}</h3>
                  {product.is_featured && (
                    <Star className="w-3.5 h-3.5 text-[hsl(var(--shop-warning))] flex-shrink-0" />
                  )}
                  {product.sale_type === 'interactive' && (
                    <Badge className="bg-[hsl(var(--shop-interactive))] text-white text-[10px] px-1.5 py-0.5 flex-shrink-0">Interativo</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-[hsl(var(--shop-text-muted))]">
                  <span>SKU: {product.sku || '—'}</span>
                  <span>Estoque: {product.stock_quantity}</span>
                </div>
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0">
                {product.sale_price ? (
                  <>
                    <div className="text-sm font-bold text-[hsl(var(--shop-primary))]">
                      {formatCurrency(product.sale_price)}
                    </div>
                    <div className="text-xs text-[hsl(var(--shop-text-muted))] line-through">
                      {formatCurrency(product.price)}
                    </div>
                  </>
                ) : (
                  <div className="text-sm font-bold text-[hsl(var(--shop-text-primary))]">
                    {formatCurrency(product.price)}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge 
                  variant={product.is_active ? 'default' : 'secondary'}
                  className={cn(
                    "text-[10px]",
                    product.is_active && "bg-[hsl(var(--shop-success)/0.15)] text-[hsl(var(--shop-success-text))]"
                  )}
                >
                  {product.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
                {!product.is_visible && (
                  <EyeOff className="w-4 h-4 text-[hsl(var(--shop-text-muted))]" />
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-10 w-10 p-0 text-[hsl(var(--shop-text-secondary))] hover:text-[hsl(var(--shop-text-primary))] min-h-[44px]"
                  onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-10 w-10 p-0 text-[hsl(var(--shop-error))] hover:text-[hsl(var(--shop-error))] hover:bg-[hsl(var(--shop-error)/0.1)] min-h-[44px]"
                  onClick={(e) => { e.stopPropagation(); setDeleteProductId(product.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && filteredProducts.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-sm text-gray-500">
            Mostrando {startIndex + 1}-{endIndex} de {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''}
          </p>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-9 px-3 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            
            {getPageNumbers().map((page, idx) => 
              page === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "h-9 w-9 p-0 text-sm",
                    currentPage === page 
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600" 
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {page}
                </Button>
              )
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-9 px-3 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 gap-1"
            >
              <span className="hidden sm:inline">Próxima</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent className="bg-white border-gray-200 text-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Esta ação não pode ser desfeita. O produto será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 h-11 min-h-[44px]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white h-11 min-h-[44px]"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent className="bg-white border-gray-200 text-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">
              Excluir {selectedCount} produto{selectedCount !== 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Esta ação não pode ser desfeita. Os produtos selecionados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 h-11 min-h-[44px]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              disabled={bulkDelete.isPending}
              className="bg-red-600 hover:bg-red-700 text-white h-11 min-h-[44px]"
            >
              {bulkDelete.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chat Simulator Dialog - Full screen on mobile like real Telegram */}
      <Dialog open={showChatSimulator} onOpenChange={setShowChatSimulator}>
        <DialogContent 
           className="max-w-2xl p-0 gap-0 max-md:!fixed max-md:!inset-0 max-md:!m-0 max-md:!max-h-none max-md:!h-[100dvh] max-md:!w-full max-md:!rounded-none max-md:!translate-x-0 max-md:!translate-y-0 max-md:!top-0 max-md:!left-0 max-md:!border-0 max-md:[&>div.mx-auto]:!hidden md:p-0 md:max-h-[85vh] md:h-[700px]"
          hideCloseButton
        >
          <TelegramChatSimulator onClose={() => setShowChatSimulator(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
