# Frontend App

React + Vite application for the Prediction Copilot marketplace.

## Architecture

```
src/
├── components/         # Reusable UI components
├── pages/              # Route components
├── hooks/              # Custom React hooks (useSignal, useAnalyst)
├── services/           # API clients and Anchor interaction
├── types/              # Frontend-specific types
└── utils/              # Helper functions
```

## Tech Stack

- **Framework**: React + Vite
- **Styling**: TailwindCSS (via PostCSS)
- **State Management**: Zustand
- **Solana**: @solana/wallet-adapter, @coral-xyz/anchor
- **Data Fetching**: React Query (TanStack Query)

## Development

### Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
```

### Environment Variables

See `.env.example`:
- `VITE_SOLANA_RPC_URL`: Solana RPC endpoint
- `VITE_PROGRAM_ID`: Anchor program ID
- `VITE_USDC_MINT`: USDC mint address
- `VITE_API_URL`: Backend API URL

## Integration Points

### Wallet Connection
Uses `@solana/wallet-adapter-react` to manage wallet state.
Components should use `useWallet()` to access the connected wallet.

### Anchor Program
Interacts with the on-chain program using the client from `@packages/anchor-client`.
Use `useAnchorProgram()` hook (to be implemented) for easy access.

### Backend API
Fetches off-chain data (market lists, analyst stats) from the backend API.
Use `fetch` or `axios` with React Query for caching and state management.

## Key Features

- **Market Browsing**: List markets from Polymarket (via backend).
- **Signal Publishing**: Form to publish a new signal (requires wallet signature).
- **Signal Purchasing**: Unlock signals using USDC (requires wallet signature).
- **Dashboard**: View purchased signals and analyst performance.
