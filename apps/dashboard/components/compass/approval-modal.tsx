"use client"

import { Clock, User, X, Check, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { approvePending, denyPending, lamportsToUsd, formatTimestamp } from "@/lib/api"

const PAYEE_LABELS: Record<string, string> = {
  PGE111111111111111111111111111111111111111: "Pacific Gas & Electric",
  NETFLIX1111111111111111111111111111111111111: "Netflix",
  SAFEWAY11111111111111111111111111111111111111: "Safeway Delivery",
  EMMACHEN111111111111111111111111111111111111: "Emma Chen",
}
function destLabel(d: string) { return PAYEE_LABELS[d] || (d.length > 12 ? d.slice(0, 8) + "…" : d) }

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  onApprove: () => void
  pendingId?: string | null
  pendingItem?: {
    id: string
    request: { destination: string; lamports: number; requestedAt: string; promptText?: string }
    reasons: string[]
  } | null
}

export function ApprovalModal({ isOpen, onClose, onApprove, pendingId, pendingItem }: ApprovalModalProps) {
  const [addToTrusted, setAddToTrusted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleApprove = async () => {
    if (!pendingId) { onApprove(); return }
    setIsProcessing(true); setError(null)
    try {
      const result = await approvePending(pendingId)
      setTxSignature(result.txSignature || null)
      setTimeout(() => { onApprove(); setTxSignature(null) }, 3000)
    } catch (err: any) { setError(err.message) }
    finally { setIsProcessing(false) }
  }

  const handleDeny = async () => {
    if (!pendingId) { onClose(); return }
    setIsProcessing(true)
    try { await denyPending(pendingId); onClose() }
    catch (err: any) { setError(err.message) }
    finally { setIsProcessing(false) }
  }

  const dest = pendingItem?.request.destination || "Unknown"
  const lamports = pendingItem?.request.lamports || 0
  const requestedAt = pendingItem?.request.requestedAt
  const promptText = pendingItem?.request.promptText
  const reasons = pendingItem?.reasons || []

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={!isProcessing ? onClose : undefined}
    >
      <div
        className="animate-modal-enter relative w-full max-w-lg rounded-3xl bg-card p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
            <Clock className="h-8 w-8 text-warning" strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
            {txSignature ? "Payment Approved! ✅" : "Approval Requested"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {txSignature
              ? "Transaction confirmed on Solana devnet."
              : `Eleanor wants to send ${lamportsToUsd(lamports)} — your approval is needed before anything is sent.`
            }
          </p>
        </div>

        {txSignature && (
          <div className="mt-6 rounded-xl bg-accent/10 p-4 text-center">
            <p className="text-sm text-accent font-medium">Transaction executed on-chain</p>
            {!txSignature.startsWith("SIMULATED") && (
              <a href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline">
                View on Solana Explorer <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Payment details card */}
        <div className="mt-6 rounded-xl bg-muted p-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">To</span>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{destLabel(dest)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-serif text-lg font-semibold text-foreground">{lamportsToUsd(lamports)}</span>
            </div>
            {promptText && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-muted-foreground shrink-0">Eleanor said</span>
                <span className="text-foreground text-sm text-right">"{promptText.slice(0, 80)}{promptText.length > 80 ? "…" : ""}"</span>
              </div>
            )}
            {requestedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Requested</span>
                <span className="text-foreground">{formatTimestamp(requestedAt)}</span>
              </div>
            )}
            {reasons.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Why approval needed:</span> {reasons.join(" · ")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Trust indicator */}
        <div className="mt-4 rounded-xl bg-accent/5 p-4">
          <p className="text-sm text-muted-foreground">
            {destLabel(dest)} has not received payments from Eleanor before. Once you approve, you can add them to trusted payees for future payments.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleApprove}
            disabled={isProcessing || !!txSignature}
            className="flex-1 gap-2 rounded-full bg-accent hover:bg-accent/90"
            size="lg"
          >
            {isProcessing ? <><Loader2 className="h-4 w-4 animate-spin" /> Executing on Solana…</> : <><Check className="h-4 w-4" /> Approve Payment</>}
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 rounded-full border-destructive text-destructive hover:bg-destructive/10"
            size="lg"
            disabled={isProcessing || !!txSignature}
            onClick={handleDeny}
          >
            <X className="h-4 w-4" />
            Decline
          </Button>
        </div>

        {/* Add to trusted checkbox */}
        <div className="mt-4 flex items-center gap-2">
          <Checkbox 
            id="add-trusted" 
            checked={addToTrusted}
            onCheckedChange={(checked) => setAddToTrusted(checked === true)}
          />
          <label htmlFor="add-trusted" className="text-sm text-muted-foreground">
            Add Emma Chen to trusted payees for the future
          </label>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          If you&apos;re unsure, you can also call Eleanor to confirm before deciding.
        </p>

        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
