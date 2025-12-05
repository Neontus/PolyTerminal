use anchor_lang::prelude::*;

pub mod state;
pub mod errors;
pub mod instructions;

use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod prediction_copilot {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        basic_price: u64,
        pro_price: u64,
        basic_duration: i64,
        pro_duration: i64,
    ) -> Result<()> {
        instructions::config::initialize_config(
            ctx,
            basic_price,
            pro_price,
            basic_duration,
            pro_duration,
        )
    }

    pub fn subscribe(ctx: Context<Subscribe>, tier: u8) -> Result<()> {
        instructions::subscription::subscribe(ctx, tier)
    }

    pub fn initialize_registry(ctx: Context<InitializeRegistry>) -> Result<()> {
        instructions::registry::initialize_registry(ctx)
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
        instructions::registry::add_trader(
            ctx,
            polygon_address,
            tier,
            total_pnl,
            win_rate,
            trade_count,
            total_volume,
            roi,
        )
    }

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
    ) -> Result<()> {
        instructions::registry::update_trader(
            ctx,
            polygon_address,
            tier,
            total_pnl,
            win_rate,
            trade_count,
            total_volume,
            roi,
            last_trade_at,
        )
    }

    pub fn remove_trader(
        ctx: Context<RemoveTrader>,
        polygon_address: [u8; 20],
    ) -> Result<()> {
        instructions::registry::remove_trader(ctx, polygon_address)
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
        instructions::signal::publish_signal(
            ctx,
            asset,
            detected_at,
            price,
            confidence,
            baseline_confidence,
            multiplier,
            severity,
        )
    }
}
