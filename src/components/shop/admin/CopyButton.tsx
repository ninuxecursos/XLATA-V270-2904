import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  value: string | number | null | undefined;
  label?: string;
  className?: string;
  size?: 'xs' | 'sm';
}

export function CopyButton({ value, label, className, size = 'xs' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const text = value === null || value === undefined ? '' : String(value);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!text.trim()) {
      toast.info('Campo vazio');
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success(label ? `${label} copiado` : 'Copiado');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Falha ao copiar');
    }
  };

  const sizeClasses = size === 'xs' ? 'h-6 w-6' : 'h-7 w-7';

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={handleCopy}
      title={label ? `Copiar ${label}` : 'Copiar'}
      className={cn(sizeClasses, 'shrink-0 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50', className)}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );
}
