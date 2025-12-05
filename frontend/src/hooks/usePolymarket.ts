import { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

export interface Market {
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
  // Computed on frontend
  currentPrice: number;
  category: string; 
}

export function usePolymarket() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMarkets() {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}/api/markets`);
        
        const mappedMarkets = response.data.map((m: any) => {
            // Determine category from question or defaults
            let category = 'Crypto';
            if (m.question.toLowerCase().includes('trump') || m.question.toLowerCase().includes('biden') || m.question.toLowerCase().includes('election')) {
                category = 'Politics';
            } else if (m.question.toLowerCase().includes('nfl') || m.question.toLowerCase().includes('nba')) {
                category = 'Sports';
            }

            // Find YES price
            const yesToken = m.tokens.find((t: any) => t.outcome === 'YES');
            const price = yesToken ? yesToken.price : 0.5;

            return {
                ...m,
                category,
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
  }, []);

  return { markets, loading, error };
}
