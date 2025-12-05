use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        init,
        payer = admin,
        space = ProgramConfig::LEN,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, ProgramConfig>,
    
    /// CHECK: Treasury address, validated by admin (can be any address for now)
    pub treasury: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn initialize_config(
    ctx: Context<InitializeConfig>,
    basic_price: u64,
    pro_price: u64,
    basic_duration: i64,
    pro_duration: i64,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.treasury = ctx.accounts.treasury.key();
    config.basic_price = basic_price;
    config.pro_price = pro_price;
    config.basic_duration = basic_duration;
    config.pro_duration = pro_duration;
    config.paused = false;
    config.bump = ctx.bumps.config;
    
    Ok(())
}
