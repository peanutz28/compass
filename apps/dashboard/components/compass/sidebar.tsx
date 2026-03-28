"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Activity, 
  Shield, 
  Bell, 
  Settings,
  Compass
} from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/rules", label: "Protection Rules", icon: Shield },
  { href: "/approvals", label: "Approvals", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
]

interface SidebarProps {
  pendingCount?: number
}

export function Sidebar({ pendingCount = 0 }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
            <Compass className="h-5 w-5 text-accent" />
          </div>
          <span className="font-serif text-xl font-semibold text-primary">Compass</span>
        </div>
        <p className="mt-1.5 text-sm text-secondary">Eleanor&apos;s Protection</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-accent/10 text-accent" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={1.5} />
                  <span>{item.label}</span>
                  {item.href === "/approvals" && pendingCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1.5 text-xs font-semibold text-warning-foreground">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Caregiver Profile */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            SC
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Sarah Chen</p>
            <p className="text-xs text-muted-foreground">Primary Caregiver</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
