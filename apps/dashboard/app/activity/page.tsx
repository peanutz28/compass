"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/compass/sidebar"
import { ActivityItem } from "@/components/compass/activity-item"
import { BlockedScamModal } from "@/components/compass/blocked-scam-modal"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import { useCompassEvents } from "@/hooks/useCompassEvents"
import { fetchTransactions, fetchPending, lamportsToUsd, formatTimestamp } from "@/lib/api"

const PAYEE_LABELS: Record<string, string> = {
  PGE111111111111111111111111111111111111111: "Pacific Gas & Electric",
  NETFLIX1111111111111111111111111111111111111: "Netflix",
  SAFEWAY11111111111111111111111111111111111111: "Safeway Delivery",
  EMMACHEN111111111111111111111111111111111111: "Emma Chen",
}
function destLabel(d: string) { return PAYEE_LABELS[d] || (d.length > 12 ? d.slice(0, 8) + "…" : d) }
function mapStatus(s: string): "completed" | "blocked" | "pending" {
  if (s === "completed" || s === "approved") return "completed"
  if (s === "blocked" || s === "denied") return "blocked"
  return "pending"
}

type FilterType = "all" | "completed" | "blocked" | "pending"

export default function ActivityPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>("all")
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])

  const loadData = useCallback(async () => {
    try {
      const [txs, pend] = await Promise.all([fetchTransactions(50), fetchPending()])
      setTransactions(txs)
      setPending(pend)
    } catch { /* offline */ }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useCompassEvents(() => loadData())

  const filtered = filter === "all" ? transactions : transactions.filter(t => mapStatus(t.status) === filter)

  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === "completed" || t.status === "approved").length,
    blocked: transactions.filter(t => t.status === "blocked" || t.status === "denied").length,
    pending: transactions.filter(t => t.status === "pending").length,
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar pendingCount={pending.length} />
      <main className="ml-60 min-h-screen p-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-foreground">Activity</h1>
              <p className="mt-2 text-muted-foreground">All transactions and protection events for Eleanor</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2 rounded-full">
                <Filter className="h-4 w-4" /> Filter
              </Button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="mt-8 grid grid-cols-4 gap-4">
            {[
              { label: "Total Transactions", value: stats.total, color: "text-foreground", filter: "all" as FilterType },
              { label: "Completed", value: stats.completed, color: "text-accent", filter: "completed" as FilterType },
              { label: "Blocked", value: stats.blocked, color: "text-destructive", filter: "blocked" as FilterType },
              { label: "Pending", value: stats.pending, color: "text-warning", filter: "pending" as FilterType },
            ].map(stat => (
              <button
                key={stat.filter}
                onClick={() => setFilter(stat.filter)}
                className={`rounded-xl bg-card p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)] text-left transition-all ${filter === stat.filter ? "ring-2 ring-accent" : "hover:shadow-md"}`}
              >
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`mt-1 font-serif text-2xl font-semibold ${stat.color}`}>
                  {isLoading ? "…" : stat.value}
                </p>
              </button>
            ))}
          </div>

          {/* Activity List */}
          <div className="mt-8 space-y-4">
            {isLoading ? (
              [1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <p className="text-sm text-muted-foreground">
                  {filter === "all" ? "No transactions yet. Run pnpm demo to simulate the demo flows." : `No ${filter} transactions.`}
                </p>
              </div>
            ) : (
              filtered.map((tx) => {
                const s = mapStatus(tx.status)
                const pend = pending.find(p => p.id === tx.id)
                return (
                  <ActivityItem
                    key={tx.id}
                    status={s}
                    title={s === "blocked" ? "Suspicious transfer blocked" : `Payment to ${destLabel(tx.destination)}`}
                    subtitle={`${destLabel(tx.destination)} · ${lamportsToUsd(tx.lamports)}`}
                    timestamp={formatTimestamp(tx.requested_at)}
                    detail={
                      s === "blocked"
                        ? (tx.reasons || []).join(" · ")
                        : s === "pending"
                        ? (pend?.reasons || []).join(" · ") || "Awaiting caregiver approval"
                        : tx.tx_signature
                        ? `TX: ${tx.tx_signature.slice(0, 12)}…`
                        : "Completed successfully"
                    }
                    onViewReport={s === "blocked" ? () => { setSelectedReasons(tx.reasons || []); setShowBlockedModal(true) } : undefined}
                  />
                )
              })
            )}
          </div>
        </div>
      </main>

      <BlockedScamModal
        isOpen={showBlockedModal}
        onClose={() => setShowBlockedModal(false)}
        reasons={selectedReasons}
      />
    </div>
  )
}
