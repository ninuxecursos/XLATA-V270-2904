import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollCTAProps {
  text: string;
  targetSection: string;
  variant?: 'primary' | 'secondary' | 'subtle' | 'final';
  subtext?: string;
  className?: string;
}

export const ScrollCTA: React.FC<ScrollCTAProps> = ({
  text,
  targetSection,
  variant = 'subtle',
  subtext,
  className
}) => {
  const scrollToSection = () => {
    const element = document.getElementById(targetSection);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  const variants = {
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold',
    secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-3',
    subtle: 'bg-transparent hover:bg-white/5 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-5 py-2.5',
    final: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-10 py-5 text-xl font-bold shadow-lg shadow-green-500/25'
  };
  
  return (
    <div className={cn('text-center py-6', className)}>
      <Button
        onClick={scrollToSection}
        className={cn(
          'rounded-full transition-all duration-300 group',
          variants[variant]
        )}
      >
        {text}
        {variant === 'final' ? (
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        ) : (
          <ChevronDown className="ml-2 h-4 w-4 animate-bounce" />
        )}
      </Button>
      {subtext && (
        <p className="text-gray-500 text-xs mt-3">{subtext}</p>
      )}
    </div>
  );
};
