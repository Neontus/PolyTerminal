const { Connection, PublicKey } = require('@solana/web3.js');
const anchor = require('@coral-xyz/anchor');

// Configuration
const PROGRAM_ID = "EFTzno3x2oUc2QhVEQRupcx8FLTWiN7bNc1RvgNu621D";
const RPC_URL = "https://api.devnet.solana.com";

async function main() {
    console.log(`🔌 Connecting to ${RPC_URL}...`);
    const connection = new Connection(RPC_URL, "confirmed");
    const programId = new PublicKey(PROGRAM_ID);

    console.log(`🔍 Fetching ALL accounts for Program: ${PROGRAM_ID}`);
    const accounts = await connection.getProgramAccounts(programId);

    console.log(`✅ Found ${accounts.length} total accounts.`);

    if (accounts.length === 0) {
        console.error("❌ No accounts found! Did the initialization scripts run successfully on Devnet?");
        return;
    }

    // Discriminator Map (pre-calculated for reference)
    const discriminators = {
        'PythSignal': anchor.utils.sha256.hash("account:PythSignal").slice(0, 16),
        'TrackedTrader': anchor.utils.sha256.hash("account:TrackedTrader").slice(0, 16)
    };
    console.log("Expected Discriminators (first 8 bytes hex):");
    console.log(`PythSignal:    ${Buffer.from(discriminators.PythSignal, 'hex').toString('hex').slice(0, 16)}`);
    // Note: Anchor hash returns hex string by default in node context of this util? Let's check.
    // Actually anchor.utils.sha256.hash returns a HEX string.
    console.log(`PythSignal (raw):    ${discriminators.PythSignal.slice(0, 16)}`);
    console.log(`TrackedTrader (raw): ${discriminators.TrackedTrader.slice(0, 16)}`);

    console.log("\n--- Account Breakdown ---");

    accounts.forEach((acc, i) => {
        const pubkey = acc.pubkey.toString();
        const data = acc.account.data;
        const discriminator = data.slice(0, 8).toString('hex');
        const length = data.length;

        console.log(`[${i}] Pubkey: ${pubkey}`);
        console.log(`    Length: ${length} bytes`);
        console.log(`    Discriminator (hex): ${discriminator}`);

        // Try to identify based on known lengths or discriminators
        // Note: You can verify these against what the frontend expects
    });
}

main().catch(console.error);
