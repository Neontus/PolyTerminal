import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { useMemo, useCallback } from 'react';
import idl from '../idl/idl.json';

const PROGRAM_ID = new PublicKey(import.meta.env.VITE_PROGRAM_ID || 'EFTzno3x2oUc2QhVEQRupcx8FLTWiN7bNc1RvgNu621D');

export function usePredictionCopilot() {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    const provider = useMemo(() => {
        if (!wallet) return null;
        return new anchor.AnchorProvider(connection, wallet, {
            preflightCommitment: 'confirmed',
        });
    }, [connection, wallet]);

    const program = useMemo(() => {
        if (!provider) return null;
        
        // Patch IDL with explicit address to avoid constructor ambiguity
        const patchedIdl = {
            ...idl,
            address: PROGRAM_ID.toString(), // Anchor 0.30+ uses root-level address or metadata.address
            metadata: {
                ...((idl as any).metadata || {}),
                address: PROGRAM_ID.toString()
            }
        };
        
        try {
            // Use standard constructor signature (idl, provider) now that IDL has address
            return new anchor.Program(patchedIdl as any, provider);
        } catch (e: any) {
            console.error("Program init failed (likely missing config)", e);
            // Return a minimal object if program fails, so we can still call initialize? 
            // Actually better to return null and handle it in UI for now, OR return a partial object that allows initialization specifically.
            // For now let's just return null, but ensuring the UI doesn't crash is key.
            return null;
        }
    }, [provider]);

    const getPDAs = useCallback(() => {
        const [configPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('config')],
            PROGRAM_ID
        );
        const [registryPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('registry')],
            PROGRAM_ID
        );
        return { configPda, registryPda };
    }, []);

    const addTrader = useCallback(async (
        polygonAddressStr: string,
        solanaAddressStr: string | null = null, // [NEW] Optional Solana Address
        tier: number = 2, // Default to Fish
        stats: {
            totalPnl: number;
            winRate: number;
            tradeCount: number;
            totalVolume: number;
            roi: number;
        } = { totalPnl: 0, winRate: 0, tradeCount: 0, totalVolume: 0, roi: 0 }
    ) => {
        if (!program || !wallet) throw new Error("Wallet not connected");

        // Convert 0x... string to [u8; 20] array
        // Remove 0x prefix if present
        const cleanAddr = polygonAddressStr.toLowerCase().replace('0x', '');
        if (cleanAddr.length !== 40) {
            throw new Error("Invalid Polygon address length");
        }
        
        const addressBytes = [];
        for (let i = 0; i < cleanAddr.length; i += 2) {
            addressBytes.push(parseInt(cleanAddr.substring(i, i + 2), 16));
        }

        const { configPda, registryPda } = getPDAs();
        
        const [traderPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('trader'), Buffer.from(addressBytes)],
            PROGRAM_ID
        );

        console.log("Adding trader:", {
            admin: wallet.publicKey.toString(),
            traderPda: traderPda.toString(),
            addressBytes
        });

        const solanaAddressParam = solanaAddressStr ? new PublicKey(solanaAddressStr) : null;

        // @ts-ignore - IDL types are sometimes tricky with Anchor 0.32
        const tx = await program.methods
            .addTrader(
                addressBytes,
                // Solana Address: Option<Pubkey> serialized manually as [u8; 33]
                // Discriminator (1 byte) + 32 bytes Key
                (() => {
                    const bytes = new Uint8Array(33);
                    if (solanaAddressParam) {
                        bytes[0] = 1; // Some
                        bytes.set(solanaAddressParam.toBytes(), 1);
                    } else {
                        bytes[0] = 0; // None
                    }
                    return Array.from(bytes);
                })(),
                tier,
                new anchor.BN(stats.totalPnl),
                stats.winRate,
                stats.tradeCount,
                new anchor.BN(stats.totalVolume),
                stats.roi
            )
            .accounts({
                admin: wallet.publicKey,
                config: configPda,
                registry: registryPda,
                trader: traderPda,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
        
        return tx;
    }, [program, wallet, getPDAs]);

    const initialize = useCallback(async () => {
        if (!wallet || !provider) throw new Error("Wallet not connected");

        // If generic program init failed (due to missing accounts), create a temporary one just for this call
        // We know the IDL and address, so we can force it.
        let localProgram = program;
        if (!localProgram) {
             const patchedIdl = {
                ...idl,
                address: PROGRAM_ID.toString(),
                metadata: {
                    ...((idl as any).metadata || {}),
                    address: PROGRAM_ID.toString()
                }
            };
            localProgram = new anchor.Program(patchedIdl as any, provider);
        }

        const { configPda } = getPDAs();
        console.log("Initializing config:", configPda.toString());

        // @ts-ignore
        const tx = await localProgram.methods
            .initializeConfig(
                new anchor.BN(10_000_000), // Basic Price (dummy)
                new anchor.BN(50_000_000), // Pro Price (dummy)
                new anchor.BN(30 * 24 * 60 * 60), // Basic Duration (30 days)
                new anchor.BN(90 * 24 * 60 * 60)  // Pro Duration (90 days)
            )
            .accounts({
                admin: wallet.publicKey,
                config: configPda,
                treasury: wallet.publicKey, // Use admin as treasury for now
                systemProgram: SystemProgram.programId,
            })
            .rpc();
        
        // Also initialize Registry
        const { registryPda } = getPDAs();
        console.log("Initializing registry:", registryPda.toString());
        await localProgram.methods.initializeRegistry()
            .accounts({
                admin: wallet.publicKey,
                config: configPda,
                registry: registryPda,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        return tx;
    }, [program, wallet, provider, getPDAs]);

    return {
        program,
        addTrader,
        initialize,
        isReady: !!program
    };
}
