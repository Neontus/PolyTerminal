use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
#[instruction(polygon_address: [u8; 20])]
pub struct RecordWhaleMovement<'info> {
    #[account(mut)]
    pub admin: Signer<'info>, // Only Admin (Keeper) can record movements for now to prevent spam

    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.admin == admin.key() @ ErrorCode::Unauthorized
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(
        seeds = [b"trader", polygon_address.as_ref()],
        bump = trader.bump
    )]
    pub trader: Account<'info, TrackedTrader>,
}

#[event]
pub struct WhaleMovementEvent {
    pub polygon_address: [u8; 20],
    pub solana_address: Pubkey,
    pub amount: u64,
    pub token: String, // "SOL" or "USDC"
    pub direction: String, // "Deposit" or "Withdraw"
    pub timestamp: i64,
}

pub fn record_whale_movement(
    ctx: Context<RecordWhaleMovement>,
    polygon_address: [u8; 20],
    amount: u64,
    token: String,
    direction: String
) -> Result<()> {
    let trader = &ctx.accounts.trader;
    
    // Validate that the trader has a solana address linked
    if trader.solana_address.is_none() {
        return err!(ErrorCode::TraderNotFound); // Reusing error code or make new one
    }

    // Emit event for indexers/frontend
    emit!(WhaleMovementEvent {
        polygon_address,
        solana_address: trader.solana_address.unwrap(),
        amount,
        token,
        direction,
        timestamp: Clock::get()?.unix_timestamp,
    });

    // We could also update some stats on the trader account here if we wanted
    // e.g., trader.last_movement_at = now;

    Ok(())
}
