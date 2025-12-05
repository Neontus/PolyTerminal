import { useEffect, useState } from 'react';
import axios from 'axios';

// Public generic proxy or direct if CORS allows. Polymarket CLOB usually allows CORS.
const CLOB_API = 'https://clob.polymarket.com/prices-history';

export interface PriceHistoryPoint {
    time: number; // unix timestamp in seconds (or ms depending on API, usually seconds from CLOB)
    price: number;
}

export function useMarketHistory(tokenId: string | undefined, interval: '1m' | '1h' | '1d' = '1h') {
    const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        if (!tokenId) return;
        if (tokenId.startsWith('mock-')) {
            // Can't fetch real history for mocks
            return;
        }

        async function fetchHistory() {
            setLoading(true);
            try {
                // CLOB Params:
                // market: token_id
                // interval: '1m', '1h', '1d'
                // fidelity: in minutes? (optional if interval provided usually)
                const response = await axios.get(CLOB_API, {
                    params: {
                        market: tokenId,
                        interval: interval,
                        fidelity: interval === '1d' ? 1440 : interval === '1h' ? 60 : 1
                    }
                });
                
                // Response format: { history: [ { t: 1234567890, p: 0.55 }, ... ] } or similar
                // Based on standard clob docs: Array of { t: timestamp, p: price }
                // Let's assume standard format.
                
                const rawData = response.data.history || response.data;
                if (Array.isArray(rawData)) {
                    const mapped: PriceHistoryPoint[] = rawData.map((d: any) => ({
                        time: d.t * 1000, // Convert seconds to ms
                        price: Number(d.p)
                    }));
                    // Sort ascending
                    mapped.sort((a, b) => a.time - b.time);
                    setHistory(mapped);
                }
            } catch (e) {
                console.error('Failed to fetch price history', e);
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [tokenId, interval]);

    return { history, loading };
}
