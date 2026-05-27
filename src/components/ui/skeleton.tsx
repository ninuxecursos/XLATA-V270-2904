import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'native' | 'circular' | 'text';
}

function Skeleton({
  className,
  variant = 'default',
  ...props
}: SkeletonProps) {
  const variants = {
    default: "animate-pulse rounded-md bg-muted",
    native: "rounded-lg bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-[shimmer-native_1.5s_ease-in-out_infinite]",
    circular: "animate-pulse rounded-full bg-muted",
    text: "animate-pulse rounded bg-muted h-4",
  };

  return (
    <div
      className={cn(variants[variant], className)}
      {...props}
    />
  )
}

// Pre-built skeleton components for common use cases
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/50 bg-card p-5 space-y-4", className)}>
      <Skeleton variant="native" className="h-32 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton variant="native" className="h-4 w-3/4" />
        <Skeleton variant="native" className="h-4 w-1/2" />
      </div>
    </div>
  );
}

function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 p-4", className)}>
      <Skeleton variant="circular" className="h-10 w-10" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="native" className="h-4 w-3/4" />
        <Skeleton variant="native" className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' };
  return <Skeleton variant="circular" className={sizes[size]} />;
}

export { Skeleton, SkeletonCard, SkeletonListItem, SkeletonAvatar }
