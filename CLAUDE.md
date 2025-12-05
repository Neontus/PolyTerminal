# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Prediction Copilot is a Solana-native prediction market intelligence platform with three layers:
1. **Intelligence Layer**: Aggregates Polymarket data and computes quantitative signals (z-score, momentum, volatility)
2. **Attestation Layer**: Records predictions on-chain with Pyth oracle price snapshots for immutable proof
3. **Marketplace Layer**: USDC-based signal marketplace with on-chain access control

**Target**: MBC Hackathon - Solana + Polymarket + Circle/USDC bounties

## Repository Structure

This is a monorepo with three main components:

```
/
├── program/              # Anchor program (Rust)
│   ├── programs/
│   │   └── prediction-copilot/
│   │       └── src/
│   │           ├── lib.rs
│   │           ├── instructions/
│   │           ├── state/
│   │           └── errors.rs
│   ├── tests/
│   └── Anchor.toml
├── backend/              # Node.js API + Indexer
│   ├── src/
│   │   ├── api/         # REST endpoints
│   │   ├── indexer/     # On-chain event listener
│   │   ├── services/    # Signal computation, Polymarket fetcher
│   │   └── db/          # PostgreSQL models
│   └── package.json
└── frontend/             # React + Vite
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── hooks/
    │   ├── services/    # Anchor program client
    │   └── types/
    └── package.json
```

## Build & Development Commands

### Anchor Program

```bash
# From /program directory
anchor build                           # Compile program
anchor test                            # Run integration tests
anchor deploy --provider.cluster devnet # Deploy to devnet

# Get program ID after build
solana address -k target/deploy/prediction_copilot-keypair.json

# Common Solana CLI
solana config set --url devnet
solana airdrop 2
solana balance
```

### Backend

```bash
# From /backend directory
npm install
npm run dev              # Start API server (port 3001)
npm run indexer          # Start event indexer
npm run db:migrate       # Run PostgreSQL migrations
npm run db:seed          # Seed test data

# Environment setup
cp .env.example .env     # Configure RPC, program ID, database URL
```

### Frontend

```bash
# From /frontend directory
npm install
npm run dev              # Start Vite dev server (port 5173)
npm run build            # Production build
npm run preview          # Preview production build
```

## Architecture & Design Principles

### On-Chain Program (Anchor)

**4 PDA Account Types:**
1. `AnalystProfile` - Seeds: `["analyst", analyst_pubkey]`
2. `Signal` - Seeds: `["signal", analyst_pubkey, signal_id_bytes]`
3. `SignalAccess` - Seeds: `["access", signal_pda, consumer_pubkey]`
4. `ProgramConfig` - Seeds: `["config"]`

**4 Core Instructions:**
- `init_analyst` - Create analyst profile
- `publish_signal` - Record signal with Pyth price snapshot
- `purchase_signal` - USDC payment + create access PDA
- `resolve_signal` - Mark outcome, update accuracy stats

**Critical Constraints:**
- All signals are immutable after creation
- market_id limited to 64 chars
- direction must be -1 (NO), 0 (NEUTRAL), or 1 (YES)
- confidence must be 0-100
- Pyth price must be < 60 seconds old when publishing
- Cannot resolve already-resolved signals

**Events Emitted:**
- `SignalPublished`, `SignalPurchased`, `SignalResolved`, `AnalystCreated`
- Backend indexer relies on these for real-time updates

### Backend Architecture

**Data Sources:**
- Polymarket API: `https://clob.polymarket.com/markets`
- Solana RPC: On-chain signal data via event indexing
- Pyth Hermes: Real-time price feeds

**Signal Computation (Off-Chain):**
```
z_score = (current_price - mean_30d) / std_dev_30d
momentum = (price_now - price_7d_ago) / price_7d_ago * 100
volatility = std_dev(daily_returns_14d) * sqrt(365)
```

**Indexer Design:**
- Poll program transactions every 5 seconds
- Parse logs for events
- Update PostgreSQL database
- Push updates via WebSocket to frontend

**Database Tables:**
- `analysts` - Denormalized profile data
- `signals` - All published signals with computed metrics
- `purchases` - Signal access records
- `markets` - Cached Polymarket data
- `price_history` - Historical prices for computation

### Frontend Architecture

**State Management:**
- Zustand for global state
- React Query for server data caching
- @solana/wallet-adapter for wallet state

