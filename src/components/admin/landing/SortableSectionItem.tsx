import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { GripVertical, Eye, EyeOff } from 'lucide-react';

interface SectionItem {
  id: string;
  section_key: string;
  title: string;
  subtitle: string | null;
  is_visible: boolean;
  display_order: number;
}

const sectionIcons: Record<string, string> = {
  hero: '🎯',
  how_it_works: '⚙️',
  requirements: '✅',
  problems: '⚠️',
  kpis: '📈',
  videos: '🎬',
  testimonials: '💬',
  plans: '💳',
  faq: '❓',
  cta_final: '🚀',
};

interface SortableSectionItemProps {
  section: SectionItem;
  onToggleVisibility: (id: string, isVisible: boolean) => void;
}

export function SortableSectionItem({ section, onToggleVisibility }: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`bg-slate-800 border-slate-700 ${!section.is_visible ? 'opacity-50' : ''} ${isDragging ? 'shadow-lg shadow-emerald-500/20' : ''}`}>
        <CardContent className="p-4 flex items-center gap-4">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="w-5 h-5 text-slate-500 hover:text-emerald-400 transition-colors" />
          </div>
          
          <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-2xl">
            {sectionIcons[section.section_key] || '📄'}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-white">{section.title}</h4>
              <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">
                {section.section_key}
              </span>
            </div>
            {section.subtitle && (
              <p className="text-sm text-slate-400">{section.subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {section.is_visible ? (
              <Eye className="w-5 h-5 text-emerald-400" />
            ) : (
              <EyeOff className="w-5 h-5 text-slate-500" />
            )}
            <Switch
              checked={section.is_visible}
              onCheckedChange={(checked) => onToggleVisibility(section.id, checked)}
              disabled={section.section_key === 'hero'} // Hero cannot be disabled
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
