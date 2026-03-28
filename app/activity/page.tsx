"use client"

import { useState } from "react"
import { Sidebar } from "@/components/compass/sidebar"
import { ActivityItem } from "@/components/compass/activity-item"
import { BlockedScamModal } from "@/components/compass/blocked-scam-modal"
import { ApprovalModal } from "@/components/compass/approval-modal"
import { Button } from "@/components/ui/button"
import { Calendar, Filter } from "lucide-react"

const activities = [
  {
    status: "completed" as const,
    title: "Electric bill payment",
    subtitle: "Pacific Gas & Electric · $87.40",
    timestamp: "Today, 9:14 AM",
    detail: "Trusted payee · Within daily limit"
  },
  {
    status: "pending" as const,
    title: "Birthday gift to granddaughter",
    subtitle: "Emma Chen · $120.00",
    timestamp: "Today, 11:02 AM",
    detail: "New recipient · First transaction"
  },
  {
    status: "blocked" as const,
    title: "Suspicious transfer blocked",
    subtitle: "Unknown address · $200.00",
    timestamp: "Today, 7:43 AM",
    detail: "Urgent language detected · Unknown payee · Amount above threshold"
  },
  {
    status: "completed" as const,
    title: "Netflix subscription",
    subtitle: "Netflix · $15.99",
    timestamp: "Yesterday, 4:00 PM",
    detail: "Trusted payee · Recurring payment"
  },
  {
    status: "completed" as const,
    title: "Grocery delivery",
    subtitle: "Safeway Delivery · $67.23",
    timestamp: "Yesterday, 11:30 AM",
    detail: "Trusted payee · Within daily limit"
  },
  {
    status: "blocked" as const,
    title: "Gift card request blocked",
    subtitle: "Unknown · $500.00",
    timestamp: "Mar 25, 2:15 PM",
    detail: "Blocked phrase: 'gift card' · Amount above threshold"
  },
  {
    status: "completed" as const,
    title: "Medication refill",
    subtitle: "Dr. Martinez Office · $45.00",
    timestamp: "Mar 24, 10:00 AM",
    detail: "Trusted payee · Within daily limit"
  }
]

export default function ActivityPage() {
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-60 min-h-screen p-8">
        <div className="mx-auto max-w-4xl">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-foreground">
                Activity
              </h1>
              <p className="mt-2 text-muted-foreground">
                All transactions and protection events for Eleanor
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2 rounded-full">
                <Calendar className="h-4 w-4" />
                This month
              </Button>
              <Button variant="outline" className="gap-2 rounded-full">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="mt-8 grid grid-cols-4 gap-4">
            <div className="rounded-xl bg-card p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="mt-1 font-serif text-2xl font-semibold text-foreground">47</p>
            </div>
            <div className="rounded-xl bg-card p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="mt-1 font-serif text-2xl font-semibold text-accent">43</p>
            </div>
            <div className="rounded-xl bg-card p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <p className="text-sm text-muted-foreground">Blocked</p>
              <p className="mt-1 font-serif text-2xl font-semibold text-destructive">3</p>
            </div>
            <div className="rounded-xl bg-card p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="mt-1 font-serif text-2xl font-semibold text-warning">1</p>
            </div>
          </div>

          {/* Activity List */}
          <div className="mt-8 space-y-4">
            {activities.map((activity, index) => (
              <ActivityItem
                key={index}
                {...activity}
                onApprove={activity.status === "pending" ? () => setShowApprovalModal(true) : undefined}
                onReview={activity.status === "pending" ? () => setShowApprovalModal(true) : undefined}
                onViewReport={activity.status === "blocked" ? () => setShowBlockedModal(true) : undefined}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Modals */}
      <BlockedScamModal 
        isOpen={showBlockedModal} 
        onClose={() => setShowBlockedModal(false)} 
      />
      <ApprovalModal 
        isOpen={showApprovalModal} 
        onClose={() => setShowApprovalModal(false)}
        onApprove={() => setShowApprovalModal(false)}
      />
    </div>
  )
}
