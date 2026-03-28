import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

dotenv.config({ path: path.join(process.cwd(), '../../.env') });

import {
  getPolicy, updatePolicy, getTodaySpend, addToTodaySpend,
  logTransaction, getTransactions, savePendingApproval,
  getPendingApprovals, resolvePendingApproval
} from './db';
import { evaluatePolicy, formatSol, formatUsd } from '@compass/policy-engine';
import { compassEvents, emitEvent, addSseClient, removeSseClient } from './events';
import { notifyBlocked, notifyEscalation } from './notify';
import { loadKeyFromKeychain } from '@compass/solana';
import { proposeTransfer, approveAndExecute, getExplorerUrl } from '@compass/solana';

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET = process.env.POLICY_SERVER_SECRET || 'compass-demo-secret-2026';

app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
app.use(express.json());

// Auth middleware for agent calls
function requireSecret(req: express.Request, res: express.Response, next: express.NextFunction) {
  const secret = req.headers['x-compass-secret'];
  if (secret !== SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

function getConnection(): Connection {
  return new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
}

function getMultisigPda(): PublicKey | null {
  const pda = process.env.MULTISIG_PDA;
  if (!pda) return null;
  try { return new PublicKey(pda); } catch { return null; }
}

function getAgentKeypair(): Keypair | null {
  const keyPath = process.env.AGENT_KEYPAIR_PATH;
  if (!keyPath) return null;
  try {
    const fs = require('fs');
    const resolvedPath = path.resolve(process.cwd(), '../../', keyPath.replace('./', ''));
    const rawKey = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    return Keypair.fromSecretKey(Uint8Array.from(rawKey));
  } catch {
    return null;
  }
}

// ─── Payment Request ────────────────────────────────────────────────────────

app.post('/api/payment-request', requireSecret, async (req, res) => {
  const { destination, lamports, promptText } = req.body;

  if (!destination || !lamports || lamports <= 0) {
    res.status(400).json({ error: 'destination and lamports are required' });
    return;
  }

  const id = uuidv4();
  const requestedAt = new Date().toISOString();
  const dailySpentSoFar = getTodaySpend();
  const policy = getPolicy();

  const request = { id, destination, lamports, promptText: promptText || '', requestedAt, dailySpentSoFar };
  const decision = evaluatePolicy(request, policy);

  console.log(`\n📋 Payment Request: ${formatSol(lamports)} → ${destination}`);
  console.log(`   Decision: ${decision.action}`);

  if (decision.action === 'BLOCK') {
    logTransaction({ id, destination, lamports, promptText, status: 'blocked', reasons: decision.reasons, requestedAt });
    emitEvent('transaction_blocked', { id, destination, lamports, reasons: decision.reasons });
    notifyBlocked(destination, lamports, decision.reasons).catch(() => {});
    res.json({ decision: 'BLOCK', reasons: decision.reasons });
    return;
  }

  if (decision.action === 'ESCALATE') {
    const pendingId = decision.pendingId;

    // Try to propose on Squads
    let transactionIndex: string | undefined;
    const multisigPda = getMultisigPda();
    const agentKeypair = getAgentKeypair();

    if (multisigPda && agentKeypair) {
      try {
        const connection = getConnection();
        const destPubkey = new PublicKey(destination);
        const txIndex = await proposeTransfer(connection, agentKeypair, multisigPda, destPubkey, lamports);
        transactionIndex = txIndex.toString();
      } catch (err) {
        console.warn('⚠️ Could not propose on Squads (will retry on approval):', err);
      }
    }

    savePendingApproval({ id: pendingId, request, reasons: decision.reasons, transactionIndex });
    logTransaction({ id: pendingId, destination, lamports, promptText, status: 'pending', reasons: decision.reasons, requestedAt });
    emitEvent('approval_requested', { id: pendingId, destination, lamports, reasons: decision.reasons });
    notifyEscalation(pendingId, destination, lamports, decision.reasons).catch(() => {});

    res.json({ decision: 'ESCALATE', reasons: decision.reasons, pendingId });
    return;
  }

  // ALLOW — execute immediately
  let txSignature: string | undefined;
  const multisigPda = getMultisigPda();
  const agentKeypair = getAgentKeypair();

  if (multisigPda && agentKeypair) {
    try {
      const connection = getConnection();
      const destPubkey = new PublicKey(destination);
      const txIndex = await proposeTransfer(connection, agentKeypair, multisigPda, destPubkey, lamports);
      const caregiverKeypair = await loadKeyFromKeychain();
      txSignature = await approveAndExecute(connection, caregiverKeypair, multisigPda, txIndex);
      addToTodaySpend(lamports);
      console.log(`✅ Transaction executed: ${getExplorerUrl(txSignature)}`);
    } catch (err) {
      console.error('❌ Squads execution failed:', err);
      logTransaction({ id, destination, lamports, promptText, status: 'blocked', reasons: ['Blockchain execution failed'], requestedAt });
      res.status(500).json({ error: 'Transaction execution failed', details: String(err) });
      return;
    }
  } else {
    // Demo mode — no multisig configured yet
    console.log('⚠️ No multisig configured — simulating ALLOW (run provision script)');
    txSignature = 'SIMULATED_' + uuidv4().replace(/-/g, '');
    addToTodaySpend(lamports);
  }

  logTransaction({ id, destination, lamports, promptText, status: 'completed', txSignature, requestedAt, resolvedAt: new Date().toISOString() });
  emitEvent('transaction_completed', { id, destination, lamports, txSignature });

  res.json({ decision: 'ALLOW', txSignature, explorerUrl: txSignature ? getExplorerUrl(txSignature) : undefined });
});

// ─── Policy CRUD ─────────────────────────────────────────────────────────────

app.get('/api/policy', (req, res) => {
  res.json(getPolicy());
});

app.put('/api/policy', (req, res) => {
  const updated = updatePolicy(req.body);
  res.json(updated);
});

// ─── Transactions ─────────────────────────────────────────────────────────────

app.get('/api/transactions', (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const offset = Number(req.query.offset) || 0;
  res.json(getTransactions(limit, offset));
});

// ─── Pending Approvals ────────────────────────────────────────────────────────

app.get('/api/pending', (req, res) => {
  const status = req.query.status as string | undefined;
  res.json(getPendingApprovals(status || 'pending'));
});

app.get('/api/pending/:id', (req, res) => {
  const all = getPendingApprovals();
  const item = all.find(p => p.id === req.params.id);
  if (!item) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(item);
});

app.post('/api/pending/:id/approve', async (req, res) => {
  const all = getPendingApprovals();
  const pending = all.find(p => p.id === req.params.id);
  if (!pending) { res.status(404).json({ error: 'Not found' }); return; }
  if (pending.status !== 'pending') { res.status(400).json({ error: 'Already resolved' }); return; }

  let txSignature: string | undefined;
  const multisigPda = getMultisigPda();

  if (multisigPda && pending.transactionIndex) {
    try {
      const connection = getConnection();
      const caregiverKeypair = await loadKeyFromKeychain();
      const txIndex = BigInt(pending.transactionIndex);
      txSignature = await approveAndExecute(connection, caregiverKeypair, multisigPda, txIndex);
      addToTodaySpend(pending.request.lamports);
    } catch (err) {
      console.error('❌ Approval execution failed:', err);
      res.status(500).json({ error: 'Failed to execute on Squads', details: String(err) });
      return;
    }
  } else {
    // Demo mode — no multisig
    txSignature = 'SIMULATED_APPROVED_' + uuidv4().replace(/-/g, '');
    addToTodaySpend(pending.request.lamports);
  }

  resolvePendingApproval(req.params.id, 'approved', txSignature);
  logTransaction({
    id: req.params.id,
    destination: pending.request.destination,
    lamports: pending.request.lamports,
    status: 'approved',
    txSignature,
    requestedAt: pending.request.requestedAt,
    resolvedAt: new Date().toISOString(),
  });

  emitEvent('approval_resolved', { id: req.params.id, status: 'approved', txSignature });

  res.json({ status: 'approved', txSignature, explorerUrl: txSignature ? getExplorerUrl(txSignature) : undefined });
});

app.post('/api/pending/:id/deny', (req, res) => {
  const all = getPendingApprovals();
  const pending = all.find(p => p.id === req.params.id);
  if (!pending) { res.status(404).json({ error: 'Not found' }); return; }

  resolvePendingApproval(req.params.id, 'denied');
  logTransaction({
    id: req.params.id,
    destination: pending.request.destination,
    lamports: pending.request.lamports,
    status: 'denied',
    requestedAt: pending.request.requestedAt,
    resolvedAt: new Date().toISOString(),
  });

  emitEvent('approval_resolved', { id: req.params.id, status: 'denied' });
  res.json({ status: 'denied' });
});

// ─── Daily Spend ──────────────────────────────────────────────────────────────

app.get('/api/daily-spend', (req, res) => {
  const policy = getPolicy();
  const lamportsSpent = getTodaySpend();
  const date = new Date().toISOString().split('T')[0];
  res.json({
    date,
    lamportsSpent,
    limitLamports: policy.dailyLimitLamports,
    percentage: Math.min(100, Math.round((lamportsSpent / policy.dailyLimitLamports) * 100)),
    spentSol: (lamportsSpent / 1_000_000_000).toFixed(4),
    limitSol: (policy.dailyLimitLamports / 1_000_000_000).toFixed(4),
    spentUsd: `$${((lamportsSpent / 1_000_000_000) * 100).toFixed(2)}`,
    limitUsd: `$${((policy.dailyLimitLamports / 1_000_000_000) * 100).toFixed(2)}`,
  });
});

// ─── SSE ─────────────────────────────────────────────────────────────────────

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.flushHeaders();

  // Send a heartbeat comment every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  const handler = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  compassEvents.on('event', handler);

  req.on('close', () => {
    clearInterval(heartbeat);
    compassEvents.removeListener('event', handler);
  });
});

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🧭 Compass Policy Server running on http://localhost:${PORT}`);
  console.log(`   Dashboard: http://localhost:3000`);
  console.log(`   Solana network: ${process.env.SOLANA_NETWORK || 'devnet'}`);
  console.log(`   Multisig: ${process.env.MULTISIG_PDA || '(not provisioned — run pnpm provision)'}\n`);
});
