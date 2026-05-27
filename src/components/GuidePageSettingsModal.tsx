
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface GuidePageSettings {
  id?: string;
  user_id: string;
  badge_text: string;
  main_title: string;
  subtitle: string;
  feature1_title: string;
  feature1_subtitle: string;
  feature2_title: string;
  feature2_subtitle: string;
  feature3_title: string;
  feature3_subtitle: string;
  cta_title: string;
  cta_subtitle: string;
  cta_button_text: string;
}

interface GuidePageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated: () => void;
  currentSettings?: GuidePageSettings;
}

const GuidePageSettingsModal: React.FC<GuidePageSettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated,
  currentSettings
}) => {
  const [formData, setFormData] = useState<Partial<GuidePageSettings>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setFormData(currentSettings);
    } else {
      // Valores padrão
      setFormData({
        badge_text: 'GUIA COMPLETO EXCLUSIVO',
        main_title: 'Aprenda a Dominar o Sistema PDV',
        subtitle: 'Vídeos tutoriais exclusivos para você se tornar um expert no sistema',
        feature1_title: 'Vídeos Exclusivos',
        feature1_subtitle: 'Conteúdo completo e detalhado',
        feature2_title: 'Conteúdo Premium',
        feature2_subtitle: 'Aprenda no seu ritmo',
        feature3_title: 'Acesso Vitalício',
        feature3_subtitle: 'Reveja quantas vezes quiser',
        cta_title: 'Pronto para Começar?',
        cta_subtitle: 'Acesse o sistema completo e comece a transformar seu ferro velho hoje mesmo',
        cta_button_text: 'ACESSAR SISTEMA COMPLETO'
      });
    }
  }, [currentSettings]);

  const handleSave = async () => {
    if (!formData.badge_text || !formData.main_title) {
      toast({
        title: "Erro",
        description: "Badge e título principal são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const settingsData = {
        user_id: user.id,
        badge_text: formData.badge_text || '',
        main_title: formData.main_title || '',
        subtitle: formData.subtitle || '',
        feature1_title: formData.feature1_title || '',
        feature1_subtitle: formData.feature1_subtitle || '',
        feature2_title: formData.feature2_title || '',
        feature2_subtitle: formData.feature2_subtitle || '',
        feature3_title: formData.feature3_title || '',
        feature3_subtitle: formData.feature3_subtitle || '',
        cta_title: formData.cta_title || '',
        cta_subtitle: formData.cta_subtitle || '',
        cta_button_text: formData.cta_button_text || ''
      };

      if (currentSettings?.id) {
        // Atualizar configurações existentes
        const { error } = await supabase
          .from('guide_page_settings')
          .update(settingsData)
          .eq('id', currentSettings.id);

        if (error) throw error;
      } else {
        // Criar novas configurações
        const { error } = await supabase
          .from('guide_page_settings')
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

  const handleInputChange = (field: keyof GuidePageSettings, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-gray-900 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações da Página do Guia</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Badge e Títulos Principais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-400">Seção Principal</h3>
            
            <div className="space-y-2">
              <Label htmlFor="badge_text">Badge Principal *</Label>
              <Input
                id="badge_text"
                value={formData.badge_text || ''}
                onChange={(e) => handleInputChange('badge_text', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="GUIA COMPLETO EXCLUSIVO"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="main_title">Título Principal *</Label>
              <Input
                id="main_title"
                value={formData.main_title || ''}
                onChange={(e) => handleInputChange('main_title', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Aprenda a Dominar o Sistema PDV"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle || ''}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Vídeos tutoriais exclusivos para você se tornar um expert no sistema"
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-400">Recursos em Destaque</h3>
            
            {/* Feature 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feature1_title">Recurso 1 - Título</Label>
                <Input
                  id="feature1_title"
                  value={formData.feature1_title || ''}
                  onChange={(e) => handleInputChange('feature1_title', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Vídeos Exclusivos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feature1_subtitle">Recurso 1 - Subtítulo</Label>
                <Input
                  id="feature1_subtitle"
                  value={formData.feature1_subtitle || ''}
                  onChange={(e) => handleInputChange('feature1_subtitle', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Conteúdo completo e detalhado"
                />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feature2_title">Recurso 2 - Título</Label>
                <Input
                  id="feature2_title"
                  value={formData.feature2_title || ''}
                  onChange={(e) => handleInputChange('feature2_title', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Conteúdo Premium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feature2_subtitle">Recurso 2 - Subtítulo</Label>
                <Input
                  id="feature2_subtitle"
                  value={formData.feature2_subtitle || ''}
                  onChange={(e) => handleInputChange('feature2_subtitle', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Aprenda no seu ritmo"
                />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feature3_title">Recurso 3 - Título</Label>
                <Input
                  id="feature3_title"
                  value={formData.feature3_title || ''}
                  onChange={(e) => handleInputChange('feature3_title', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Acesso Vitalício"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feature3_subtitle">Recurso 3 - Subtítulo</Label>
                <Input
                  id="feature3_subtitle"
                  value={formData.feature3_subtitle || ''}
                  onChange={(e) => handleInputChange('feature3_subtitle', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Reveja quantas vezes quiser"
                />
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-400">Seção de Chamada para Ação</h3>
            
            <div className="space-y-2">
              <Label htmlFor="cta_title">Título do CTA</Label>
              <Input
                id="cta_title"
                value={formData.cta_title || ''}
                onChange={(e) => handleInputChange('cta_title', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Pronto para Começar?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta_subtitle">Subtítulo do CTA</Label>
              <Textarea
                id="cta_subtitle"
                value={formData.cta_subtitle || ''}
                onChange={(e) => handleInputChange('cta_subtitle', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Acesse o sistema completo e comece a transformar seu ferro velho hoje mesmo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta_button_text">Texto do Botão</Label>
              <Input
                id="cta_button_text"
                value={formData.cta_button_text || ''}
                onChange={(e) => handleInputChange('cta_button_text', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="ACESSAR SISTEMA COMPLETO"
              />
            </div>
          </div>

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
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuidePageSettingsModal;
