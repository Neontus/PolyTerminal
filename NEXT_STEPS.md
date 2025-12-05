# Next Steps After Deployment

## ✅ Completed
- Program deployed to Devnet
- Program ID: `EFTzno3x2oUc2QhVEQRupcx8FLTWiN7bNc1RvgNu621D`
- Configuration files updated

## 📥 Download IDL from Solana Playground

1. In Solana Playground, look in the file explorer for:
   - `target/idl/prediction_copilot.json`
   
2. Download this file

3. Save it to your project:
   ```bash
   # Create the directory if it doesn't exist
   mkdir -p /Users/junokim/Desktop/Code/PolyTerminal/frontend/src/idl
   
   # Move the downloaded file there
   mv ~/Downloads/prediction_copilot.json /Users/junokim/Desktop/Code/PolyTerminal/frontend/src/idl/
   ```

## 🔧 Initialize Program (Required Before Use)

Before the frontend can interact with the program, you need to initialize it:

```bash
cd /Users/junokim/Desktop/Code/PolyTerminal/program

# Make sure you have Devnet SOL
solana airdrop 2 --url devnet

# Run admin initialization
npx ts-node tests/admin-actions.ts
```

This will:
- Initialize program config (set subscription prices, treasury address)
- Initialize whale registry
- Add initial tracked traders (optional)
- Publish test signals (optional)

## 🧪 Test the Program

```bash
# Test user subscription flow
npx ts-node tests/user-actions.ts
```

## 🚀 Run Your Frontend

```bash
cd /Users/junokim/Desktop/Code/PolyTerminal/frontend
npm run dev
```

Your frontend will now be able to:
- Connect to the deployed program
- Show subscription tiers
- Process USDC payments
- Display whale signals
- Show Pyth anomalies

## 📍 Important Addresses

- **Program ID**: `EFTzno3x2oUc2QhVEQRupcx8FLTWiN7bNc1RvgNu621D`
- **Network**: Devnet
- **USDC Mint**: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- **RPC**: `https://api.devnet.solana.com`
