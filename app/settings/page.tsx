"use client"

import { Sidebar } from "@/components/compass/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { 
  User, 
  Bell, 
  Smartphone, 
  Mail, 
  Shield, 
  Heart,
  Compass,
  ChevronRight,
  LogOut
} from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-60 min-h-screen p-8">
        <div className="mx-auto max-w-2xl">
          {/* Page Header */}
          <div>
            <h1 className="font-serif text-3xl font-semibold text-foreground">
              Settings
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage your account and notification preferences
            </p>
          </div>

          {/* Profile Section */}
          <div className="mt-8">
            <h2 className="font-serif text-lg font-semibold text-foreground">Profile</h2>
            <div className="mt-4 rounded-2xl bg-card p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
                  SC
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Sarah Chen</p>
                  <p className="text-sm text-muted-foreground">Primary Caregiver for Eleanor</p>
                </div>
                <Button variant="outline" className="rounded-full">
                  Edit Profile
                </Button>
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <Input 
                    value="sarah.chen@email.com" 
                    className="mt-1.5 rounded-xl" 
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Phone</label>
                  <Input 
                    value="+1 (555) 123-4567" 
                    className="mt-1.5 rounded-xl" 
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="mt-8">
            <h2 className="font-serif text-lg font-semibold text-foreground">Notifications</h2>
            <div className="mt-4 rounded-2xl bg-card p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                      <Bell className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Get alerts on your phone</p>
                    </div>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-accent" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                      <Smartphone className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">SMS Alerts</p>
                      <p className="text-sm text-muted-foreground">Text messages for urgent events</p>
                    </div>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-accent" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                      <Mail className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Email Digests</p>
                      <p className="text-sm text-muted-foreground">Daily summary of activity</p>
                    </div>
                  </div>
                  <Switch className="data-[state=checked]:bg-accent" />
                </div>
              </div>
            </div>
          </div>

          {/* Protected Person Section */}
          <div className="mt-8">
            <h2 className="font-serif text-lg font-semibold text-foreground">Protected Person</h2>
            <div className="mt-4 rounded-2xl bg-card p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                    <Heart className="h-7 w-7 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Eleanor Chen</p>
                    <p className="text-sm text-muted-foreground">Mother · Protected since Jan 2024</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="mt-6 rounded-xl bg-accent/5 p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-accent">Protection Active</p>
                    <p className="text-sm text-muted-foreground">12 trusted payees · 8 safety rules</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="mt-8">
            <h2 className="font-serif text-lg font-semibold text-foreground">About</h2>
            <div className="mt-4 rounded-2xl bg-card p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <Compass className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-serif text-lg font-semibold text-primary">Compass</p>
                  <p className="text-sm text-muted-foreground">Version 1.0.0</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Financial protection for your loved ones. Built with love and care.
              </p>
            </div>
          </div>

          {/* Sign Out */}
          <div className="mt-8 pb-8">
            <Button 
              variant="outline" 
              className="w-full gap-2 rounded-full border-destructive text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
