import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { polymarketService } from './services/polymarket';
import { pythService } from './services/pyth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'prediction-copilot-backend',
  });
});

// --- API Routes ---

/**
 * GET /api/markets
 * Fetch active prediction markets
 */
app.get('/api/markets', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
        const markets = await polymarketService.getTopMarkets(limit);
        res.json(markets);
    } catch (error) {
        console.error('Error fetching markets:', error);
        res.status(500).json({ error: 'Failed to fetch markets' });
    }
});

/**
 * GET /api/signals/pyth
 * Fetch active Pyth confidence anomalies
 */
app.get('/api/signals/pyth', async (_req, res) => {
    try {
        const signals = await pythService.getSignals();
        res.json(signals);
    } catch (error) {
        console.error('Error fetching Pyth signals:', error);
        res.status(500).json({ error: 'Failed to fetch Pyth signals' });
    }
});

/**
 * GET /api/signals/whales
 * Fetch recent trader movements
 */
app.get('/api/signals/whales', async (_req, res) => {
    try {
        const movements = await polymarketService.getWhaleMovements();
        res.json(movements);
    } catch (error) {
        console.error('Error fetching whale movements:', error);
        res.status(500).json({ error: 'Failed to fetch whale movements' });
    }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 RPC: ${process.env.SOLANA_RPC_URL}`);
});

export default app;
