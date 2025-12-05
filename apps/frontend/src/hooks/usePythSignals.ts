import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import idl from '../idl/idl.json';

const PROGRAM_ID = new PublicKey(import.meta.env.VITE_PROGRAM_ID || 'EFTzno3x2oUc2QhVEQRupcx8FLTWiN7bNc1RvgNu621D');

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
  const { connection } = useConnection();
  const [signals, setSignals] = useState<PythSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSignals() {
      try {
        setLoading(true);
        
        // Anchor 0.32.1 requires strict separation of accounts and types.
        // We must move the inline account type definition to the 'types' array.
        
        // 1. Find the original account definition
        const originalPythAcc = idl.accounts.find(acc => acc.name === 'PythSignal');
        
        if (!originalPythAcc) {
            throw new Error("PythSignal account not found in IDL");
        }

        // 2. Deep clone and patch fields to avoid Anchor 0.32.1 crash on "publicKey" type
        const patchedType = JSON.parse(JSON.stringify(originalPythAcc.type));
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
                name: 'PythSignal',
                type: patchedType
            }
        ];

        // 4. Create a normalized IDL with the type stripped from accounts
        // AND inject the discriminator manually (Array of numbers) to bypass coder lookup failure
        const normalizedIdl = {
            ...idl,
            accounts: [
                { 
                    name: 'PythSignal',
                    discriminator: [0x2f, 0x22, 0x8d, 0xfc, 0x5b, 0x81, 0x2b, 0xcb] // sha256("account:PythSignal").slice(0, 8)
                } 
            ],
            types: newTypes
        };
        
        console.log("Instantiating Coder with normalized and patched IDL...");
        const coder = new anchor.BorshAccountsCoder(normalizedIdl as any);
        
        console.log("Fetching accounts for Program ID:", PROGRAM_ID.toString());
        // Fetch all program accounts manually to bypass Anchor .all() issues
        const allAccounts = await connection.getProgramAccounts(PROGRAM_ID);
        console.log("Total accounts found (usePyth):", allAccounts.length);
        if (allAccounts.length > 0) {
            const firstAcc = allAccounts[0];
            const discriminator = firstAcc.account.data.slice(0, 8);
            console.log("First account discriminator:", Array.from(discriminator).map(b => b.toString(16).padStart(2, '0')).join(' '));
            console.log("First account pubkey:", firstAcc.pubkey.toString());
        }
        
        const signalsData: PythSignal[] = [];
        
        for (const account of allAccounts) {
          try {
            // Try to decode as PythSignal
            const data = coder.decode("PythSignal", account.account.data);
            if (data) {
              // Convert asset bytes to string
              const assetBytes = data.asset;
              const marketId = new TextDecoder().decode(new Uint8Array(assetBytes as number[])).replace(/\0/g, '');
              
              // Get severity (0=Low, 1=High, 2=Critical)
              const severityNames: ('Low' | 'High' | 'Critical')[] = ['Low', 'High', 'Critical'];
              const severity = severityNames[data.severity] || 'Low';
              
              signalsData.push({
                id: account.pubkey.toString(), // Use pubkey as ID
                marketId,
                confidence: data.confidence.toNumber(),
                severity,
                timestamp: data.detectedAt.toNumber(),
                price: data.price.toNumber(),
                multiplier: data.multiplier,
              });
            }
          } catch (e) {
            // Not a PythSignal account, skip
          }
        }
        
        // Sort by timestamp (newest first)
        signalsData.sort((a, b) => b.timestamp - a.timestamp);
        
        setSignals(signalsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching signals:', err);
        setError('Failed to fetch Pyth signals');
        setSignals([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSignals();
    
    // Refresh every 15 seconds
    const interval = setInterval(fetchSignals, 15000);
    return () => clearInterval(interval);
  }, [connection]);

  return { signals, loading, error };
}
