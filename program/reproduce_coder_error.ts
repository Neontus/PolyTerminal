import * as anchor from "@coral-xyz/anchor";
import fs from 'fs';
import path from 'path';

// Load IDL manually since we are in node environment
const idlPath = path.resolve(__dirname, '../apps/frontend/src/idl/idl.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

console.log("Original IDL accounts:", idl.accounts.map((a: any) => a.name));

// Simulate the filtering logic from usePythSignals.ts
const filteredPythSignalIdl = {
  ...idl,
  accounts: idl.accounts.filter((acc: any) => acc.name === 'PythSignal'),
  types: idl.types
};
console.log("Filtered Pyth IDL accounts:", filteredPythSignalIdl.accounts.map((a: any) => a.name));

try {
  console.log("Attempting to instantiate Coder for PythSignal...");
  const coder = new anchor.BorshAccountsCoder(filteredPythSignalIdl as any);
  console.log("✅ PythSignal Coder instantiated successfully!");
} catch (e) {
  console.error("❌ PythSignal Coder failed:", e);
}

console.log("---------------------------------------------------");

// Simulate the filtering logic from useWhaleTraders.ts
const filteredTraderIdl = {
  ...idl,
  accounts: idl.accounts.filter((acc: any) => acc.name === 'TrackedTrader'),
  types: idl.types
};
console.log("Filtered Trader IDL accounts:", filteredTraderIdl.accounts.map((a: any) => a.name));

try {
  console.log("Attempting to instantiate Coder for TrackedTrader...");
  const coder = new anchor.BorshAccountsCoder(filteredTraderIdl as any);
  console.log("✅ TrackedTrader Coder instantiated successfully!");
} catch (e) {
  console.error("❌ TrackedTrader Coder failed:", e);
}
