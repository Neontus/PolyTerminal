import axios from 'axios';
import WebSocket from 'ws';

// Interfaces for Polymarket Data
export interface PolymarketMarket {
    id: string;
    question: string;
    slug: string;
    volume: number;
    tokens: {
        tokenId: string;
        price: number;
        outcome: string;
        winner: boolean;
    }[];
    endDate: string;
    active: boolean;
    // Optional for UI enrichment
    signals?: any[];
    movements?: any[];
}

export interface TraderMovement {
    txHash: string;
    trader: string;
    marketId: string;
    marketQuestion: string;
    type: 'BUY' | 'SELL';
    outcome: 'YES' | 'NO';
    amount: number;
    price: number;
    timestamp: number;
}

const GRAPH_API_URL = 'https://gamma-api.polymarket.com/events';
const CLOB_API_URL = 'https://clob.polymarket.com';

// Mock Whales for Hackathon
const TRACKED_WHALES = [
    '0x4b16c5de96eb2117bbe5fd171e4d2058', // Example short hash
    '0x88e6a0c2ddd26feeb64f039a2c41296f', // Example
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' // vitalik.eth
];

export class PolymarketService {
    // Store real fetched markets to correlate whale activity
    private currentMarkets: PolymarketMarket[] = [];
    
    // Callback for broadcasting updates
    private onMarketUpdate?: (data: any) => void;
    private ws?: WebSocket;
    private wsPingInterval?: NodeJS.Timeout;

    /**
     * Connect to Polymarket CLOB WebSocket
     */
    /**
     * Connect to Polymarket CLOB WebSocket
     */
    connectWebSocket(broadcastCallback: (data: any) => void) {
        this.onMarketUpdate = broadcastCallback;
        
        try {
            console.log("Connecting to Polymarket CLOB WebSocket...");
            // Correct Endpoint from docs: wss://ws-subscriptions-clob.polymarket.com/ws/market
            this.ws = new WebSocket('wss://ws-subscriptions-clob.polymarket.com/ws/market');

            this.ws.on('open', () => {
                console.log("✅ Connected to Polymarket CLOB WebSocket");
                this.startPing();
            });

            this.ws.on('message', (data: WebSocket.RawData) => {
                try {
                    const messageStr = data.toString();
                    if (messageStr === 'PONG') return;

                    const message = JSON.parse(messageStr);
                    
                    // Handle Price Updates
                    // The 'market' channel returns updates. structure might vary.
                    // Based on docs, it returns array of events.
                    if (Array.isArray(message)) {
                        message.forEach(msg => {
                            if (msg.event_type === 'price_change' || msg.price) {
                                this.handlePriceUpdate(msg);
                            }
                        });
                    } else if (message.event_type === 'price_change' || message.price) {
                         this.handlePriceUpdate(message);
                    }
                } catch (e) {
                    console.error("Error parsing WS message:", e);
                }
            });

            this.ws.on('error', (err) => {
                console.error("Polymarket WS Error:", err);
            });

            this.ws.on('close', () => {
                console.log("Polymarket WS Closed. Reconnecting in 5s...");
                clearInterval(this.wsPingInterval);
                setTimeout(() => this.connectWebSocket(broadcastCallback), 5000);
            });

        } catch (e) {
            console.error("Failed to init WS:", e);
        }
    }

