import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PredictionCopilot } from "../target/types/prediction_copilot";
import { assert } from "chai";

describe("admin-actions", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PredictionCopilot as Program<PredictionCopilot>;
  
  // PDAs
  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );
  
  const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("registry")],
    program.programId
  );

  it("Is initialized!", async () => {
    // Basic Price: 5 USDC (5_000_000)
    // Pro Price: 20 USDC (20_000_000)
    // Duration: 30 days (2592000 seconds)
    
    // Create a random treasury keypair for testing
    const treasury = anchor.web3.Keypair.generate();

    try {
        await program.methods
        .initializeConfig(
            new anchor.BN(5_000_000), 
            new anchor.BN(20_000_000),
            new anchor.BN(2592000),
            new anchor.BN(2592000)
        )
        .accounts({
            admin: provider.wallet.publicKey,
            config: configPda,
            treasury: treasury.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
        
        console.log("Config initialized");
    } catch (e) {
        console.log("Config might already be initialized:", e);
    }

    const configAccount = await program.account.programConfig.fetch(configPda);
    assert.ok(configAccount.admin.equals(provider.wallet.publicKey));
    assert.equal(configAccount.basicPrice.toNumber(), 5_000_000);
  });
  
  it("Initializes Registry", async () => {
      try {
        await program.methods
            .initializeRegistry()
            .accounts({
                admin: provider.wallet.publicKey,
                config: configPda,
                registry: registryPda,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();
        console.log("Registry initialized");
      } catch (e) {
          console.log("Registry might already be initialized", e);
      }
      
      const registryAccount = await program.account.whaleRegistry.fetch(registryPda);
      assert.equal(registryAccount.whaleCount, 0);
  });
  
  it("Adds a Trader", async () => {
      // Mock polygon address (20 bytes)
      const polygonAddress = Array.from(Buffer.alloc(20, 1)); // [1, 1, ..., 1]
      
      const [traderPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("trader"), Buffer.from(polygonAddress)],
        program.programId
      );
      
      try {
          // Check if exists first to avoid error in reruns
          await program.account.trackedTrader.fetch(traderPda);
          console.log("Trader already exists");
      } catch (e) {
          await program.methods
            .addTrader(
                polygonAddress,
                0, // Whale tier
                new anchor.BN(1000000), // Total PnL (1 USDC)
                7500, // Win rate 75%
                100, // Trade count
                new anchor.BN(5000000), // Volume
                500 // ROI 5%
            )
            .accounts({
                admin: provider.wallet.publicKey,
                config: configPda,
                registry: registryPda,
                trader: traderPda,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();
            console.log("Trader added");
      }
      
      const traderAccount = await program.account.trackedTrader.fetch(traderPda);
      assert.deepEqual(traderAccount.polygonAddress, polygonAddress);
      assert.equal(traderAccount.tier, 0);
  });
  
  it("Publishes a Signal", async () => {
      const asset = Buffer.alloc(16);
      asset.write("BTC/USD");
      const assetArray = Array.from(asset);
      const detectedAt = new anchor.BN(Math.floor(Date.now() / 1000));
      
      const [signalPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("signal"), Buffer.from(assetArray), detectedAt.toArrayLike(Buffer, 'le', 8)],
        program.programId
      );
      
      // Random feed address
      const pythFeed = anchor.web3.Keypair.generate().publicKey;
      
      await program.methods
        .publishSignal(
            assetArray,
            detectedAt,
            new anchor.BN(50000000000), // Price
            new anchor.BN(100), // Confidence
            new anchor.BN(50), // Baseline confidence
            300, // Multiplier (3x)
            1 // Severity Medium
        )
        .accounts({
            publisher: provider.wallet.publicKey,
            config: configPda,
            signal: signalPda,
            pythFeed: pythFeed,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
        
      console.log("Signal published");
      
      const signalAccount = await program.account.pythSignal.fetch(signalPda);
      assert.equal(signalAccount.multiplier, 300);
  });
});
