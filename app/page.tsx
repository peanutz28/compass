"use client"

import { useState } from "react"
import { Sidebar } from "@/components/compass/sidebar"
import { StatCard } from "@/components/compass/stat-card"
import { ActivityItem } from "@/components/compass/activity-item"
import { ProtectionSummary } from "@/components/compass/protection-summary"
import { BlockedScamModal } from "@/components/compass/blocked-scam-modal"
import { ApprovalModal } from "@/components/compass/approval-modal"
import { CheckCircle2, Clock, Shield, Sparkles } from "lucide-react"

export default function Dashboard() {
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-60 min-h-screen p-8">
        <div className="mx-auto max-w-6xl">
          {/* Page Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-foreground">
                Good morning, Sarah.
              </h1>
              <p className="mt-2 text-muted-foreground">
                Eleanor&apos;s finances are protected. Here&apos;s today&apos;s summary.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-pulse-soft absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent"></span>
              </span>
              Last checked 2 min ago
            </div>
          </div>

          {/* Stat Cards */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Safe Today"
              value="$87.40 spent"
              icon={CheckCircle2}
              subtext="Within normal range"
              progress={58}
            />
            <StatCard
              title="Awaiting Your Approval"
              value="1 request"
              icon={Clock}
              subtext="Birthday gift · $120"
              variant="warning"
            />
            <StatCard
              title="Scam Attempts Blocked"
              value="1 today"
              icon={Shield}
              subtext="Urgent transfer · 2h ago"
              variant="danger"
            />
            <StatCard
              title="Agent Status"
              value="Active & Protected"
              icon={Sparkles}
              subtext="12 trusted payees · 8 rules"
            />
          </div>

          {/* Content Grid */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Activity Feed */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold text-foreground">Recent Activity</h2>
                <button className="text-sm font-medium text-accent hover:underline">View all</button>
              </div>

              <div className="mt-5 space-y-4">
                <ActivityItem
                  status="completed"
                  title="Electric bill payment"
                  subtitle="Pacific Gas & Electric · $87.40"
                  timestamp="Today, 9:14 AM"
                  detail="Trusted payee · Within daily limit"
                />
                <ActivityItem
                  status="pending"
                  title="Birthday gift to granddaughter"
                  subtitle="Emma Chen · $120.00"
                  timestamp="Today, 11:02 AM"
                  detail="New recipient · First transaction"
                  onApprove={() => setShowApprovalModal(true)}
                  onReview={() => setShowApprovalModal(true)}
                />
                <ActivityItem
                  status="blocked"
                  title="Suspicious transfer blocked"
                  subtitle="Unknown address · $200.00"
                  timestamp="Today, 7:43 AM"
                  detail="Urgent language detected · Unknown payee · Amount above threshold"
                  onViewReport={() => setShowBlockedModal(true)}
                />
              </div>
            </div>

            {/* Protection Summary */}
            <div>
              <ProtectionSummary />
            </div>
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
        onApprove={() => {
          setShowApprovalModal(false)
          // Handle approval
        }}
      />
    </div>
  )
}
