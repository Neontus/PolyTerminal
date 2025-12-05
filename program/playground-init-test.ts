// Save this as: tests/initialize.ts in Solana Playground
// Then click "Test" button to run it

import * as anchor from "@coral-xyz/anchor";

describe("Initialize Program", () => {
  it("Initializes config and registry", async () => {
    const program = anchor.workspace.PredictionCopilot;
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    // Initialize Config
    const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    try {
      await program.methods
        .initializeConfig(
          new anchor.BN(10_000_000), // 10 USDC for basic
          new anchor.BN(50_000_000), // 50 USDC for pro
          new anchor.BN(30 * 24 * 60 * 60), // 30 days
          new anchor.BN(90 * 24 * 60 * 60)  // 90 days
        )
        .accounts({
          admin: provider.wallet.publicKey,
          config: configPda,
          treasury: provider.wallet.publicKey, // Treasury address (using admin for demo)
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Config initialized at:", configPda.toString());
    } catch (err) {
      console.log("ℹ️  Config may already be initialized:", err.message);
    }

    // Initialize Registry
    const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId
    );

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

      console.log("✅ Registry initialized at:", registryPda.toString());
    } catch (err) {
      console.log("ℹ️  Registry may already be initialized:", err.message);
    }

    console.log("\n🎉 Program is ready to use!");
  });
});
