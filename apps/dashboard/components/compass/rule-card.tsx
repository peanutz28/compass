"use client"

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface RuleCardProps {
  icon: LucideIcon
  title: string
  children: ReactNode
  className?: string
}

export function RuleCard({ icon: Icon, title, children, className }: RuleCardProps) {
  return (
    <div className={cn(
      "rounded-2xl bg-card p-7 shadow-[0_2px_16px_rgba(0,0,0,0.06)]",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
        </div>
        <h3 className="font-medium text-foreground">{title}</h3>
      </div>
      <div className="mt-5">
        {children}
      </div>
    </div>
  )
}
