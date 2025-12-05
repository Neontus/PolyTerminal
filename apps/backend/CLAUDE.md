# Backend Service

Node.js/Express backend providing REST API, event indexing, and signal computation for Prediction Copilot.

## Architecture

```
src/
├── index.ts            # Express app entry point
├── api/                # REST API route handlers
│   ├── markets.ts      # GET /api/markets, /api/markets/:id
│   ├── signals.ts      # GET /api/signals, /api/signals/:id
│   ├── analysts.ts     # GET /api/analysts, /api/analysts/:pubkey
│   └── access.ts       # GET /api/access/:consumer/:signal
├── indexer/            # On-chain event listener
│   ├── index.ts        # Main indexer process
│   ├── parser.ts       # Parse Anchor events from logs
│   └── handlers.ts     # Event handlers (update database)
├── services/           # Business logic
│   ├── polymarket.ts   # Fetch market data from Polymarket API
│   ├── signals.ts      # Compute z-score, momentum, volatility
│   └── websocket.ts    # WebSocket broadcast service
├── db/                 # Database layer
│   ├── client.ts       # PostgreSQL connection pool
│   ├── models/         # Database models
│   └── migrations/     # SQL migration files
└── shared/             # Backend-only utilities
    ├── logger.ts       # Logging utility
    └── cache.ts        # Redis cache wrapper
```

## Development

### Start API Server
```bash
npm run dev
```
Runs on `http://localhost:3001` with hot-reload.

### Start Indexer (Separate Process)
```bash
npm run indexer
```
Polls Solana transactions every 5 seconds, parses events, updates database.

### Database Setup
```bash
# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed
```

## Environment Variables

See `.env.example` for all required variables:
- `SOLANA_RPC_URL` - Devnet RPC endpoint
- `PROGRAM_ID` - Deployed Anchor program ID
- `DATABASE_URL` - PostgreSQL connection string
- `POLYMARKET_API_URL` - Polymarket CLOB API base URL

## Dependencies on Shared Packages

```typescript
import { createPredictionCopilotClient, deriveSignalPDA } from '@packages/anchor-client';
import { OnChainSignal, MarketWithSignals } from '@packages/shared-types';
import { USDC_DECIMALS, POLYMARKET_API } from '@packages/constants';
```

- **@packages/anchor-client**: Read on-chain data, parse events
- **@packages/shared-types**: API response types, business logic types
- **@packages/constants**: Addresses, fee rates, computation parameters

## Signal Computation

### Z-Score
```typescript
const mean = prices.slice(-30).reduce((a, b) => a + b) / 30;
const variance = prices.slice(-30).reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / 30;
const stdDev = Math.sqrt(variance);
const zScore = (currentPrice - mean) / stdDev;
```

### Momentum
```typescript
const price7DaysAgo = priceHistory[priceHistory.length - 7];
const momentum = ((currentPrice - price7DaysAgo) / price7DaysAgo) * 100;
```

### Volatility (Annualized)
```typescript
const returns = prices.slice(-14).map((p, i, arr) => i > 0 ? Math.log(p / arr[i-1]) : 0);
const dailyVol = Math.sqrt(returns.reduce((sum, r) => sum + r**2, 0) / returns.length);
const annualizedVol = dailyVol * Math.sqrt(365);
```

### Signal Strength Classification
```typescript
if (zScore > 1.5) return 'strong_yes';
if (zScore > 0.5) return 'weak_yes';
if (zScore < -1.5) return 'strong_no';
if (zScore < -0.5) return 'weak_no';
return 'neutral';
```

## Event Indexing Strategy

### Poll-Based Approach
1. Query Solana for recent program transactions (last 100)
2. Parse transaction logs for Anchor events
3. Decode event data using IDL
4. Update PostgreSQL database
5. Broadcast updates via WebSocket
6. Sleep for 5 seconds, repeat

### Event Types
- `SignalPublished` → Insert into `signals` table
- `SignalPurchased` → Insert into `purchases` table, increment analyst earnings
- `SignalResolved` → Update signal outcome, recalculate analyst accuracy
- `AnalystCreated` → Insert into `analysts` table

