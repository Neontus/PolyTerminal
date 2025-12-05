/**
 * Solana network types
 */
export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';

/**
 * USDC token mint addresses
 */
export const USDC_MINT = {
  'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  testnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Same as devnet
  localnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Mock
} as const;

/**
 * USDC decimals (consistent across all networks)
 */
export const USDC_DECIMALS = 6;

/**
 * Pyth oracle price feed IDs
 */
export const PYTH_PRICE_FEEDS = {
  BTC_USD: 'HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J',
  ETH_USD: 'EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw',
  SOL_USD: 'J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix',
} as const;

/**
 * Pyth program ID (same across all networks)
 */
export const PYTH_PROGRAM_ID = 'gSbePebfvPy7tRqimPoVecS2UsBvYv46ynrzWocc92s';

/**
 * Program ID placeholder (will be updated after deployment)
 * Set via environment variable in apps
 */
export const PROGRAM_ID_PLACEHOLDER = '11111111111111111111111111111111';

/**
 * Helper to get USDC mint for current network
 */
export function getUsdcMint(network: SolanaNetwork): string {
  return USDC_MINT[network];
}

/**
 * Helper to convert USDC to raw units (multiply by 10^6)
 */
export function usdcToRaw(usdc: number): number {
  return Math.floor(usdc * Math.pow(10, USDC_DECIMALS));
}

/**
 * Helper to convert raw units to USDC (divide by 10^6)
 */
export function rawToUsdc(raw: number): number {
  return raw / Math.pow(10, USDC_DECIMALS);
}
