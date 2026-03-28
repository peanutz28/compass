import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Keypair } from '@solana/web3.js';

const ALGORITHM = 'aes-256-gcm';

interface EncryptedKeyFile {
  salt: string;
  iv: string;
  authTag: string;
  data: string;
  createdAt: string;
  hint: string;
}

export function encryptKey(keypair: Keypair, passphrase: string): EncryptedKeyFile {
  const salt = crypto.randomBytes(32);
  const key = crypto.scryptSync(passphrase, salt, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const secretKey = Buffer.from(keypair.secretKey).toString('base64');
  const encrypted = Buffer.concat([cipher.update(secretKey, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted.toString('hex'),
    createdAt: new Date().toISOString(),
    hint: 'Compass caregiver recovery key — AES-256-GCM encrypted. Keep this file and your passphrase safe.',
  };
}

export function decryptKey(encryptedFile: EncryptedKeyFile, passphrase: string): Keypair {
  const { salt, iv, authTag, data } = encryptedFile;
  const key = crypto.scryptSync(passphrase, Buffer.from(salt, 'hex'), 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data, 'hex')),
    decipher.final(),
  ]);
  return Keypair.fromSecretKey(Buffer.from(decrypted.toString(), 'base64'));
}

export function saveEncryptedKey(keypair: Keypair, filePath: string, passphrase: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const encrypted = encryptKey(keypair, passphrase);
  fs.writeFileSync(filePath, JSON.stringify(encrypted, null, 2), 'utf8');
  console.log(`✅ Encrypted recovery key saved to: ${filePath}`);
}

export function loadEncryptedKey(filePath: string, passphrase: string): Keypair {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Recovery key file not found: ${filePath}\nRun provision script first.`);
  }
  const encrypted: EncryptedKeyFile = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return decryptKey(encrypted, passphrase);
}
