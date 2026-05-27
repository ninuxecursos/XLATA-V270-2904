import React, { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface WordCountIndicatorProps {
  content: string;
  minWords?: number;
  idealWords?: number;
}

export const WordCountIndicator: React.FC<WordCountIndicatorProps> = ({
  content,
  minWords = 400,
  idealWords = 1200
}) => {
  const wordCount = useMemo(() => {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  const percentage = Math.min((wordCount / idealWords) * 100, 100);

  const getStatus = () => {
    if (wordCount < minWords) return 'error';
    if (wordCount < 1000) return 'warning';
    if (wordCount < idealWords) return 'good';
    return 'excellent';
  };

  const status = getStatus();

  const getStatusConfig = () => {
    switch (status) {
      case 'error':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          progressColor: '[&>div]:bg-red-500',
          icon: XCircle,
          message: `Mínimo: ${minWords} palavras`
        };
      case 'warning':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          progressColor: '[&>div]:bg-yellow-500',
          icon: AlertTriangle,
          message: `Bom, mas ideal: ${idealWords}+ palavras`
        };
      case 'good':
        return {
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          progressColor: '[&>div]:bg-emerald-500',
          icon: CheckCircle2,
          message: 'Muito bom! Quase no ideal'
        };
      case 'excellent':
        return {
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          progressColor: '[&>div]:bg-emerald-600',
          icon: CheckCircle2,
          message: 'Excelente para SEO! ✓'
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className={cn("rounded-md p-3 space-y-2", config.bgColor)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("h-4 w-4", config.color)} />
          <span className={cn("text-sm font-medium", config.color)}>
            {wordCount.toLocaleString()} palavras
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {Math.round(percentage)}% do ideal
        </span>
      </div>
      
      <Progress 
        value={percentage} 
        className={cn("h-2", config.progressColor)} 
      />
      
      <p className={cn("text-xs", config.color)}>
        {config.message}
      </p>
    </div>
  );
};

export default WordCountIndicator;
