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
    eventId?: string;
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
    pnl?: number;
}

const GRAPH_API_URL = 'https://gamma-api.polymarket.com/events';
const CLOB_API_URL = 'https://clob.polymarket.com';

// Mock Whales for Hackathon
const TRACKED_WHALES: string[] = [];

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
    async getTopMarkets(limit: number = 10, category?: string): Promise<PolymarketMarket[]> {
        try {
            // Using the Gamma API /events endpoint for fresh 2025 markets
            const params: any = {
                limit,
                active: true,
                closed: false,
                order: 'createdAt',
                ascending: false
            };

            if (category && category !== 'Overall') {
                // Map UI categories to Gamma API slugs if needed, or use direct
                // Common slugs: 'crypto', 'sports', 'politics', 'business'
                params.tag_slug = category.toLowerCase();
            }

            const response = await axios.get(`${GRAPH_API_URL}`, {
                params,
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
                    eventId: event.id, // ID for comments/social
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
     * Get a specific market by ID (Condition ID)
     */
    async getMarket(id: string): Promise<PolymarketMarket | null> {
        try {
            // Check cache first
            if (this.currentMarkets) {
                const cached = this.currentMarkets.find(m => m.id === id);
                if (cached) return cached;
            }

            // Fetch from CLOB API
            // content-type: application/json
            const response = await axios.get(`${CLOB_API_URL}/markets/${id}`);
            const m = response.data;

            if (!m) return null;

            return {
                id: m.condition_id,
                question: m.question,
                slug: m.market_slug,
                volume: 0, // CLOB API single market endpoint doesn't return volume
                endDate: m.end_date_iso,
                active: m.active,
                // eventId is not provided in CLOB response. 
                // Comments might not load correctly without it if strict filtering is on.
                eventId: undefined, 
                tokens: (m.tokens || []).map((t: any) => ({
                    tokenId: t.token_id,
                    price: t.price,
                    outcome: t.outcome,
                    winner: t.winner
                }))
            };

        } catch (error) {
            console.error(`Error fetching individual market ${id} from CLOB:`, error);
            return null;
        }
    }

    /**
     * Update the list of tracked whales dynamically
     */
    setTrackedWhales(addresses: string[]) {
        if (addresses && addresses.length > 0) {
            // Append new addresses, avoiding duplicates
            const newAddresses = addresses.filter(addr => !this.customWhales.includes(addr));
            this.customWhales = [...this.customWhales, ...newAddresses];
            console.log(`Updated tracked whales: ${this.customWhales.length} users`);
        }
    }

    getTrackedWhales(): string[] {
        return this.customWhales;
    }

    /**
     * Auto-discover top traders by looking at holders of top markets
     */
    async discoverTopTraders(limit: number = 10): Promise<string[]> {
        console.log("Starting auto-discovery of top traders...");
        try {
            // 1. Get Top Markets to find where the action is
            const markets = await this.getTopMarkets(5); // Top 5 active markets
            const uniqueTraders = new Set<string>();
            const traderScores = new Map<string, number>();

            // 2. Fetch Holders for each market
            for (const market of markets) {
                try {
                    // https://data-api.polymarket.com/holders?market=CONDITION_ID
                    const response = await axios.get(`https://data-api.polymarket.com/holders`, {
                        params: { market: market.id }
                    });
                    
                    const holders = response.data;
                    if (Array.isArray(holders)) {
                        for (const holder of holders) {
                            // Filter out small holders or noise if necessary
                            // API returns: { asset: string, amount: string, user: string }
                            const user = holder.user;
                            const amount = parseFloat(holder.amount || '0');
                            
                            if (amount > 10) { // arbitrary small threshold to filter dust
                                uniqueTraders.add(user);
                                // Simple score: accumulate size (rough proxy for activity/wealth)
                                const currentScore = traderScores.get(user) || 0;
                                traderScores.set(user, currentScore + amount);
                            }
                        }
                    }
                } catch (e) {
                    console.error(`Failed to fetch holders for market ${market.id}`, e);
                }
            }

            // 3. Sort by score and take top N
            const sortedTraders = Array.from(traderScores.entries())
                .sort((a, b) => b[1] - a[1]) // Descending by score
                .map(entry => entry[0])
                .slice(0, limit);

            // 4. Update tracked list
            this.setTrackedWhales(sortedTraders);
            
            console.log(`Auto-discovered ${sortedTraders.length} top traders.`);
            return sortedTraders;

        } catch (e) {
            console.error("Auto-discovery failed", e);
            return [];
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
    /**
     * Get real positions for tracked users from Polymarket Data API
     */
    async getUserPositions(address: string): Promise<any[]> {
        try {
            // https://data-api.polymarket.com/positions?user=ADDRESS&sortBy=CASHPNL
            const response = await axios.get(`https://data-api.polymarket.com/positions`, {
                params: {
                    user: address,
                    sortBy: 'CASHPNL'
                }
            });
            return Array.isArray(response.data) ? response.data : [];
        } catch (e) {
            console.error(`Failed to fetch positions for ${address}`, e);
            return [];
        }
    }

    /**
     * Get recent movements/positions for tracked whales
     * For Hackathon/Demo: We will treat "Current Positions" as "Movements" to show PnL and activity.
     */
    async getWhaleMovements(): Promise<TraderMovement[]> {
        const movements: TraderMovement[] = [];
        
        // Use user-provided whales if available, otherwise default list
        const sourceWhales = this.customWhales.length > 0 ? this.customWhales : TRACKED_WHALES;

        for (const whale of sourceWhales) {
            const positions = await this.getUserPositions(whale);
            
            for (const pos of positions) {
                // Map position data to our Movement interface
                // Note: The Data API returns current state, not individual trade history events in this endpoint.
                // We will map "currentValue" -> amount/price effectively for the demo view.
                
                if (pos.size === 0) continue; // Skip closed positions

                movements.push({
                    txHash: `pos-${pos.asset}-${Date.now()}`, // Synth ID
                    trader: whale,
                    marketId: pos.conditionId || pos.asset, 
                    marketQuestion: pos.title || 'Unknown Market',
                    type: pos.size > 0 ? 'BUY' : 'SELL', // Simplification
                    outcome: pos.outcome,
                    amount: Math.abs(pos.size),
                    price: pos.avgPrice,
                    pnl: pos.cashPnl || 0,
                    timestamp: pos.updatedAt ? new Date(pos.updatedAt).getTime() : Date.now()
                });
            }
        }
        
        // Sort by timestamp (newest first)
        return movements.sort((a, b) => b.timestamp - a.timestamp);
    }
}

export const polymarketService = new PolymarketService();
