"use client"

import { Clock, User, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  onApprove: () => void
}

export function ApprovalModal({ isOpen, onClose, onApprove }: ApprovalModalProps) {
  const [addToTrusted, setAddToTrusted] = useState(false)

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
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
            Approval Requested
          </h2>
          <p className="mt-2 text-muted-foreground">
            Eleanor wants to send a birthday gift. This recipient is new — your approval is needed before anything is sent.
          </p>
        </div>

        {/* Payment details card */}
        <div className="mt-6 rounded-xl bg-muted p-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">To</span>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">Emma Chen (granddaughter)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-serif text-lg font-semibold text-foreground">$120.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Note</span>
              <span className="text-foreground">For Emma&apos;s birthday 🎂</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Requested</span>
              <span className="text-foreground">Today at 11:02 AM</span>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Why approval needed:</span> New recipient · Over $100 threshold
              </p>
            </div>
          </div>
        </div>

        {/* Trust indicator */}
        <div className="mt-4 rounded-xl bg-accent/5 p-4">
          <p className="text-sm text-muted-foreground">
            Emma Chen has not received payments from Eleanor before. Once you approve, you can add her to trusted payees for future payments.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button 
            onClick={onApprove}
            className="flex-1 gap-2 rounded-full bg-accent hover:bg-accent/90"
            size="lg"
          >
            <Check className="h-4 w-4" />
            Approve Payment
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 gap-2 rounded-full border-destructive text-destructive hover:bg-destructive/10"
            size="lg"
            onClick={onClose}
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
