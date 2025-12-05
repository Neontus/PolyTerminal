import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import idl from '../idl/idl.json';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Default Devnet Program ID
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID || 'EFTzno3x2oUc2QhVEQRupcx8FLTWiN7bNc1RvgNu621D');

class SolanaService {
    connection: Connection;
    provider: anchor.AnchorProvider;
    program: anchor.Program;
    adminKeypair: Keypair;

    constructor() {
        const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        this.connection = new Connection(rpcUrl, 'confirmed');

        // Load Admin Keypair from File or Env
        // For PoC, we'll generate a dummy keypair if not present, but in prod this must be the real admin
        // that has authority to call 'recordWhaleMovement'
        if (process.env.ADMIN_KEYPAIR_PATH) {
            const secretKey = JSON.parse(fs.readFileSync(process.env.ADMIN_KEYPAIR_PATH, 'utf-8'));
            this.adminKeypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
        } else {
             console.warn("No ADMIN_KEYPAIR_PATH found. Using a random keypair (Transactions will fail if auth required).");
             this.adminKeypair = Keypair.generate();
        }

        const wallet = new anchor.Wallet(this.adminKeypair);
        this.provider = new anchor.AnchorProvider(this.connection, wallet, {
            preflightCommitment: 'confirmed',
        });

        // @ts-ignore
        this.program = new anchor.Program(idl, PROGRAM_ID, this.provider);
    }

    async getProgramConfig() {
        const [configPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('config')],
            PROGRAM_ID
        );
        return configPda;
    }
    
    // Helper to find Trader PDA
    getTraderPda(polygonAddress: string) {
        // clean 0x
        const cleanAddr = polygonAddress.toLowerCase().replace('0x', '');
        const addressBytes = [];
        for (let i = 0; i < cleanAddr.length; i += 2) {
            addressBytes.push(parseInt(cleanAddr.substring(i, i + 2), 16));
        }
        
        const [traderPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('trader'), Buffer.from(addressBytes)],
            PROGRAM_ID
        );
        return { traderPda, addressBytes };
    }

    async recordMovement(polygonAddress: string, amountSol: number) {
        try {
            const { traderPda, addressBytes } = this.getTraderPda(polygonAddress);
            const configPda = await this.getProgramConfig();
            
            // Amount in Lamports
            const amountLamports = new anchor.BN(amountSol * 1_000_000_000);

            console.log(`[Keeper] Recording movement for ${polygonAddress} on-chain...`);

            const tx = await this.program.methods
            // @ts-ignore
                .recordWhaleMovement(
                    addressBytes,
                    amountLamports,
                    "SOL", // token
                    "Deposit" // direction
                )
                .accounts({
                    admin: this.adminKeypair.publicKey,
                    config: configPda,
                    trader: traderPda,
                })
                .rpc();

            console.log(`[Keeper] Success! Tx: ${tx}`);
            return tx;
        } catch (error) {
            console.error("[Keeper] Failed to record movement:", error);
            throw error;
        }
    }
}

export const solanaService = new SolanaService();
