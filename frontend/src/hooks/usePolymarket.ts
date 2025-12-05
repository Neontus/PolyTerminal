import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import type { Market } from '../types/market';

const BACKEND_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

export function usePolymarket(category?: string) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  // Fetch initial state
  useEffect(() => {
    async function fetchMarkets() {
      try {
        setLoading(true);
        const query = category ? `&category=${category}` : '';
        const response = await axios.get(`${BACKEND_URL}/api/markets?limit=10${query}`);
        
        const mappedMarkets = response.data.map((m: any) => {
            // Determine category (fallback if backend doesn't provide strict category)
            let cat = 'Crypto';
            if (m.question.toLowerCase().includes('trump') || m.question.toLowerCase().includes('biden') || m.question.toLowerCase().includes('election')) {
                cat = 'Politics';
            } else if (m.question.toLowerCase().includes('nfl') || m.question.toLowerCase().includes('nba')) {
                cat = 'Sports';
            }
            // Use backend tag if available or fallback
            // For now we trust our heuristic or backend response if it has category field? 
            // The interface has 'category' computed on frontend.
            
            // Find YES price
            const yesToken = m.tokens.find((t: any) => t.outcome === 'YES');
            const price = yesToken ? yesToken.price : 0.5;

            return {
                ...m,
                category: cat,
                currentPrice: price
            };
        });
        
        setMarkets(mappedMarkets);
        setError(null);
      } catch (err) {
        console.error('Error fetching markets:', err);
        setError('Failed to fetch markets');
      } finally {
        setLoading(false);
      }
    }

    fetchMarkets();
  }, [category]);

  // WebSocket Connection
  useEffect(() => {
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
        console.log('Connected to Market Stream');
    };

    ws.current.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            if (message.type === 'MARKET_UPDATE') {
                const { marketId, price } = message;
                
                setMarkets(prev => prev.map(m => {
                    // Update matching regular ID or if it's a mock update matching our mock ID pattern
                    // NOTE: Mock updates send "mock-X". Real updates would send condition ID.
                    if (m.id === marketId) {
                        return { ...m, currentPrice: price };
                    }
                    return m;
                }));
            }
        } catch (e) {
            console.error('WS Message Parse Error', e);
        }
    };

    return () => {
        ws.current?.close();
    };
  }, []);

  return { markets, loading, error };
}
