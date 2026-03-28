import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../.env') });

async function main() {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');

  const targets: Array<{ label: string; pubkey: string }> = [];

  if (process.env.VAULT_PDA) targets.push({ label: 'Vault PDA', pubkey: process.env.VAULT_PDA });
  if (process.env.AGENT_MEMBER_PUBKEY) targets.push({ label: 'Agent', pubkey: process.env.AGENT_MEMBER_PUBKEY });
  if (process.env.CAREGIVER_MEMBER_PUBKEY) targets.push({ label: 'Caregiver', pubkey: process.env.CAREGIVER_MEMBER_PUBKEY });

  if (targets.length === 0) {
    console.error('No addresses found in .env. Run pnpm provision first.');
    process.exit(1);
  }

  console.log('\n💧 Funding devnet accounts...\n');

  for (const { label, pubkey } of targets) {
    try {
      const pk = new PublicKey(pubkey);
      const before = await connection.getBalance(pk);
      console.log(`${label} (${pubkey.slice(0, 8)}...): ${before / LAMPORTS_PER_SOL} SOL`);

      const sig = await connection.requestAirdrop(pk, 1 * LAMPORTS_PER_SOL);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });

      const after = await connection.getBalance(pk);
      console.log(`  ✅ Now: ${after / LAMPORTS_PER_SOL} SOL (+1 SOL)\n`);
    } catch (err: any) {
      console.warn(`  ⚠️ Airdrop to ${label} failed: ${err.message}`);
      console.log(`  Try manually: https://faucet.solana.com/?wallet=${pubkey}\n`);
    }
  }
}

main().catch(console.error);
