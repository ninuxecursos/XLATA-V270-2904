 import React from 'react';
 import { cn } from '@/lib/utils';
 import { LucideIcon } from 'lucide-react';
 import { Button } from './button';
 
 export interface EmptyStateProps {
   icon?: LucideIcon;
   title: string;
   description?: string;
   action?: {
     label: string;
     onClick: () => void;
   };
   secondaryAction?: {
     label: string;
     onClick: () => void;
   };
   className?: string;
   variant?: 'default' | 'compact' | 'large';
 }
 
 export function EmptyState({
   icon: Icon,
   title,
   description,
   action,
   secondaryAction,
   className,
   variant = 'default',
 }: EmptyStateProps) {
   const sizes = {
     default: {
       container: 'py-12 px-6',
       icon: 'w-14 h-14 mb-4',
       iconWrapper: 'w-20 h-20 mb-5',
       title: 'text-lg font-semibold',
       description: 'text-sm max-w-xs',
     },
     compact: {
       container: 'py-8 px-4',
       icon: 'w-10 h-10',
       iconWrapper: 'w-14 h-14 mb-3',
       title: 'text-base font-medium',
       description: 'text-sm max-w-[280px]',
     },
     large: {
       container: 'py-16 px-8',
       icon: 'w-20 h-20',
       iconWrapper: 'w-28 h-28 mb-6',
       title: 'text-xl font-bold',
       description: 'text-base max-w-sm',
     },
   };
 
   const s = sizes[variant];
 
   return (
     <div className={cn(
       "flex flex-col items-center justify-center text-center",
       s.container,
       className
     )}>
       {Icon && (
         <div className={cn(
           "flex items-center justify-center rounded-2xl bg-muted/50",
           s.iconWrapper
         )}>
           <Icon className={cn("text-muted-foreground/60", s.icon)} strokeWidth={1.5} />
         </div>
       )}
       
       <h3 className={cn("text-foreground mb-1.5", s.title)}>
         {title}
       </h3>
       
       {description && (
         <p className={cn("text-muted-foreground mb-5", s.description)}>
           {description}
         </p>
       )}
       
       {(action || secondaryAction) && (
         <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
           {action && (
             <Button
               variant="native"
               size="native-md"
               onClick={action.onClick}
               className="min-w-[140px]"
             >
               {action.label}
             </Button>
           )}
           {secondaryAction && (
             <Button
               variant="native-ghost"
               size="native-md"
               onClick={secondaryAction.onClick}
             >
               {secondaryAction.label}
             </Button>
           )}
         </div>
       )}
     </div>
   );
 }
 
 export default EmptyState;