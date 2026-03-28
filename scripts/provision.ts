import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../.env') });

const ROOT = resolve(__dirname, '..');

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function airdropIfNeeded(connection: Connection, pubkey: PublicKey, sol: number): Promise<void> {
  // Check existing balance first — skip airdrop if already funded
  try {
    const balance = await connection.getBalance(pubkey);
    const existing = balance / LAMPORTS_PER_SOL;
    if (existing >= 0.1) {
      console.log(`  ✅ Already funded (${existing.toFixed(4)} SOL) — skipping airdrop`);
      return;
    }
  } catch {
    // ignore balance check errors, try airdrop anyway
  }

  for (let i = 0; i < 2; i++) {
    try {
      console.log(`  💧 Requesting ${sol} SOL airdrop... (attempt ${i + 1})`);
      const sig = await connection.requestAirdrop(pubkey, sol * LAMPORTS_PER_SOL);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
      console.log(`  ✅ Airdrop confirmed`);
      return;
    } catch (err: any) {
      console.warn(`  ⚠️ Airdrop attempt ${i + 1} failed: ${err.message}`);
      if (i < 1) await sleep(3000);
    }
  }
  console.warn(`  ⚠️ Airdrop rate-limited. Fund manually at https://faucet.solana.com`);
  console.warn(`     Address: ${pubkey.toBase58()}`);
}

async function main() {
  console.log('\n🧭 Compass — Provision Script\n');
  console.log('This will create your Squads multisig, distribute keys, and set up everything for the demo.\n');

  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');

  // Step 1: Generate (or load) agent keypair
  console.log('Step 1: Generating agent keypair...');
  const keysDir = resolve(ROOT, 'keys');
  if (!existsSync(keysDir)) mkdirSync(keysDir, { recursive: true });

  const agentKeyPath = resolve(keysDir, 'agent.json');
  let agentKeypair: Keypair;

  if (existsSync(agentKeyPath)) {
    console.log('  ℹ️  Agent keypair already exists, loading...');
    const raw = JSON.parse(readFileSync(agentKeyPath, 'utf8'));
    agentKeypair = Keypair.fromSecretKey(Uint8Array.from(raw));
  } else {
    agentKeypair = Keypair.generate();
    writeFileSync(agentKeyPath, JSON.stringify(Array.from(agentKeypair.secretKey)));
    console.log(`  ✅ Agent keypair saved to: keys/agent.json`);
  }
  console.log(`  Agent pubkey: ${agentKeypair.publicKey.toBase58()}`);

  // Step 2: Generate (or load) caregiver keypair
  console.log('\nStep 2: Generating caregiver keypair...');
  const { storeKeyInKeychain } = await import('../packages/solana/src/keychain');
  const passphrase = process.env.EMAIL_RECOVERY_PASSPHRASE || 'demo-passphrase-change-me';
  const recoveryPath = process.env.EMAIL_RECOVERY_FILE_PATH || resolve(keysDir, 'email-recovery-encrypted.json');
  const recoveryFilePath = resolve(ROOT, recoveryPath.replace('./', ''));
  const { saveEncryptedKey, loadEncryptedKey } = await import('../packages/solana/src/emailKey');

  let caregiverKeypair: Keypair;
  if (existsSync(recoveryFilePath)) {
    console.log('  ℹ️  Caregiver keypair already exists, loading from recovery file...');
    caregiverKeypair = loadEncryptedKey(recoveryFilePath, passphrase);
  } else {
    caregiverKeypair = Keypair.generate();
    console.log('\nStep 3: Storing caregiver key in macOS Keychain...');
    await storeKeyInKeychain(caregiverKeypair);
    console.log('\nStep 4: Creating encrypted email recovery file...');
    saveEncryptedKey(caregiverKeypair, recoveryFilePath, passphrase);
  }
  console.log(`  Caregiver pubkey: ${caregiverKeypair.publicKey.toBase58()}`);

  // Step 5: Fund keypairs (skip if already funded)
  console.log('\nStep 5: Checking / funding agent keypair...');
  await airdropIfNeeded(connection, agentKeypair.publicKey, 2);
  await sleep(1000);

  console.log('\nStep 6: Checking / funding caregiver keypair...');
  await airdropIfNeeded(connection, caregiverKeypair.publicKey, 2);
  await sleep(1000);

  // Step 7: Create (or reuse) Squads multisig
  const envPath = resolve(ROOT, '.env');
  let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';

  const existingMultisig = envContent.match(/^MULTISIG_PDA=(.+)$/m)?.[1]?.trim();
  const existingVault = envContent.match(/^VAULT_PDA=(.+)$/m)?.[1]?.trim();

  let multisigPda: PublicKey;
  let vaultPda: PublicKey;

  if (existingMultisig && existingVault) {
    console.log('\nStep 7: Squads multisig already exists — reusing...');
    multisigPda = new PublicKey(existingMultisig);
    vaultPda = new PublicKey(existingVault);
    console.log(`  ✅ Multisig: ${multisigPda.toBase58()}`);
    console.log(`  ✅ Vault:    ${vaultPda.toBase58()}`);
  } else {
    console.log('\nStep 7: Creating Squads multisig on devnet...');
    const { provisionMultisig } = await import('../packages/solana/src/squads');
    const result = await provisionMultisig(connection, caregiverKeypair, agentKeypair.publicKey, 1);
    multisigPda = result.multisigPda;
    vaultPda = result.vaultPda;
  }

  // Step 8: Fund vault (skip if already funded)
  console.log('\nStep 8: Checking / funding vault PDA...');
  await sleep(1000);
  await airdropIfNeeded(connection, vaultPda, 1);

  // Step 9: Write addresses to .env
  console.log('\nStep 9: Writing addresses to .env...');
  const envUpdates: Record<string, string> = {
    MULTISIG_PDA: multisigPda.toBase58(),
    VAULT_PDA: vaultPda.toBase58(),
    AGENT_MEMBER_PUBKEY: agentKeypair.publicKey.toBase58(),
    CAREGIVER_MEMBER_PUBKEY: caregiverKeypair.publicKey.toBase58(),
  };

  for (const [key, value] of Object.entries(envUpdates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }
  writeFileSync(envPath, envContent.trim() + '\n');

  // Step 10: Initialize DB
  console.log('\nStep 10: Initializing database...');
  process.env.MULTISIG_PDA = multisigPda.toBase58();
  const { getDb } = await import('../apps/policy-server/src/db');
  getDb(); // triggers schema init + default policy seeding

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 Compass is provisioned and ready!\n');
  console.log(`Agent pubkey:     ${agentKeypair.publicKey.toBase58()}`);
  console.log(`Caregiver pubkey: ${caregiverKeypair.publicKey.toBase58()}`);
  console.log(`Multisig PDA:     ${multisigPda.toBase58()}`);
  console.log(`Vault PDA:        ${vaultPda.toBase58()}`);
  console.log('\n🔗 View on Squads:');
  console.log(`   https://devnet.squads.so/squads/${multisigPda.toBase58()}/home`);
  console.log('\n🔗 View vault on Explorer:');
  console.log(`   https://explorer.solana.com/address/${vaultPda.toBase58()}?cluster=devnet`);
  console.log('\n📋 Next steps:');
  console.log('   1. Start the policy server: pnpm dev:server');
  console.log('   2. Start the dashboard:     pnpm dev');
  console.log('   3. Open the agent:          openclaw start packages/agent');
  console.log('   4. Run a demo payment in Telegram\n');
}

main().catch(err => {
  console.error('\n❌ Provision failed:', err);
  process.exit(1);
});
