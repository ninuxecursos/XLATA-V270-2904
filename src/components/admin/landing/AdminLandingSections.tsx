import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableSectionItem } from './SortableSectionItem';

interface SectionItem {
  id: string;
  section_key: string;
  title: string;
  subtitle: string | null;
  is_visible: boolean;
  display_order: number;
}

export function AdminLandingSections() {
  const queryClient = useQueryClient();
  const [localSections, setLocalSections] = useState<SectionItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['admin-landing-sections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('landing_sections').select('*').order('display_order');
      if (error) throw error;
      return data as SectionItem[];
    },
  });

  useEffect(() => {
    if (sections.length > 0) {
      setLocalSections(sections);
      setHasChanges(false);
    }
  }, [sections]);

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase.from('landing_sections').update({ is_visible }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-sections'] });
      queryClient.invalidateQueries({ queryKey: ['landing-sections'] });
      toast.success('Visibilidade atualizada!');
      window.dispatchEvent(new CustomEvent('landingConfigUpdated'));
    },
    onError: () => toast.error('Erro ao atualizar'),
  });

  const saveOrderMutation = useMutation({
    mutationFn: async (orderedSections: SectionItem[]) => {
      const updates = orderedSections.map((section, index) => ({
        id: section.id,
        display_order: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('landing_sections')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-sections'] });
      queryClient.invalidateQueries({ queryKey: ['landing-sections'] });
      toast.success('Ordem das seções salva!');
      setHasChanges(false);
      window.dispatchEvent(new CustomEvent('landingConfigUpdated'));
    },
    onError: () => toast.error('Erro ao salvar ordem'),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localSections.findIndex((item) => item.id === active.id);
      const newIndex = localSections.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(localSections, oldIndex, newIndex);
      setLocalSections(newOrder);
      setHasChanges(true);
    }
  };

  const handleToggleVisibility = (id: string, checked: boolean) => {
    toggleMutation.mutate({ id, is_visible: checked });
    setLocalSections(prev =>
      prev.map(s => s.id === id ? { ...s, is_visible: checked } : s)
    );
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Controle de Seções</h3>
          <p className="text-slate-400 text-sm">Arraste para reordenar. Ative ou desative seções da landing page.</p>
        </div>
        {hasChanges && (
          <Button
            onClick={() => saveOrderMutation.mutate(localSections)}
            disabled={saveOrderMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saveOrderMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Ordem
          </Button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localSections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {localSections.map((section) => (
              <SortableSectionItem
                key={section.id}
                section={section}
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <p className="text-slate-400 text-sm">
          💡 <strong>Dica:</strong> Arraste as seções para reordenar. A seção "Hero" é essencial e não pode ser desativada.
          Clique em "Salvar Ordem" após reordenar.
        </p>
      </div>
    </div>
  );
}
