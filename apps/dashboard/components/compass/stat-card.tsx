import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  subtext: string
  variant?: "default" | "warning" | "danger" | "success"
  progress?: number
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  subtext, 
  variant = "default",
  progress 
}: StatCardProps) {
  const variantStyles = {
    default: {
      border: "border-transparent",
      bg: "bg-card",
      iconBg: "bg-accent/10",
      iconColor: "text-accent"
    },
    warning: {
      border: "border-l-4 border-l-warning",
      bg: "bg-warning/5",
      iconBg: "bg-warning/10",
      iconColor: "text-warning"
    },
    danger: {
      border: "border-l-4 border-l-destructive",
      bg: "bg-destructive/5",
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive"
    },
    success: {
      border: "border-l-4 border-l-accent",
      bg: "bg-accent/5",
      iconBg: "bg-accent/10",
      iconColor: "text-accent"
    }
  }

  const styles = variantStyles[variant]

  return (
    <div 
      className={cn(
        "rounded-2xl p-7 shadow-[0_2px_16px_rgba(0,0,0,0.06)]",
        styles.border,
        styles.bg
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 font-serif text-2xl font-semibold text-foreground">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{subtext}</p>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", styles.iconBg)}>
          <Icon className={cn("h-6 w-6", styles.iconColor)} strokeWidth={1.5} />
        </div>
      </div>
      
      {progress !== undefined && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div 
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
