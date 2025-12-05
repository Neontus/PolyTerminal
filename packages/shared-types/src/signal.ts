/**
 * Signal strength classification based on z-score analysis
 */
export type SignalStrength = 'strong_yes' | 'weak_yes' | 'neutral' | 'weak_no' | 'strong_no';

/**
 * Direction of prediction
 */
export type SignalDirection = 'YES' | 'NO' | 'NEUTRAL';

/**
 * Computed signal data (off-chain analysis)
 */
export interface ComputedSignal {
  zScore: number; // Standard deviations from mean
  momentum: number; // Percentage change over lookback period
  volatility: number; // Annualized volatility
  strength: SignalStrength; // Composite strength indicator
  confidence: number; // 0-100
}

/**
 * On-chain signal metadata
 */
export interface OnChainSignal {
  id: string; // Signal PDA address
  analyst: string; // Analyst public key
  marketId: string; // Polymarket market ID
  direction: SignalDirection;
  zScore: number; // Scaled by 1000 on-chain (2400 = 2.4)
  confidence: number; // 0-100
  pythPrice: number; // Price at signal creation
  pythFeedId: string; // Pyth oracle feed used
  priceUsdc: number; // Cost to unlock in USDC (6 decimals)
  createdAt: Date;
  resolved: boolean;
  outcome: SignalDirection | null; // Actual result (null if unresolved)
  resolvedAt: Date | null;
  txSignature?: string; // Transaction signature
}

/**
 * Signal with access metadata
 */
export interface SignalWithAccess extends OnChainSignal {
  hasAccess: boolean; // Whether current user has purchased
  purchasedAt?: Date; // When user purchased (if hasAccess)
  amountPaid?: number; // USDC amount paid (if hasAccess)
}

/**
 * Signal creation payload
 */
export interface CreateSignalPayload {
  marketId: string;
  direction: SignalDirection;
  confidence: number; // 0-100
  priceUsdc: number; // In USDC (6 decimals)
}

/**
 * Signal resolution payload
 */
export interface ResolveSignalPayload {
  signalId: string;
  outcome: SignalDirection;
}
