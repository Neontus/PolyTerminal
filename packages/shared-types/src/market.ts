/**
 * Polymarket market data
 */
export interface Market {
  id: string; // Polymarket market ID (condition ID)
  question: string;
  description?: string;
  category: string;
  currentPrice: number; // YES token price (0-1)
  volume24h: number; // 24h volume in USD
  totalVolume: number; // All-time volume
  liquidity: number; // Current liquidity
  outcomes: string[]; // Usually ["YES", "NO"]
  outcomePrices: number[]; // Prices for each outcome
  startDate: Date;
  endDate: Date;
  resolvedAt?: Date;
  resolved: boolean;
  winningOutcome?: string;
}

/**
 * Market with computed signals
 */
export interface MarketWithSignals extends Market {
  signals: {
    computed: {
      zScore: number;
      momentum: number;
      volatility: number;
      strength: 'strong_yes' | 'weak_yes' | 'neutral' | 'weak_no' | 'strong_no';
    };
    onChainCount: number; // Number of on-chain signals published
  };
}

/**
 * Market price history point
 */
export interface PricePoint {
  timestamp: Date;
  price: number;
  volume?: number;
}

/**
 * Market filters for API queries
 */
export interface MarketFilters {
  category?: string;
  minVolume?: number;
  maxVolume?: number;
  resolved?: boolean;
  search?: string;
  sortBy?: 'volume' | 'price' | 'endDate' | 'created';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Paginated market response
 */
export interface PaginatedMarkets {
  markets: MarketWithSignals[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
