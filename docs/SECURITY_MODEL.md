# Compass Security Model

## Overview

Compass uses a layered security architecture to protect Eleanor's finances even if individual components are compromised.

## Key Distribution

Two keypairs are created during provisioning:

### Agent Key (`keys/agent.json`)
- Stored as a JSON file on disk
- Used by the OpenClaw agent to **propose** transactions to the Squads multisig
- Has `Initiate` permission only — it can propose but cannot execute alone
- Think of it as the agent's pen: it can write the check but cannot cash it

### Caregiver Key (split across two backends)

**Backend 1 — macOS Keychain (primary)**
- Stored using `keytar` in the system keychain
- Used by the policy server to auto-execute within-policy transactions (ALLOW path)
- Used by the caregiver dashboard approval flow (ESCALATE path)

**Backend 2 — Encrypted Recovery File (`keys/email-recovery-encrypted.json`)**
- The same private key, encrypted with AES-256-GCM using `scrypt` key derivation
- The encryption passphrase is sent to the caregiver's email during provisioning
- Recovery only — used if the OS keychain entry is lost
- File alone is useless without the passphrase

## Threat Model

### What happens if the agent's machine is compromised?
The attacker gets `keys/agent.json`, giving them the agent's private key. However:
- The agent key can only **propose** transactions, not execute them
- Squads requires the caregiver key to approve and execute
- All proposed transactions are visible in the dashboard immediately
- The caregiver can pause all payments instantly from the dashboard

**Result: No funds can be stolen.** The attacker can propose transactions that will be visible to the caregiver.

### What happens if the OS keychain is compromised?
The attacker gets the caregiver's private key. However:
- They still need the agent key to **propose** a transaction first
- Without the agent key, they cannot create a valid Squads transaction to approve
- The agent key is on a separate machine

**Result: No funds can be stolen from keychain compromise alone** (requires combining with agent key compromise).

### What happens if the encrypted recovery file is stolen?
The attacker has an encrypted blob. Without the passphrase (sent to caregiver email), it cannot be decrypted. AES-256-GCM with scrypt key derivation is computationally infeasible to brute-force.

**Result: No key exposure** without the passphrase.

### What about the policy server secret?
The `POLICY_SERVER_SECRET` authenticates the OpenClaw agent to the policy server. If compromised, an attacker could send payment requests as if they were the agent. However:
- All requests still pass through the policy engine (keyword detection, daily limits, trusted payees)
- ALLOW decisions still require the agent key on Squads
- The caregiver receives notifications for every blocked or escalated transaction

## Defense in Depth

```
Agent Request
    ↓
Policy Engine (keyword detection, daily limits, trusted payees)
    ↓ ALLOW
Squads Propose (agent key required)
    ↓
Squads Approve + Execute (caregiver key required)
    ↓
On-chain transfer
```

No single key or secret gives an attacker the ability to drain funds.

## What Compass Does NOT Protect Against

- Physical access to both the agent machine AND the caregiver's email/phone simultaneously
- Social engineering of the caregiver to manually approve a malicious transaction
- Bugs in the Squads Protocol smart contract itself (use audited versions only)
- Solana network-level attacks (outside scope)
