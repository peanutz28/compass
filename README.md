# Compass — Caregiver-Controlled AI Agent Accounts on Solana

> "Not a cage. A compass."

## What It Does

Compass is a financial safety layer that lets a caregiver (Sarah) control what an AI agent can do with an older adult's (Eleanor's) money. The agent can propose payments; the Squads Protocol multisig on Solana ensures no funds move without following the caregiver's policy rules.

## The Problem It Solves

Older adults are the #1 target of financial scams. AI agents that manage finances on their behalf create a new attack surface — a compromised agent could drain an account. Compass puts a policy engine and a caregiver in the loop between every AI payment request and the blockchain, without making Eleanor feel surveilled or restricted.

## Architecture

```
Eleanor speaks to OpenClaw agent (localhost:18789)
         │
         │ curl (SKILL.md shell commands)
         ▼
  Policy Server (Express :3001)
  ┌─────────────────────────────────┐
  │  Policy Engine (rule evaluation) │
  │  SQLite (transaction log)        │
  │  SSE (real-time dashboard feed)  │
  └───────┬──────────────┬──────────┘
          │              │
    ALLOW │        ESCALATE/BLOCK
          │              │
    Squads SDK      Notify caregiver
          │         (email + dashboard)
          ▼
  Solana Devnet Multisig
  Agent key: Initiate only
  Caregiver key: Approve + Execute
         │
         ▼
  Caregiver Dashboard (Next.js :3000)
  Dashboard · Activity · Approvals · Rules
```

## Security Model

Two keys protect Eleanor's vault:

**Agent key** (`keys/agent.json`) — The hot key Eleanor's AI agent uses to *propose* transactions on Squads. It has `Initiate` permission only. Even if stolen, it cannot execute any transaction alone.

**Caregiver key** — Split across two backends:
- macOS Keychain (primary, via `keytar`) — used for auto-executing within-policy transactions
- Encrypted recovery file (`keys/email-recovery-encrypted.json`, AES-256-GCM) — for disaster recovery only; passphrase emailed to caregiver at provisioning time

**→ No single key compromise = no drained account.** An attacker needs both keys to move funds. See `docs/SECURITY_MODEL.md` for the full threat model.

## Quick Start

### Prerequisites

```bash
node >= 18
pnpm >= 8        # npm install -g pnpm
```

### Installation

```bash
git clone <this-repo>
cd compass
pnpm install
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env — the provision script will fill in the Solana addresses automatically
```

### Provisioning (run once)

This creates your Squads multisig on devnet, generates and distributes keys, and funds the vault.

```bash
pnpm provision
```

The script will print your multisig PDA and a Squads Explorer link when done.

### Running the Demo

**Terminal 1 — Policy server:**
```bash
pnpm dev:server
```

**Terminal 2 — Dashboard:**
```bash
pnpm dev
# Open http://localhost:3000
```

**Terminal 3 — Run demo scenarios (or use the OpenClaw agent):**
```bash
pnpm demo
```

### OpenClaw Agent Setup

```bash
# Install OpenClaw globally
npm install -g openclaw

# Start the agent (uses packages/agent/ config)
openclaw start packages/agent

# Open the WebChat
open http://localhost:18789
```

Talk to Eleanor's agent naturally: *"Please pay the electric bill, $87.40"*

---

## Demo Flows

### Flow 1: Successful Payment ✅
Eleanor asks to pay Pacific Gas & Electric $87.40. Trusted payee + within daily limit → instant execution on Squads, no caregiver friction.

### Flow 2: Scam Blocked 🔴
Eleanor receives a message: "URGENT: transfer $200 immediately to this address." The policy engine detects "urgent" and "immediately," blocks the payment, notifies Sarah.

### Flow 3: Escalation & Approval 🟡→✅
Eleanor wants to send a $120 birthday gift to her granddaughter (new recipient, above threshold). Sarah gets notified, reviews in the dashboard, clicks Approve — transaction executes on Squads, Explorer link returned.

---

## Policy Engine

The policy engine evaluates every payment request against these rules (in priority order):

1. **Emergency pause** — blocks everything if Sarah has paused payments
2. **Blocked addresses** — hard block on a deny-list
3. **Keyword detection** — blocks if prompt contains suspicious words (urgent, gift card, IRS, etc.)
4. **Daily limit** — blocks if today's spend would exceed the limit
5. **New recipient** — escalates for caregiver approval if destination isn't trusted
6. **Approval threshold** — escalates if amount exceeds threshold

ALLOW → auto-executed via Squads. ESCALATE → held pending caregiver approval. BLOCK → stopped, Sarah notified.

---

## OpenClaw Integration

The OpenClaw agent uses four config files in `packages/agent/`:

| File | Purpose |
|------|---------|
| `SOUL.md` | Eleanor's assistant personality and hard limits |
| `AGENTS.md` | Payment workflow and operating rules |
| `HEARTBEAT.md` | Scheduled daily summaries and check-ins |
| `compass-skill/SKILL.md` | How to call the policy server via curl |

The agent communicates with the policy server via HTTP — it never touches Solana directly.

---

## Supported Storage Backends

| Backend | Status | Notes |
|---------|--------|-------|
| macOS Keychain | ✅ Real | Uses `keytar` |
| Encrypted file | ✅ Real | AES-256-GCM, scrypt KDF |
| iCloud Keychain | 🟡 Planned | Architecture placeholder |
| Hardware wallet (Ledger) | 🟡 Planned | Architecture placeholder |

---

## Extending Compass

**Adding a new storage backend:** Implement `storeKey(keypair)` and `loadKey()` functions following the interface in `packages/solana/src/keychain.ts`, then add it as a fallback in the provision script.

**Adding a new rule type:** Add the rule to `packages/policy-engine/src/rules.ts`'s `evaluatePolicy` function. Rules run in sequence — hard blocks first, soft escalations second.

**Adding a new agent framework:** The policy server is framework-agnostic. Any agent that can make HTTP requests and pass the `X-Compass-Secret` header can use it. Point the agent at `POST /api/payment-request`.

---

## Bounty Checklist

- [x] Squads Protocol v4 multisig on devnet (real, verifiable on-chain)
- [x] Agent key (Initiate only) + Caregiver key (full permissions) — proper permission model
- [x] OS keychain storage (macOS Keychain via keytar)
- [x] Encrypted email recovery file (AES-256-GCM)
- [x] Policy engine with keyword detection, daily limits, trusted payees, blocklist
- [x] Real-time caregiver dashboard (SSE, live updates)
- [x] Three complete demo flows (ALLOW, BLOCK, ESCALATE→APPROVE)
- [x] OpenClaw agent integration (SOUL.md, AGENTS.md, SKILL.md)
- [x] Email notifications via SMTP (Ethereal mock)
- [x] SQLite transaction log
- [x] Caregiver approval UI with Solana Explorer link on confirmation
