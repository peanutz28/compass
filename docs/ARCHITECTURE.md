# Compass Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Caregiver Dashboard                          │
│                    (Next.js 14, port 3000)                      │
│  Dashboard · Activity · Approvals · Protection Rules · Settings  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP + SSE
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Policy Server                                  │
│                  (Express, port 3001)                            │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ Policy Engine│  │  SQLite DB   │  │  SSE Event Stream   │   │
│  │ (rules.ts)   │  │ (better-sq.) │  │  (real-time UI)     │   │
│  └──────────────┘  └──────────────┘  └─────────────────────┘   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ Squads SDK   │  │ OS Keychain  │  │  Email Notifier     │   │
│  │ (@sqds/mult.)│  │ (keytar)     │  │  (nodemailer)       │   │
│  └──────────────┘  └──────────────┘  └─────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │ Squads v4 SDK
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Solana Devnet                                  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Squads Protocol v4 Multisig                  │   │
│  │   Members: Agent (Initiate) + Caregiver (All)             │   │
│  │   Vault PDA: holds the SOL balance                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                         ▲
                         │ curl (shell commands in SKILL.md)
┌─────────────────────────────────────────────────────────────────┐
│                    OpenClaw Agent                                 │
│                  (webchat: localhost:18789)                      │
│                                                                   │
│  SOUL.md ─── who Eleanor's agent is and its values               │
│  AGENTS.md ─ operating rules and payment workflow                 │
│  HEARTBEAT.md ─ scheduled tasks (daily summary, etc.)            │
│  compass-skill/SKILL.md ─ how to call the policy server          │
└─────────────────────────────────────────────────────────────────┘
                         ▲
                         │ chat interface
                    Eleanor (end user)
```

## Decision Flow

```
Eleanor sends message
        │
        ▼
OpenClaw agent parses intent
        │
        ▼
compass-skill calls POST /api/payment-request
        │
        ▼
Policy Engine evaluates:
  1. Is account paused? → BLOCK
  2. Blocked address? → BLOCK
  3. Suspicious keywords? → BLOCK
  4. Daily limit exceeded? → BLOCK
  5. New recipient? → ESCALATE
  6. Above threshold? → ESCALATE
  7. All clear → ALLOW
        │
   ┌────┴────┐
   ▼         ▼         ▼
ALLOW     BLOCK     ESCALATE
   │         │         │
Execute   Log +     Log +
on Squads Notify    Notify
          caregiver caregiver
                    (pending)
                    Caregiver
                    approves via
                    dashboard →
                    Execute on
                    Squads
```

## Key Storage Architecture

```
Caregiver Key
     │
     ├── macOS Keychain (primary, via keytar)
     │   Used for: auto-execute ALLOW + caregiver approval
     │
     └── Encrypted File (recovery, AES-256-GCM)
         keys/email-recovery-encrypted.json
         Passphrase sent to caregiver email
         Used for: disaster recovery only

Agent Key
     └── keys/agent.json (JSON file on disk)
         Used for: proposing transactions on Squads
         Permission: Initiate only (cannot execute)
```

## Package Structure

```
compass/
├── apps/
│   ├── dashboard/          # Next.js 14 caregiver UI
│   └── policy-server/      # Express API + enforcement engine
├── packages/
│   ├── policy-engine/      # Shared rule evaluation logic
│   ├── solana/             # Squads SDK wrapper + key management
│   └── agent/              # OpenClaw workspace files
├── scripts/                # provision, fund, demo
└── docs/                   # This file + security model + demo guide
```
