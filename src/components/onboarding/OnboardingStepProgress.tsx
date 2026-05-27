import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubStep {
  id: string;
  label: string;
  completed: boolean;
}

interface OnboardingStepProgressProps {
  stepName: string;
  subSteps: SubStep[];
  className?: string;
  isMobile?: boolean;
}

export function OnboardingStepProgress({ 
  stepName, 
  subSteps,
  className,
  isMobile = false
}: OnboardingStepProgressProps) {
  if (!subSteps || subSteps.length === 0) return null;
  
  const completedCount = subSteps.filter(s => s.completed).length;
  const totalSteps = subSteps.length;
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      isMobile 
        ? "bg-gray-800/60 p-4 border-gray-700" 
        : "bg-gray-800/50 p-3 border-gray-700",
      className
    )}>
      <div className={cn(
        "flex items-center justify-between",
        isMobile ? "mb-3" : "mb-2"
      )}>
        <span className={cn(
          "text-gray-400 font-medium",
          isMobile ? "text-sm" : "text-xs"
        )}>
          {stepName}
        </span>
        <span className={cn(
          "font-bold text-green-400",
          isMobile ? "text-sm" : "text-xs"
        )}>
          {completedCount}/{totalSteps}
        </span>
      </div>
      
      <Progress 
        value={progressPercent} 
        className={cn(
          isMobile ? "h-2 mb-4" : "h-1.5 mb-3"
        )} 
      />
      
      <div className={cn(
        "space-y-2",
        isMobile && "space-y-3"
      )}>
        {subSteps.map((subStep) => (
          <div 
            key={subStep.id}
            className={cn(
              "flex items-center gap-3 transition-colors",
              isMobile ? "py-1" : "",
              subStep.completed ? "text-green-400" : "text-gray-500"
            )}
          >
            <CheckCircle2 
              className={cn(
                "flex-shrink-0",
                isMobile ? "w-5 h-5" : "w-3.5 h-3.5",
                subStep.completed ? "text-green-500" : "text-gray-600"
              )} 
            />
            <span className={cn(
              isMobile ? "text-sm" : "text-xs",
              subStep.completed && "line-through opacity-70"
            )}>
              {subStep.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
