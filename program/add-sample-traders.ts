// Add Sample Whale Traders
// Run this in Solana Playground Client

import * as anchor from "@coral-xyz/anchor";

const program = anchor.workspace.PredictionCopilot;
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

console.log("🐋 Adding Sample Whale Traders...");

// Helper to convert hex string to bytes
function hexToBytes20(hex: string): number[] {
  const bytes = new Array(20).fill(0);
  const cleanHex = hex.replace('0x', '');
  for (let i = 0; i < Math.min(cleanHex.length / 2, 20); i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Get config and registry PDAs
const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);

const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("registry")],
  program.programId
);

// Trader 1: Gold Tier Whale
console.log("\n1️⃣ Adding Gold Tier Trader...");
const trader1Address = hexToBytes20("0x1234567890123456789012345678901234567890");
const [trader1Pda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("trader"), Buffer.from(trader1Address)],
  program.programId
);

try {
  await program.methods
    .addTrader(
      trader1Address,
      0, // tier: 0 = Whale
      new anchor.BN(500000), // total_pnl: $500k profit
      8500, // win_rate: 85.00% (in basis points)
      250, // trade_count
      new anchor.BN(5000000), // total_volume: $5M
      12000 // roi: 120% (in basis points)
    )
    .accounts({
      admin: provider.wallet.publicKey,
      config: configPda,
      registry: registryPda,
      trader: trader1Pda,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
  
  console.log("✅ Added Gold Tier trader");
} catch (err) {
  console.log("ℹ️  Trader may already exist:", err.message);
}

// Trader 2: Silver Tier Shark
console.log("\n2️⃣ Adding Silver Tier Trader...");
const trader2Address = hexToBytes20("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
const [trader2Pda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("trader"), Buffer.from(trader2Address)],
  program.programId
);

try {
  await program.methods
    .addTrader(
      trader2Address,
      1, // tier: 1 = Shark
      new anchor.BN(250000), // total_pnl: $250k profit
      7800, // win_rate: 78.00%
      180, // trade_count
      new anchor.BN(3000000), // total_volume: $3M
      9500 // roi: 95%
    )
    .accounts({
      admin: provider.wallet.publicKey,
      config: configPda,
      registry: registryPda,
      trader: trader2Pda,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
  
  console.log("✅ Added Silver Tier trader");
} catch (err) {
  console.log("ℹ️  Trader may already exist:", err.message);
}

// Trader 3: Bronze Tier Fish
console.log("\n3️⃣ Adding Bronze Tier Trader...");
const trader3Address = hexToBytes20("0x9999888877776666555544443333222211110000");
const [trader3Pda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("trader"), Buffer.from(trader3Address)],
  program.programId
);

try {
  await program.methods
    .addTrader(
      trader3Address,
      2, // tier: 2 = Fish
      new anchor.BN(100000), // total_pnl: $100k profit
      6500, // win_rate: 65.00%
      120, // trade_count
      new anchor.BN(1500000), // total_volume: $1.5M
      7000 // roi: 70%
    )
    .accounts({
      admin: provider.wallet.publicKey,
      config: configPda,
      registry: registryPda,
      trader: trader3Pda,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
  
  console.log("✅ Added Bronze Tier trader");
} catch (err) {
  console.log("ℹ️  Trader may already exist:", err.message);
}

console.log("\n🎉 Sample traders added!");
console.log("Refresh your frontend to see the whale leaderboard!");
