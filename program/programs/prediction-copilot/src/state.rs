use anchor_lang::prelude::*;

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

impl ProgramConfig {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 1; // 106
}

#[account]
pub struct Subscription {
    pub user: Pubkey,               // Subscriber's wallet
    pub tier: u8,                   // 0 = none, 1 = basic, 2 = pro
    pub started_at: i64,            // Unix timestamp
    pub expires_at: i64,            // Unix timestamp
    pub total_paid: u64,            // Cumulative USDC paid
    pub bump: u8,
}

impl Subscription {
    pub const LEN: usize = 8 + 32 + 1 + 8 + 8 + 8 + 1; // 66
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum SubscriptionTier {
    None = 0,
    Basic = 1,
    Pro = 2,
}

#[account]
pub struct WhaleRegistry {
    pub admin: Pubkey,              // Can add/remove traders
    pub whale_count: u32,           // Number of whales tracked
    pub degen_count: u32,           // Number of degens tracked
    pub last_updated: i64,          // Last update timestamp
    pub bump: u8,
}

impl WhaleRegistry {
    pub const LEN: usize = 8 + 32 + 4 + 4 + 8 + 1; // 57
}

#[account]
pub struct TrackedTrader {
    pub polygon_address: [u8; 20],  // Ethereum/Polygon address (20 bytes)
    pub solana_address: Option<Pubkey>, // [NEW] Optional Solana address to track deposits
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

impl TrackedTrader {
    pub const LEN: usize = 8 + 20 + (1 + 32) + 1 + 8 + 2 + 4 + 8 + 4 + 8 + 8 + 8 + 1; // 113
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum TraderTier {
    Whale = 0,    // Top performers, high volume
    Shark = 1,    // Good performers
    Fish = 2,     // Average
    Shrimp = 3,   // Low activity or slight negative
    Degen = 4,    // Consistently wrong, fade these
}

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

impl PythSignal {
    pub const LEN: usize = 8 + 16 + 32 + 8 + 8 + 8 + 2 + 1 + 8 + 32 + 1; // 124
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum SignalSeverity {
    Low = 0,      // 2-3x baseline
    Medium = 1,   // 3-5x baseline
    High = 2,     // 5x+ baseline
}
