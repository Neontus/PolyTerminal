import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

export interface DepositAlert {
    signature: string;
    amount: number; // in SOL
    token?: string; // "SOL" or "USDC"
    from: string;
    timestamp: number;
}

export function useDepositTracker(targetAddress: string | null) {
    const { connection } = useConnection();
    const [alerts, setAlerts] = useState<DepositAlert[]>([]);

    useEffect(() => {
        if (!targetAddress) return;

        let subId: number;
        
        try {
            const pubkey = new PublicKey(targetAddress);
            console.log(`Starting deposit tracker for: ${targetAddress}`);

            // Subscribe to logs involving this address
            // faster than onAccountChange for detecting interactions, though less data rich
            subId = connection.onLogs(
                pubkey,
                (logs) => {
                    if (logs.err) return;
                    
                    console.log("Activity detected on monitored wallet!", logs);
                    
                    // In a real app, we would fetch the tx details here to confirm amount.
                    // For this demo, we'll optimistically alert "Activity Detected"
                    // or simulate a fetch.
                    
                    const newAlert: DepositAlert = {
                        signature: logs.signature,
                        amount: 0, // Placeholder, requires getTransaction to fill
                        from: "Unknown",
                        timestamp: Date.now(),
                        token: "SOL" // Assumption
                    };
                    
                    setAlerts(prev => [newAlert, ...prev]);
                    
                    // Optional: Trigger a toast or sound here
                },
                "confirmed"
            );
        } catch (e) {
            console.error("Invalid public key for tracker:", targetAddress);
        }

        return () => {
            if (subId) connection.removeOnLogsListener(subId);
        };
    }, [targetAddress, connection]);

    return { alerts };
}
