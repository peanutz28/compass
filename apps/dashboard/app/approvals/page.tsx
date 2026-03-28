"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/compass/sidebar"
import { Button } from "@/components/ui/button"
import { Clock, User, Check, X, Heart, Compass, ExternalLink, Loader2 } from "lucide-react"
import { useCompassEvents } from "@/hooks/useCompassEvents"
import { fetchPending, approvePending, denyPending, lamportsToUsd, formatTimestamp } from "@/lib/api"

interface PendingApproval {
  id: string
  request: { destination: string; lamports: number; requestedAt: string; promptText?: string }
  reasons: string[]
  status: string
  txSignature?: string
  createdAt: string
}

interface ResolvedApproval {
  id: string
  request: { destination: string; lamports: number }
  status: "approved" | "denied"
  txSignature?: string
  resolvedAt: string
}

const PAYEE_LABELS: Record<string, string> = {
  PGE111111111111111111111111111111111111111: "Pacific Gas & Electric",
  NETFLIX1111111111111111111111111111111111111: "Netflix",
  SAFEWAY11111111111111111111111111111111111111: "Safeway Delivery",
  EMMACHEN111111111111111111111111111111111111: "Emma Chen",
}
function destLabel(d: string) { return PAYEE_LABELS[d] || (d.length > 12 ? d.slice(0, 8) + "…" : d) }

export default function ApprovalsPage() {
  const [pending, setPending] = useState<PendingApproval[]>([])
  const [resolved, setResolved] = useState<ResolvedApproval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadPending = useCallback(async () => {
    try {
      const data = await fetchPending()
      setPending(data)
    } catch { /* server might be offline */ }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { loadPending() }, [loadPending])
  useCompassEvents(() => loadPending())

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    setError(null)
    try {
      const result = await approvePending(id)
      const item = pending.find(p => p.id === id)
      if (item) {
        setResolved(prev => [{
          id, request: item.request, status: "approved",
          txSignature: result.txSignature, resolvedAt: new Date().toISOString()
        }, ...prev])
      }
      setPending(prev => prev.filter(p => p.id !== id))
    } catch (err: any) {
      setError(`Approval failed: ${err.message}. Is the policy server running?`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeny = async (id: string) => {
    setProcessingId(id)
    setError(null)
    try {
      await denyPending(id)
      const item = pending.find(p => p.id === id)
      if (item) {
        setResolved(prev => [{
          id, request: item.request, status: "denied", resolvedAt: new Date().toISOString()
        }, ...prev])
      }
      setPending(prev => prev.filter(p => p.id !== id))
    } catch (err: any) {
      setError(`Could not deny: ${err.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar pendingCount={pending.length} />
      <main className="ml-60 min-h-screen p-8">
        <div className="mx-auto max-w-3xl">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-foreground">Approvals</h1>
            <p className="mt-2 text-muted-foreground">Review and approve pending transactions for Eleanor</p>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Pending Approvals */}
          {isLoading ? (
            <div className="mt-8 space-y-4">
              {[1, 2].map(i => <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : pending.length > 0 ? (
            <div className="mt-8 space-y-4">
              {pending.map((approval) => (
                <div key={approval.id} className="rounded-2xl border-l-4 border-l-warning bg-warning/5 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning">
                        <Clock className="h-6 w-6 text-white" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Payment to {destLabel(approval.request.destination)}</h3>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{destLabel(approval.request.destination)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-xl font-semibold text-foreground">{lamportsToUsd(approval.request.lamports)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatTimestamp(approval.createdAt)}</p>
                    </div>
                  </div>

                  {approval.request.promptText && (
                    <div className="mt-4 rounded-xl bg-card p-4">
                      <p className="text-sm text-muted-foreground">Eleanor's message:</p>
                      <p className="mt-1 text-foreground">"{approval.request.promptText}"</p>
                    </div>
                  )}

                  <p className="mt-4 text-sm text-muted-foreground">
                    <span className="font-medium">Why approval needed:</span>{" "}
                    {approval.reasons.join(" · ")}
                  </p>

                  <div className="mt-6 flex gap-3">
                    <Button
                      onClick={() => handleApprove(approval.id)}
                      disabled={processingId === approval.id}
                      className="flex-1 gap-2 rounded-full bg-accent hover:bg-accent/90"
                      size="lg"
                    >
                      {processingId === approval.id ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Executing on Solana…</>
                      ) : (
                        <><Check className="h-4 w-4" /> Approve Payment</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDeny(approval.id)}
                      disabled={processingId === approval.id}
                      className="flex-1 gap-2 rounded-full border-destructive text-destructive hover:bg-destructive/10"
                      size="lg"
                    >
                      <X className="h-4 w-4" /> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
                <Compass className="h-10 w-10 text-accent" strokeWidth={1.5} />
              </div>
              <h2 className="mt-6 font-serif text-xl font-semibold text-foreground">All caught up!</h2>
              <p className="mt-2 max-w-sm text-muted-foreground">
                There are no pending approvals right now. Eleanor's transactions are flowing smoothly within your protection rules.
              </p>
              <div className="mt-6 flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm text-accent">
                <Heart className="h-4 w-4" />
                <span>Eleanor is safe and protected</span>
              </div>
            </div>
          )}

          {/* Recently Resolved */}
          {resolved.length > 0 && (
            <div className="mt-12">
              <h2 className="font-serif text-lg font-semibold text-foreground">Recently Resolved</h2>
              <div className="mt-4 space-y-3">
                {resolved.map((item) => (
                  <div key={item.id} className={`rounded-2xl p-5 ${item.status === "approved" ? "bg-accent/5" : "bg-muted"}`}>
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.status === "approved" ? "bg-accent" : "bg-muted-foreground"}`}>
                        {item.status === "approved"
                          ? <Check className="h-5 w-5 text-white" />
                          : <X className="h-5 w-5 text-white" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {item.status === "approved" ? "✅ Approved" : "❌ Declined"} — {destLabel(item.request.destination)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lamportsToUsd(item.request.lamports)} · Just now
                        </p>
                      </div>
                      {item.txSignature && (
                        <a
                          href={`https://explorer.solana.com/tx/${item.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-accent hover:underline"
                        >
                          View on Solana <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {item.txSignature && !item.txSignature.startsWith("SIMULATED") && (
                      <p className="mt-2 text-xs text-muted-foreground pl-14">
                        TX: {item.txSignature.slice(0, 20)}…
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
