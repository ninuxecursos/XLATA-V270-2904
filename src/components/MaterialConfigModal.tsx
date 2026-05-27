
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Save, FolderOpen, Settings2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getUserMaterialSettings, updateUserMaterialSettings } from '@/utils/supabaseStorage';
import CategoryManagementModal from './CategoryManagementModal';

interface MaterialConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export interface MaterialDisplayConfig {
  fontSize: 'small' | 'medium' | 'large';
  showPricePerKg: boolean;
}

const fontSizeClass = "text-[130%]"; // +30% no texto

const MaterialConfigModal: React.FC<MaterialConfigModalProps> = ({ open, onClose }) => {
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showPricePerKg, setShowPricePerKg] = useState<boolean>(true);
  const [useCategories, setUseCategories] = useState<boolean>(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  useEffect(() => {
    if (open) {
      // Load saved configuration from localStorage
      const savedConfig = localStorage.getItem('material_display_config');
      if (savedConfig) {
        const config: MaterialDisplayConfig = JSON.parse(savedConfig);
        setFontSize(config.fontSize);
        setShowPricePerKg(config.showPricePerKg);
      }

      // Load category settings from database
      loadCategorySettings();
    }
  }, [open]);

  const loadCategorySettings = async () => {
    setIsLoadingSettings(true);
    try {
      const settings = await getUserMaterialSettings();
      if (settings) {
        setUseCategories(settings.use_categories);
      }
    } catch (error) {
      console.error('Error loading category settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSave = async () => {
    // Save display config to localStorage
    const config: MaterialDisplayConfig = {
      fontSize,
      showPricePerKg
    };
    localStorage.setItem('material_display_config', JSON.stringify(config));

    // Save category setting to database
    try {
      await updateUserMaterialSettings(useCategories);
    } catch (error) {
      console.error('Error saving category settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração de categorias",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Configurações salvas",
      description: "As configurações dos materiais foram atualizadas",
    });

    // Trigger a page refresh to apply changes immediately
    window.location.reload();
  };

  const handleCategoriesChanged = () => {
    // Could refresh data here if needed
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-[#202020] border-gray-700 text-white max-w-xl min-h-[500px]">
          <DialogHeader>
            <DialogTitle className={`text-center ${fontSizeClass}`}>Configurações dos Materiais</DialogTitle>
            <DialogDescription className="text-gray-400 text-center">
              Personalize a exibição dos materiais na tela principal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Font size settings */}
            <div className="space-y-3">
              <Label className={`text-white text-base ${fontSizeClass}`}>Tamanho da fonte do nome do material:</Label>
              <RadioGroup value={fontSize} onValueChange={(value: 'small' | 'medium' | 'large') => setFontSize(value)}>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="small" id="small" className="border-green-500 text-green-500" />
                    <Label htmlFor="small" className={`text-white ${fontSizeClass}`}>Pequeno</Label>
                  </div>
                  <div className="text-white text-xs">Material Exemplo</div>
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" className="border-green-500 text-green-500" />
                    <Label htmlFor="medium" className={`text-white ${fontSizeClass}`}>Médio</Label>
                  </div>
                  <div className="text-white text-sm">Material Exemplo</div>
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="large" id="large" className="border-green-500 text-green-500" />
                    <Label htmlFor="large" className={`text-white ${fontSizeClass}`}>Grande</Label>
                  </div>
                  <div className="text-white text-lg">Material Exemplo</div>
                </div>
              </RadioGroup>
            </div>

            {/* Show price toggle */}
            <div className="flex items-center justify-between">
              <Label className={`text-white text-base ${fontSizeClass}`}>Exibir valor por kg:</Label>
              <Switch
                checked={showPricePerKg}
                onCheckedChange={setShowPricePerKg}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-600 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <FolderOpen className="w-5 h-5 text-emerald-400" />
                <span className={`text-white font-semibold ${fontSizeClass}`}>Categorias de Materiais</span>
              </div>

              {/* Categories toggle */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <Label className="text-white text-sm">Usar categorias de materiais:</Label>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {useCategories 
                      ? "Materiais serão organizados por categoria no PDV" 
                      : "Grid único de materiais (padrão)"}
                  </p>
                </div>
                <Switch
                  checked={useCategories}
                  onCheckedChange={setUseCategories}
                  disabled={isLoadingSettings}
                />
              </div>

              {/* Category management button - only shown when categories are enabled */}
              {useCategories && (
                <Button
                  variant="outline"
                  onClick={() => setShowCategoryManagement(true)}
                  className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  Gerenciar Categorias
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              className={`text-black bg-white hover:bg-gray-100 ${fontSizeClass}`}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className={`bg-pdv-green hover:bg-pdv-green/90 ${fontSizeClass}`}
            >
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Management Modal */}
      <CategoryManagementModal
        open={showCategoryManagement}
        onClose={() => setShowCategoryManagement(false)}
        onCategoriesChanged={handleCategoriesChanged}
      />
    </>
  );
};

export default MaterialConfigModal;