**Access Control Pattern:**
```typescript
// For each signal, check in order:
1. signal.price_usdc === 0 → public, show full details
2. connected_wallet === signal.analyst → owner, show full details
3. SignalAccess PDA exists for (signal, wallet) → purchased, show full details
4. Else → show preview + "Unlock for X USDC" button
```

**Transaction Building:**
```typescript
// Use Anchor Program class
const tx = await program.methods
  .publishSignal(params)
  .accounts({ ... })
  .remainingAccounts([pythPriceAccount]) // Pyth oracle account
  .rpc();
```

### Integration Points

**Pyth Oracle:**
- Price feeds read during `publish_signal` instruction
- Stored in Signal PDA for future verification
- Devnet BTC/USD feed: `HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J`

**USDC Payments:**
- Devnet USDC Mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- Decimals: 6 (1 USDC = 1,000,000 units)
- 97.5% to analyst, 2.5% platform fee

**Polymarket API:**
- Fetch markets: `GET /markets?limit=50`
- Returns: id, question, currentPrice, volume, endDate
- No auth required for public endpoints

## Key Technical Decisions

**Off-chain signal computation** - Complex math in backend saves compute units; Pyth price is the verifiable on-chain anchor

**Per-signal PDAs** - Better parallelism than single account; follows standard patterns

**Events over account polling** - More efficient for indexer; enables real-time WebSocket updates

**Manual resolution (MVP)** - Simple admin resolution for hackathon; document upgrade path to oracle-based auto-resolution

**String market_id** - Improves debuggability vs hashing; 64 char limit is reasonable

## Development Workflow

### Phase 1: Foundation (Days 1-2)
Focus on Anchor program core (accounts + basic instructions). Test locally with `anchor test`.

### Phase 2: Marketplace (Days 3-4)
Implement USDC payment flow, access control PDAs, event emission. Validate on devnet.

### Phase 3: Backend (Days 3-4, parallel)
Build data pipeline: Polymarket fetcher → signal computation → API → indexer.

### Phase 4: Frontend (Days 4-5)
End-to-end flow: wallet connection → browse markets → publish signal → purchase signal.

### Phase 5: Polish (Days 6-7)
Error handling, loading states, deploy to stable devnet, demo video, documentation.

## Environment Variables

### Backend (.env)
```
POLYMARKET_API_URL=https://clob.polymarket.com
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=<deployed_program_id>
DATABASE_URL=postgresql://...
PYTH_PRICE_FEED_BTC=HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J
```

### Frontend (.env)
```
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_PROGRAM_ID=<deployed_program_id>
VITE_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
VITE_API_URL=http://localhost:3001
```

## Testing Strategy

**Anchor Program:**
- Unit tests for each instruction in `tests/`
- Test PDA derivation correctness
- Validate all error conditions
- Test USDC transfer CPI calls

**Backend:**
- Test signal computation accuracy
- Mock Polymarket API responses
- Test indexer event parsing
- Validate database constraints

**Frontend:**
- Test wallet connection flow
- Test transaction building
- Test access control logic
- Manual E2E testing on devnet

## Common Pitfalls

**Pyth Integration:**
- Always check price age (< 60 seconds)
- Pass Pyth account as `remainingAccounts`, not in `accounts` macro
- Store both price and exponent for correct decimal handling

**USDC Transfers:**
- Use `init_if_needed` for analyst token accounts
- Check token program is correct (not Token-2022)
- Handle decimal conversion (1 USDC = 1_000_000 units)

**PDA Derivation:**
- Signal ID must be converted to bytes with correct endianness
- Always store and verify bump seeds
- Use `find_program_address` in tests, `bump` in program

**Event Indexing:**
- Events are in transaction logs, not account data
- Must parse base64-encoded event data
- Handle transaction failures gracefully (no events emitted)

## Deployment Checklist

- [ ] Build Anchor program: `anchor build`
- [ ] Deploy to devnet: `anchor deploy --provider.cluster devnet`
- [ ] Copy program ID to backend/frontend env files
- [ ] Initialize ProgramConfig account (set treasury, fee)
- [ ] Deploy backend to hosting service
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Test full flow on devnet with real wallets
- [ ] Record demo video (≤3 minutes)
- [ ] Verify transaction on Solana Explorer

## Hackathon Submission Requirements

- Public GitHub repository with complete code
- Professional README with setup instructions
- Demo video (≤3 minutes)
- Deployed devnet program ID
- Technical summary: problem, architecture, Solana tools used
- Working demo on devnet

## Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Pyth Network Docs](https://docs.pyth.network/)
- [Polymarket API](https://docs.polymarket.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [SPL Token Program](https://spl.solana.com/token)
