import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PredictionCopilot } from "../target/types/prediction_copilot";
import { assert } from "chai";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAccount } from "@solana/spl-token";

describe("user-actions", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PredictionCopilot as Program<PredictionCopilot>;
  
  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );
  
  let usdcMint: anchor.web3.PublicKey;
  let userUsdc: anchor.web3.PublicKey;
  let treasuryUsdc: anchor.web3.PublicKey;
  const user = anchor.web3.Keypair.generate();
  
  // Setup: Create a fresh user and mint USDC to them
  it("Setup User with USDC", async () => {
      // Allow provider to pay for setup
      const payer = (provider.wallet as any).payer; // Access underlying keypair for spl-token funcs
      
      // 1. Create Mint
      usdcMint = await createMint(
          provider.connection,
          payer,
          provider.wallet.publicKey,
          null,
          6
      );
      
      // 2. Fund user with SOL for fees
      const sx = await provider.connection.requestAirdrop(user.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(sx);
      
      // 3. Create User Token Account
      userUsdc = await createAccount(
          provider.connection,
          payer,
          usdcMint,
          user.publicKey
      );
      
      // 4. Mint 100 USDC to user
      await mintTo(
          provider.connection,
          payer,
          usdcMint,
          userUsdc,
          provider.wallet.publicKey,
          100_000_000 // 100 USDC
      );
      
      // 5. Create Treasury Token Account (owned by treasury PDA or address in config)
      // For this test, we need to know what the treasury address is in config.
      // In a real test we'd fetch config.treasury.
      const configAccount = await program.account.programConfig.fetch(configPda);
      const treasuryPubkey = configAccount.treasury;
      
      treasuryUsdc = await createAccount(
          provider.connection,
          payer,
          usdcMint,
          treasuryPubkey
      );
      
      console.log("User setup complete with 100 USDC");
  });

  it("Subscribes to Basic Tier", async () => {
      const [subscriptionPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("subscription"), user.publicKey.toBuffer()],
        program.programId
      );
      
      // Basic Tier = 1
      await program.methods
        .subscribe(1)
        .accounts({
            user: user.publicKey,
            subscription: subscriptionPda,
            config: configPda,
            userUsdc: userUsdc,
            treasuryUsdc: treasuryUsdc,
            usdcMint: usdcMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user]) 
        .rpc();
        
      console.log("Subscribed to Basic");
      
      const subAccount = await program.account.subscription.fetch(subscriptionPda);
      assert.equal(subAccount.tier, 1);
      assert.ok(subAccount.expiresAt.toNumber() > Date.now()/1000);
  });
});
