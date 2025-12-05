/**
 * Analyst profile with statistics
 */
export interface AnalystProfile {
  pubkey: string; // Solana public key
  totalSignals: number;
  resolvedSignals: number;
  correctSignals: number;
  accuracy: number; // Computed: correctSignals / resolvedSignals (0-100)
  totalEarnings: number; // Cumulative USDC earned (6 decimals)
  createdAt: Date;
}

/**
 * Analyst with signal preview
 */
export interface AnalystWithSignals extends AnalystProfile {
  recentSignals: {
    id: string;
    marketId: string;
    direction: string;
    createdAt: Date;
    resolved: boolean;
  }[];
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number;
  analyst: AnalystProfile;
}

/**
 * Analyst stats for dashboard
 */
export interface AnalystStats {
  totalViews: number; // Off-chain tracking
  totalPurchases: number;
  averagePrice: number; // Average signal price
  successRate: number; // Same as accuracy
  totalRevenue: number; // Same as totalEarnings
}
