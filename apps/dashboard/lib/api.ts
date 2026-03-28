const BASE = process.env.NEXT_PUBLIC_POLICY_SERVER_URL || 'http://localhost:3001';

export async function fetchPolicy() {
  const res = await fetch(`${BASE}/api/policy`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch policy');
  return res.json();
}

export async function updatePolicy(updates: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/policy`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update policy');
  return res.json();
}

export async function fetchTransactions(limit = 20, offset = 0) {
  const res = await fetch(`${BASE}/api/transactions?limit=${limit}&offset=${offset}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function fetchPending() {
  const res = await fetch(`${BASE}/api/pending`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch pending');
  return res.json();
}

export async function fetchPendingById(id: string) {
  const res = await fetch(`${BASE}/api/pending/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

export async function approvePending(id: string) {
  const res = await fetch(`${BASE}/api/pending/${id}/approve`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to approve');
  return res.json();
}

export async function denyPending(id: string) {
  const res = await fetch(`${BASE}/api/pending/${id}/deny`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to deny');
  return res.json();
}

export async function fetchDailySpend() {
  const res = await fetch(`${BASE}/api/daily-spend`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch daily spend');
  return res.json();
}

/** $1 = 10,000,000 lamports (demo: 1 SOL = $100) */
export function lamportsToUsd(lamports: number): string {
  return `$${((lamports / 1_000_000_000) * 100).toFixed(2)}`;
}

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (date.toDateString() === today.toDateString()) return `Today, ${timeStr}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeStr}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${timeStr}`;
}
