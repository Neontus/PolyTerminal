import { useEffect, useState } from 'react';
import axios from 'axios';

// Backend URL - in production this should be an env var
const BACKEND_URL = 'http://localhost:3001';

export interface PythSignal {
  id: string;
  marketId: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High';
  timestamp: number;
  price: number;
  multiplier: number;
}

export function usePythSignals() {
  const [signals, setSignals] = useState<PythSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSignals() {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}/api/signals/pyth`);
        
        // Map backend format to frontend format
        const signalsData: PythSignal[] = response.data.map((s: any) => ({
            id: s.priceId,
            marketId: s.symbol,
            confidence: s.confidence,
            severity: s.severity,
            timestamp: s.timestamp,
            price: s.price,
            multiplier: 0 // Not relevant for this view
        }));
        
        // Sort by timestamp (newest first)
        signalsData.sort((a, b) => b.timestamp - a.timestamp);
        
        setSignals(signalsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching signals:', err);
        setError('Failed to fetch Pyth signals from backend');
        setSignals([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSignals();
    
    // Refresh every 15 seconds
    const interval = setInterval(fetchSignals, 15000);
    return () => clearInterval(interval);
  }, []);

  return { signals, loading, error };
}
