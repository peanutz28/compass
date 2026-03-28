/**
 * macOS Keychain storage using the built-in `security` CLI.
 * Equivalent to keytar but requires zero native compilation.
 * Works on macOS 10.12+. No npm packages needed beyond @solana/web3.js.
 */
import { execSync } from 'child_process';
import { Keypair } from '@solana/web3.js';

const SERVICE = process.env.KEYCHAIN_SERVICE || 'compass-app';
const ACCOUNT = process.env.KEYCHAIN_ACCOUNT || 'caregiver-key';

export async function storeKeyInKeychain(keypair: Keypair): Promise<void> {
  const secretKey = Buffer.from(keypair.secretKey).toString('base64');

  // Delete any existing entry first (ignore errors)
  try {
    execSync(
      `security delete-generic-password -s "${SERVICE}" -a "${ACCOUNT}"`,
      { stdio: 'ignore' }
    );
  } catch { /* doesn't exist yet — that's fine */ }

  // Add the new entry
  execSync(
    `security add-generic-password -s "${SERVICE}" -a "${ACCOUNT}" -w "${secretKey}"`,
    { stdio: 'inherit' }
  );

  console.log(`✅ Caregiver key stored in macOS Keychain (service: ${SERVICE}, account: ${ACCOUNT})`);
}

export async function loadKeyFromKeychain(): Promise<Keypair> {
  try {
    const secretKey = execSync(
      `security find-generic-password -s "${SERVICE}" -a "${ACCOUNT}" -w`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();

    if (!secretKey) throw new Error('Empty keychain entry');
    return Keypair.fromSecretKey(Buffer.from(secretKey, 'base64'));
  } catch (err: any) {
    throw new Error(
      `Caregiver key not found in macOS Keychain.\n` +
      `Run the provision script first: pnpm provision\n` +
      `Service: ${SERVICE}, Account: ${ACCOUNT}\n` +
      `Details: ${err.message}`
    );
  }
}

export async function deleteKeyFromKeychain(): Promise<boolean> {
  try {
    execSync(
      `security delete-generic-password -s "${SERVICE}" -a "${ACCOUNT}"`,
      { stdio: 'ignore' }
    );
    return true;
  } catch {
    return false;
  }
}
