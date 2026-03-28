import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { CompassPolicy } from '@compass/policy-engine';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'compass.db');

let db: DatabaseSync;

export function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    initSchema();
  }
  return db;
}

function initSchema() {
  const d = getDb();

  d.exec(`
    CREATE TABLE IF NOT EXISTS policy (
      id INTEGER PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      destination TEXT NOT NULL,
      lamports INTEGER NOT NULL,
      prompt_text TEXT,
      status TEXT NOT NULL,
      reasons TEXT,
      tx_signature TEXT,
      requested_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_spend (
      date TEXT PRIMARY KEY,
      lamports_spent INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pending_approvals (
      id TEXT PRIMARY KEY,
      request_json TEXT NOT NULL,
      reasons TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      transaction_index TEXT,
      tx_signature TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );
  `);

  // Seed default policy if empty
  const existing = d.prepare('SELECT id FROM policy WHERE id = 1').get();
  if (!existing) {
    const defaultPolicy: CompassPolicy = {
      dailyLimitLamports: 1_500_000_000,         // 1.5 SOL ≈ $150 at demo price
      approvalThresholdLamports: 1_000_000_000,   // 1 SOL ≈ $100
      trustedPayees: [
        'PGE111111111111111111111111111111111111111',   // Pacific Gas & Electric (demo)
        'NETFLIX1111111111111111111111111111111111111',  // Netflix (demo)
        'SAFEWAY11111111111111111111111111111111111111', // Safeway (demo)
      ],
      blockedAddresses: [],
      blockedKeywords: ['urgent', 'gift card', 'irs', 'wire transfer', 'bail', 'expires', 'immediately', 'emergency transfer'],
      allowedPrograms: [],
      paused: false,
    };
    d.prepare('INSERT INTO policy (id, data) VALUES (?, ?)').run(1, JSON.stringify(defaultPolicy));
  }
}

export function getPolicy(): CompassPolicy {
  const d = getDb();
  const row = d.prepare('SELECT data FROM policy WHERE id = 1').get() as { data: string } | undefined;
  if (!row) throw new Error('Policy not found in database');
  return JSON.parse(row.data);
}

export function updatePolicy(updates: Partial<CompassPolicy>): CompassPolicy {
  const d = getDb();
  const current = getPolicy();
  const updated = { ...current, ...updates };
  d.prepare('UPDATE policy SET data = ? WHERE id = 1').run(JSON.stringify(updated));
  return updated;
}

export function getTodaySpend(): number {
  const d = getDb();
  const today = new Date().toISOString().split('T')[0];
  const row = d.prepare('SELECT lamports_spent FROM daily_spend WHERE date = ?').get(today) as { lamports_spent: number | bigint } | undefined;
  if (!row) return 0;
  return typeof row.lamports_spent === 'bigint' ? Number(row.lamports_spent) : row.lamports_spent;
}

export function addToTodaySpend(lamports: number): void {
  const d = getDb();
  const today = new Date().toISOString().split('T')[0];
  d.prepare(`
    INSERT INTO daily_spend (date, lamports_spent) VALUES (?, ?)
    ON CONFLICT(date) DO UPDATE SET lamports_spent = lamports_spent + ?
  `).run(today, lamports, lamports);
}

export function logTransaction(tx: {
  id: string;
  destination: string;
  lamports: number;
  promptText?: string;
  status: string;
  reasons?: string[];
  txSignature?: string;
  requestedAt: string;
  resolvedAt?: string;
}): void {
  const d = getDb();
  d.prepare(`
    INSERT OR REPLACE INTO transactions
    (id, destination, lamports, prompt_text, status, reasons, tx_signature, requested_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tx.id, tx.destination, tx.lamports, tx.promptText ?? null,
    tx.status, tx.reasons ? JSON.stringify(tx.reasons) : null,
    tx.txSignature ?? null, tx.requestedAt, tx.resolvedAt ?? null
  );
}

export function getTransactions(limit = 20, offset = 0) {
  const d = getDb();
  const rows = d.prepare(`
    SELECT * FROM transactions ORDER BY requested_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset) as any[];
  return rows.map(r => ({
    ...r,
    lamports: typeof r.lamports === 'bigint' ? Number(r.lamports) : r.lamports,
    reasons: r.reasons ? JSON.parse(r.reasons) : [],
  }));
}

export function savePendingApproval(pending: {
  id: string;
  request: any;
  reasons: string[];
  transactionIndex?: string;
}): void {
  const d = getDb();
  d.prepare(`
    INSERT INTO pending_approvals (id, request_json, reasons, status, transaction_index, created_at)
    VALUES (?, ?, ?, 'pending', ?, ?)
  `).run(
    pending.id,
    JSON.stringify(pending.request),
    JSON.stringify(pending.reasons),
    pending.transactionIndex ?? null,
    new Date().toISOString()
  );
}

export function getPendingApprovals(statusFilter?: string) {
  const d = getDb();
  let rows: any[];
  if (statusFilter) {
    rows = d.prepare('SELECT * FROM pending_approvals WHERE status = ? ORDER BY created_at DESC').all(statusFilter) as any[];
  } else {
    rows = d.prepare('SELECT * FROM pending_approvals ORDER BY created_at DESC').all() as any[];
  }
  return rows.map(r => ({
    id: r.id,
    request: JSON.parse(r.request_json),
    reasons: JSON.parse(r.reasons),
    status: r.status,
    transactionIndex: r.transaction_index,
    txSignature: r.tx_signature,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at,
  }));
}

export function resolvePendingApproval(id: string, status: 'approved' | 'denied', txSignature?: string): void {
  const d = getDb();
  d.prepare(`
    UPDATE pending_approvals SET status = ?, tx_signature = ?, resolved_at = ? WHERE id = ?
  `).run(status, txSignature ?? null, new Date().toISOString(), id);
}
