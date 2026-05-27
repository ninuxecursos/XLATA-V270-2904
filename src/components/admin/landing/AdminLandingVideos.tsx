import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VideoUploader } from '@/components/ui/VideoUploader';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Loader2, Play, LayoutGrid } from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  video_file_url: string | null;
  video_type: 'url' | 'upload';
  column_position: number;
  thumbnail_url: string | null;
  duration: string | null;
  is_active: boolean;
  display_order: number;
}

export function AdminLandingVideos() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<VideoItem | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-landing-videos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('landing_videos').select('*').order('display_order');
      if (error) throw error;
      return data as VideoItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<VideoItem>) => {
      const saveData = {
        title: item.title,
        description: item.description,
        video_url: item.video_url || '',
        video_file_url: item.video_file_url,
        video_type: item.video_type || 'url',
        column_position: item.column_position || 2,
        thumbnail_url: item.thumbnail_url,
        duration: item.duration,
        is_active: item.is_active,
        display_order: item.display_order || items.length + 1,
      };

      if (item.id) {
        const { error } = await supabase.from('landing_videos').update(saveData).eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('landing_videos').insert(saveData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-videos'] });
      queryClient.invalidateQueries({ queryKey: ['landing-videos'] });
      toast.success('Salvo!');
      setEditingItem(null);
    },
    onError: (err: any) => toast.error('Erro ao salvar: ' + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('landing_videos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-videos'] });
      queryClient.invalidateQueries({ queryKey: ['landing-videos'] });
      toast.success('Removido!');
    },
  });

  const handleNew = () => {
    setEditingItem({
      id: '',
      title: '',
      description: null,
      video_url: '',
      video_file_url: null,
      video_type: 'url',
      column_position: 2,
      thumbnail_url: null,
      duration: null,
      is_active: true,
      display_order: items.length + 1,
    });
  };

  const handleVideoChange = (url: string | null, type: 'url' | 'upload') => {
    if (!editingItem) return;
    
    if (type === 'url') {
      setEditingItem({
        ...editingItem,
        video_type: 'url',
        video_url: url || '',
        video_file_url: null,
      });
    } else {
      setEditingItem({
        ...editingItem,
        video_type: 'upload',
        video_file_url: url,
        video_url: '',
      });
    }
  };

  const getColumnLabel = (pos: number) => {
    switch (pos) {
      case 1: return 'Esquerda';
      case 2: return 'Centro';
      case 3: return 'Direita';
      default: return 'Centro';
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Vídeos Demonstrativos</h3>
        <Button onClick={handleNew} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className={`bg-slate-800 border-slate-700 ${!item.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="p-4">
              <div className="aspect-video bg-slate-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                ) : item.video_file_url ? (
                  <video src={item.video_file_url} className="w-full h-full object-cover" />
                ) : (
                  <Play className="w-12 h-12 text-slate-500" />
                )}
              </div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white truncate">{item.title}</h4>
                <Switch checked={item.is_active} onCheckedChange={() => saveMutation.mutate({ id: item.id, is_active: !item.is_active })} />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                {item.duration && <span>{item.duration}</span>}
                <span className="flex items-center gap-1">
                  <LayoutGrid className="w-3 h-3" />
                  Col {item.column_position || 2}
                </span>
                <span className="capitalize">{item.video_type || 'url'}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>Editar</Button>
                <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingItem && (
        <Card className="bg-slate-800 border-emerald-500">
          <CardHeader><CardTitle className="text-white">{editingItem.id ? 'Editar' : 'Novo'} Vídeo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Título</label>
                <Input value={editingItem.title} onChange={(e) => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)} placeholder="Como Pesar Materiais" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Duração (opcional)</label>
                <Input value={editingItem.duration || ''} onChange={(e) => setEditingItem(prev => prev ? { ...prev, duration: e.target.value } : null)} placeholder="2:30" className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>

            {/* Posição da coluna em desktop */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                Posição em Desktop
              </label>
              <Select 
                value={String(editingItem.column_position || 2)} 
                onValueChange={(val) => setEditingItem(prev => prev ? { ...prev, column_position: parseInt(val) } : null)}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Coluna 1 (Esquerda)</SelectItem>
                  <SelectItem value="2">Coluna 2 (Centro)</SelectItem>
                  <SelectItem value="3">Coluna 3 (Direita)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Em mobile ou com apenas 1 vídeo, será centralizado automaticamente.</p>
            </div>

            {/* Upload ou URL de vídeo */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Vídeo</label>
              <VideoUploader
                value={editingItem.video_type === 'upload' ? editingItem.video_file_url : editingItem.video_url}
                videoType={editingItem.video_type || 'url'}
                onChange={handleVideoChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Descrição (opcional)</label>
              <Textarea value={editingItem.description || ''} onChange={(e) => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)} className="bg-slate-700 border-slate-600 text-white" rows={2} />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">URL da Thumbnail (opcional)</label>
              <Input value={editingItem.thumbnail_url || ''} onChange={(e) => setEditingItem(prev => prev ? { ...prev, thumbnail_url: e.target.value } : null)} placeholder="https://..." className="bg-slate-700 border-slate-600 text-white" />
              <p className="text-xs text-slate-500">Se usar YouTube, a thumbnail é gerada automaticamente.</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => saveMutation.mutate(editingItem)} disabled={saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar
              </Button>
              <Button variant="outline" onClick={() => setEditingItem(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
