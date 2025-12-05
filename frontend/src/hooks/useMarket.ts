import { useEffect, useState } from 'react';
import axios from 'axios';
import type { Market } from '../types/market';

const BACKEND_URL = 'http://localhost:3001';

export function useMarket(id?: string) {
    const [market, setMarket] = useState<Market | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        async function fetchMarket() {
            try {
                setLoading(true);
                const response = await axios.get(`${BACKEND_URL}/api/markets/${id}`);
                
                const m = response.data;
                // Determine category (similar logic to usePolymarket)
                let category = 'Crypto';
                if (m.question.toLowerCase().includes('trump') || m.question.toLowerCase().includes('biden') || m.question.toLowerCase().includes('election')) {
                    category = 'Politics';
                } else if (m.question.toLowerCase().includes('nfl') || m.question.toLowerCase().includes('nba')) {
                    category = 'Sports';
                }

                // Find YES price (Case insensitive check)
                const yesToken = m.tokens.find((t: any) => t.outcome === 'YES' || t.outcome === 'Yes');
                const price = yesToken ? yesToken.price : 0.5;

                setMarket({
                    ...m,
                    category,
                    currentPrice: price
                });
                setError(null);
            } catch (err) {
                console.error(`Error fetching market ${id}:`, err);
                setError('Failed to fetch market');
                setMarket(null);
            } finally {
                setLoading(false);
            }
        }

        fetchMarket();
    }, [id]);

    return { market, loading, error };
}
