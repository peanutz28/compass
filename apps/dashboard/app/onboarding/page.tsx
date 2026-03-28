"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Compass, Heart, ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  "Your loved one",
  "Comfort zone",
  "Trusted people",
  "Safety words",
  "Enable protection"
]

const suggestedPayees = [
  { id: "utilities", label: "Utility companies (PG&E, Con Edison, etc.)", checked: true },
  { id: "grocery", label: "Grocery delivery (Instacart, Safeway)", checked: true },
  { id: "streaming", label: "Streaming services (Netflix, Hulu)", checked: true },
  { id: "medical", label: "Doctor's office / pharmacy", checked: false },
  { id: "family", label: "Family members (add by name)", checked: false },
]

export default function OnboardingPage() {
  const [currentStep] = useState(2) // Zero-indexed, showing step 3
  const [selectedPayees, setSelectedPayees] = useState<string[]>(["utilities", "grocery", "streaming"])
  const [addedPayees, setAddedPayees] = useState(["Sarah Chen", "Dr. Martinez"])
  const [newPayee, setNewPayee] = useState("")

  const togglePayee = (id: string) => {
    setSelectedPayees(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    )
  }

  const addPayee = () => {
    if (newPayee.trim()) {
      setAddedPayees(prev => [...prev, newPayee.trim()])
      setNewPayee("")
    }
  }

  const removePayee = (payee: string) => {
    setAddedPayees(prev => prev.filter(p => p !== payee))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
            <Compass className="h-5 w-5 text-accent" />
          </div>
          <span className="font-serif text-2xl font-semibold text-primary">Compass</span>
        </div>

        {/* Progress */}
        <div className="mb-12">
          {/* Progress bar */}
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  index <= currentStep ? "bg-accent" : "bg-muted"
                )}
              />
            ))}
          </div>
          {/* Step labels */}
          <div className="mt-4 flex justify-between">
            {steps.map((step, index) => (
              <span 
                key={step}
                className={cn(
                  "text-xs",
                  index === currentStep 
                    ? "font-medium text-accent" 
                    : index < currentStep 
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50"
                )}
              >
                {step}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-2xl bg-card p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Who can always receive payments?
          </h1>
          <p className="mt-2 text-muted-foreground">
            Add people and businesses Eleanor pays regularly. The agent will never need your permission for these.
          </p>

          {/* Suggested payees */}
          <div className="mt-8 space-y-3">
            {suggestedPayees.map((payee) => (
              <label 
                key={payee.id}
                className={cn(
                  "flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-colors",
                  selectedPayees.includes(payee.id)
                    ? "border-accent bg-accent/5"
                    : "border-border hover:bg-muted"
                )}
              >
                <Checkbox 
                  checked={selectedPayees.includes(payee.id)}
                  onCheckedChange={() => togglePayee(payee.id)}
                  className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                />
                <span className="text-sm text-foreground">{payee.label}</span>
              </label>
            ))}
          </div>

          {/* Manual add */}
          <div className="mt-6">
            <p className="text-sm font-medium text-muted-foreground mb-3">Add a person or business</p>
            <div className="flex gap-2">
              <Input 
                placeholder="Enter name..."
                value={newPayee}
                onChange={(e) => setNewPayee(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPayee()}
                className="rounded-xl"
              />
              <Button 
                onClick={addPayee}
                className="rounded-xl bg-accent hover:bg-accent/90 shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span className="ml-2">Add</span>
              </Button>
            </div>

            {/* Added payees */}
            {addedPayees.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {addedPayees.map((payee) => (
                  <span 
                    key={payee}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-sm text-accent"
                  >
                    {payee}
                    <button 
                      onClick={() => removePayee(payee)}
                      className="text-accent/70 hover:text-accent"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Reassurance note */}
          <div className="mt-8 rounded-xl bg-accent/5 p-4">
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 shrink-0 text-accent" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">
                You can always add or remove people later. Eleanor&apos;s protections are always active.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Button 
            variant="outline" 
            className="gap-2 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Step 3 of 5 — Trusted People
          </span>
          
          <Button 
            className="gap-2 rounded-full bg-accent hover:bg-accent/90"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
