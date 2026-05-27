import React, { useState, useEffect, startTransition } from 'react';
import { FeatureGuard } from '@/components/FeatureGuard';
import { FEATURE_KEYS } from '@/constants/featureAccess';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Plus, Save, Trash, Download, Search, Settings, AlertTriangle, Package, History, TrendingUp, TrendingDown, Merge } from "lucide-react";
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMaterials, saveMaterial, removeMaterial, getMaterialCategories, getUserMaterialSettings, seedDefaultCategoriesAndMaterials } from "../utils/supabaseStorage";
import { supabase } from "@/integrations/supabase/client";
import { Material, MaterialCategory } from "../types/pdv";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import DeleteMaterialModal from "../components/DeleteMaterialModal";
import DeleteAllMaterialsModal from "../components/DeleteAllMaterialsModal";
import MaterialConfigModal from "../components/MaterialConfigModal";
import MaterialStockBlockModal from "../components/MaterialStockBlockModal";
import ClearMaterialStockModal from "../components/ClearMaterialStockModal";
import RenameMaterialConfirmModal from "../components/RenameMaterialConfirmModal";
import MaterialPriceHistoryModal from "../components/MaterialPriceHistoryModal";
import { DuplicateMaterialsModal } from "../components/DuplicateMaterialsModal";
import { useAuth } from "@/hooks/useAuth";
import { findMaterialMatches, wouldCreateDuplicate, MaterialSuggestion, findDuplicateMaterialGroups } from '@/utils/materialMatching';
import { getDisplayName } from '@/utils/materialNormalization';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingGuideBanner } from '@/components/onboarding/OnboardingGuideBanner';
import { useStockCalculation } from '@/hooks/useStockCalculation';

// Helper para indicador de variação de preço
const getPriceIndicator = (currentPrice: number, previousPrice: number | null | undefined) => {
  if (previousPrice === null || previousPrice === undefined) return null;
  if (currentPrice > previousPrice) return { symbol: '▲', color: 'text-red-400', Icon: TrendingUp };
  if (currentPrice < previousPrice) return { symbol: '▼', color: 'text-green-400', Icon: TrendingDown };
  return null;
};

