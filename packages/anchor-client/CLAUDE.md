# Anchor Client Package

This package contains the generated Anchor IDL and TypeScript types for the Prediction Copilot Solana program, along with helper utilities for interacting with the program.

## Purpose

- Provides type-safe program client for backend and frontend
- Centralizes PDA derivation logic
- Auto-generated from Anchor program build

## Structure

```
src/
├── generated/          # Auto-generated files (DO NOT EDIT)
│   ├── idl.json       # Program IDL
│   ├── types.ts       # TypeScript types
│   └── README.md      # Generation instructions
├── client.ts          # Client factory and PDA helpers
└── index.ts           # Public exports
```

## IDL Generation Workflow

### After Program Changes

Whenever you modify the Anchor program (account structures, instructions, errors), regenerate the IDL:

```bash
# From repository root
pnpm run sync-idl
```

This script:
1. Builds the Anchor program: `cd program && anchor build`
2. Copies IDL: `program/target/idl/prediction_copilot.json` → `src/generated/idl.json`
3. Copies types: `program/target/types/prediction_copilot.ts` → `src/generated/types.ts`

### What Triggers Regeneration

- New instruction added/modified
- Account structure changed (new fields, renamed fields)
- Error codes updated
- Event definitions changed

## Usage in Apps

### Backend (Indexer/API)

```typescript
import { createPredictionCopilotClient, deriveSignalPDA } from '@packages/anchor-client';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection(process.env.SOLANA_RPC_URL!);
const programId = new PublicKey(process.env.PROGRAM_ID!);

// Read-only client (no wallet needed)
const program = createPredictionCopilotClient(connection, programId);

// Derive PDA
const analyst = new PublicKey('...');
const [signalPDA, bump] = deriveSignalPDA(programId, analyst, 0);

// Fetch account
const signalAccount = await program.account.signal.fetch(signalPDA);
```

### Frontend (Transaction Building)

```typescript
import { createPredictionCopilotClient, deriveAnalystProfilePDA } from '@packages/anchor-client';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';

function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const provider = new AnchorProvider(connection, wallet, {});
  const programId = new PublicKey(import.meta.env.VITE_PROGRAM_ID);

  return createPredictionCopilotClient(connection, programId, provider);
}

// In component
const program = useProgram();
const [profilePDA] = deriveAnalystProfilePDA(program.programId, wallet.publicKey);

await program.methods
  .initAnalyst()
  .accounts({
    analyst: wallet.publicKey,
    analystProfile: profilePDA,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## PDA Derivation Helpers

### `deriveAnalystProfilePDA(programId, analyst)`
Seeds: `["analyst", analyst_pubkey]`

### `deriveSignalPDA(programId, analyst, signalId)`
Seeds: `["signal", analyst_pubkey, signal_id_bytes]`
Note: signalId is u64, converted to 8-byte buffer

### `deriveSignalAccessPDA(programId, signal, consumer)`
Seeds: `["access", signal_pda, consumer_pubkey]`

### `deriveProgramConfigPDA(programId)`
Seeds: `["config"]`

## Dependencies

- `@coral-xyz/anchor` - Anchor framework client
- `@solana/web3.js` - Solana web3 library

Consumers (backend/frontend) should have these as peer dependencies.

## Common Issues

**Error: Cannot find module './generated/idl.json'**
- Solution: Run `pnpm run sync-idl` to generate IDL files

**Type errors after program changes**
- Solution: Rebuild program and run `pnpm run sync-idl`

**PDA mismatch errors**
- Check seed order matches program exactly
- Verify signalId endianness (LE)
- Ensure bump is stored and used correctly
