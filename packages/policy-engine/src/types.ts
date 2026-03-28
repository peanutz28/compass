export interface CompassPolicy {
  dailyLimitLamports: number;          // e.g., 1.5 SOL = 1_500_000_000
  approvalThresholdLamports: number;   // above this = needs caregiver approval
  trustedPayees: string[];             // list of base58 public keys OR display names
  blockedAddresses: string[];          // always-deny list
  blockedKeywords: string[];           // e.g., ["urgent", "gift card", "IRS", "bail"]
  allowedPrograms: string[];           // whitelist of Solana program IDs
  paused: boolean;                     // emergency pause all payments
}

export type PolicyDecision =
  | { action: 'ALLOW' }
  | { action: 'BLOCK'; reasons: string[] }
  | { action: 'ESCALATE'; reasons: string[]; pendingId: string };

export interface PaymentRequest {
  id: string;
  destination: string;        // base58 pubkey or display name
  lamports: number;
  promptText: string;         // raw text that triggered this payment
  requestedAt: string;        // ISO timestamp
  dailySpentSoFar: number;    // lamports spent today already
}

export interface PendingApproval {
  id: string;
  request: PaymentRequest;
  reasons: string[];
  status: 'pending' | 'approved' | 'denied';
  transactionIndex?: string;  // BigInt stored as string
  txSignature?: string;
  resolvedAt?: string;
}

export interface TransactionRecord {
  id: string;
  destination: string;
  lamports: number;
  promptText?: string;
  status: 'completed' | 'blocked' | 'pending' | 'approved' | 'denied';
  reasons?: string[];
  txSignature?: string;
  requestedAt: string;
  resolvedAt?: string;
}

export interface DailySpend {
  date: string;
  lamportsSpent: number;
  limitLamports: number;
  percentage: number;
}
