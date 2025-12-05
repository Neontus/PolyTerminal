// Publish Sample Pyth Signals
// Run this in Solana Playground Client

import * as anchor from "@coral-xyz/anchor";

const program = anchor.workspace.PredictionCopilot;
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

console.log("📊 Publishing Sample Pyth Signals...");

// Helper to convert string to fixed-size byte array
function stringToBytes16(str: string): number[] {
  const bytes = new Array(16).fill(0);
  for (let i = 0; i < Math.min(str.length, 16); i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}

// Dummy Pyth feed account (just for demo)
const dummyPythFeed = anchor.web3.Keypair.generate().publicKey;

// Signal 1: BTC high severity
console.log("\n1️⃣ Publishing BTC signal (High severity)...");
const btcAsset = stringToBytes16("BTC-USD");
const btcDetectedAt = Math.floor(Date.now() / 1000);

const [signal1Pda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("signal"), Buffer.from(btcAsset), Buffer.from(new anchor.BN(btcDetectedAt).toArray("le", 8))],
  program.programId
);

try {
  await program.methods
    .publishSignal(
      btcAsset,
      new anchor.BN(btcDetectedAt),
      new anchor.BN(95000_00000000), // price: $95,000
      new anchor.BN(85), // confidence: 85%
      new anchor.BN(99), // baseline: 99%
      140, // multiplier: 1.4x
      1 // severity: 1 = High (0=Low, 1=High, 2=Critical)
    )
    .accounts({
      publisher: provider.wallet.publicKey,
      config: anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId)[0],
      signal: signal1Pda,
      pythFeed: dummyPythFeed,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
  
  console.log("✅ Published BTC signal");
} catch (err) {
  console.log("ℹ️  Error:", err.message);
}

// Signal 2: ETH medium severity
console.log("\n2️⃣ Publishing ETH signal (Medium severity)...");
const ethAsset = stringToBytes16("ETH-USD");
const ethDetectedAt = Math.floor(Date.now() / 1000) + 1;

const [signal2Pda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("signal"), Buffer.from(ethAsset), Buffer.from(new anchor.BN(ethDetectedAt).toArray("le", 8))],
  program.programId
);

try {
  await program.methods
    .publishSignal(
      ethAsset,
      new anchor.BN(ethDetectedAt),
      new anchor.BN(3500_00000000), // price: $3,500
      new anchor.BN(90), // confidence: 90%
      new anchor.BN(99), // baseline: 99%
      110, // multiplier: 1.1x
      0 // severity: 0 = Low/Medium
    )
    .accounts({
      publisher: provider.wallet.publicKey,
      config: anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId)[0],
      signal: signal2Pda,
      pythFeed: dummyPythFeed,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
  
  console.log("✅ Published ETH signal");
} catch (err) {
  console.log("ℹ️  Error:", err.message);
}

// Signal 3: SOL critical severity
console.log("\n3️⃣ Publishing SOL signal (Critical severity)...");
const solAsset = stringToBytes16("SOL-USD");
const solDetectedAt = Math.floor(Date.now() / 1000) + 2;

const [signal3Pda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("signal"), Buffer.from(solAsset), Buffer.from(new anchor.BN(solDetectedAt).toArray("le", 8))],
  program.programId
);

try {
  await program.methods
    .publishSignal(
      solAsset,
      new anchor.BN(solDetectedAt),
      new anchor.BN(100_00000000), // price: $100
      new anchor.BN(75), // confidence: 75%
      new anchor.BN(99), // baseline: 99%
      200, // multiplier: 2.0x
      2 // severity: 2 = Critical
    )
    .accounts({
      publisher: provider.wallet.publicKey,
      config: anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId)[0],
      signal: signal3Pda,
      pythFeed: dummyPythFeed,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
  
  console.log("✅ Published SOL signal");
} catch (err) {
  console.log("ℹ️  Error:", err.message);
}

console.log("\n🎉 Sample signals published!");
console.log("Refresh your frontend to see the signals feed!");

