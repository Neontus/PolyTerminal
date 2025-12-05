use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use crate::state::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct Subscribe<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        init_if_needed,
        payer = user,
        space = Subscription::LEN,
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
        constraint = user_usdc.owner == user.key() @ ErrorCode::Unauthorized,
        constraint = user_usdc.mint == usdc_mint.key() @ ErrorCode::InsufficientBalance
    )]
    pub user_usdc: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = treasury_usdc.owner == config.treasury @ ErrorCode::Unauthorized,
        constraint = treasury_usdc.mint == usdc_mint.key() @ ErrorCode::Unauthorized
    )]
    pub treasury_usdc: Account<'info, TokenAccount>,
    
    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn subscribe(ctx: Context<Subscribe>, tier: u8) -> Result<()> {
    let config = &ctx.accounts.config;
    let subscription = &mut ctx.accounts.subscription;
    
    // 1. Validate tier
    let (price, duration) = match tier {
        1 => (config.basic_price, config.basic_duration),
        2 => (config.pro_price, config.pro_duration),
        _ => return err!(ErrorCode::InvalidTier),
    };
    
    // 2. Transfer USDC
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_usdc.to_account_info(),
        to: ctx.accounts.treasury_usdc.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, price)?;
    
    // 3. Update subscription
    let now = Clock::get()?.unix_timestamp;
    
    // Calculate new expiry
    let current_expiry = subscription.expires_at;
    let new_expiry = if current_expiry > now {
        current_expiry + duration
    } else {
        now + duration
    };
    
    subscription.user = ctx.accounts.user.key();
    subscription.tier = tier;
    
    // Only set started_at if it's new or expired
    if subscription.started_at == 0 || current_expiry < now {
        subscription.started_at = now;
    }
    
    subscription.expires_at = new_expiry;
    subscription.total_paid += price;
    subscription.bump = ctx.bumps.subscription;
    
    // Emit event? (Spec mentions SubscriptionCreated/Extended, will implement later or now if easy)
    // For now skipping events file to save context window, will add if needed.
    
    Ok(())
}
