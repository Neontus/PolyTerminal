import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Create an Anchor program client for Prediction Copilot
 *
 * @param connection - Solana connection
 * @param programId - Program public key
 * @param provider - Anchor provider (optional, will create read-only if not provided)
 * @returns Typed Anchor program instance
 */
export function createPredictionCopilotClient(
  connection: Connection,
  programId: PublicKey,
  provider?: AnchorProvider
) {
  // Import will be available after sync-idl script runs
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const idl = require('./generated/idl.json');

  if (provider) {
    return new Program(idl, programId, provider);
  }

  // Read-only client (for indexer, API, etc.)
  const readOnlyProvider = {
    connection,
  };

  return new Program(idl, programId, readOnlyProvider as any);
}

/**
 * Derive PDA for analyst profile
 */
export function deriveAnalystProfilePDA(
  programId: PublicKey,
  analyst: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('analyst'), analyst.toBuffer()],
    programId
  );
}

/**
 * Derive PDA for signal
 */
export function deriveSignalPDA(
  programId: PublicKey,
  analyst: PublicKey,
  signalId: number
): [PublicKey, number] {
  const signalIdBuffer = Buffer.alloc(8);
  signalIdBuffer.writeBigUInt64LE(BigInt(signalId));

  return PublicKey.findProgramAddressSync(
    [Buffer.from('signal'), analyst.toBuffer(), signalIdBuffer],
    programId
  );
}

/**
 * Derive PDA for signal access
 */
export function deriveSignalAccessPDA(
  programId: PublicKey,
  signal: PublicKey,
  consumer: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('access'), signal.toBuffer(), consumer.toBuffer()],
    programId
  );
}

/**
 * Derive PDA for program config
 */
export function deriveProgramConfigPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('config')], programId);
}
