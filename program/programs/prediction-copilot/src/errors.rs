use anchor_lang::prelude::*;

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
