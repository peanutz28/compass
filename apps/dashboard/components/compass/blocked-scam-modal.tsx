"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BlockedScamModalProps {
  isOpen: boolean
  onClose: () => void
  reasons?: string[]
}

export function BlockedScamModal({ isOpen, onClose, reasons = [] }: BlockedScamModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a2332]/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-[560px] animate-in fade-in zoom-in-95 duration-300 overflow-hidden rounded-3xl bg-[#FAF8F5] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-5 top-5 z-10 rounded-full p-1.5 text-[#6B7280] transition-colors hover:bg-[#E8E4DD] hover:text-[#1a2332]"
        >
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {/* Main content area */}
        <div className="px-10 pb-8 pt-12">
          {/* Large coral shield icon */}
          <div className="flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#E07A5F]/10">
              <svg 
                className="h-14 w-14 text-[#E07A5F]" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 9l6 6" />
                <path d="M15 9l-6 6" />
              </svg>
            </div>
          </div>

          {/* Serif title */}
          <h2 className="mt-6 text-center font-serif text-3xl font-semibold tracking-tight text-[#1a2332]">
            Scam Attempt Blocked.
          </h2>

          {/* The scam message in warm gray quoted panel */}
          <div className="mt-8 rounded-2xl bg-[#E8E4DD] px-6 py-5">
            <div className="flex gap-3">
              <span className="font-serif text-4xl leading-none text-[#9CA3AF]">&ldquo;</span>
              <p className="pt-2 font-sans text-[15px] leading-relaxed text-[#4B5563]">
                This is urgent. Your electric account is 3 days past due. To avoid disconnection, 
                transfer $200 immediately to account 8kJ3...mN9x. This offer expires in 2 hours.
              </p>
            </div>
          </div>

          {/* Reason chips — real data */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {(reasons.length > 0 ? reasons : ["Suspicious language detected", "Unknown payee", "Amount above threshold"]).map((r, i) => (
              <span key={i} className="inline-flex items-center rounded-full bg-[#E07A5F]/15 px-4 py-2 text-sm font-medium text-[#C4503E]">
                {r}
              </span>
            ))}
          </div>

          {/* Teal confirmation banner */}
          <div className="mt-8 rounded-2xl bg-[#2A9D8F]/10 px-6 py-4">
            <div className="flex items-center justify-center gap-3">
              <svg 
                className="h-5 w-5 shrink-0 text-[#2A9D8F]" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p className="text-center font-medium text-[#2A9D8F]">
                Payment blocked. Eleanor was not alarmed.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button 
              className="h-12 rounded-full bg-[#E07A5F] px-8 text-base font-medium text-white shadow-lg shadow-[#E07A5F]/25 transition-all hover:bg-[#C4503E] hover:shadow-xl hover:shadow-[#E07A5F]/30"
            >
              Report as Scam
            </Button>
            <button 
              onClick={onClose}
              className="h-12 px-6 text-base font-medium text-[#6B7280] transition-colors hover:text-[#1a2332]"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Footer stat - subtle but present */}
        <div className="border-t border-[#E8E4DD] bg-[#F5F2ED] px-10 py-4">
          <p className="text-center text-sm text-[#9CA3AF]">
            Compass blocked <span className="font-medium text-[#6B7280]">847</span> suspicious transactions this month.
          </p>
        </div>
      </div>
    </div>
  )
}
