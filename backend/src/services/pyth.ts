import axios from 'axios';

export interface PythSignal {
    priceId: string;
    symbol: string;
    confidence: number;
    price: number;
    timestamp: number;
    isAnomaly: boolean;
    severity: 'Low' | 'Medium' | 'High';
    history: { timestamp: number, confidence: number, price: number }[];
}

const PYTH_HERMES_URL = 'https://hermes.pyth.network';

// Map of Pyth Price Feed IDs to human readable symbols
const PRICE_IDS = {
    '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43': 'BTC/USD',
    '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace': 'ETH/USD',
    '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d': 'SOL/USD'
};

export class PythService {
    
    // Store history: priceId -> list of data points
    private history: Record<string, { timestamp: number, confidence: number, price: number }[]> = {};
    private readonly HISTORY_LIMIT = 60; // Keep last 60 updates

    constructor() {
        // Poll regularly to build history
        setInterval(() => this.fetchLatestPrices(), 3000); // Every 3 seconds
    }

    async fetchLatestPrices() {
        try {
            const ids = Object.keys(PRICE_IDS);
            // Fetch latest prices from Hermes v2
            const response = await axios.get(`${PYTH_HERMES_URL}/v2/updates/price/latest`, {
                params: {
                    ids,
                }
            });

            // Hermes v2 returns { parsed: [...], binary: {...} } depending on params. 
            // By default with standard axios GET it returns JSON parsed:
            // { binary: {...}, parsed: [ { id: "...", price: { price: "...", conf: "...", expo: -8, ... }, ... } ] }
            
            const updates = response.data.parsed;
            if (!updates || !Array.isArray(updates)) return;

            const now = Date.now();

            updates.forEach((update: any) => {
                const id = '0x' + update.id; // Hermes might return without 0x prefix
                const priceData = update.price;
                
                if (!priceData) return;

                // Parse standard Pyth exponent
                const price = parseFloat(priceData.price) * Math.pow(10, priceData.expo);
                const rawConf = parseFloat(priceData.conf) * Math.pow(10, priceData.expo);
                
                // Confidence score as % of Price (volatility metric)
                // If price is 100 and conf is 1, that's 1% uncertainty.
                // We want a "Confidence Score" where 100% is rock solid and 0% is chaos.
                // Actually, Pyth confidence is a standard deviation (sigma).
                // Let's normalize: standard market condition might be 0.1% spread.
                // If spread > 1%, confidence is Low.
                
                const spreadPct = (rawConf / price) * 100;
                
                // Score: 100 - (spreadPct * 50). 
                // Ex: 0.1% spread -> 95 score. 1% spread -> 50 score. 2% spread -> 0 score.
                let mockScore = Math.max(0, Math.min(100, 100 - (spreadPct * 100))); // aggressive scaling
                
                // NOTE: For debugging/demo, sometimes Pyth conf is very tight. Let's ensure some movement.
                
                // Store in history
                if (!this.history[id]) this.history[id] = [];
                this.history[id].push({
                    timestamp: now,
                    confidence: mockScore,
                    price
                });
                
                // Trim history
                if (this.history[id].length > this.HISTORY_LIMIT) {
                    this.history[id].shift();
                }
            });

        } catch (error) {
            console.error("Failed to poll Pyth prices:", error);
        }
    }

    async getSignals(): Promise<PythSignal[]> {
        const signals: PythSignal[] = [];
        const now = Date.now();
        
        Object.keys(this.history).forEach(id => {
            const points = this.history[id];
            if (points.length === 0) return;

            const latest = points[points.length - 1];
            
            // Anomaly detection: if latest confidence dropped by > 10 points compared to avg of last 5
            const relevantHistory = points.slice(-Math.min(points.length, 10)); // last 10
            const avgConf = relevantHistory.reduce((sum, p) => sum + p.confidence, 0) / relevantHistory.length;
            
            // If current is significantly lower than average, it's an anomaly (Confidence Drop)
            // Or if standard dev of confidence is high.
            
            const isAnomaly = latest.confidence < (avgConf - 15); // Drop of 15% score
            const severity = isAnomaly ? (latest.confidence < 30 ? 'High' : 'Medium') : 'Low';
            
            // Normalize ID in case of 0x mismatch
            const normalize = (s: string) => s.startsWith('0x') ? s : '0x'+s;
            const symbol = PRICE_IDS[normalize(id) as keyof typeof PRICE_IDS] || 'UNKNOWN';

            signals.push({
                priceId: id,
                symbol,
                confidence: latest.confidence,
                price: latest.price,
                timestamp: latest.timestamp,
                isAnomaly,
                severity,
                history: points
            });
        });
        
        return signals;
    }
}

export const pythService = new PythService();
