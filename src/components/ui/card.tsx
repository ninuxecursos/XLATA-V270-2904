import * as React from "react"

import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'native' | 'native-elevated' | 'native-interactive';
}

const cardVariants = {
  default: "rounded-lg border bg-card text-card-foreground shadow-sm",
  native: "rounded-2xl border border-border/50 bg-card text-card-foreground shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-200",
  'native-elevated': "rounded-2xl border-0 bg-card text-card-foreground shadow-[0_4px_20px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-200",
  'native-interactive': "rounded-2xl border border-border/50 bg-card text-card-foreground shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-200 active:scale-[0.98] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:border-border cursor-pointer",
};

const Card = React.forwardRef<
  HTMLDivElement,
  CardProps
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(cardVariants[variant], className)}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-5 pb-3 md:p-6 md:pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-5 pt-0 md:p-6 md:pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