    private startPing() {
        this.wsPingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send("PING"); // Docs say send "PING" string, not JSON
            }
        }, 30000);
    }

    private handlePriceUpdate(msg: any) {
        // Find market with this asset_id (token_id)
        // msg structure might use asset_id or token_id
        if (!this.currentMarkets) return;
        
        const assetId = msg.asset_id || msg.token_id;
        if (!assetId) return;

        let updated = false;
        
        for (const market of this.currentMarkets) {
            const token = market.tokens.find(t => t.tokenId === assetId);
            if (token) {
                const oldPrice = token.price;
                const newPrice = parseFloat(msg.price);
                
                if (oldPrice !== newPrice) {
                    token.price = newPrice;
                    updated = true;
                    
                    // Broadcast Update
                    if (this.onMarketUpdate) {
                        this.onMarketUpdate({
                            type: 'MARKET_UPDATE',
                            marketId: market.id,
                            price: newPrice, 
                            tokenId: token.tokenId,
                            outcome: token.outcome
                        });
                    }
                }
            }
        }
    }

    /**
     * Subscribe to live price/ticker updates for current markets
     */
    private subscribeToMarkets(markets: PolymarketMarket[]) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const assetIds = markets.flatMap(m => m.tokens.map(t => t.tokenId));
        
        // Polymarket WS usually expects strings for asset_ids
        if (assetIds.length > 0) {
            // Protocol from docs: {"assets_ids": [...], "type": "market"}
            const msg = {
                assets_ids: assetIds,
                type: "market"
            };
            this.ws.send(JSON.stringify(msg));
            console.log(`Subscribed to ${assetIds.length} assets on Polymarket WS`);
        }
    }
    async getTopMarkets(limit: number = 10): Promise<PolymarketMarket[]> {
        try {
            // Using the Gamma API /events endpoint for fresh 2025 markets
            const response = await axios.get(`${GRAPH_API_URL}`, {
                params: {
                    limit,
                    active: true,
                    closed: false,
                    order: 'createdAt',
                    ascending: false
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json'
                }
            });

            // Gamma returns a list of Events, each containing Markets
            const events = Array.isArray(response.data) ? response.data : (response.data.data || []);
            
            const markets: PolymarketMarket[] = [];

            for (const event of events) {
                // Each event can have multiple markets, we take the primary/first one
                if (!event.markets || event.markets.length === 0) continue;
                
                const m = event.markets[0];
                
                // Parse JSON string fields
                let outcomePrices: string[] = [];
                let outcomes: string[] = [];
                let tokenIds: string[] = [];
                
                try {
                    outcomePrices = JSON.parse(m.outcomePrices || '[]');
                    outcomes = JSON.parse(m.outcomes || '[]');
                    tokenIds = JSON.parse(m.clobTokenIds || '[]');
                } catch (e) {
                    console.error(`Error parsing fields for market ${m.id}`, e);
                    continue;
                }

                // Map tokens
                const tokens = outcomes.map((outcome, index) => ({
                    tokenId: tokenIds[index] || `mock-${m.id}-${index}`,
                    price: parseFloat(outcomePrices[index] || '0'),
                    outcome: outcome,
                    winner: false
                }));

                markets.push({
                    id: m.conditionId, // Use conditionId as unique ID
                    question: m.question,
                    slug: event.slug, // Use event slug for navigation
                    volume: m.liquidity ? parseFloat(m.liquidity) : 0, // Gamma uses liquidity or volume
                    tokens: tokens,
                    endDate: m.endDate,
                    active: m.active
                });
            }

            // Save for whale generator
            this.currentMarkets = markets;
            
            // Subscribe to WS updates
            this.subscribeToMarkets(markets);

            return markets;

        } catch (error: any) {
            console.error("Failed to fetch markets from Polymarket Gamma API. Falling back to mocks.");
            if (axios.isAxiosError(error)) {
                 console.error(`Status: ${error.response?.status}, StatusText: ${error.response?.statusText}`);
            }
            // Fallback to mock markets ONLY if API fails
            const mocks = this.generateMockMarkets();
            this.currentMarkets = mocks; 
            return mocks;
        }
    }

    /**
     * Update the list of tracked whales dynamically
     */
    setTrackedWhales(addresses: string[]) {
        if (addresses && addresses.length > 0) {
            // Replace the static list with user provided list
            // We modify the global const by pushing to it or we can change implementation to use a class property.
            // Since TRACKED_WHALES is a const module-level, better to make it a class property or modify the usage.
            // Let's modify the usage in getWhaleMovements to prefer a class property.
            this.customWhales = addresses;
        }
    }

    private customWhales: string[] = [];

    private generateMockMarkets(): PolymarketMarket[] {
        return [
            {
                id: 'mock-1',
                question: 'Will Bitcoin reach $150,000 in 2025?',
                slug: 'bitcoin-150k-2025',
                volume: 5000000,
                tokens: [{ tokenId: 't1', price: 0.45, outcome: 'YES', winner: false }, { tokenId: 't2', price: 0.55, outcome: 'NO', winner: false }],
                endDate: '2025-12-31',
                active: true,
                signals: [],
                movements: []
            },
            {
                id: 'mock-2',
                question: 'Solana to flip Ethereum by 2026?',
                slug: 'sol-flip-eth-2026',
                volume: 2500000,
                tokens: [{ tokenId: 't3', price: 0.20, outcome: 'YES', winner: false }, { tokenId: 't4', price: 0.80, outcome: 'NO', winner: false }],
                endDate: '2026-01-01',
                active: true,
                signals: [],
                movements: []
            },
            {
                id: 'mock-3',
                question: 'GPT-5 Release before Q3 2025?',
                slug: 'gpt5-release-q3-2025',
                volume: 1000000,
                tokens: [{ tokenId: 't5', price: 0.60, outcome: 'YES', winner: false }, { tokenId: 't6', price: 0.40, outcome: 'NO', winner: false }],
                endDate: '2025-07-01',
                active: true,
                signals: [],
                movements: []
            }
        ];
    }

    /**
     * Get recent movements for tracked whales (Mock/Simulated for Hackathon)
     * In a real production app, this would query Covalent/TheGraph for TransferSingle events on CTF.
     */
    async getWhaleMovements(): Promise<TraderMovement[]> {
        // Mock data generator for demo purposes
        const movements: TraderMovement[] = [];
        const actions = ['BUY', 'SELL'];
        const outcomes = ['YES', 'NO'];
        
        // Generate 3-5 random movements
        const count = 3 + Math.floor(Math.random() * 3);
        
        // Ensure we have markets to reference
        const refMarkets = this.currentMarkets.length > 0 ? this.currentMarkets : this.generateMockMarkets();

        // Use user-provided whales if available, otherwise default list
        const sourceWhales = this.customWhales.length > 0 ? this.customWhales : TRACKED_WHALES;

        for (let i = 0; i < count; i++) {
            const whale = sourceWhales[Math.floor(Math.random() * sourceWhales.length)];
            const action = actions[Math.floor(Math.random() * actions.length)] as 'BUY' | 'SELL';
            const outcome = outcomes[Math.floor(Math.random() * outcomes.length)] as 'YES' | 'NO';
            const price = 0.3 + Math.random() * 0.6; // Random price between 0.30 and 0.90
            
            // Pick a random real market
            const market = refMarkets[Math.floor(Math.random() * refMarkets.length)];

            movements.push({
                txHash: '0x' + Math.random().toString(16).slice(2, 40),
                trader: whale,
                marketId: market.id, // REAL Market ID
                marketQuestion: market.question, // REAL Market Question
                type: action,
                outcome: outcome,
                amount: Math.floor(Math.random() * 10000),
                price: parseFloat(price.toFixed(2)),
                timestamp: Date.now() - Math.floor(Math.random() * 3600000) // Within last hour
            });
        }
        
        return movements.sort((a, b) => b.timestamp - a.timestamp);
    }
}

export const polymarketService = new PolymarketService();
