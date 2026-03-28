import { CompassPolicy, PaymentRequest, PolicyDecision } from './types';
import { v4 as uuidv4 } from 'uuid';

export function evaluatePolicy(
  request: PaymentRequest,
  policy: CompassPolicy
): PolicyDecision {
  const reasons: string[] = [];

  // 0. Emergency pause — block everything
  if (policy.paused) {
    return { action: 'BLOCK', reasons: ['All payments are currently paused by caregiver'] };
  }

  // 1. Hard block: blocked addresses
  if (policy.blockedAddresses.includes(request.destination)) {
    reasons.push('Destination address is blacklisted');
  }

  // 2. Hard block: keyword detection in prompt
  const lowerPrompt = request.promptText.toLowerCase();
  const triggeredKeywords = policy.blockedKeywords.filter(kw =>
    lowerPrompt.includes(kw.toLowerCase())
  );
  if (triggeredKeywords.length > 0) {
    reasons.push(`Suspicious language detected: "${triggeredKeywords.join('", "')}"`);
  }

  // 3. Hard block: daily limit exceeded
  const projectedSpend = request.dailySpentSoFar + request.lamports;
  if (projectedSpend > policy.dailyLimitLamports) {
    reasons.push(`Exceeds daily limit (${formatSol(policy.dailyLimitLamports)} limit, ${formatSol(request.dailySpentSoFar)} already spent)`);
  }

  // If any hard-block reasons → BLOCK immediately
  if (reasons.length > 0) {
    return { action: 'BLOCK', reasons };
  }

  // 4. Soft escalate: destination not in trusted payees
  if (!policy.trustedPayees.includes(request.destination)) {
    reasons.push('New recipient — not in trusted payees list');
  }

  // 5. Soft escalate: above approval threshold
  if (request.lamports > policy.approvalThresholdLamports) {
    reasons.push(`Amount above approval threshold (${formatSol(policy.approvalThresholdLamports)})`);
  }

  // If any soft-escalate reasons → ESCALATE
  if (reasons.length > 0) {
    return { action: 'ESCALATE', reasons, pendingId: uuidv4() };
  }

  return { action: 'ALLOW' };
}

export function lamportsToUsd(lamports: number, solPriceUsd = 100): number {
  return (lamports / 1_000_000_000) * solPriceUsd;
}

export function usdToLamports(usd: number, solPriceUsd = 100): number {
  return Math.round((usd / solPriceUsd) * 1_000_000_000);
}

export function formatSol(lamports: number): string {
  return `${(lamports / 1_000_000_000).toFixed(4)} SOL`;
}

export function formatUsd(lamports: number, solPriceUsd = 100): string {
  return `$${lamportsToUsd(lamports, solPriceUsd).toFixed(2)}`;
}
