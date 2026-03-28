"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/compass/sidebar"
import { StatCard } from "@/components/compass/stat-card"
import { ActivityItem } from "@/components/compass/activity-item"
import { ProtectionSummary } from "@/components/compass/protection-summary"
import { BlockedScamModal } from "@/components/compass/blocked-scam-modal"
import { ApprovalModal } from "@/components/compass/approval-modal"
import { CheckCircle2, Clock, Shield, Sparkles } from "lucide-react"
import { useCompassEvents } from "@/hooks/useCompassEvents"
import { fetchDailySpend, fetchTransactions, fetchPending, fetchPolicy, lamportsToUsd, formatTimestamp } from "@/lib/api"

const PAYEE_LABELS: Record<string, string> = {
  PGE111111111111111111111111111111111111111: "Pacific Gas & Electric",
  NETFLIX1111111111111111111111111111111111111: "Netflix",
  SAFEWAY11111111111111111111111111111111111111: "Safeway Delivery",
}
function destLabel(d: string) { return PAYEE_LABELS[d] || (d.length > 12 ? d.slice(0, 8) + "…" : d) }
function mapStatus(s: string): "completed" | "blocked" | "pending" {
  if (s === "completed" || s === "approved") return "completed"
  if (s === "blocked" || s === "denied") return "blocked"
  return "pending"
}

export default function Dashboard() {
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [dailySpend, setDailySpend] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [policy, setPolicy] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [serverOnline, setServerOnline] = useState(false)
  const [lastChecked, setLastChecked] = useState("just now")

  const loadData = useCallback(async () => {
    try {
      const [spend, txs, pend, pol] = await Promise.all([
        fetchDailySpend(), fetchTransactions(5), fetchPending(), fetchPolicy(),
      ])
      setDailySpend(spend); setTransactions(txs); setPending(pend); setPolicy(pol)
      setServerOnline(true); setLastChecked("just now")
    } catch { setServerOnline(false) }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => {
    loadData()
    const t = setInterval(() => setLastChecked("2 min ago"), 120_000)
    return () => clearInterval(t)
  }, [loadData])

  useCompassEvents(() => loadData())

  const blockedToday = transactions.filter(t => t.status === "blocked" || t.status === "denied").length
  const selectedPending = pending.find(p => p.id === selectedPendingId) || null

  return (
    <div className="min-h-screen bg-background">
      <Sidebar pendingCount={pending.length} />
      <main className="ml-60 min-h-screen p-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-foreground">Good morning, Sarah.</h1>
              <p className="mt-2 text-muted-foreground">
                {serverOnline ? "Eleanor's finances are protected. Here's today's summary." : "⚠️ Policy server offline — run: pnpm dev:server"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${serverOnline ? "animate-pulse bg-accent" : "bg-destructive"}`} />
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${serverOnline ? "bg-accent" : "bg-destructive"}`} />
              </span>
              {serverOnline ? `Last checked ${lastChecked}` : "Server offline"}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Safe Today" value={isLoading ? "Loading…" : `${dailySpend?.spentUsd || "$0.00"} spent`} icon={CheckCircle2}
              subtext={`${dailySpend?.percentage || 0}% of ${dailySpend?.limitUsd || "$150.00"} daily limit`} progress={dailySpend?.percentage || 0} />
            <StatCard title="Awaiting Your Approval" value={isLoading ? "…" : `${pending.length} request${pending.length !== 1 ? "s" : ""}`} icon={Clock}
              subtext={pending.length > 0 ? `${lamportsToUsd(pending[0]?.request.lamports || 0)} pending` : "All caught up"} variant={pending.length > 0 ? "warning" : undefined} />
            <StatCard title="Scam Attempts Blocked" value={isLoading ? "…" : `${blockedToday} today`} icon={Shield}
              subtext={blockedToday > 0 ? "See Activity for details" : "None blocked today"} variant={blockedToday > 0 ? "danger" : undefined} />
            <StatCard title="Agent Status" value={serverOnline ? "Active & Protected" : "Offline"} icon={Sparkles}
              subtext={policy ? `${policy.trustedPayees?.length || 0} trusted payees · ${policy.blockedKeywords?.length || 0} rules` : "Connecting…"} />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold text-foreground">Recent Activity</h2>
                <a href="/activity" className="text-sm font-medium text-accent hover:underline">View all</a>
              </div>
              <div className="mt-5 space-y-4">
                {isLoading ? (
                  [1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)
                ) : transactions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                    <p className="text-sm text-muted-foreground">No transactions yet.</p>
                    <p className="mt-1 text-xs text-muted-foreground">Run <code className="rounded bg-muted px-1.5 py-0.5">pnpm demo</code> to simulate the demo flows.</p>
                  </div>
                ) : transactions.map(tx => {
                  const s = mapStatus(tx.status)
                  const pend = pending.find(p => p.id === tx.id)
                  return (
                    <ActivityItem key={tx.id} status={s}
                      title={s === "blocked" ? "Suspicious transfer blocked" : `Payment to ${destLabel(tx.destination)}`}
                      subtitle={`${destLabel(tx.destination)} · ${lamportsToUsd(tx.lamports)}`}
                      timestamp={formatTimestamp(tx.requested_at)}
                      detail={s === "blocked" ? (tx.reasons || []).join(" · ") : s === "pending" ? (pend?.reasons || []).join(" · ") || "Awaiting approval" : "Completed successfully"}
                      onApprove={s === "pending" ? () => { setSelectedPendingId(tx.id); setShowApprovalModal(true) } : undefined}
                      onReview={s === "pending" ? () => { setSelectedPendingId(tx.id); setShowApprovalModal(true) } : undefined}
                      onViewReport={s === "blocked" ? () => { setSelectedReasons(tx.reasons || []); setShowBlockedModal(true) } : undefined}
                    />
                  )
                })}
              </div>
            </div>
            <div><ProtectionSummary policy={policy} /></div>
          </div>
        </div>
      </main>
      <BlockedScamModal isOpen={showBlockedModal} onClose={() => setShowBlockedModal(false)} reasons={selectedReasons} />
      <ApprovalModal isOpen={showApprovalModal} onClose={() => setShowApprovalModal(false)}
        pendingId={selectedPendingId} pendingItem={selectedPending}
        onApprove={() => { setShowApprovalModal(false); loadData() }} />
    </div>
  )
}
