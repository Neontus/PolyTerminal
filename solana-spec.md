# Prediction Terminal — Solana/On-Chain Specification

**Owner:** On-Chain Engineer (Person B)  
**Timeline:** 7 days  
**Network:** Solana Devnet

---

## Overview

The Solana program handles:

1. **User Subscriptions** — Pay USDC to unlock premium features
2. **Whale Registry** — On-chain record of tracked Polymarket wallets
3. **Pyth Signal Publications** — Record detected anomalies on-chain

The program does NOT handle trading execution (that's on Polygon).

---

## Table of Contents

1. [Program Architecture](#1-program-architecture)
2. [Account Structures](#2-account-structures)
3. [Instructions](#3-instructions)
4. [Pyth Integration](#4-pyth-integration)
5. [USDC Handling](#5-usdc-handling)
6. [Error Codes](#6-error-codes)
7. [Events](#7-events)
8. [Testing Plan](#8-testing-plan)
9. [Deployment](#9-deployment)
10. [Integration Points](#10-integration-points)

---

## 1. Program Architecture

### Design Principles

- **Minimal on-chain logic** — Heavy computation happens off-chain
- **PDAs for everything** — Deterministic addresses, no keypair management
- **USDC only** — No native SOL payments (cleaner UX)
- **No admin upgrades** — Program is immutable after deploy (hackathon scope)

### Account Hierarchy

```
Program
├── ProgramConfig (1 global)
│   └── Treasury address, fee settings
│
├── Subscriptions (1 per user)
│   └── [subscription, user_pubkey]
│
├── WhaleRegistry (1 global)
│   └── Metadata about the registry
│
├── TrackedTrader (1 per tracked wallet)
│   └── [trader, polygon_address_hash]
│
└── PythSignal (1 per published signal)
    └── [signal, asset, timestamp]
```

---

## 2. Account Structures

### 2.1 ProgramConfig

Single global config account.

```rust
#[account]
pub struct ProgramConfig {
    pub admin: Pubkey,              // Can update config
    pub treasury: Pubkey,           // Receives subscription payments
    pub basic_price: u64,           // Price in USDC (6 decimals) e.g., 5_000_000 = $5
    pub pro_price: u64,             // e.g., 20_000_000 = $20
    pub basic_duration: i64,        // Seconds, e.g., 2592000 = 30 days
    pub pro_duration: i64,          
    pub paused: bool,               // Emergency pause
    pub bump: u8,
}
```

**Seeds:** `["config"]`

**Space:** 8 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 1 = **106 bytes**

---

### 2.2 Subscription

One per user.

```rust
#[account]
pub struct Subscription {
    pub user: Pubkey,               // Subscriber's wallet
    pub tier: u8,                   // 0 = none, 1 = basic, 2 = pro
    pub started_at: i64,            // Unix timestamp
    pub expires_at: i64,            // Unix timestamp
    pub total_paid: u64,            // Cumulative USDC paid
    pub bump: u8,
}
```

**Seeds:** `["subscription", user.key().as_ref()]`

**Space:** 8 + 32 + 1 + 8 + 8 + 8 + 1 = **66 bytes**

**Tier Enum:**
```rust
pub enum SubscriptionTier {
    None = 0,
    Basic = 1,
    Pro = 2,
}
```

---

### 2.3 WhaleRegistry

Global registry metadata.

```rust
#[account]
pub struct WhaleRegistry {
    pub admin: Pubkey,              // Can add/remove traders
    pub whale_count: u32,           // Number of whales tracked
    pub degen_count: u32,           // Number of degens tracked
    pub last_updated: i64,          // Last update timestamp
    pub bump: u8,
}
```

**Seeds:** `["registry"]`

**Space:** 8 + 32 + 4 + 4 + 8 + 1 = **57 bytes**

---

### 2.4 TrackedTrader

One per tracked Polymarket wallet.

```rust
#[account]
pub struct TrackedTrader {
    pub polygon_address: [u8; 20],  // Ethereum/Polygon address (20 bytes)
    pub tier: u8,                   // 0 = whale, 1 = shark, 2 = fish, 3 = shrimp, 4 = degen
    pub total_pnl: i64,             // Scaled by 1e6 (can be negative)
    pub win_rate: u16,              // Basis points (7500 = 75.00%)
    pub trade_count: u32,           // Total trades
    pub total_volume: u64,          // Total $ volume (scaled 1e6)
    pub roi: i32,                   // Basis points, can be negative (-500 = -5%)
    pub last_trade_at: i64,         // Unix timestamp
    pub added_at: i64,              // When added to registry
    pub updated_at: i64,            // Last stats update
    pub bump: u8,
}
```

**Seeds:** `["trader", polygon_address.as_ref()]`

**Space:** 8 + 20 + 1 + 8 + 2 + 4 + 8 + 4 + 8 + 8 + 8 + 1 = **80 bytes**

**Tier Enum:**
```rust
pub enum TraderTier {
    Whale = 0,    // Top performers, high volume
    Shark = 1,    // Good performers
    Fish = 2,     // Average
    Shrimp = 3,   // Low activity or slight negative
    Degen = 4,    // Consistently wrong, fade these
}
```

---

### 2.5 PythSignal

One per detected anomaly.

```rust
#[account]
pub struct PythSignal {
    pub asset: [u8; 16],            // Asset name, e.g., "BTC/USD" (padded)
    pub pyth_feed: Pubkey,          // Pyth feed account
    pub price: i64,                 // Price at detection (Pyth format)
    pub confidence: u64,            // Confidence at detection
    pub baseline_confidence: u64,   // Normal confidence for comparison
    pub multiplier: u16,            // How many x above baseline (300 = 3x)
    pub severity: u8,               // 0 = low, 1 = medium, 2 = high
    pub detected_at: i64,           // Unix timestamp
    pub publisher: Pubkey,          // Backend wallet that published
    pub bump: u8,
}
```

**Seeds:** `["signal", asset.as_ref(), &detected_at.to_le_bytes()]`

**Space:** 8 + 16 + 32 + 8 + 8 + 8 + 2 + 1 + 8 + 32 + 1 = **124 bytes**

**Severity Enum:**
```rust
pub enum SignalSeverity {
    Low = 0,      // 2-3x baseline
    Medium = 1,   // 3-5x baseline
    High = 2,     // 5x+ baseline
}
```

---

## 3. Instructions

### 3.1 initialize_config

**Purpose:** One-time setup of program config.

**Signer:** Admin (deployer)

**Accounts:**
```rust
#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        init,
        payer = admin,
        space = 8 + 106,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, ProgramConfig>,
    
    /// CHECK: Treasury address, validated by admin
    pub treasury: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}
```

**Args:**
```rust
pub fn initialize_config(
    ctx: Context<InitializeConfig>,
    basic_price: u64,      // e.g., 5_000_000 (5 USDC)
    pro_price: u64,        // e.g., 20_000_000 (20 USDC)
    basic_duration: i64,   // e.g., 2592000 (30 days)
    pro_duration: i64,     // e.g., 2592000 (30 days)
) -> Result<()>
```

**Logic:**
1. Set admin = signer
2. Set treasury
3. Set prices and durations
4. Set paused = false
5. Set bump

---

### 3.2 subscribe

**Purpose:** User pays USDC to start/extend subscription.

**Signer:** User

**Accounts:**
```rust
#[derive(Accounts)]
pub struct Subscribe<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 66,
        seeds = [b"subscription", user.key().as_ref()],
        bump
    )]
    pub subscription: Account<'info, Subscription>,
    
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = !config.paused @ ErrorCode::ProgramPaused
    )]
    pub config: Account<'info, ProgramConfig>,
    
    #[account(
        mut,
        constraint = user_usdc.owner == user.key(),
        constraint = user_usdc.mint == usdc_mint.key()
    )]
    pub user_usdc: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = treasury_usdc.owner == config.treasury,
        constraint = treasury_usdc.mint == usdc_mint.key()
    )]
    pub treasury_usdc: Account<'info, TokenAccount>,
    
    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
```

**Args:**
```rust
pub fn subscribe(
    ctx: Context<Subscribe>,
    tier: u8,  // 1 = basic, 2 = pro
) -> Result<()>
```

**Logic:**
1. Validate tier is 1 or 2
2. Get price from config based on tier
3. Transfer USDC from user to treasury
4. Calculate new expiry:
   - If new subscription: now + duration
   - If extending: max(now, current_expiry) + duration
5. Update subscription account

---

### 3.3 check_subscription

**Purpose:** Read-only check of subscription status. (Can also just fetch account directly)

**Note:** This is optional—frontend can just fetch the PDA directly. Include if you want a standardized way to check.

---

### 3.4 initialize_registry

**Purpose:** One-time setup of whale registry.

**Signer:** Admin

**Accounts:**
```rust
#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.admin == admin.key() @ ErrorCode::Unauthorized
    )]
    pub config: Account<'info, ProgramConfig>,
    
    #[account(
        init,
        payer = admin,
        space = 8 + 57,
        seeds = [b"registry"],
        bump
    )]
    pub registry: Account<'info, WhaleRegistry>,
    
    pub system_program: Program<'info, System>,
}
```

**Logic:**
1. Verify admin
2. Initialize registry with zero counts
3. Set admin and bump

---

### 3.5 add_trader

**Purpose:** Add a Polymarket wallet to tracking registry.

**Signer:** Admin (or authorized backend wallet)

**Accounts:**
```rust
#[derive(Accounts)]
#[instruction(polygon_address: [u8; 20])]
pub struct AddTrader<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.admin == admin.key() @ ErrorCode::Unauthorized
    )]
    pub config: Account<'info, ProgramConfig>,
    
    #[account(
        mut,
        seeds = [b"registry"],
        bump = registry.bump
    )]
    pub registry: Account<'info, WhaleRegistry>,
    
    #[account(
        init,
        payer = admin,
        space = 8 + 80,
        seeds = [b"trader", polygon_address.as_ref()],
        bump
    )]
    pub trader: Account<'info, TrackedTrader>,
    
    pub system_program: Program<'info, System>,
}
```

**Args:**
```rust
pub fn add_trader(
    ctx: Context<AddTrader>,
    polygon_address: [u8; 20],
    tier: u8,
    total_pnl: i64,
    win_rate: u16,
    trade_count: u32,
    total_volume: u64,
    roi: i32,
) -> Result<()>
```

**Logic:**
1. Verify admin
2. Create trader account with provided stats
3. Increment whale_count or degen_count in registry based on tier
4. Set timestamps

---

### 3.6 update_trader

**Purpose:** Update stats for an existing tracked trader.

**Signer:** Admin

**Accounts:**
```rust
#[derive(Accounts)]
#[instruction(polygon_address: [u8; 20])]
pub struct UpdateTrader<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.admin == admin.key() @ ErrorCode::Unauthorized
    )]
    pub config: Account<'info, ProgramConfig>,
    
    #[account(
        mut,
        seeds = [b"trader", polygon_address.as_ref()],
        bump = trader.bump
    )]
    pub trader: Account<'info, TrackedTrader>,
}
```

**Args:**
```rust
pub fn update_trader(
    ctx: Context<UpdateTrader>,
    polygon_address: [u8; 20],
    tier: u8,
    total_pnl: i64,
    win_rate: u16,
    trade_count: u32,
    total_volume: u64,
    roi: i32,
    last_trade_at: i64,
) -> Result<()>
```

**Logic:**
1. Verify admin
2. Update all stats fields
3. Set updated_at = now

---

### 3.7 remove_trader

**Purpose:** Remove a trader from registry.

**Signer:** Admin

**Accounts:**
```rust
#[derive(Accounts)]
#[instruction(polygon_address: [u8; 20])]
pub struct RemoveTrader<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.admin == admin.key() @ ErrorCode::Unauthorized
    )]
    pub config: Account<'info, ProgramConfig>,
    
    #[account(
        mut,
        seeds = [b"registry"],
        bump = registry.bump
    )]
    pub registry: Account<'info, WhaleRegistry>,
    
    #[account(
        mut,
        close = admin,
        seeds = [b"trader", polygon_address.as_ref()],
        bump = trader.bump
    )]
    pub trader: Account<'info, TrackedTrader>,
}
```

**Logic:**
1. Verify admin
2. Decrement appropriate count in registry
3. Close trader account (rent returned to admin)

---

### 3.8 publish_signal

**Purpose:** Record a Pyth confidence anomaly on-chain.

**Signer:** Publisher (backend wallet)

**Accounts:**
```rust
#[derive(Accounts)]
#[instruction(asset: [u8; 16], detected_at: i64)]
pub struct PublishSignal<'info> {
    #[account(mut)]
    pub publisher: Signer<'info>,
    
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.admin == publisher.key() @ ErrorCode::Unauthorized
    )]
    pub config: Account<'info, ProgramConfig>,
    
    #[account(
        init,
        payer = publisher,
        space = 8 + 124,
        seeds = [b"signal", asset.as_ref(), &detected_at.to_le_bytes()],
        bump
    )]
    pub signal: Account<'info, PythSignal>,
    
    /// CHECK: Pyth price feed account, validated in instruction
    pub pyth_feed: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}
```

**Args:**
```rust
pub fn publish_signal(
    ctx: Context<PublishSignal>,
    asset: [u8; 16],
    detected_at: i64,
    price: i64,
    confidence: u64,
    baseline_confidence: u64,
    multiplier: u16,
    severity: u8,
) -> Result<()>
```

**Logic:**
1. Verify publisher is admin
2. Optionally verify Pyth feed is valid (read current price to confirm)
3. Store all signal data
4. Emit event

---

## 4. Pyth Integration

### Reading Pyth On-Chain

For the `publish_signal` instruction, you can optionally read from Pyth to verify the data:

```rust
use pyth_solana_receiver_sdk::price_update::PriceUpdateV2;

// In your instruction:
let price_feed = &ctx.accounts.pyth_feed;
let price_data = PriceUpdateV2::try_deserialize(&mut &price_feed.data.borrow()[..])?;

let current_price = price_data.price_message.price;
let current_conf = price_data.price_message.conf;
```

### Pyth Feed Addresses (Devnet)

| Asset | Devnet Feed ID |
|-------|----------------|
| BTC/USD | `HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J` |
| ETH/USD | `EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw` |
| SOL/USD | `J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix` |

### Dependency

```toml
[dependencies]
pyth-solana-receiver-sdk = "0.1.0"
```

### Note on Pyth Integration

For hackathon, you have two options:

**Option A: Trust the backend (simpler)**
- Backend detects anomaly off-chain using Pyth Hermes API
- Backend publishes signal with data
- On-chain program just stores it
- No on-chain Pyth verification

**Option B: Verify on-chain (more robust)**
- Backend passes Pyth feed account
- Program reads current Pyth data
- Verifies it roughly matches what backend claims
- More complex, more trustless

**Recommendation:** Option A for hackathon. Note in docs that Option B is the production path.

---

## 5. USDC Handling

### USDC Mint Addresses

| Network | USDC Mint |
|---------|-----------|
| Devnet | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |
| Mainnet | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |

### Transfer Pattern

```rust
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

// Inside subscribe instruction:
let cpi_accounts = Transfer {
    from: ctx.accounts.user_usdc.to_account_info(),
    to: ctx.accounts.treasury_usdc.to_account_info(),
    authority: ctx.accounts.user.to_account_info(),
};

let cpi_ctx = CpiContext::new(
    ctx.accounts.token_program.to_account_info(),
    cpi_accounts
);

token::transfer(cpi_ctx, amount)?;
```

### Dependencies

```toml
[dependencies]
anchor-spl = "0.29.0"
```

### Treasury Setup

Before program works:
1. Create treasury wallet (regular Solana keypair)
2. Create Associated Token Account for USDC
3. Use that ATA address in `initialize_config`

---

## 6. Error Codes

```rust
#[error_code]
pub enum ErrorCode {
    #[msg("Program is paused")]
    ProgramPaused,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Invalid subscription tier")]
    InvalidTier,
    
    #[msg("Invalid trader tier")]
    InvalidTraderTier,
    
    #[msg("Invalid signal severity")]
    InvalidSeverity,
    
    #[msg("Insufficient USDC balance")]
    InsufficientBalance,
    
    #[msg("Subscription expired")]
    SubscriptionExpired,
    
    #[msg("Trader already exists")]
    TraderAlreadyExists,
    
    #[msg("Trader not found")]
    TraderNotFound,
    
    #[msg("Invalid Pyth feed")]
    InvalidPythFeed,
    
    #[msg("Signal timestamp too old")]
    SignalTooOld,
}
```

---

## 7. Events

```rust
#[event]
pub struct SubscriptionCreated {
    pub user: Pubkey,
    pub tier: u8,
    pub amount: u64,
    pub expires_at: i64,
}

#[event]
pub struct SubscriptionExtended {
    pub user: Pubkey,
    pub tier: u8,
    pub amount: u64,
    pub new_expires_at: i64,
}

#[event]
pub struct TraderAdded {
    pub polygon_address: [u8; 20],
    pub tier: u8,
    pub added_at: i64,
}

#[event]
pub struct TraderUpdated {
    pub polygon_address: [u8; 20],
    pub tier: u8,
    pub total_pnl: i64,
    pub win_rate: u16,
}

#[event]
pub struct TraderRemoved {
    pub polygon_address: [u8; 20],
}

#[event]
pub struct SignalPublished {
    pub asset: [u8; 16],
    pub price: i64,
    pub confidence: u64,
    pub multiplier: u16,
    pub severity: u8,
    pub detected_at: i64,
}
```

---

## 8. Testing Plan

### Unit Tests (Anchor Test)

| Test | What It Verifies |
|------|------------------|
| `test_initialize_config` | Config PDA created with correct values |
| `test_subscribe_basic` | Basic subscription works, USDC transferred |
| `test_subscribe_pro` | Pro subscription works |
| `test_subscribe_extend` | Extending subscription adds time correctly |
| `test_subscribe_insufficient_balance` | Fails with insufficient USDC |
| `test_subscribe_paused` | Fails when program paused |
| `test_initialize_registry` | Registry PDA created |
| `test_add_trader_whale` | Whale added, count incremented |
| `test_add_trader_degen` | Degen added, count incremented |
| `test_update_trader` | Stats updated correctly |
| `test_remove_trader` | Trader removed, rent returned, count decremented |
| `test_publish_signal` | Signal PDA created with correct data |
| `test_unauthorized` | Non-admin cannot call admin functions |

### Integration Test Flow

```typescript
describe("Full Flow", () => {
    it("initializes program", async () => {
        // Initialize config
        // Initialize registry
    });
    
    it("user subscribes", async () => {
        // Airdrop USDC to user (devnet)
        // Call subscribe
        // Verify subscription PDA
        // Verify USDC transferred
    });
    
    it("admin adds traders", async () => {
        // Add whale
        // Add degen
        // Verify registry counts
    });
    
    it("backend publishes signal", async () => {
        // Publish signal
        // Verify signal PDA
    });
    
    it("frontend checks access", async () => {
        // Fetch subscription PDA
        // Verify tier and expiry
    });
});
```

### Devnet Testing

```bash
# Build
anchor build

# Test locally
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Get program ID
solana address -k target/deploy/terminal-keypair.json
```

---

## 9. Deployment

### Pre-Deployment Checklist

- [ ] All tests pass locally
- [ ] Program ID updated in `declare_id!`
- [ ] Anchor.toml configured for devnet
- [ ] Wallet has SOL for deployment (~3 SOL)
- [ ] USDC mint address correct for devnet

### Deployment Commands

```bash
# Configure for devnet
solana config set --url devnet

# Check balance
solana balance

# Airdrop if needed
solana airdrop 2

# Build
anchor build

# Deploy
anchor deploy

# Note the program ID from output
```

### Post-Deployment

1. **Initialize config:**
```bash
anchor run initialize
# Or via script that calls initialize_config
```

2. **Initialize registry:**
```bash
anchor run init-registry
```

3. **Fund treasury ATA:**
- Create ATA for treasury wallet
- Note: Treasury doesn't need USDC, it just receives it

4. **Share with frontend:**
- Program ID
- IDL (from `target/idl/terminal.json`)
- Config PDA address
- USDC mint address

### Environment Variables

```bash
# .env for backend
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=<your_program_id>
ADMIN_KEYPAIR_PATH=./admin-keypair.json
USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

---

## 10. Integration Points

### Frontend Integration

**Check subscription:**
```typescript
import { PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';

async function checkSubscription(
    program: Program,
    userPubkey: PublicKey
): Promise<{ tier: number; expiresAt: Date } | null> {
    const [subscriptionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("subscription"), userPubkey.toBuffer()],
        program.programId
    );
    
    try {
        const subscription = await program.account.subscription.fetch(subscriptionPda);
        return {
            tier: subscription.tier,
            expiresAt: new Date(subscription.expiresAt.toNumber() * 1000),
        };
    } catch {
        return null; // No subscription
    }
}
```

**Subscribe:**
```typescript
async function subscribe(
    program: Program,
    userPubkey: PublicKey,
    tier: number, // 1 or 2
    userUsdcAta: PublicKey,
    treasuryUsdcAta: PublicKey
): Promise<string> {
    const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
    );
    
    const [subscriptionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("subscription"), userPubkey.toBuffer()],
        program.programId
    );
    
    const tx = await program.methods
        .subscribe(tier)
        .accounts({
            user: userPubkey,
            subscription: subscriptionPda,
            config: configPda,
            userUsdc: userUsdcAta,
            treasuryUsdc: treasuryUsdcAta,
            usdcMint: USDC_MINT,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        })
        .rpc();
    
    return tx;
}
```

### Backend Integration

**Publish signal:**
```typescript
async function publishSignal(
    program: Program,
    adminKeypair: Keypair,
    asset: string,
    price: number,
    confidence: number,
    baselineConfidence: number,
    multiplier: number,
    severity: number
): Promise<string> {
    const detectedAt = Math.floor(Date.now() / 1000);
    const assetBytes = Buffer.alloc(16);
    assetBytes.write(asset);
    
    const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
    );
    
    const [signalPda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("signal"),
            assetBytes,
            new BN(detectedAt).toArrayLike(Buffer, 'le', 8)
        ],
        program.programId
    );
    
    const tx = await program.methods
        .publishSignal(
            Array.from(assetBytes),
            new BN(detectedAt),
            new BN(price),
            new BN(confidence),
            new BN(baselineConfidence),
            multiplier,
            severity
        )
        .accounts({
            publisher: adminKeypair.publicKey,
            config: configPda,
            signal: signalPda,
            pythFeed: PYTH_BTC_FEED, // or appropriate feed
            systemProgram: SystemProgram.programId,
        })
        .signers([adminKeypair])
        .rpc();
    
    return tx;
}
```

**Add trader:**
```typescript
async function addTrader(
    program: Program,
    adminKeypair: Keypair,
    polygonAddress: string, // "0x..." format
    tier: number,
    stats: TraderStats
): Promise<string> {
    // Convert polygon address to bytes
    const addressBytes = Buffer.from(polygonAddress.slice(2), 'hex');
    
    const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
    );
    
    const [registryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("registry")],
        program.programId
    );
    
    const [traderPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("trader"), addressBytes],
        program.programId
    );
    
    const tx = await program.methods
        .addTrader(
            Array.from(addressBytes),
            tier,
            new BN(stats.totalPnl),
            stats.winRate,
            stats.tradeCount,
            new BN(stats.totalVolume),
            stats.roi
        )
        .accounts({
            admin: adminKeypair.publicKey,
            config: configPda,
            registry: registryPda,
            trader: traderPda,
            systemProgram: SystemProgram.programId,
        })
        .signers([adminKeypair])
        .rpc();
    
    return tx;
}
```

---

## Summary: What to Build

### Day 1-2: Foundation
- [ ] Anchor project setup
- [ ] Account structures defined
- [ ] `initialize_config` instruction
- [ ] `subscribe` instruction
- [ ] Basic tests passing

### Day 3-4: Registry
- [ ] `initialize_registry` instruction
- [ ] `add_trader` instruction
- [ ] `update_trader` instruction
- [ ] `remove_trader` instruction
- [ ] Registry tests passing

### Day 5: Signals
- [ ] `publish_signal` instruction
- [ ] Events emitting correctly
- [ ] All tests passing

### Day 6: Deploy + Integrate
- [ ] Deploy to devnet
- [ ] Share IDL with frontend
- [ ] Test integration
- [ ] Fix issues

### Day 7: Polish
- [ ] Error handling
- [ ] Edge cases
- [ ] Documentation
- [ ] Demo prep

---

## File Structure

```
anchor/
├── programs/
│   └── terminal/
│       ├── src/
│       │   ├── lib.rs           # Main program file
│       │   ├── state.rs         # Account structures (optional, can be in lib.rs)
│       │   ├── instructions/    # (optional, can be in lib.rs)
│       │   │   ├── mod.rs
│       │   │   ├── config.rs
│       │   │   ├── subscription.rs
│       │   │   ├── registry.rs
│       │   │   └── signal.rs
│       │   └── errors.rs        # Error codes
│       └── Cargo.toml
├── tests/
│   └── terminal.ts
├── migrations/
│   └── deploy.ts
├── Anchor.toml
└── package.json
```

For hackathon, putting everything in `lib.rs` is fine. It'll be ~400-500 lines.

---

*End of Solana/On-Chain Specification*
