"use client"

import { cn } from "@/lib/utils"
import { CheckCircle2, Clock, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type ActivityStatus = "completed" | "pending" | "blocked"

interface ActivityItemProps {
  status: ActivityStatus
  title: string
  subtitle: string
  timestamp: string
  detail: string
  onApprove?: () => void
  onReview?: () => void
  onViewReport?: () => void
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    iconBg: "bg-accent",
    pillBg: "bg-accent/10",
    pillText: "text-accent",
    pillLabel: "Completed"
  },
  pending: {
    icon: Clock,
    iconBg: "bg-warning",
    pillBg: "bg-warning/10",
    pillText: "text-warning",
    pillLabel: "Needs your approval"
  },
  blocked: {
    icon: XCircle,
    iconBg: "bg-destructive",
    pillBg: "bg-destructive/10",
    pillText: "text-destructive",
    pillLabel: "Blocked"
  }
}

export function ActivityItem({
  status,
  title,
  subtitle,
  timestamp,
  detail,
  onApprove,
  onReview,
  onViewReport
}: ActivityItemProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="card-hover rounded-2xl bg-card p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          config.iconBg
        )}>
          <Icon className="h-5 w-5 text-white" strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-medium text-foreground">{title}</h4>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm text-muted-foreground">{timestamp}</p>
              <span className={cn(
                "mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                config.pillBg,
                config.pillText
              )}>
                {config.pillLabel}
              </span>
            </div>
          </div>

          {/* Detail text */}
          <p className="mt-3 text-xs text-muted-foreground">{detail}</p>

          {/* Action buttons */}
          {status === "pending" && (
            <div className="mt-3 flex gap-2">
              <Button 
                size="sm" 
                className="rounded-full bg-accent hover:bg-accent/90"
                onClick={onApprove}
              >
                Approve
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-full"
                onClick={onReview}
              >
                Review
              </Button>
            </div>
          )}

          {status === "blocked" && onViewReport && (
            <button 
              onClick={onViewReport}
              className="mt-3 text-sm font-medium text-destructive hover:underline"
            >
              View incident report →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
