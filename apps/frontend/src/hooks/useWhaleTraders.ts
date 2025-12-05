import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import idl from '../idl/idl.json';

const PROGRAM_ID = new PublicKey(import.meta.env.VITE_PROGRAM_ID || 'EFTzno3x2oUc2QhVEQRupcx8FLTWiN7bNc1RvgNu621D');

export interface WhaleTrader {
  walletAddress: string;
  tier: 'Whale' | 'Shark' | 'Fish' | 'Shrimp' | 'Degen';
  totalTrades: number;
  winningTrades: number;
  totalVolume: number;
  winRate: number;
  totalPnl: number;
  roi: number;
}

export function useWhaleTraders() {
  const { connection } = useConnection();
  const [traders, setTraders] = useState<WhaleTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTraders() {
      try {
        setLoading(true);
        
        // Anchor 0.32.1 requires strict separation of accounts and types.
        // We must move the inline account type definition to the 'types' array.
        
        // 1. Find the original account definition
        const originalTraderAcc = idl.accounts.find(acc => acc.name === 'TrackedTrader');
        
        if (!originalTraderAcc) {
            throw new Error("TrackedTrader account not found in IDL");
        }

        // 2. Deep clone and patch fields to avoid Anchor 0.32.1 crash on "publicKey" type
        const patchedType = JSON.parse(JSON.stringify(originalTraderAcc.type));
         if (patchedType.kind === 'struct' && Array.isArray(patchedType.fields)) {
            patchedType.fields.forEach((field: any) => {
                if (field.type === 'publicKey') {
                    // Replace string "publicKey" with raw byte array to bypass 'in' operator check crash
                    field.type = { array: ["u8", 32] };
                }
            });
        }

        // 3. Create a new types array including the moved definition
        const newTypes = [
            ...(idl.types || []),
            {
                name: 'TrackedTrader',
                type: patchedType
            }
        ];

        // 4. Create a normalized IDL with the type stripped from accounts
        // AND inject the discriminator manually (Array of numbers) to bypass coder lookup failure
        const normalizedIdl = {
            ...idl,
            accounts: [
                {
                    name: 'TrackedTrader',
                    discriminator: [0x40, 0xea, 0x6b, 0xa0, 0x87, 0x8a, 0x16, 0xac] // sha256("account:TrackedTrader").slice(0, 8)
                } 
            ],
            types: newTypes
        };
        
        console.log("Instantiating Coder with normalized and patched IDL...");
        
        const coder = new anchor.BorshAccountsCoder(normalizedIdl as any);
        
        console.log("Fetching accounts for Program ID:", PROGRAM_ID.toString());
        // Fetch all program accounts manually to bypass Anchor .all() issues
        const allAccounts = await connection.getProgramAccounts(PROGRAM_ID);
        console.log("Total accounts found:", allAccounts.length);
        
        const tradersData: WhaleTrader[] = [];

        for (const account of allAccounts) {
          try {
            // Try to decode as TrackedTrader
            const data = coder.decode("TrackedTrader", account.account.data);
            if (data) {
              // Convert polygon address bytes to hex string
              const addressBytes = data.polygonAddress;
              const hex = Array.from(addressBytes as number[]).map(b => b.toString(16).padStart(2, '0')).join('');
              const walletAddress = '0x' + hex;
              
              // Get tier (0=Whale, 1=Shark, 2=Fish, 3=Shrimp, 4=Degen)
              const tierNames: ('Whale' | 'Shark' | 'Fish' | 'Shrimp' | 'Degen')[] = ['Whale', 'Shark', 'Fish', 'Shrimp', 'Degen'];
              const tier = tierNames[data.tier] || 'Fish';
              
              const tradeCount = data.tradeCount;
              const winRate = data.winRate / 100; // winRate is stored as basis points
              const winningTrades = Math.floor((tradeCount * winRate) / 100);
              
              tradersData.push({
                walletAddress,
                tier,
                totalTrades: tradeCount,
                winningTrades,
                totalVolume: data.totalVolume.toNumber(),
                winRate,
                totalPnl: data.totalPnl.toNumber(),
                roi: data.roi,
              });
            }
          } catch (e) {
            // Not a TrackedTrader account, skip
          }
        }
        
        // Sort by win rate
        tradersData.sort((a, b) => b.winRate - a.winRate);
        
        setTraders(tradersData);
        setError(null);
      } catch (err) {
        console.error('Error fetching traders:', err);
        setError('Failed to fetch whale traders');
        setTraders([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTraders();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchTraders, 30000);
    return () => clearInterval(interval);
  }, [connection]);

  return { traders, loading, error };
}
