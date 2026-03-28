import * as multisig from '@sqds/multisig';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

const { Permission, Permissions } = multisig.types;

export async function provisionMultisig(
  connection: Connection,
  creator: Keypair,
  agentMember: PublicKey,
  threshold: number = 1
): Promise<{ multisigPda: PublicKey; vaultPda: PublicKey; createKey: Keypair }> {
  const createKey = Keypair.generate();
  const [multisigPda] = multisig.getMultisigPda({ createKey: createKey.publicKey });
  const [vaultPda] = multisig.getVaultPda({ multisigPda, index: 0 });

  const programConfigPda = multisig.getProgramConfigPda({})[0];
  const programConfig = await multisig.accounts.ProgramConfig.fromAccountAddress(
    connection,
    programConfigPda
  );

  console.log('Creating Squads multisig...');
  await multisig.rpc.multisigCreateV2({
    connection,
    treasury: programConfig.treasury,
    createKey,
    creator,
    multisigPda,
    configAuthority: creator.publicKey,
    threshold,
    members: [
      {
        key: creator.publicKey,
        permissions: Permissions.all(),
      },
      {
        key: agentMember,
        permissions: Permissions.fromPermissions([Permission.Initiate]),
      },
    ],
    timeLock: 0,
    sendOptions: { skipPreflight: true },
  });

  console.log(`✅ Multisig created: ${multisigPda.toBase58()}`);
  console.log(`✅ Vault PDA: ${vaultPda.toBase58()}`);

  return { multisigPda, vaultPda, createKey };
}

export async function proposeTransfer(
  connection: Connection,
  agentKeypair: Keypair,
  multisigPda: PublicKey,
  destination: PublicKey,
  lamports: number
): Promise<bigint> {
  const [vaultPda] = multisig.getVaultPda({ multisigPda, index: 0 });

  const instruction = SystemProgram.transfer({
    fromPubkey: vaultPda,
    toPubkey: destination,
    lamports,
  });

  const transferMessage = new TransactionMessage({
    payerKey: vaultPda,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions: [instruction],
  });

  const multisigInfo = await multisig.accounts.Multisig.fromAccountAddress(connection, multisigPda);
  const newTransactionIndex = BigInt(Number(multisigInfo.transactionIndex) + 1);

  await multisig.rpc.vaultTransactionCreate({
    connection,
    feePayer: agentKeypair,
    multisigPda,
    transactionIndex: newTransactionIndex,
    creator: agentKeypair.publicKey,
    vaultIndex: 0,
    ephemeralSigners: 0,
    transactionMessage: transferMessage,
    sendOptions: { skipPreflight: true },
  });

  await multisig.rpc.proposalCreate({
    connection,
    feePayer: agentKeypair,
    multisigPda,
    transactionIndex: newTransactionIndex,
    creator: agentKeypair,
    sendOptions: { skipPreflight: true },
  });

  await multisig.rpc.proposalApprove({
    connection,
    feePayer: agentKeypair,
    multisigPda,
    transactionIndex: newTransactionIndex,
    member: agentKeypair,
    sendOptions: { skipPreflight: true },
  });

  console.log(`📤 Transaction proposed at index: ${newTransactionIndex}`);
  return newTransactionIndex;
}

export async function approveAndExecute(
  connection: Connection,
  caregiverKeypair: Keypair,
  multisigPda: PublicKey,
  transactionIndex: bigint
): Promise<string> {
  await multisig.rpc.proposalApprove({
    connection,
    feePayer: caregiverKeypair,
    multisigPda,
    transactionIndex,
    member: caregiverKeypair,
    sendOptions: { skipPreflight: true },
  });

  const sig = await multisig.rpc.vaultTransactionExecute({
    connection,
    feePayer: caregiverKeypair,
    multisigPda,
    transactionIndex,
    member: caregiverKeypair.publicKey,
    signers: [caregiverKeypair],
    sendOptions: { skipPreflight: true },
  });

  console.log(`✅ Transaction executed: ${sig}`);
  return sig;
}

export async function executeWithinPolicy(
  connection: Connection,
  caregiverKeypair: Keypair,
  multisigPda: PublicKey,
  transactionIndex: bigint
): Promise<string> {
  // For within-policy transactions (ALLOW path): caregiver auto-approves and executes
  return approveAndExecute(connection, caregiverKeypair, multisigPda, transactionIndex);
}

export function getExplorerUrl(signature: string, network: string = 'devnet'): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${network}`;
}

export async function airdropSol(
  connection: Connection,
  pubkey: PublicKey,
  sol: number = 2
): Promise<void> {
  console.log(`💧 Airdropping ${sol} SOL to ${pubkey.toBase58()}...`);
  const sig = await connection.requestAirdrop(pubkey, sol * LAMPORTS_PER_SOL);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
  console.log(`✅ Airdrop confirmed: ${sig}`);
}
