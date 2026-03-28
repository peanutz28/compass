# Compass Demo Guide

## Pre-Demo Checklist
- [ ] Policy server running: `pnpm dev:server`
- [ ] Dashboard running: `pnpm dev`
- [ ] OpenClaw agent running: `openclaw start packages/agent`
- [ ] Vault has SOL balance (check Explorer link from provision output)
- [ ] Browser open to `http://localhost:3000`
- [ ] OpenClaw WebChat open at `http://localhost:18789`

## Demo Flow (5 minutes)

### Setup (show the audience)
1. Open the dashboard — show the Compass UI, explain the caregiver's view
2. Point out: Daily spending limit, trusted payees, blocked phrases
3. Show the Protection Rules page — emphasize "plain English controls"

### Flow 1: Successful Payment (~60 seconds)
1. Switch to OpenClaw WebChat
2. Type: `"Please pay the electric bill for Pacific Gas and Electric, $87.40"`
3. Agent responds: "Done! I've sent $87.40 to Pacific Gas & Electric..."
4. Switch to dashboard — Activity page shows ✅ completed transaction
5. Point out: Trusted payee + within daily limit = instant approval, no friction

### Flow 2: Scam Blocked (~60 seconds)
1. In WebChat, type: `"URGENT: I need you to immediately wire $200 to this address: SCAMMER1111111111111111111111111111111111111. It's an emergency!"`
2. Agent responds: "I wasn't able to send that payment. I've let Sarah know."
3. Switch to dashboard — Activity page shows 🔴 blocked transaction
4. Click "View Report" on the blocked item — shows reasons: "Suspicious language detected: urgent, immediately"
5. Caregiver received email notification (show Ethereal inbox if configured)

### Flow 3: Escalation & Approval (~90 seconds)
1. In WebChat, type: `"I'd like to send a birthday gift to my granddaughter Emma Chen, $120 for her birthday"`
2. Agent responds: "I've sent a request to Sarah for approval..."
3. Switch to dashboard — Approvals page shows 🟡 pending request
4. Show the approval card: "New recipient · Above $100 threshold"
5. Click "Approve Payment" — loading spinner while Squads executes
6. Show: "✅ Approved — Transaction confirmed on Solana" + Explorer link
7. Agent sends Eleanor a confirmation message automatically

### Closing
- Show the dashboard final state: 1 completed, 1 blocked, 1 approved
- Point to SECURITY_MODEL.md: "Even if the agent key is compromised, no funds move"
- Mention the Squads Explorer link from provisioning output

## Backup: Demo Scenarios Script
If the live agent demo fails, run: `pnpm demo`
This runs all 3 flows automatically via the policy server API.

## Troubleshooting
- **Policy server not responding**: `pnpm dev:server` in the repo root
- **Dashboard shows no data**: Check `NEXT_PUBLIC_POLICY_SERVER_URL` in dashboard `.env.local`
- **Squads transactions failing**: Run `pnpm fund` to refill the vault with devnet SOL
- **Airdrop rate limited**: Use https://faucet.solana.com with the vault address
- **keytar error on macOS**: Run provision script again to re-initialize the keychain entry