### Handling Reorgs
- Store processed transaction signatures
- Skip already-processed transactions
- Maintain `last_processed_slot` cursor

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/markets` | List Polymarket markets with signals |
| GET | `/api/markets/:id` | Single market with full data |
| GET | `/api/signals` | Published on-chain signals (paginated) |
| GET | `/api/signals/:id` | Single signal details |
| GET | `/api/analysts` | Leaderboard of analysts |
| GET | `/api/analysts/:pubkey` | Single analyst profile + signals |
| GET | `/api/access/:consumer/:signal` | Check if consumer has access |

### Response Format
```typescript
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-12-05T00:00:00Z"
}
```

### Error Format
```typescript
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Signal not found"
  },
  "timestamp": "2024-12-05T00:00:00Z"
}
```

## Database Schema

### `analysts`
- `pubkey` (PK) - Solana public key
- `total_signals`, `resolved_signals`, `correct_signals`
- `total_earnings` - USDC in smallest units
- `created_at`, `updated_at`

### `signals`
- `id` (PK) - Auto-increment
- `on_chain_id` - Signal PDA address (unique)
- `analyst_pubkey` (FK)
- `market_id` - Polymarket condition ID
- `direction`, `z_score`, `confidence`
- `pyth_price`, `price_usdc`
- `created_at`, `resolved`, `outcome`, `resolved_at`
- `tx_signature`

### `purchases`
- `id` (PK)
- `signal_id` (FK), `consumer_pubkey`
- `amount_paid`, `purchased_at`, `tx_signature`
- UNIQUE(`signal_id`, `consumer_pubkey`)

### `markets` (cached)
- `id` (PK) - Polymarket market ID
- `question`, `category`, `current_price`, `volume_24h`
- `end_date`, `resolved`
- `updated_at` - Cache invalidation timestamp

## Polymarket Integration

### Fetch Markets
```typescript
const response = await axios.get(`${POLYMARKET_API_URL}/markets`, {
  params: { limit: 50 }
});
```

### Rate Limiting
- Max 1 request per second
- Use simple queue with delays

### Data Caching
- Cache market data for 60 seconds (Redis or in-memory)
- Cache price history for 10 minutes
- Invalidate on WebSocket updates

## WebSocket Server

### Connection
```
ws://localhost:3001/ws
```

### Message Format
```typescript
{
  "type": "market_update" | "signal_published" | "signal_purchased",
  "data": { ... },
  "timestamp": "2024-12-05T00:00:00Z"
}
```

### Events Broadcasted
- Market price updates (from Polymarket)
- New signals published
- Signals purchased
- Signals resolved

## Common Development Tasks

### Add New API Endpoint
1. Create route handler in `src/api/`
2. Import and mount in `src/index.ts`
3. Add types to `@packages/shared-types` if needed
4. Test with curl or Postman

### Add New Event Handler
1. Add case to `src/indexer/handlers.ts`
2. Define database update logic
3. Test with mock event data
4. Verify on devnet

### Update Signal Computation
1. Modify formulas in `src/services/signals.ts`
2. Update constants in `@packages/constants` if thresholds change
3. Add unit tests
4. Clear cached computed signals

## Testing

Run tests:
```bash
npm test
```

(Note: Test suite not yet implemented - TODO for Phase 5)

## Deployment

Build for production:
```bash
npm run build
npm start
```

Run on server (PM2, Docker, etc.):
```bash
pm2 start dist/index.js --name prediction-copilot-api
pm2 start dist/indexer/index.js --name prediction-copilot-indexer
```

## Troubleshooting

**Indexer not picking up events**
- Check `PROGRAM_ID` is correct
- Verify RPC endpoint is responsive
- Check transaction logs manually in Solana Explorer

**Database connection errors**
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Run migrations: `npm run db:migrate`

**Polymarket API rate limits**
- Increase `POLYMARKET_RATE_LIMIT_MS`
- Implement Redis caching
- Use WebSocket for real-time data instead of polling
