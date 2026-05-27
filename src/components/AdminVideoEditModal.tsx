
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface GuideVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: string;
  category: string;
  difficulty: string;
  order_position: number;
  is_active: boolean;
  youtube_video_id?: string;
  cover_image_url?: string;
}

interface AdminVideoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: GuideVideo | null;
  onVideoUpdated: () => void;
}

const AdminVideoEditModal: React.FC<AdminVideoEditModalProps> = ({
  isOpen,
  onClose,
  video,
  onVideoUpdated
}) => {
  const [formData, setFormData] = useState<Partial<GuideVideo>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (video) {
      setFormData(video);
    } else {
      setFormData({
        title: '',
        description: '',
        video_url: '',
        thumbnail_url: '',
        duration: '',
        category: 'Geral',
        difficulty: 'Iniciante',
        order_position: 0,
        is_active: true
      });
    }
  }, [video]);

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleSave = async () => {
    if (!formData.title || !formData.video_url) {
      toast({
        title: "Erro",
        description: "Título e URL do vídeo são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      const youtubeId = extractYouTubeId(formData.video_url || '');
      
      const videoData = {
        title: formData.title,
        description: formData.description || '',
        video_url: formData.video_url,
        thumbnail_url: formData.thumbnail_url || '',
        duration: formData.duration || '',
        category: formData.category || 'Geral',
        difficulty: formData.difficulty || 'Iniciante',
        order_position: Number(formData.order_position) || 0,
        is_active: formData.is_active !== false,
        youtube_video_id: youtubeId,
        cover_image_url: formData.cover_image_url || null
      };

      if (video?.id) {
        // Atualizar vídeo existente
        const { error } = await supabase
          .from('guide_videos')
          .update(videoData)
          .eq('id', video.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Vídeo atualizado com sucesso"
        });
      } else {
        // Criar novo vídeo
        const { error } = await supabase
          .from('guide_videos')
          .insert(videoData);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Vídeo criado com sucesso"
        });
      }

      onVideoUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar vídeo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar vídeo",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof GuideVideo, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {video ? 'Editar Vídeo' : 'Adicionar Novo Vídeo'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="Digite o título do vídeo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white min-h-[80px]"
              placeholder="Digite a descrição do vídeo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">URL do Vídeo (YouTube) *</Label>
            <Input
              id="video_url"
              value={formData.video_url || ''}
              onChange={(e) => handleInputChange('video_url', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">URL da Thumbnail</Label>
            <Input
              id="thumbnail_url"
              value={formData.thumbnail_url || ''}
              onChange={(e) => handleInputChange('thumbnail_url', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover_image_url">URL da Imagem de Capa</Label>
            <Input
              id="cover_image_url"
              value={formData.cover_image_url || ''}
              onChange={(e) => handleInputChange('cover_image_url', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="https://exemplo.com/capa.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração</Label>
              <Input
                id="duration"
                value={formData.duration || ''}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="10:30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_position">Posição</Label>
              <Input
                id="order_position"
                type="number"
                value={formData.order_position || 0}
                onChange={(e) => handleInputChange('order_position', parseInt(e.target.value))}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category || 'Geral'}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="Geral">Geral</SelectItem>
                  <SelectItem value="PDV">PDV</SelectItem>
                  <SelectItem value="Configuração">Configuração</SelectItem>
                  <SelectItem value="Avançado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificuldade</Label>
              <Select
                value={formData.difficulty || 'Iniciante'}
                onValueChange={(value) => handleInputChange('difficulty', value)}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="Iniciante">Iniciante</SelectItem>
                  <SelectItem value="Intermediário">Intermediário</SelectItem>
                  <SelectItem value="Avançado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active !== false}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="rounded bg-gray-800 border-gray-600"
            />
            <Label htmlFor="is_active">Vídeo ativo</Label>
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
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminVideoEditModal;
