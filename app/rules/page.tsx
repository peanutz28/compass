"use client"

import { useState } from "react"
import { Sidebar } from "@/components/compass/sidebar"
import { RuleCard } from "@/components/compass/rule-card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Wallet, 
  CheckCircle2, 
  Users, 
  AlertTriangle, 
  UserPlus, 
  Lock,
  X,
  Plus
} from "lucide-react"
import { cn } from "@/lib/utils"

const trustedPayees = [
  "Pacific Gas & Electric",
  "Safeway Delivery",
  "Netflix",
  "Dr. Martinez Office",
  "Sarah Chen"
]

const blockedPhrases = [
  "urgent",
  "gift card",
  "IRS",
  "wire transfer",
  "bail",
  "expires"
]

export default function RulesPage() {
  const [dailyLimit, setDailyLimit] = useState(150)
  const [approvalThreshold, setApprovalThreshold] = useState("100")
  const [requireNewRecipientApproval, setRequireNewRecipientApproval] = useState(true)
  const [emergencyPause, setEmergencyPause] = useState(false)
  const [newPayee, setNewPayee] = useState("")
  const [newPhrase, setNewPhrase] = useState("")

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-60 min-h-screen p-8">
        <div className="mx-auto max-w-5xl">
          {/* Page Header */}
          <div>
            <h1 className="font-serif text-3xl font-semibold text-foreground">
              Protection Rules
            </h1>
            <p className="mt-2 text-muted-foreground">
              Plain-English controls for Eleanor&apos;s financial safety. No technical knowledge needed.
            </p>
          </div>

          {/* Rules Grid */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Daily Spending Limit */}
            <RuleCard icon={Wallet} title="How much can Eleanor spend each day?">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-serif font-semibold text-foreground">
                    ${dailyLimit.toFixed(2)}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="500" 
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$0</span>
                  <span>$500</span>
                </div>
                <p className="text-sm text-muted-foreground">$87.40 spent today</p>
              </div>
            </RuleCard>

            {/* Approval Threshold */}
            <RuleCard icon={CheckCircle2} title="When should Sarah be asked to approve?">
              <div className="space-y-3">
                {[
                  { value: "always", label: "Always (any amount)" },
                  { value: "100", label: "Transactions over $100" },
                  { value: "250", label: "Transactions over $250" },
                  { value: "new", label: "Only new recipients" },
                ].map((option) => (
                  <label 
                    key={option.value}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors",
                      approvalThreshold === option.value 
                        ? "border-accent bg-accent/5" 
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2",
                      approvalThreshold === option.value 
                        ? "border-accent bg-accent" 
                        : "border-muted-foreground"
                    )}>
                      {approvalThreshold === option.value && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground">{option.label}</span>
                  </label>
                ))}
                <p className="text-sm text-muted-foreground pt-2">
                  You&apos;ll get a notification and can approve in seconds.
                </p>
              </div>
            </RuleCard>

            {/* Trusted Payees */}
            <RuleCard icon={Users} title="Who can always receive payments without approval?">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {trustedPayees.map((payee) => (
                    <span 
                      key={payee}
                      className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-foreground"
                    >
                      {payee}
                      <button className="text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add a person or business"
                    value={newPayee}
                    onChange={(e) => setNewPayee(e.target.value)}
                    className="rounded-xl"
                  />
                  <Button className="rounded-xl bg-accent hover:bg-accent/90 shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  These are pre-approved. The agent will never need your permission to pay them within the daily limit.
                </p>
              </div>
            </RuleCard>

            {/* Blocked Phrases */}
            <RuleCard icon={AlertTriangle} title="What words should trigger an automatic block?">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {blockedPhrases.map((phrase) => (
                    <span 
                      key={phrase}
                      className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-sm text-destructive"
                    >
                      {phrase}
                      <button className="text-destructive/70 hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add a phrase to block"
                    value={newPhrase}
                    onChange={(e) => setNewPhrase(e.target.value)}
                    className="rounded-xl"
                  />
                  <Button className="rounded-xl bg-destructive hover:bg-destructive/90 shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  If a payment request contains these words, it&apos;s blocked instantly and you&apos;re notified — no matter what.
                </p>
              </div>
            </RuleCard>

            {/* New Recipient Rules */}
            <RuleCard icon={UserPlus} title="What happens when Eleanor's agent tries to pay someone new?">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Require my approval for all new recipients</span>
                  <Switch 
                    checked={requireNewRecipientApproval}
                    onCheckedChange={setRequireNewRecipientApproval}
                    className="data-[state=checked]:bg-accent"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Eleanor can still initiate the payment — it just waits for your green light before going through.
                </p>
              </div>
            </RuleCard>

            {/* Emergency Pause */}
            <RuleCard 
              icon={Lock} 
              title="Pause all payments immediately"
              className={cn(emergencyPause && "bg-warning/5 border border-warning")}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-sm font-medium",
                    emergencyPause ? "text-warning" : "text-foreground"
                  )}>
                    {emergencyPause ? "All payments currently paused" : "All transactions paused"}
                  </span>
                  <Switch 
                    checked={emergencyPause}
                    onCheckedChange={setEmergencyPause}
                    className="data-[state=checked]:bg-warning"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Use this if you think Eleanor&apos;s agent has been compromised or she&apos;s in an unsafe situation. You can re-enable anytime.
                </p>
              </div>
            </RuleCard>
          </div>
        </div>
      </main>
    </div>
  )
}
