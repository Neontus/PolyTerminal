import { Connection, PublicKey } from '@solana/web3.js';
import { solanaService } from '../services/solana';

class WhaleWatcher {
    private connection: Connection;
    private monitoredAddresses: Map<string, string> = new Map(); // SolanaAddr -> PolygonAddr
    private subscriptionIds: Map<string, number> = new Map();

    constructor() {
        this.connection = solanaService.connection;
    }

    // Sync monitored list with what's in our simple "DB" (memory array in polymarket service)
    // In a real app, this would query Postgres
    public async syncMonitoredTraders() {
        // Here we ideally need the MAPPING from Polygon -> Solana.
        // For this demo, let's assume we have a way to get the Solana address for a Polygon whale.
        // We'll mock this for now or rely on what was added via the Frontend if we shared a DB.
        
        // LIMITATION: The backend `polymarketService` stores simple strings. 
        // We need a store for the solana addresses.
        // For the sake of the demo, I will hardcode monitoring of the *User's* inputs if possible,
        // or just expose a method `watch(solanaAddress, polygonAddress)`
        
        console.log("[WhaleWatcher] Syncing traders...");
    }

    public watch(solanaAddress: string, polygonAddress: string) {
        if (this.monitoredAddresses.has(solanaAddress)) return;

        console.log(`[WhaleWatcher] Starting watch on ${solanaAddress} (linked to ${polygonAddress})`);
        this.monitoredAddresses.set(solanaAddress, polygonAddress);

        try {
            const pubkey = new PublicKey(solanaAddress);
            const subId = this.connection.onLogs(
                pubkey,
                async (logs) => {
                    if (logs.err) return;
                    
                    console.log(`[WhaleWatcher] Activity detected for ${solanaAddress}!`);
                    
                    // HEURISTIC: Check if this was a transfer (simplified)
                    // In production, parse the transaction to see if balance increased.
                    // For DEMO: Assume any activity is a deposit we want to record.
                    
                    try {
                        // Record to Smart Contract
                        // We use a fixed amount for the demo since parsing logs is complex
                        await solanaService.recordMovement(polygonAddress, 1.5); // 1.5 SOL
                    } catch (e) {
                        console.error("Failed to record to chain:", e);
                    }
                },
                "confirmed"
            );
            this.subscriptionIds.set(solanaAddress, subId);
        } catch (e) {
            console.error("Invalid solana address to watch:", solanaAddress);
        }
    }
}

export const whaleWatcher = new WhaleWatcher();
