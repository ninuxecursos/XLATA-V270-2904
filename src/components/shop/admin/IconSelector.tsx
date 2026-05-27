import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

interface IconSelectorProps {
  value: string;
  onChange: (icon: string) => void;
}

// Common icons for categories/products
const POPULAR_ICONS = [
  'folder', 'tag', 'box', 'package', 'shopping-bag', 'shopping-cart', 'store',
  'gift', 'heart', 'star', 'sparkles', 'zap', 'flame', 'sun', 'moon',
  'car', 'bike', 'truck', 'plane', 'home', 'building', 'factory',
  'smartphone', 'laptop', 'monitor', 'camera', 'headphones', 'speaker', 'tv',
  'shirt', 'watch', 'glasses', 'scissors', 'wrench', 'hammer', 'paintbrush',
  'book', 'bookmark', 'file', 'folder-open', 'archive', 'database',
  'music', 'gamepad-2', 'trophy', 'medal', 'crown', 'diamond',
  'leaf', 'flower', 'tree', 'mountain', 'waves', 'droplet',
  'coffee', 'utensils', 'wine', 'pizza', 'cake', 'cookie',
  'dog', 'cat', 'fish', 'bird', 'bug', 'paw-print',
  'baby', 'users', 'user', 'briefcase', 'graduation-cap', 'stethoscope',
  'dumbbell', 'football', 'basketball', 'tennis-ball', 'target',
  'palette', 'brush', 'pen', 'pencil', 'ruler', 'compass',
  'key', 'lock', 'shield', 'check-circle', 'award', 'badge-check'
];

const getIconComponent = (iconName: string): React.ComponentType<{ className?: string }> | undefined => {
  const pascalCase = iconName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  return icons[pascalCase];
};

export function IconSelector({ value, onChange }: IconSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = search
    ? POPULAR_ICONS.filter(icon => icon.includes(search.toLowerCase()))
    : POPULAR_ICONS;

  const SelectedIcon = getIconComponent(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full mt-1 justify-between bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            {SelectedIcon && <SelectedIcon className="w-4 h-4 text-gray-600" />}
            <span className="text-sm text-gray-700">{value}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2 bg-white" align="start">
        <Input
          placeholder="Buscar ícone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-9 bg-white text-gray-900 border-gray-300 placeholder:text-gray-400"
        />
        <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
          {filteredIcons.map((iconName) => {
            const IconComponent = getIconComponent(iconName);
            if (!IconComponent) return null;
            
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => {
                  onChange(iconName);
                  setOpen(false);
                }}
                className={cn(
                  "p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center",
                  value === iconName && "bg-emerald-100 text-emerald-600"
                )}
                title={iconName}
              >
                <IconComponent className="w-4 h-4" />
              </button>
            );
          })}
        </div>
        {filteredIcons.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-4">Nenhum ícone encontrado</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
