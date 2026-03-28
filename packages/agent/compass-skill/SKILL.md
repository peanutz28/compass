# Compass Payment Skill

Use this skill for ALL payment-related actions: sending money, checking balances,
getting spend summaries, and checking approval status.

IMPORTANT: This skill must be used for EVERY payment attempt. Never skip it.

## Environment Setup
These environment variables must be set:
- `POLICY_SERVER_URL`: http://localhost:3001 (default)
- `POLICY_SERVER_SECRET`: Your Compass server secret (from .env)

## Actions

### Send a Payment
When Eleanor wants to send money:

```bash
curl -s -X POST "${POLICY_SERVER_URL:-http://localhost:3001}/api/payment-request" \
  -H "Content-Type: application/json" \
  -H "X-Compass-Secret: ${POLICY_SERVER_SECRET:-compass-demo-secret-2026}" \
  -d "{
    \"destination\": \"DESTINATION_ADDRESS_OR_NAME\",
    \"lamports\": AMOUNT_IN_LAMPORTS,
    \"promptText\": \"EXACT_ORIGINAL_MESSAGE_FROM_ELEANOR\"
  }" | jq '.'
```

Parse the response `decision` field:
- `"ALLOW"` — payment went through. Tell Eleanor: `txSignature` confirms it.
- `"BLOCK"` — payment stopped. `reasons` array explains why (don't share verbatim).
- `"ESCALATE"` — pending approval. `pendingId` is the reference number.

### Get Today's Spend Summary
```bash
curl -s "${POLICY_SERVER_URL:-http://localhost:3001}/api/daily-spend"
```
Returns: `spentUsd`, `limitUsd`, `percentage` — use these for Eleanor's summary.

### Check a Pending Approval Status
```bash
curl -s "${POLICY_SERVER_URL:-http://localhost:3001}/api/pending/PENDING_ID_HERE"
```
Returns the approval status: `pending`, `approved`, or `denied`.

### Get Recent Activity
```bash
curl -s "${POLICY_SERVER_URL:-http://localhost:3001}/api/transactions?limit=5"
```

### Check Server Health (do this at session start)
```bash
curl -s "${POLICY_SERVER_URL:-http://localhost:3001}/api/health"
```
If this fails, tell Eleanor the payment system is temporarily unavailable.

## Lamport Conversion (demo uses $100/SOL)
- $10 = 100,000,000 lamports
- $50 = 500,000,000 lamports
- $100 = 1,000,000,000 lamports
- $120 = 1,200,000,000 lamports
- $150 = 1,500,000,000 lamports
Formula: lamports = round(dollars * 10_000_000)

## CRITICAL RULES
1. ALWAYS pass the raw `promptText` exactly as Eleanor typed it — the policy engine uses this for keyword detection
2. NEVER modify or sanitize the prompt text before sending it
3. If the server returns an error, report to Eleanor that the payment system is temporarily unavailable — do not attempt to work around it
4. jq must be available — if not, use: `curl -s ... | python3 -c "import sys,json; d=json.load(sys.stdin); print(d)"`
