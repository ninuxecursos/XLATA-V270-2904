import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: LucideIcon;
  iconColor?: string;
  label: string;
  value: string | number;
  subValue?: string;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

export function MetricCard({
  icon: Icon,
  iconColor = "text-emerald-500",
  label,
  value,
  subValue,
  onClick,
  className,
  compact = false,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "bg-slate-700 border-slate-600",
        onClick && "cursor-pointer hover:bg-slate-600 transition-colors",
        className
      )}
      onClick={onClick}
    >
        <CardContent className={cn("!p-3", compact && "!p-2.5")}>
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className={cn("h-4 w-4 flex-shrink-0", iconColor)} />
          <span className={cn(
            "text-slate-300 truncate",
            compact ? "text-[11px]" : "text-xs"
          )}>{label}</span>
        </div>
        <div className={cn(
          "font-bold text-white truncate",
          compact ? "text-base" : "text-lg"
        )}>
          {value}
        </div>
        {subValue && (
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">{subValue}</div>
        )}
        {onClick && (
          <div className="text-[10px] text-slate-500 mt-0.5">Detalhes →</div>
        )}
      </CardContent>
    </Card>
  );
}
