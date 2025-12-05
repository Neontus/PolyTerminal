use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ErrorCode;

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
        space = WhaleRegistry::LEN,
        seeds = [b"registry"],
        bump
    )]
    pub registry: Account<'info, WhaleRegistry>,
    
    pub system_program: Program<'info, System>,
}

pub fn initialize_registry(ctx: Context<InitializeRegistry>) -> Result<()> {
    let registry = &mut ctx.accounts.registry;
    registry.admin = ctx.accounts.admin.key();
    registry.whale_count = 0;
    registry.degen_count = 0;
    registry.last_updated = Clock::get()?.unix_timestamp;
    registry.bump = ctx.bumps.registry;
    Ok(())
}

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
        space = TrackedTrader::LEN,
        seeds = [b"trader", polygon_address.as_ref()],
        bump
    )]
    pub trader: Account<'info, TrackedTrader>,
    
    pub system_program: Program<'info, System>,
}

pub fn add_trader(
    ctx: Context<AddTrader>,
    polygon_address: [u8; 20],
    tier: u8,
    total_pnl: i64,
    win_rate: u16,
    trade_count: u32,
    total_volume: u64,
    roi: i32,
) -> Result<()> {
    // Validate Tier
    if tier > 4 {
        return err!(ErrorCode::InvalidTraderTier);
    }

    let trader = &mut ctx.accounts.trader;
    let registry = &mut ctx.accounts.registry;
    let now = Clock::get()?.unix_timestamp;
    
    trader.polygon_address = polygon_address;
    trader.tier = tier;
    trader.total_pnl = total_pnl;
    trader.win_rate = win_rate;
    trader.trade_count = trade_count;
    trader.total_volume = total_volume;
    trader.roi = roi;
    trader.last_trade_at = now; // Default to now if not provided
    trader.added_at = now;
    trader.updated_at = now;
    trader.bump = ctx.bumps.trader;
    
    // Update registry counts
    if tier == TraderTier::Degen as u8 {
        registry.degen_count += 1;
    } else {
        registry.whale_count += 1;
    }
    registry.last_updated = now;
    
    Ok(())
}

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
    
    #[account(
        mut,
        seeds = [b"registry"],
        bump = registry.bump
    )]
    pub registry: Account<'info, WhaleRegistry>,
}

pub fn update_trader(
    ctx: Context<UpdateTrader>,
    _polygon_address: [u8; 20],
    tier: u8,
    total_pnl: i64,
    win_rate: u16,
    trade_count: u32,
    total_volume: u64,
    roi: i32,
    last_trade_at: i64,
) -> Result<()> {
    if tier > 4 {
        return err!(ErrorCode::InvalidTraderTier);
    }

    let trader = &mut ctx.accounts.trader;
    let registry = &mut ctx.accounts.registry;
    
    // Update counts if tier changed
    // Note: This logic assumes we know the old tier. But we do!
    // If old was degen and new is whale -> degen--, whale++
    // If old was whale and new is degen -> whale--, degen++
    // If old was whale and new is whale -> no change
    
    let old_tier = trader.tier;
    if old_tier != tier {
        if old_tier == TraderTier::Degen as u8 {
            registry.degen_count = registry.degen_count.saturating_sub(1);
        } else {
            registry.whale_count = registry.whale_count.saturating_sub(1);
        }
        
        if tier == TraderTier::Degen as u8 {
            registry.degen_count += 1;
        } else {
            registry.whale_count += 1;
        }
    }

    trader.tier = tier;
    trader.total_pnl = total_pnl;
    trader.win_rate = win_rate;
    trader.trade_count = trade_count;
    trader.total_volume = total_volume;
    trader.roi = roi;
    trader.last_trade_at = last_trade_at;
    trader.updated_at = Clock::get()?.unix_timestamp;
    
    registry.last_updated = trader.updated_at;

    Ok(())
}

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

pub fn remove_trader(
    ctx: Context<RemoveTrader>,
    _polygon_address: [u8; 20],
) -> Result<()> {
    let registry = &mut ctx.accounts.registry;
    let trader = &ctx.accounts.trader;
    
    if trader.tier == TraderTier::Degen as u8 {
        registry.degen_count = registry.degen_count.saturating_sub(1);
    } else {
        registry.whale_count = registry.whale_count.saturating_sub(1);
    }
    registry.last_updated = Clock::get()?.unix_timestamp;
    
    Ok(())
}
