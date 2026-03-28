"use client"

import { Shield, Pencil, Lock, Compass } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"

interface ProtectionSummaryProps {
  policy?: {
    dailyLimitLamports?: number
    approvalThresholdLamports?: number
    trustedPayees?: string[]
    blockedKeywords?: string[]
    paused?: boolean
  } | null
}

export function ProtectionSummary({ policy }: ProtectionSummaryProps) {
  const dailyUsd = policy ? `$${Math.round((policy.dailyLimitLamports || 0) / 10_000_000)}/day` : "$150/day"
  const thresholdUsd = policy ? `Over $${Math.round((policy.approvalThresholdLamports || 0) / 10_000_000)}` : "Over $100"
  const payeeCount = policy?.trustedPayees?.length ?? 0
  const keywordCount = policy?.blockedKeywords?.length ?? 0
  const isPaused = policy?.paused ?? false

  return (
    <div className="rounded-2xl bg-card p-7 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-accent" strokeWidth={1.5} />
        <h3 className="font-serif text-lg font-semibold text-foreground">Eleanor&apos;s Protection</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {isPaused ? "⚠️ Payments paused" : "Rules set by you · Always enforced"}
      </p>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Daily Limit</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{dailyUsd}</span>
            <a href="/rules" className="text-muted-foreground hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Trusted Payees</span>
          <a href="/rules" className="text-sm font-medium text-accent hover:underline">{payeeCount} payee{payeeCount !== 1 ? "s" : ""}</a>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Blocked Phrases</span>
          <a href="/rules" className="text-sm font-medium text-accent hover:underline">{keywordCount} phrase{keywordCount !== 1 ? "s" : ""}</a>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Approval Threshold</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{thresholdUsd}</span>
            <a href="/rules" className="text-muted-foreground hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Emergency Pause</span>
          <Switch
            checked={isPaused}
            disabled
            className="data-[state=checked]:bg-warning"
          />
        </div>
      </div>

      {/* Compass Rose Banner */}
      <div className="mt-6 rounded-xl bg-accent/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10">
            <Compass className="h-4 w-4 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm italic text-muted-foreground">
              Rules are enforced on-chain. Even Eleanor&apos;s agent cannot override them without your approval.
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-accent">
              <Lock className="h-3 w-3" />
              <span>Secured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
