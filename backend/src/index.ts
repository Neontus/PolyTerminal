import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { polymarketService } from './services/polymarket';
import { pythService } from './services/pyth';
import { whaleWatcher } from './indexer/WhaleWatcher';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
}));
app.use(express.json());

// Create HTTP server to attach WebSocket
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Track connected clients
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
    });

    // Send initial "Connected" message
    ws.send(JSON.stringify({ type: 'WELCOME', message: 'Connected to Prediction Copilot Stream' }));
});

// Initialize Polymarket Service and connect to their Real-Time WebSocket
// We pass a callback that broadcasts the data to OUR frontend via OUR WebSocket
polymarketService.connectWebSocket((data) => {
    // Broadcast to all connected frontend clients
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
});

// Start fetching markets (which will trigger subscriptions)
// We initially fetch top markets to populate the list and subscribe
polymarketService.getTopMarkets().then(markets => {
    console.log(`Initial fetch: ${markets.length} markets found.`);
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'prediction-copilot-backend',
    clients: wss.clients.size
  });
});

// --- API Routes ---

/**
 * GET /api/markets
 * Fetch active prediction markets
 */
app.get('/api/markets', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const category = req.query.category ? (req.query.category as string) : undefined;
        const markets = await polymarketService.getTopMarkets(limit, category);
        res.json(markets);
    } catch (error) {
        console.error('Error fetching markets:', error);
        res.status(500).json({ error: 'Failed to fetch markets' });
    }
});

/**
 * GET /api/markets/:id
 * Fetch a single market by ID
 */
app.get('/api/markets/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const market = await polymarketService.getMarket(id);
        
        if (market) {
            res.json(market);
        } else {
            res.status(404).json({ error: 'Market not found' });
        }
    } catch (error) {
        console.error(`Error fetching market ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to fetch market' });
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

// Get Tracked Whales
app.get('/api/config/whales', (_req, res) => {
    res.json(polymarketService.getTrackedWhales());
});

// Config Endpoint
app.post('/api/config/whales', (req, res) => {
    const { addresses } = req.body;
    if (Array.isArray(addresses)) {
        polymarketService.setTrackedWhales(addresses);
        res.json({ success: true, message: 'Updated tracked whales', count: addresses.length });
    } else {
        res.status(400).json({ error: 'Invalid format. Expected { addresses: string[] }' });
    }
});

// Auto-Discover Endpoint
app.post('/api/config/whales/auto-discover', async (_req, res) => {
    try {
        const traders = await polymarketService.discoverTopTraders();
        res.json({ success: true, count: traders.length, traders });
    } catch (e) {
        console.error("Auto-discover endpoint failed", e);
        res.status(500).json({ error: 'Failed to auto-discover traders' });
    }
});

// Start Watcher Endpoint
app.post('/api/config/watch', (req, res) => {
    const { solanaAddress, polygonAddress } = req.body;
    if (solanaAddress && polygonAddress) {
        whaleWatcher.watch(solanaAddress, polygonAddress);
        res.json({ success: true, message: `Started watching ${solanaAddress}` });
        return; // Explicit return to avoid void/Response type issues
    }
    res.status(400).json({ error: 'Missing solanaAddress or polygonAddress' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Backend server (HTTP + WS) running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 RPC: ${process.env.SOLANA_RPC_URL}`);
});

export default app;
