
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface LandingContentSettings {
  id?: string;
  user_id: string;
  hero_badge_text: string;
  hero_main_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_button_text: string;
  logo_url: string;
  background_image_url: string;
  company_name: string;
  company_phone: string;
  footer_text: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
}

interface LandingContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: string;
  currentSettings?: Partial<LandingContentSettings>;
  onSettingsUpdated: () => void;
}

const LandingContentModal: React.FC<LandingContentModalProps> = ({
  isOpen,
  onClose,
  section,
  currentSettings,
  onSettingsUpdated
}) => {
  const [formData, setFormData] = useState<Partial<LandingContentSettings>>(currentSettings || {});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const settingsData = {
        user_id: user.id,
        ...formData
      };

      if (currentSettings?.id) {
        const { error } = await supabase
          .from('landing_page_settings' as any)
          .update(settingsData)
          .eq('id', currentSettings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('landing_page_settings' as any)
          .insert(settingsData);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso"
      });

      onSettingsUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof LandingContentSettings, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderFormFields = () => {
    switch (section) {
      case 'hero':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="hero_badge_text">Texto do Badge</Label>
              <Input
                id="hero_badge_text"
                value={formData.hero_badge_text || ''}
                onChange={(e) => handleInputChange('hero_badge_text', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_main_title">Título Principal</Label>
              <Textarea
                id="hero_main_title"
                value={formData.hero_main_title || ''}
                onChange={(e) => handleInputChange('hero_main_title', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_subtitle">Subtítulo</Label>
              <Textarea
                id="hero_subtitle"
                value={formData.hero_subtitle || ''}
                onChange={(e) => handleInputChange('hero_subtitle', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_description">Descrição</Label>
              <Textarea
                id="hero_description"
                value={formData.hero_description || ''}
                onChange={(e) => handleInputChange('hero_description', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_button_text">Texto do Botão</Label>
              <Input
                id="hero_button_text"
                value={formData.hero_button_text || ''}
                onChange={(e) => handleInputChange('hero_button_text', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </>
        );
      case 'branding':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input
                id="logo_url"
                value={formData.logo_url || ''}
                onChange={(e) => handleInputChange('logo_url', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="background_image_url">URL da Imagem de Fundo</Label>
              <Input
                id="background_image_url"
                value={formData.background_image_url || ''}
                onChange={(e) => handleInputChange('background_image_url', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da Empresa</Label>
              <Input
                id="company_name"
                value={formData.company_name || ''}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </>
        );
      case 'footer':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="footer_text">Texto do Footer</Label>
              <Textarea
                id="footer_text"
                value={formData.footer_text || ''}
                onChange={(e) => handleInputChange('footer_text', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_phone">Telefone da Empresa</Label>
              <Input
                id="company_phone"
                value={formData.company_phone || ''}
                onChange={(e) => handleInputChange('company_phone', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </>
        );
      case 'seo':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="seo_title">Título SEO</Label>
              <Input
                id="seo_title"
                value={formData.seo_title || ''}
                onChange={(e) => handleInputChange('seo_title', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_description">Descrição SEO</Label>
              <Textarea
                id="seo_description"
                value={formData.seo_description || ''}
                onChange={(e) => handleInputChange('seo_description', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_keywords">Palavras-chave SEO</Label>
              <Input
                id="seo_keywords"
                value={formData.seo_keywords || ''}
                onChange={(e) => handleInputChange('seo_keywords', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Editar {section}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {renderFormFields()}

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LandingContentModal;
