const anchor = require("@coral-xyz/anchor");
const fs = require('fs');
const path = require('path');

// Load IDL manually
const idlPath = path.resolve(__dirname, '../apps/frontend/src/idl/idl.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

console.log("Original IDL accounts:", idl.accounts.map(a => a.name));

// Simulate the filtering logic from usePythSignals.ts
const filteredPythSignalIdl = {
    ...idl,
    accounts: idl.accounts.filter(acc => acc.name === 'PythSignal'),
    types: idl.types
};
console.log("Filtered Pyth IDL accounts:", filteredPythSignalIdl.accounts.map(a => a.name));

try {
    console.log("Attempting to instantiate Coder for PythSignal...");
    const coder = new anchor.BorshAccountsCoder(filteredPythSignalIdl);
    console.log("✅ PythSignal Coder instantiated successfully!");
} catch (e) {
    console.error("❌ PythSignal Coder failed:", e);
}

console.log("---------------------------------------------------");

// Simulate the filtering logic from useWhaleTraders.ts
const filteredTraderIdl = {
    ...idl,
    accounts: idl.accounts.filter(acc => acc.name === 'TrackedTrader'),
    types: idl.types
};
console.log("Filtered Trader IDL accounts:", filteredTraderIdl.accounts.map(a => a.name));

try {
    console.log("Attempting to instantiate Coder for TrackedTrader...");
    const coder = new anchor.BorshAccountsCoder(filteredTraderIdl);
    console.log("✅ TrackedTrader Coder instantiated successfully!");
} catch (e) {
    console.error("❌ TrackedTrader Coder failed:", e);
}

console.log("---------------------------------------------------");
try {
    console.log("Attempting to instantiate Coder with FULL IDL...");
    const coder = new anchor.BorshAccountsCoder(idl);
    console.log("✅ FULL IDL Coder instantiated successfully!");
} catch (e) {
    console.error("❌ FULL IDL Coder failed:", e);
}

console.log("---------------------------------------------------");
try {
    console.log("TEST 1: Empty Accounts");
    const emptyIdl = { ...idl, accounts: [] };
    new anchor.BorshAccountsCoder(emptyIdl);
    console.log("✅ Empty Accounts Coder instantiated!");
} catch (e) { console.error("❌ Empty Accounts failed:", e); }

try {
    console.log("TEST 2: Simple Inline Struct");
    const simpleIdl = {
        ...idl,
        accounts: [{
            name: "SimpleAccount",
            type: {
                kind: "struct",
                fields: [{ name: "data", type: "u64" }]
            }
        }]
    };
    new anchor.BorshAccountsCoder(simpleIdl);
    console.log("✅ Simple Inline Coder instantiated!");
} catch (e) { console.error("❌ Simple Inline failed:", e); }

try {
    console.log("TEST 3: PythSignal Structure (Cloned)");
    // Copy exactly what is in the file
    const pythAcc = idl.accounts.find(a => a.name === 'PythSignal');
    const testIdl = { ...idl, accounts: [pythAcc] };
    new anchor.BorshAccountsCoder(testIdl);
    console.log("✅ Cloned PythSignal instantiated!");
} catch (e) { console.error("❌ Cloned PythSignal failed:", e); }

try {
    console.log("TEST 4: Separated Types (Reproducing Crash)");
    const separatedIdl = {
        ...idl,
        accounts: [{ name: "SeparatedAccount" }],
        types: [{
            name: "SeparatedAccount",
            type: {
                kind: "struct",
                fields: [
                    { name: "complex", type: { array: ["u8", 8] } }, // Object type (should pass 'in' check)
                    { name: "simple", type: "publicKey" } // Can 'in' operator search in string "publicKey"?
                ]
            }
        }]
    };
    new anchor.BorshAccountsCoder(separatedIdl);
    console.log("✅ Separated Types instantiated!");
} catch (e) {
    console.error("❌ Separated Types failed:", e);
}

try {
    console.log("TEST 6: Substitute publicKey with [u8; 32]");
    const separatedIdl = {
        ...idl,
        accounts: [{ name: "SubstitutedAccount" }],
        types: [{
            name: "SubstitutedAccount",
            type: {
                kind: "struct",
                fields: [
                    { name: "complex", type: { array: ["u8", 8] } },
                    { name: "simple", type: { array: ["u8", 32] } } // Replaced "publicKey"
                ]
            }
        }]
    };
    const coder = new anchor.BorshAccountsCoder(separatedIdl);
    console.log("✅ Substituted Types instantiated!");

    // Attempt to decode
    const discriminator = anchor.utils.sha256.hash("account:SubstitutedAccount").slice(0, 16); // first 8 bytes hex
    const data = Buffer.concat([
        Buffer.from(discriminator, 'hex'),
        Buffer.alloc(8), // complex: [u8; 8]
        Buffer.alloc(32) // simple: [u8; 32]
    ]);

    try {
        coder.decode("SubstitutedAccount", data);
        console.log("✅ Substituted Types DECODED!");
    } catch (decodeErr) {
        console.error("❌ Substituted Types DECODE failed:", decodeErr);
    }

} catch (e) {
    console.error("❌ Substituted Types failed:", e);
}

try {
    console.log("TEST 7: Substitute + Inject Discriminator");
    const disc = anchor.utils.sha256.hash("account:SubstitutedAccount").slice(0, 16);
    // disc is hex string, need to convert to array of numbers for IDL if it expects that?
    // Or maybe it expects a valid specific format.
    // Actually, let's look closer at what Anchor expects for 'discriminator'.
    // Usually it's not in the IDL. But if we put it there?

    // Let's try injecting it as a property.
    // Note: Anchor 0.29 didn't rely on this being in IDL. But 0.30+ might.

    // Alternative: Keep the type in 'accounts' but REMOVE the 'fields' so it's empty struct?
    // No, that changes the discriminator.

    // Strategy: 
    // 1. Calculate the discriminator locally.
    // 2. Add it to the account definition in 'accounts' list in the IDL passed to Coder.
    // We need to know the format. Array of numbers? Hex string?
    // Let's try [u8, ...].

    const discArray = Array.from(Buffer.from(disc, 'hex'));

    const separatedIdl = {
        ...idl,
        accounts: [{
            name: "SubstitutedAccount",
            discriminator: discArray // Try injecting this
        }],
        types: [{
            name: "SubstitutedAccount",
            type: {
                kind: "struct",
                fields: [
                    { name: "complex", type: { array: ["u8", 8] } },
                    { name: "simple", type: { array: ["u8", 32] } }
                ]
            }
        }]
    };

    const coder = new anchor.BorshAccountsCoder(separatedIdl);
    console.log("✅ Injected Disc Types instantiated!");

    // Attempt to decode
    const data = Buffer.concat([
        Buffer.from(disc, 'hex'),
        Buffer.alloc(8),
        Buffer.alloc(32)
    ]);

    coder.decode("SubstitutedAccount", data);
    console.log("✅ Injected Disc Types DECODED!");
} catch (e) {
    console.error("❌ Injected Disc Types failed:", e);
}

try { // Test 5: Check if it requires discriminator in account
    console.log("TEST 5: Separated + Discriminator");
    // Anchor usually doesn't need explicit discriminator in IDL for Coder... 
    // unless checking for "Account not found" implies it filters by expected vs provided?
    // No, Coder constructor builds layout.
} catch (e) { }