const Materials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialName, setMaterialName] = useState<string>("");
  const [materialPrice, setMaterialPrice] = useState<string>("");
  const [materialSalePrice, setMaterialSalePrice] = useState<string>("");
  const [materialUnit, setMaterialUnit] = useState<string>("kg");
  const [materialCategoryId, setMaterialCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [useCategoriesEnabled, setUseCategoriesEnabled] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    material: Material | null;
  }>({
    open: false,
    material: null
  });
  const [configModal, setConfigModal] = useState<boolean>(false);
  const [deleteAllModal, setDeleteAllModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [materialSuggestions, setMaterialSuggestions] = useState<MaterialSuggestion[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState<boolean>(false);
  
  // Stock protection modals
  const [stockBlockModal, setStockBlockModal] = useState<{
    open: boolean;
    material: Material | null;
    stockQuantity: number;
  }>({ open: false, material: null, stockQuantity: 0 });
  
  const [clearMaterialStockModal, setClearMaterialStockModal] = useState<{
    open: boolean;
    materialName: string;
  }>({ open: false, materialName: '' });
  
  const [renameConfirmModal, setRenameConfirmModal] = useState<{
    open: boolean;
    pendingMaterial: Material | null;
    oldName: string;
    newName: string;
    pendingSaveData: { price: number; salePrice: number; unit: string; categoryId: string | null } | null;
  }>({ open: false, pendingMaterial: null, oldName: '', newName: '', pendingSaveData: null });

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editFromUrl = searchParams.get('edit');
  const { isOnboardingActive, progress, completeStep, completeSubStep, skipOnboarding, requestOpenCashRegister } = useOnboarding();
  const { calculateMaterialStock, calculateMultipleMaterialsStock } = useStockCalculation();
  const isMaterialsTutorialActive = isOnboardingActive && progress.currentStep === 2;
  
  // Stock indicators state
  const [materialsStock, setMaterialsStock] = useState<Record<string, number>>({});
  const [loadingStock, setLoadingStock] = useState(false);
  
  // Price history modal state
  const [priceHistoryModal, setPriceHistoryModal] = useState<{
    open: boolean;
    materialId: string;
    materialName: string;
  }>({ open: false, materialId: '', materialName: '' });

  // Duplicate materials modal state
  const [duplicatesModal, setDuplicatesModal] = useState(false);
  const [duplicatesDetected, setDuplicatesDetected] = useState(false);
  const [duplicatesCount, setDuplicatesCount] = useState(0);

  const defaultMaterialsList = ['Aerosol', 'Alum chap', 'Alum perfil', 'Bloco limpo', 'Bloco misto', 'Bloco sujo', 'Bronze', 'Cavaco', 'Chumbo mole', 'Chumbo duro', 'Cobre 1', 'Cobre 2', 'Cobre 3', 'Eletrônico', 'Ferro', 'Ferro fundido', 'Ferro leve', 'Ferro pesado', 'Fio inst', 'Garrafa pet', 'Inox 304', 'Latinha', 'Metal', 'Panela limpa', 'Panela suja', 'Papel alum', 'Papelão', 'Plástico', 'Radiador alum', 'Radiador cobre', 'Roda', 'Televisão', 'Torneira', 'Vergalhão', 'Vidro', 'Plástico pvc', 'Plástico ps', 'Plástico pead', 'Fio pp', 'Fio off-set'];
  
  useEffect(() => {
    loadMaterials();
  }, []);
  
  useEffect(() => {
    const sorted = materials.sort((a, b) => a.name.localeCompare(b.name));
    const filtered = sorted.filter(material => material.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredMaterials(filtered);
  }, [materials, searchTerm]);

  // Load stock for all materials when materials are loaded
  useEffect(() => {
    const loadMaterialsStock = async () => {
      if (materials.length === 0) return;
      
      setLoadingStock(true);
      try {
        const materialNames = materials.map(m => m.name);
        const stockData = await calculateMultipleMaterialsStock(materialNames);
        setMaterialsStock(stockData);
      } catch (error) {
        console.error('Error loading materials stock:', error);
      } finally {
        setLoadingStock(false);
      }
    };
    
    if (materials.length > 0) {
      loadMaterialsStock();
    }
  }, [materials, calculateMultipleMaterialsStock]);

  // Auto-open edit dialog from URL param
  useEffect(() => {
    if (editFromUrl && !loading && materials.length > 0) {
      const materialToEdit = materials.find(
        m => m.name.toLowerCase() === editFromUrl.toLowerCase()
      );
      if (materialToEdit) {
        handleEditMaterial(materialToEdit);
        // Clear the URL param after opening
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('edit');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [editFromUrl, loading, materials]);
  const loadMaterials = async () => {
    try {
      setLoading(true);
      const [storedMaterials, cats, settings] = await Promise.all([
        getMaterials(),
        getMaterialCategories(),
        getUserMaterialSettings()
      ]);
      setMaterials(storedMaterials);
      setCategories(cats);
      setUseCategoriesEnabled(settings?.use_categories ?? false);
      
      // Detect duplicates automatically
      const duplicateGroups = findDuplicateMaterialGroups(storedMaterials);
      if (duplicateGroups.length > 0) {
        setDuplicatesDetected(true);
        setDuplicatesCount(duplicateGroups.length);
      } else {
        setDuplicatesDetected(false);
        setDuplicatesCount(0);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar materiais",
        variant: "destructive"
      });
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  const insertDefaultMaterials = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para inserir materiais.",
        variant: "destructive"
      });
      return;
    }
    try {
      setLoading(true);
      
      // Use the function that links materials to their categories
      await seedDefaultCategoriesAndMaterials();
      
      // Reload materials and categories
      await loadMaterials();
      
      // Check active/inactive categories
      const updatedCategories = await getMaterialCategories();
      const activeCategories = updatedCategories.filter(c => c.is_active !== false);
      const inactiveCategories = updatedCategories.filter(c => c.is_active === false);
      
      // Show informative toast
      if (inactiveCategories.length > 0) {
        toast({
          title: "Materiais criados com sucesso!",
          description: `${activeCategories.length} categorias ativas e ${inactiveCategories.length} inativas. Acesse "Configurações" para ativar mais categorias.`,
          action: (
            <Button 
              size="sm" 
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => setConfigModal(true)}
            >
              Configurar
            </Button>
          )
        });
      } else {
        toast({
          title: "Sucesso",
          description: `Materiais e ${activeCategories.length} categorias criados com sucesso!`
        });
      }
    } catch (error) {
      console.error('Error inserting default materials:', error);
      toast({
        title: "Erro",
        description: "Erro ao inserir materiais padrão",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const maskBRL = (value: string) => {
    const onlyDigits = value.replace(/[^\d]/g, "");
    let numberValue = onlyDigits ? parseInt(onlyDigits, 10) : 0;
    const cents = numberValue % 100;
    const reais = Math.floor(numberValue / 100);
    return `R$ ${reais},${cents.toString().padStart(2, "0")}`;
  };
  const unmaskBRL = (maskedValue: string) => {
    const onlyDigits = maskedValue.replace(/[^\d]/g, "");
    if (!onlyDigits) return 0;
    return parseFloat((parseInt(onlyDigits, 10) / 100).toFixed(2));
  };
  const numberToMask = (value: number) => {
    if (!value && value !== 0) return maskBRL("");

    // Multiplica por 100 para converter para centavos e depois aplica a máscara
    const cents = Math.round(value * 100);
    const centString = cents.toString().padStart(1, "0");
    return maskBRL(centString);
  };
  const handleMaterialPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const masked = maskBRL(val);
    setMaterialPrice(masked);
  };
  const handleMaterialSalePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const masked = maskBRL(val);
    setMaterialSalePrice(masked);
  };
  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setMaterialName(material.name);
    setMaterialPrice(numberToMask(material.price));
    setMaterialSalePrice(numberToMask(material.salePrice ?? 0));
    setMaterialUnit(material.unit);
    setMaterialCategoryId(material.category_id || null);
    setOpenDialog(true);
  };
  const handleAddMaterial = () => {
    resetForm();
    setOpenDialog(true);
  };
  const handleSaveMaterial = async () => {
    if (isSubmitting) return; // Prevent double submission

    const price = unmaskBRL(materialPrice);
    const salePrice = unmaskBRL(materialSalePrice);
    const trimmedName = getDisplayName(materialName.trim());
    
    if (!materialName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do material é obrigatório",
        variant: "destructive"
      });
      return;
    }
    if (isNaN(price) || price < 0 || isNaN(salePrice) || salePrice < 0) {
      toast({
        title: "Erro",
        description: "Preços devem ser valores válidos e não negativos",
        variant: "destructive"
      });
      return;
    }
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar materiais.",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicates
    const excludeId = editingMaterial?.id;
    if (wouldCreateDuplicate(trimmedName, materials, excludeId)) {
      toast({
        title: "Material Duplicado",
        description: "Já existe um material com nome similar. Verifique os materiais existentes.",
        variant: "destructive"
      });
      return;
    }
    
    // If editing and name changed, check for stock and require confirmation
    if (editingMaterial && editingMaterial.name !== trimmedName) {
      const stock = await calculateMaterialStock(editingMaterial.name);
      
      if (stock > 0) {
        // Has stock - require confirmation to propagate name change
        setRenameConfirmModal({
          open: true,
          pendingMaterial: editingMaterial,
          oldName: editingMaterial.name,
          newName: trimmedName,
          pendingSaveData: { price, salePrice, unit: materialUnit, categoryId: materialCategoryId }
        });
        return; // Wait for confirmation
      }
    }
    
    // Continue with normal save
    await executeSaveMaterial(trimmedName, price, salePrice);
  };

  const executeSaveMaterial = async (name: string, price: number, salePrice: number, propagateName = false, oldName?: string) => {
    try {
      setIsSubmitting(true);
      setLoading(true);
      
      // If we need to propagate name change to order_items
      if (propagateName && oldName && user) {
        const { error: updateError } = await supabase
          .from('order_items')
          .update({ material_name: name })
          .eq('user_id', user.id)
          .eq('material_name', oldName);

        if (updateError) {
          console.error('Error propagating name:', updateError);
          throw new Error('Erro ao propagar alteração de nome');
        }
        
        toast({
          title: "Nome propagado",
          description: `Registros de "${oldName}" atualizados para "${name}".`,
        });
      }
      
      if (editingMaterial) {
        const updatedMaterial: Material = {
          ...editingMaterial,
          name,
          price,
          salePrice,
          unit: materialUnit,
          user_id: user!.id,
          category_id: materialCategoryId || undefined
        };
        console.log('Atualizando material:', updatedMaterial);
        await saveMaterial(updatedMaterial);
        toast({
          title: "Sucesso",
          description: "Material atualizado com sucesso"
        });
        
        // Complete onboarding sub-steps when editing
        if (isMaterialsTutorialActive) {
          if (price > 0) await completeSubStep(2, 'price-buy');
          if (salePrice > 0) await completeSubStep(2, 'price-sell');
        }
      } else {
        const newMaterial: Material = {
          id: crypto.randomUUID(),
          name,
          price,
          salePrice,
          unit: materialUnit,
          user_id: user!.id,
          category_id: materialCategoryId || undefined
        };
        console.log('Criando novo material:', newMaterial);
        await saveMaterial(newMaterial);
        toast({
          title: "Sucesso",
          description: "Material adicionado com sucesso"
        });
        
        // Complete onboarding sub-steps when adding
        if (isMaterialsTutorialActive) {
          await completeSubStep(2, 'add');
          if (price > 0) await completeSubStep(2, 'price-buy');
          if (salePrice > 0) await completeSubStep(2, 'price-sell');
        }
      }
      await loadMaterials();
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving material:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar material";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleRenameConfirmed = async () => {
    const { pendingMaterial, oldName, newName, pendingSaveData } = renameConfirmModal;
    setRenameConfirmModal({ open: false, pendingMaterial: null, oldName: '', newName: '', pendingSaveData: null });
    
    if (pendingMaterial && pendingSaveData) {
      // Temporarily set editing material for the save
      setEditingMaterial(pendingMaterial);
      setMaterialCategoryId(pendingSaveData.categoryId);
      setMaterialUnit(pendingSaveData.unit);
      await executeSaveMaterial(newName, pendingSaveData.price, pendingSaveData.salePrice, true, oldName);
    }
  };
  const resetForm = () => {
    setEditingMaterial(null);
    setMaterialName("");
    setMaterialPrice(maskBRL(""));
    setMaterialSalePrice(maskBRL(""));
    setMaterialUnit("kg");
    setMaterialCategoryId(null);
    setMaterialSuggestions([]);
    setShowDuplicateWarning(false);
  };

  // Handle material name changes and show suggestions
  const handleMaterialNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaterialName(value);
    
    if (value.trim().length > 2) {
      const matches = findMaterialMatches(value.trim(), materials);
      setMaterialSuggestions(matches.suggestions);
      
      const excludeId = editingMaterial?.id;
      const isDuplicate = wouldCreateDuplicate(value.trim(), materials, excludeId);
      setShowDuplicateWarning(isDuplicate);
    } else {
      setMaterialSuggestions([]);
      setShowDuplicateWarning(false);
    }
  };

  const selectSuggestion = (suggestion: MaterialSuggestion) => {
    handleEditMaterial(materials.find(m => m.id === suggestion.id)!);
    setMaterialSuggestions([]);
    setShowDuplicateWarning(false);
  };
  useEffect(() => {
    setMaterialPrice(prev => maskBRL(prev));
    setMaterialSalePrice(prev => maskBRL(prev));
  }, []);
  const handleDeleteMaterial = async (material: Material) => {
    // Check ONLY if material has stock - transactions are preserved with SET NULL
    const stock = await calculateMaterialStock(material.name);
    
    if (stock > 0) {
      // Block deletion - show modal with "Ver no Estoque" option
      setStockBlockModal({
        open: true,
        material,
        stockQuantity: stock
      });
    } else {
      // No stock - can delete (order_items preserved via FK SET NULL)
      setDeleteModal({
        open: true,
        material
      });
    }
  };

  const handleViewMaterialInStock = () => {
    const materialName = stockBlockModal.material?.name;
    setStockBlockModal({ open: false, material: null, stockQuantity: 0 });
    
    // Usar startTransition para evitar erro de Suspense com lazy loading
    startTransition(() => {
      navigate(`/current-stock?material=${encodeURIComponent(materialName || '')}`);
    });
  };

  const handleClearMaterialStock = () => {
    const materialName = stockBlockModal.material?.name || '';
    setStockBlockModal({ open: false, material: null, stockQuantity: 0 });
    setClearMaterialStockModal({ open: true, materialName });
  };

  const handleMaterialStockCleared = async () => {
    setClearMaterialStockModal({ open: false, materialName: '' });
    await loadMaterials();
    toast({
      title: "Estoque zerado",
      description: "Agora você pode excluir este material",
    });
  };

  const confirmDeleteMaterial = async () => {
    if (deleteModal.material) {
      try {
        setLoading(true);
        await removeMaterial(deleteModal.material.id);
        await loadMaterials();
        toast({
          title: "Material excluído",
          description: "O material foi removido com sucesso"
        });
      } catch (error) {
        console.error('Error deleting material:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir material",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    setDeleteModal({
      open: false,
      material: null
    });
  };
  const formatCurrency = (value: string) => {
    if (!value) return "R$ 0,00";
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "R$ 0,00";
    return numValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      e.preventDefault();
      handleSaveMaterial();
    }
  };
  const handleCardClick = (material: Material, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    handleEditMaterial(material);
  };
  // Auto-completar etapa 2 do onboarding quando houver ≥1 material com preço de compra E venda > 0
  const validMaterialsCount = materials.filter(
    (m) => Number(m.price) > 0 && Number(m.salePrice) > 0
  ).length;
  const hasAtLeastOneMaterial = materials.length > 0;
  const hasValidPrices = validMaterialsCount > 0;

  useEffect(() => {
    if (!isMaterialsTutorialActive) return;
    if (hasAtLeastOneMaterial) completeSubStep(2, 'add');
    if (hasValidPrices) {
      completeSubStep(2, 'price-buy');
      completeSubStep(2, 'price-sell');
    }
  }, [isMaterialsTutorialActive, hasAtLeastOneMaterial, hasValidPrices, completeSubStep]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-3 sm:p-4 md:p-6">
      {/* Onboarding Banner — Etapa 2 */}
      {isMaterialsTutorialActive && (
        <div className="max-w-7xl mx-auto mb-4">
          <OnboardingGuideBanner
            step={2}
            title="Cadastre seus materiais"
            subtitle="Você precisa de pelo menos 1 material com preço de compra e venda para abrir o caixa."
            instructions={[
              {
                text: 'Toque em "Materiais Padrão" para uma lista pronta, ou em "Adicionar" para criar manualmente',
                done: hasAtLeastOneMaterial,
              },
              {
                text: 'Toque em cada material para definir preço de compra (R$/kg) e preço de venda',
                done: hasValidPrices,
              },
              {
                text: 'Quando estiver pronto, toque em "Concluir e abrir caixa" abaixo',
                done: false,
              },
            ]}
            successMessage="Materiais prontos! Toque no botão verde abaixo para ir abrir o caixa."
            onSkip={skipOnboarding}
          />
          {hasValidPrices && (
            <Button
              onClick={async () => {
                await completeStep(2);
                requestOpenCashRegister();
                navigate('/pdv');
              }}
              className="w-full mt-3 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg"
            >
              Concluir e abrir caixa →
            </Button>
          )}
        </div>
      )}
      {/* Header */}
      <header className="flex items-center justify-between gap-3 mb-4" data-tutorial="materials-header">
        <div className="flex items-center gap-2.5">
          <Link to="/">
            <Button variant="outline" size="icon" className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 h-9 w-9 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-white">Materiais</h1>
              <ContextualHelpButton module="estoque" />
            </div>
            <p className="text-slate-500 text-xs">
              {filteredMaterials.length} {filteredMaterials.length === 1 ? 'material' : 'materiais'}
            </p>
          </div>
        </div>
        
        {/* Primary action - always visible */}
        <Button 
          onClick={handleAddMaterial} 
          className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 px-3 rounded-xl text-sm font-medium" 
          disabled={loading}
          data-tutorial="add-material-button"
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </header>

      {/* Secondary Actions - grid on mobile, row on desktop */}
      <div className="grid grid-cols-4 sm:flex sm:items-center gap-1.5 mb-3">
        <button 
          onClick={() => setConfigModal(true)} 
          disabled={loading}
          className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-[10px] sm:text-xs font-medium transition-colors active:scale-95 disabled:opacity-50"
          data-tutorial="config-button"
        >
          <Settings className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          <span>Config</span>
        </button>
        <button 
          onClick={() => setDuplicatesModal(true)} 
          disabled={loading || materials.length === 0}
          className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl bg-slate-800 border border-blue-500/30 text-blue-400 hover:bg-blue-500/15 text-[10px] sm:text-xs font-medium transition-colors active:scale-95 disabled:opacity-50"
        >
          <Merge className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          <span>Duplicatas</span>
        </button>
        <button 
          onClick={insertDefaultMaterials} 
          disabled={loading}
          className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 text-[10px] sm:text-xs font-medium transition-colors active:scale-95 disabled:opacity-50"
          data-tutorial="default-materials-button"
        >
          <Download className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          <span>Padrão</span>
        </button>
        <button 
          onClick={() => setDeleteAllModal(true)} 
          disabled={loading || materials.length === 0}
          className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl bg-slate-800 border border-red-500/30 text-red-400 hover:bg-red-500/15 text-[10px] sm:text-xs font-medium transition-colors active:scale-95 disabled:opacity-50"
        >
          <Trash className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          <span>Excluir</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input 
          type="text" 
          placeholder="Buscar material por nome..." 
          value={searchTerm} 
          onChange={handleSearchChange} 
          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-10 text-sm rounded-xl" 
          disabled={loading} 
        />
      </div>

      {/* Duplicate Alert */}
      {duplicatesDetected && (
        <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-200 flex items-center gap-2">
            <span>Detectamos {duplicatesCount} grupo(s) de materiais duplicados.</span>
            <Button 
              variant="link" 
              className="text-amber-400 p-0 h-auto hover:text-amber-300"
              onClick={() => setDuplicatesModal(true)}
            >
              Clique aqui para unificar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Materials Grid */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-2 sm:p-3">
          <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-260px)]">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-slate-400">Carregando materiais...</div>
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <p className="text-base">Nenhum material encontrado</p>
                <p className="text-sm mt-1">Adicione materiais ou use os materiais padrão</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
                {filteredMaterials.map((material, index) => (
                  <Card 
                    key={material.id} 
                    className="bg-slate-700 border-slate-600 relative group hover:bg-slate-600 hover:border-emerald-500/50 cursor-pointer transition-all duration-200"
                    onClick={e => handleCardClick(material, e)}
                    data-tutorial={index === 0 ? "material-card" : undefined}
                  >
                    {/* Delete Button */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-1 right-1 h-6 w-6 rounded-full text-slate-400 hover:text-white hover:bg-red-600 opacity-60 hover:opacity-100 z-10"
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteMaterial(material);
                      }} 
                      disabled={loading}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                    
                    <CardContent className="p-3 pt-6">
                      {/* Stock Indicator Badge */}
                      {materialsStock[material.name] > 0 && (
                        <div className="absolute top-1 left-1 z-10">
                          <Badge 
                            variant="secondary" 
                            className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0"
                          >
                            <Package className="h-2.5 w-2.5 mr-0.5" />
                            {materialsStock[material.name].toFixed(1)} kg
                          </Badge>
                        </div>
                      )}
                      
                      {/* Material Name */}
                      <h3 className="font-semibold text-sm sm:text-base text-white text-center leading-tight mb-2 truncate" title={material.name}>
                        {material.name}
                      </h3>
                      
                      {/* Prices with variation indicators */}
                      <div className="space-y-1 text-center">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-slate-400">Compra:</span>
                          <span className="flex items-center gap-1">
                            <span className="text-amber-400 font-medium">
                              {formatCurrency(material.price.toString())}/{material.unit}
                            </span>
                            {getPriceIndicator(material.price, material.previousPrice) && (
                              <span className={`${getPriceIndicator(material.price, material.previousPrice)!.color} text-xs font-bold`}>
                                {getPriceIndicator(material.price, material.previousPrice)!.symbol}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-slate-400">Venda:</span>
                          <span className="flex items-center gap-1">
                            <span className="text-emerald-400 font-semibold">
                              {formatCurrency(material.salePrice?.toString() || "0")}/{material.unit}
                            </span>
                            {getPriceIndicator(material.salePrice || 0, material.previousSalePrice) && (
                              <span className={`${getPriceIndicator(material.salePrice || 0, material.previousSalePrice)!.color} text-xs font-bold`}>
                                {getPriceIndicator(material.salePrice || 0, material.previousSalePrice)!.symbol}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {/* History button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-8 h-6 w-6 p-0 rounded-full text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 opacity-60 hover:opacity-100 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPriceHistoryModal({
                            open: true,
                            materialId: material.id,
                            materialName: material.name
                          });
                        }}
                        title="Ver histórico de preços"
                      >
                        <History className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white w-[95vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-white">
              {editingMaterial ? "Editar Material" : "Adicionar Material"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material-name" className="text-slate-300 text-sm">Nome do Material</Label>
                <Input 
                  id="material-name" 
                  value={materialName} 
                  onChange={handleMaterialNameChange} 
                  onKeyDown={handleKeyDown} 
                  disabled={loading || isSubmitting} 
                  className="bg-slate-700 border-slate-600 text-emerald-400 text-base sm:text-lg font-medium" 
                />
                
                {showDuplicateWarning && (
                  <Alert className="border-amber-500 bg-amber-500/10">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-amber-400 text-sm">
                      Material similar já existe. Verifique os materiais cadastrados.
                    </AlertDescription>
                  </Alert>
                )}
                
                {materialSuggestions.length > 0 && (
                  <div className="bg-slate-700 border border-slate-600 rounded-md p-2 space-y-1">
                    <p className="text-xs text-slate-400 mb-2">Materiais similares encontrados:</p>
                    {materialSuggestions.slice(0, 3).map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="flex items-center justify-between p-2 bg-slate-600 rounded cursor-pointer hover:bg-slate-500"
                        onClick={() => selectSuggestion(suggestion)}
                      >
                        <span className="text-sm text-white">{suggestion.name}</span>
                        <Badge variant="secondary" className="text-xs bg-slate-500">
                          {Math.round(suggestion.similarity * 100)}% similar
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-unit" className="text-slate-300 text-sm">Unidade</Label>
                <Input 
                  id="material-unit" 
                  value={materialUnit} 
                  onChange={e => setMaterialUnit(e.target.value)} 
                  className="bg-slate-700 border-slate-600 text-slate-400 text-base" 
                  disabled 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-price" className="text-slate-300 text-sm">Preço de Compra (R$)</Label>
                <Input 
                  id="material-price" 
                  value={materialPrice} 
                  onChange={handleMaterialPriceChange} 
                  inputMode="numeric" 
                  maxLength={15} 
                  onKeyDown={handleKeyDown} 
                  disabled={loading || isSubmitting} 
                  className="bg-slate-700 border-slate-600 text-amber-400 text-xl sm:text-2xl py-3 font-bold" 
                  data-tutorial="price-buy-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-sale-price" className="text-slate-300 text-sm">Preço de Venda (R$)</Label>
                <Input 
                  id="material-sale-price" 
                  value={materialSalePrice} 
                  onChange={handleMaterialSalePriceChange} 
                  inputMode="numeric" 
                  maxLength={15} 
                  onKeyDown={handleKeyDown} 
                  disabled={loading || isSubmitting} 
                  className="bg-slate-700 border-slate-600 text-emerald-400 text-xl sm:text-2xl py-3 font-bold" 
                  data-tutorial="price-sell-input"
                />
              </div>
            </div>
            
            {/* Category selector - Only show when categories are enabled */}
            {useCategoriesEnabled && categories.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label htmlFor="material-category" className="text-slate-300 text-sm">Categoria</Label>
                <Select
                  value={materialCategoryId || "none"}
                  onValueChange={(value) => setMaterialCategoryId(value === "none" ? null : value)}
                  disabled={loading || isSubmitting}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="none" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                      Nenhuma (sem categoria)
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem 
                        key={category.id} 
                        value={category.id}
                        className="text-slate-300 focus:bg-slate-700 focus:text-white"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            category.color === 'blue' ? 'bg-blue-600' :
                            category.color === 'purple' ? 'bg-purple-600' :
                            category.color === 'orange' ? 'bg-orange-500' :
                            category.color === 'red' ? 'bg-red-600' :
                            category.color === 'yellow' ? 'bg-yellow-500' :
                            category.color === 'pink' ? 'bg-pink-500' :
                            category.color === 'gray' ? 'bg-gray-500' :
                            category.color === 'brown' ? 'bg-amber-700' :
                            category.color === 'black' ? 'bg-gray-900' :
                            category.color === 'sky' ? 'bg-sky-400' : 'bg-blue-600'
                          }`} />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpenDialog(false)} 
              className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 w-full sm:w-auto order-2 sm:order-1" 
              disabled={loading || isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveMaterial} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white w-full sm:w-auto order-1 sm:order-2" 
              disabled={loading || isSubmitting}
              data-tutorial="save-material-button"
            >
              <Save className="mr-2 h-4 w-4" /> 
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteMaterialModal 
        open={deleteModal.open} 
        onClose={() => setDeleteModal({ open: false, material: null })} 
        onConfirm={confirmDeleteMaterial} 
        materialName={deleteModal.material?.name || ""} 
      />

      <MaterialConfigModal open={configModal} onClose={() => setConfigModal(false)} />

      <DeleteAllMaterialsModal
        open={deleteAllModal}
        onOpenChange={setDeleteAllModal}
        onMaterialsDeleted={loadMaterials}
        materialsCount={materials.length}
      />

      {/* Stock Block Modal */}
      <MaterialStockBlockModal
        open={stockBlockModal.open}
        onClose={() => setStockBlockModal({ open: false, material: null, stockQuantity: 0 })}
        materialName={stockBlockModal.material?.name || ''}
        stockQuantity={stockBlockModal.stockQuantity}
        onViewStock={handleViewMaterialInStock}
        onClearMaterialStock={handleClearMaterialStock}
      />

      {/* Clear Material Stock Modal */}
      <ClearMaterialStockModal
        open={clearMaterialStockModal.open}
        onClose={() => setClearMaterialStockModal({ open: false, materialName: '' })}
        materialName={clearMaterialStockModal.materialName}
        onStockCleared={handleMaterialStockCleared}
      />

      {/* Rename Confirmation Modal */}
      <RenameMaterialConfirmModal
        open={renameConfirmModal.open}
        onClose={() => setRenameConfirmModal({ open: false, pendingMaterial: null, oldName: '', newName: '', pendingSaveData: null })}
        oldName={renameConfirmModal.oldName}
        newName={renameConfirmModal.newName}
        onRenameConfirmed={handleRenameConfirmed}
      />

      {/* Materials Tutorial — substituído pelo banner instrucional no topo */}

      {/* Price History Modal */}
      <MaterialPriceHistoryModal
        open={priceHistoryModal.open}
        onOpenChange={(open) => setPriceHistoryModal(prev => ({ ...prev, open }))}
        materialId={priceHistoryModal.materialId}
        materialName={priceHistoryModal.materialName}
      />

      {/* Duplicate Materials Modal */}
      <DuplicateMaterialsModal
        open={duplicatesModal}
        onOpenChange={setDuplicatesModal}
        onConsolidated={loadMaterials}
      />
    </div>
    
  );
};

export default Materials;