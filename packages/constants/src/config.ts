/**
 * Platform fee configuration
 */
export const PLATFORM_FEE_BPS = 250; // 2.5% (250 basis points)

/**
 * Signal validation limits
 */
export const SIGNAL_LIMITS = {
  MAX_PRICE_USDC: 1000, // Maximum signal price: 1000 USDC
  MIN_CONFIDENCE: 0, // Minimum confidence: 0%
  MAX_CONFIDENCE: 100, // Maximum confidence: 100%
  MAX_MARKET_ID_LENGTH: 64, // Maximum market ID string length
  MIN_SIGNAL_AGE_TO_CLOSE: 24 * 60 * 60, // 24 hours in seconds
} as const;

/**
 * Signal direction enum values
 */
export const SIGNAL_DIRECTION = {
  NO: -1,
  NEUTRAL: 0,
  YES: 1,
} as const;

/**
 * Pyth price validation
 */
export const PYTH_VALIDATION = {
  MAX_PRICE_AGE_SECONDS: 60, // Price must be < 60 seconds old
  MAX_CONFIDENCE_BPS: 500, // Confidence interval must be < 5% of price
} as const;

/**
 * Signal computation parameters
 */
export const SIGNAL_COMPUTATION = {
  Z_SCORE_LOOKBACK_DAYS: 30, // Calculate mean/stddev over 30 days
  MOMENTUM_LOOKBACK_DAYS: 7, // Calculate momentum over 7 days
  VOLATILITY_LOOKBACK_DAYS: 14, // Calculate volatility over 14 days
} as const;

/**
 * Signal strength thresholds (z-score based)
 */
export const SIGNAL_STRENGTH_THRESHOLDS = {
  STRONG_YES: 1.5, // z-score > 1.5
  WEAK_YES: 0.5, // z-score > 0.5
  WEAK_NO: -0.5, // z-score < -0.5
  STRONG_NO: -1.5, // z-score < -1.5
  // Between -0.5 and 0.5 is NEUTRAL
} as const;

/**
 * API pagination defaults
 */
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
} as const;

/**
 * Polymarket API configuration
 */
export const POLYMARKET_API = {
  BASE_URL: 'https://clob.polymarket.com',
  MARKETS_ENDPOINT: '/markets',
  PRICES_HISTORY_ENDPOINT: '/prices-history',
  DEFAULT_LIMIT: 50,
  RATE_LIMIT_MS: 1000, // Minimum 1s between requests
} as const;

/**
 * Cache TTLs (in seconds)
 */
export const CACHE_TTL = {
  MARKETS: 60, // 1 minute
  SIGNALS: 30, // 30 seconds
  ANALYST_PROFILE: 300, // 5 minutes
  PRICE_HISTORY: 600, // 10 minutes
} as const;

/**
 * WebSocket configuration
 */
export const WEBSOCKET = {
  RECONNECT_DELAY_MS: 5000,
  PING_INTERVAL_MS: 30000,
  MAX_RECONNECT_ATTEMPTS: 5,
} as const;

/**
 * Indexer configuration
 */
export const INDEXER = {
  POLL_INTERVAL_MS: 5000, // Poll for new transactions every 5 seconds
  BATCH_SIZE: 100, // Process 100 transactions per batch
  MAX_RETRIES: 3, // Retry failed transactions up to 3 times
} as const;
