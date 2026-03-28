"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Sidebar } from "@/components/compass/sidebar"
import { RuleCard } from "@/components/compass/rule-card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wallet, CheckCircle2, Users, AlertTriangle, UserPlus, Lock, X, Plus, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchPolicy, updatePolicy, fetchPending } from "@/lib/api"

export default function RulesPage() {
  const [policy, setPolicy] = useState<any>(null)
  const [pending, setPending] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState("")
  const [newPayee, setNewPayee] = useState("")
  const [newPhrase, setNewPhrase] = useState("")
  const [localDailyLimit, setLocalDailyLimit] = useState(150)
  const [localThreshold, setLocalThreshold] = useState("100")
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [pol, pend] = await Promise.all([fetchPolicy(), fetchPending()])
      setPolicy(pol)
      setPending(pend)
      // Sync local UI state from policy
      setLocalDailyLimit(Math.round((pol.dailyLimitLamports / 1_000_000_000) * 100))
      setLocalThreshold(Math.round((pol.approvalThresholdLamports / 1_000_000_000) * 100).toString())
    } catch { /* offline */ }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const save = useCallback(async (updates: any) => {
    setIsSaving(true)
    try {
      const updated = await updatePolicy(updates)
      setPolicy(updated)
      setSavedMsg("Saved")
      setTimeout(() => setSavedMsg(""), 2000)
    } catch { setSavedMsg("Save failed") }
    finally { setIsSaving(false) }
  }, [])

  const debouncedSave = useCallback((updates: any) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => save(updates), 600)
  }, [save])

  const removePayee = (payee: string) => {
    const updated = (policy.trustedPayees || []).filter((p: string) => p !== payee)
    setPolicy({ ...policy, trustedPayees: updated })
    debouncedSave({ trustedPayees: updated })
  }

  const addPayee = () => {
    if (!newPayee.trim()) return
    const updated = [...(policy.trustedPayees || []), newPayee.trim()]
    setPolicy({ ...policy, trustedPayees: updated })
    setNewPayee("")
    save({ trustedPayees: updated })
  }

  const removeKeyword = (kw: string) => {
    const updated = (policy.blockedKeywords || []).filter((k: string) => k !== kw)
    setPolicy({ ...policy, blockedKeywords: updated })
    debouncedSave({ blockedKeywords: updated })
  }

  const addKeyword = () => {
    if (!newPhrase.trim()) return
    const updated = [...(policy.blockedKeywords || []), newPhrase.trim().toLowerCase()]
    setPolicy({ ...policy, blockedKeywords: updated })
    setNewPhrase("")
    save({ blockedKeywords: updated })
  }

  const thresholdOptions = [
    { value: "0", label: "Always (any amount)" },
    { value: "100", label: "Transactions over $100" },
    { value: "250", label: "Transactions over $250" },
    { value: "999999", label: "Only new recipients" },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar pendingCount={pending.length} />
        <main className="ml-60 min-h-screen p-8">
          <div className="mx-auto max-w-5xl">
            <div className="h-8 w-64 rounded bg-muted animate-pulse mb-2" />
            <div className="h-4 w-80 rounded bg-muted animate-pulse" />
            <div className="mt-8 grid grid-cols-2 gap-6">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          </div>
        </main>
      </div>
    )
  }

  const dailyLimitUsd = localDailyLimit
  const thresholdUsd = localThreshold === "999999" ? Infinity : Number(localThreshold)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar pendingCount={pending.length} />
      <main className="ml-60 min-h-screen p-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-foreground">Protection Rules</h1>
              <p className="mt-2 text-muted-foreground">
                Plain-English controls for Eleanor's financial safety. Changes save automatically.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {isSaving && <span className="text-muted-foreground">Saving…</span>}
              {savedMsg && <span className="text-accent flex items-center gap-1"><Save className="h-3.5 w-3.5" /> {savedMsg}</span>}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Daily Spending Limit */}
            <RuleCard icon={Wallet} title="How much can Eleanor spend each day?">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-serif font-semibold text-foreground">${dailyLimitUsd}.00</span>
                </div>
                <input type="range" min="0" max="500" value={dailyLimitUsd}
                  onChange={e => {
                    const usd = Number(e.target.value)
                    setLocalDailyLimit(usd)
                    debouncedSave({ dailyLimitLamports: usd * 10_000_000 })
                  }}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between text-xs text-muted-foreground"><span>$0</span><span>$500</span></div>
                <p className="text-sm text-muted-foreground">
                  {policy?.paused ? "⏸ All payments currently paused" : "Active limit — updates immediately"}
                </p>
              </div>
            </RuleCard>

            {/* Approval Threshold */}
            <RuleCard icon={CheckCircle2} title="When should Sarah be asked to approve?">
              <div className="space-y-3">
                {thresholdOptions.map(option => (
                  <label key={option.value} className={cn(
                    "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors",
                    localThreshold === option.value ? "border-accent bg-accent/5" : "border-border hover:bg-muted"
                  )}>
                    <div className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2",
                      localThreshold === option.value ? "border-accent bg-accent" : "border-muted-foreground"
                    )}>
                      {localThreshold === option.value && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <input type="radio" className="sr-only" checked={localThreshold === option.value}
                      onChange={() => {
                        setLocalThreshold(option.value)
                        const lamports = option.value === "0" ? 0 : option.value === "999999" ? 999_999_000_000 : Number(option.value) * 10_000_000
                        save({ approvalThresholdLamports: lamports })
                      }} />
                    <span className="text-sm font-medium text-foreground">{option.label}</span>
                  </label>
                ))}
                <p className="text-sm text-muted-foreground pt-2">You'll get a notification and can approve in seconds.</p>
              </div>
            </RuleCard>

            {/* Trusted Payees */}
            <RuleCard icon={Users} title="Who can always receive payments without approval?">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(policy?.trustedPayees || []).map((payee: string) => (
                    <span key={payee} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-foreground">
                      {payee.length > 20 ? payee.slice(0, 8) + "…" : payee}
                      <button onClick={() => removePayee(payee)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Add address or label" value={newPayee}
                    onChange={e => setNewPayee(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addPayee()}
                    className="rounded-xl" />
                  <Button onClick={addPayee} className="rounded-xl bg-accent hover:bg-accent/90 shrink-0"><Plus className="h-4 w-4" /></Button>
                </div>
                <p className="text-sm text-muted-foreground">Pre-approved — the agent never needs your permission for these payees within the daily limit.</p>
              </div>
            </RuleCard>

            {/* Blocked Phrases */}
            <RuleCard icon={AlertTriangle} title="What words should trigger an automatic block?">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(policy?.blockedKeywords || []).map((phrase: string) => (
                    <span key={phrase} className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-sm text-destructive">
                      {phrase}
                      <button onClick={() => removeKeyword(phrase)} className="text-destructive/70 hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Add a phrase to block" value={newPhrase}
                    onChange={e => setNewPhrase(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addKeyword()}
                    className="rounded-xl" />
                  <Button onClick={addKeyword} className="rounded-xl bg-destructive hover:bg-destructive/90 shrink-0"><Plus className="h-4 w-4" /></Button>
                </div>
                <p className="text-sm text-muted-foreground">If a payment request contains these words, it's blocked instantly and you're notified — no matter what.</p>
              </div>
            </RuleCard>

            {/* New Recipient Rules */}
            <RuleCard icon={UserPlus} title="What happens when Eleanor's agent tries to pay someone new?">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Require my approval for all new recipients</span>
                  <Switch
                    checked={thresholdUsd <= 100}
                    onCheckedChange={(checked) => {
                      const newThreshold = checked ? "100" : "250"
                      setLocalThreshold(newThreshold)
                      save({ approvalThresholdLamports: Number(newThreshold) * 10_000_000 })
                    }}
                    className="data-[state=checked]:bg-accent"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Eleanor can still initiate the payment — it just waits for your green light before going through.</p>
              </div>
            </RuleCard>

            {/* Emergency Pause */}
            <RuleCard icon={Lock} title="Pause all payments immediately"
              className={cn(policy?.paused && "bg-warning/5 border border-warning")}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-medium", policy?.paused ? "text-warning" : "text-foreground")}>
                    {policy?.paused ? "⏸ All payments currently paused" : "Payments running normally"}
                  </span>
                  <Switch
                    checked={policy?.paused || false}
                    onCheckedChange={(checked) => {
                      setPolicy({ ...policy, paused: checked })
                      save({ paused: checked })
                    }}
                    className="data-[state=checked]:bg-warning"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Use this if you think Eleanor's agent has been compromised or she's in an unsafe situation. You can re-enable anytime.
                </p>
              </div>
            </RuleCard>
          </div>
        </div>
      </main>
    </div>
  )
}
