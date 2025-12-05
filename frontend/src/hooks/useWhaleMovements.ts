import { useEffect, useState } from 'react';
import axios from 'axios';


const BACKEND_URL = 'http://localhost:3001';

export interface WhaleMovement {
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

export function useWhaleMovements() {
  const [movements, setMovements] = useState<WhaleMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovements() {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/signals/whales`);
        setMovements(response.data);
      } catch (err) {
        console.error('Error fetching whale movements:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMovements();
    const interval = setInterval(fetchMovements, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  return { movements, loading };
}
