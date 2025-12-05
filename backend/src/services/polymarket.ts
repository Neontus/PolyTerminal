import axios from 'axios';

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
    
    /**
     * Fetch top active markets from Polymarket Gamma API
     */
    async getTopMarkets(limit: number = 20): Promise<PolymarketMarket[]> {
        try {
            // Using the Gamma API /query or similar endpoint. 
            // For hackathon, we can use the /markets endpoint if available or a specific query.
            // Simplified fetch:
            const response = await axios.get(`${CLOB_API_URL}/markets`, {
                params: {
                    limit,
                    active: true,
                    closed: false,
                    order: 'volume24h',
                    ascending: false
                }
            });

            // Iterate and format
            // Note: The CLOB API structure might vary, adapting to a generic structure for now.
            // If CLOB API fails or is complex, we might fallback to hardcoded popular tags.
            
            const markets = response.data.data || [];
            
            return markets.map((m: any) => ({
                id: m.condition_id,
                question: m.question,
                slug: m.slug,
                volume: m.volume_24h || 0,
                tokens: m.tokens?.map((t: any) => ({
                    tokenId: t.token_id,
                    price: t.price || 0.5,
                    outcome: t.outcome,
                    winner: false
                })) || [],
                endDate: m.end_date_iso,
                active: m.active
            }));

        } catch (error) {
            console.error("Failed to fetch markets from Polymarket CLOB:", error);
            // Fallback to mock markets for demo
            return [
                {
                    id: 'mock-1',
                    question: 'Will Bitcoin reach $100,000 in 2024?',
                    slug: 'bitcoin-100k-2024',
                    volume: 1500000,
                    tokens: [{ tokenId: 't1', price: 0.65, outcome: 'YES', winner: false }],
                    endDate: '2024-12-31',
                    active: true
                },
                {
                    id: 'mock-2',
                    question: 'Will Ethereum ETF launch in Q1?',
                    slug: 'eth-etf-q1',
                    volume: 800000,
                    tokens: [{ tokenId: 't2', price: 0.30, outcome: 'YES', winner: false }],
                    endDate: '2024-03-31',
                    active: true
                },
                {
                    id: 'mock-3',
                    question: 'Solana > $200 in May?',
                    slug: 'solana-200-may',
                    volume: 500000,
                    tokens: [{ tokenId: 't3', price: 0.80, outcome: 'YES', winner: false }],
                    endDate: '2024-05-31',
                    active: true
                }
            ];
        }
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
        
        for (let i = 0; i < count; i++) {
            const whale = TRACKED_WHALES[Math.floor(Math.random() * TRACKED_WHALES.length)];
            const action = actions[Math.floor(Math.random() * actions.length)] as 'BUY' | 'SELL';
            const outcome = outcomes[Math.floor(Math.random() * outcomes.length)] as 'YES' | 'NO';
            const price = 0.3 + Math.random() * 0.6; // Random price between 0.30 and 0.90
            
            movements.push({
                txHash: '0x' + Math.random().toString(16).slice(2, 40),
                trader: whale,
                marketId: 'mock-market-' + i,
                marketQuestion: 'Will Bitcoin reach $100k by 2024?', // Simplified common market
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
