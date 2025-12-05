use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ErrorCode;

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
        space = PythSignal::LEN,
        seeds = [b"signal", asset.as_ref(), &detected_at.to_le_bytes()],
        bump
    )]
    pub signal: Account<'info, PythSignal>,
    
    /// CHECK: Pyth price feed account, validated in instruction if enabled (skipped for hackathon)
    pub pyth_feed: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn publish_signal(
    ctx: Context<PublishSignal>,
    asset: [u8; 16],
    detected_at: i64,
    price: i64,
    confidence: u64,
    baseline_confidence: u64,
    multiplier: u16,
    severity: u8,
) -> Result<()> {
    if severity > 2 {
        return err!(ErrorCode::InvalidSeverity);
    }
    
    // Note: Option A (Trust Backend) implementation
    // We do NOT verify pyth feed data here.
    
    let signal = &mut ctx.accounts.signal;
    signal.asset = asset;
    signal.pyth_feed = ctx.accounts.pyth_feed.key();
    signal.price = price;
    signal.confidence = confidence;
    signal.baseline_confidence = baseline_confidence;
    signal.multiplier = multiplier;
    signal.severity = severity;
    signal.detected_at = detected_at;
    signal.publisher = ctx.accounts.publisher.key();
    signal.bump = ctx.bumps.signal;
    
    // Emit event (to be implemented if needed)
    
    Ok(())
}
