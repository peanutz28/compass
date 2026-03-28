"use client"

import { useState } from "react"
import { Sidebar } from "@/components/compass/sidebar"
import { ApprovalModal } from "@/components/compass/approval-modal"
import { Button } from "@/components/ui/button"
import { Clock, User, Check, X, Heart, Compass } from "lucide-react"

const pendingApprovals = [
  {
    id: 1,
    title: "Birthday gift to granddaughter",
    recipient: "Emma Chen",
    relationship: "granddaughter",
    amount: "$120.00",
    note: "For Emma's birthday 🎂",
    timestamp: "Today at 11:02 AM",
    reason: "New recipient · Over $100 threshold"
  }
]

export default function ApprovalsPage() {
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvedItems, setApprovedItems] = useState<number[]>([])

  const handleApprove = (id: number) => {
    setApprovedItems(prev => [...prev, id])
    setShowApprovalModal(false)
  }

  const activePendingApprovals = pendingApprovals.filter(a => !approvedItems.includes(a.id))

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-60 min-h-screen p-8">
        <div className="mx-auto max-w-3xl">
          {/* Page Header */}
          <div>
            <h1 className="font-serif text-3xl font-semibold text-foreground">
              Approvals
            </h1>
            <p className="mt-2 text-muted-foreground">
              Review and approve pending transactions for Eleanor
            </p>
          </div>

          {/* Pending Approvals */}
          {activePendingApprovals.length > 0 ? (
            <div className="mt-8 space-y-4">
              {activePendingApprovals.map((approval) => (
                <div 
                  key={approval.id}
                  className="rounded-2xl border-l-4 border-l-warning bg-warning/5 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning">
                        <Clock className="h-6 w-6 text-white" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{approval.title}</h3>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{approval.recipient} ({approval.relationship})</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-xl font-semibold text-foreground">{approval.amount}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{approval.timestamp}</p>
                    </div>
                  </div>

                  {approval.note && (
                    <div className="mt-4 rounded-xl bg-card p-4">
                      <p className="text-sm text-muted-foreground">Note from Eleanor:</p>
                      <p className="mt-1 text-foreground">&quot;{approval.note}&quot;</p>
                    </div>
                  )}

                  <p className="mt-4 text-sm text-muted-foreground">
                    <span className="font-medium">Why approval needed:</span> {approval.reason}
                  </p>

                  <div className="mt-6 flex gap-3">
                    <Button 
                      onClick={() => setShowApprovalModal(true)}
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
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="mt-16 flex flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
                <Compass className="h-10 w-10 text-accent" strokeWidth={1.5} />
              </div>
              <h2 className="mt-6 font-serif text-xl font-semibold text-foreground">
                All caught up!
              </h2>
              <p className="mt-2 max-w-sm text-muted-foreground">
                There are no pending approvals right now. Eleanor&apos;s transactions are flowing smoothly within your protection rules.
              </p>
              <div className="mt-6 flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm text-accent">
                <Heart className="h-4 w-4" />
                <span>Eleanor is safe and protected</span>
              </div>
            </div>
          )}

          {/* Recent Approved */}
          {approvedItems.length > 0 && (
            <div className="mt-12">
              <h2 className="font-serif text-lg font-semibold text-foreground">Recently Approved</h2>
              <div className="mt-4 rounded-2xl bg-accent/5 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Birthday gift to Emma Chen</p>
                    <p className="text-sm text-muted-foreground">$120.00 · Approved just now</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Approval Modal */}
      <ApprovalModal 
        isOpen={showApprovalModal} 
        onClose={() => setShowApprovalModal(false)}
        onApprove={() => handleApprove(activePendingApprovals[0]?.id || 0)}
      />
    </div>
  )
}
