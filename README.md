# Prediction Copilot

> Solana-native prediction market intelligence platform powered by Polymarket data and Pyth oracles

A decentralized marketplace for prediction signals where analysts can publish quantitative market analysis on-chain and monetize their insights through USDC-based access control.

## 🎯 Overview

Prediction Copilot combines three key layers:

1. **Intelligence Layer** - Aggregates Polymarket data and computes quantitative signals (z-score, momentum, volatility)
2. **Attestation Layer** - Records predictions on-chain with Pyth oracle price snapshots for immutable proof
3. **Marketplace Layer** - USDC-based signal marketplace with on-chain access control

Built for the MBC Hackathon targeting Solana + Polymarket + Circle/USDC bounties.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│              React + Vite + Tailwind CSS                     │
│         Wallet Adapter + Anchor Client                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├─────────────────┬────────────────────────┐
                   ▼                 ▼                        ▼
         ┌─────────────────┐ ┌──────────────┐    ┌──────────────────┐
         │  Solana Program │ │   Backend    │    │   Polymarket     │
         │  (Anchor/Rust)  │ │  (Node.js)   │    │      API         │
         │                 │ │              │    │                  │
         │ • Analyst PDAs  │ │ • REST API   │    │ • Market Data    │
         │ • Signal PDAs   │ │ • Indexer    │    │ • Price History  │
         │ • USDC Payments │ │ • Signals    │    │                  │
         │ • Pyth Oracle   │ │ • PostgreSQL │    │                  │
         └─────────────────┘ └──────────────┘    └──────────────────┘
```

## 📦 Project Structure

```
PolyTerminal/
├── apps/
│   ├── frontend/          # React application
│   └── backend/           # Node.js API + Indexer
├── packages/
│   ├── anchor-client/     # Generated Anchor types & client
│   ├── constants/         # Shared constants
│   └── shared-types/      # TypeScript types
└── program/               # Anchor program (Rust)
    └── programs/
        └── prediction-copilot/
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Rust and Anchor CLI (for contract development)
- Solana CLI (for deployment)
- PostgreSQL (for backend)

### Installation

```bash
# Install dependencies for all workspaces
pnpm install

# Install frontend dependencies only
cd apps/frontend && npm install
```

### Running the Frontend

```bash
# From project root
cd apps/frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Running the Full Stack (when backend is ready)

```bash
# From project root
pnpm run dev
```

This will start:
- Frontend on `http://localhost:5173`
- Backend API on `http://localhost:3001`

### Environment Setup

#### Frontend (.env)
```bash
cd apps/frontend
cp .env.example .env
# Edit .env with your values
```

Required variables:
- `VITE_SOLANA_RPC_URL` - Solana RPC endpoint (devnet)
- `VITE_PROGRAM_ID` - Deployed Anchor program ID
- `VITE_USDC_MINT` - USDC mint address
- `VITE_API_URL` - Backend API URL

#### Backend (.env)
```bash
cd apps/backend
cp .env.example .env
# Edit .env with your values
```

Required variables:
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `PROGRAM_ID` - Deployed Anchor program ID
- `DATABASE_URL` - PostgreSQL connection string
- `POLYMARKET_API_URL` - Polymarket API base URL

## 🔧 Development

### Frontend Development

```bash
cd apps/frontend
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
```

### Backend Development (when implemented)

```bash
cd apps/backend
npm run dev          # Start API server
npm run indexer      # Start event indexer
npm run db:migrate   # Run database migrations
```

### Anchor Program Development (when implemented)

```bash
cd program
anchor build         # Compile program
anchor test          # Run tests
anchor deploy        # Deploy to configured cluster
```

## 📚 Documentation

- [Root CLAUDE.md](./CLAUDE.md) - Complete project documentation
- [Frontend CLAUDE.md](./apps/frontend/CLAUDE.md) - Frontend architecture
- [Backend CLAUDE.md](./apps/backend/CLAUDE.md) - Backend architecture
- [Program CLAUDE.md](./program/CLAUDE.md) - Anchor program details
- [Implementation Plan](./docs/implementation_plan.md) - Detailed implementation roadmap

## 🎨 Features

### Current (Frontend MVP)
- ✅ Market browsing interface
- ✅ Signal list with metrics display
- ✅ Analyst leaderboard
- ✅ Wallet connection (Solana)
- ✅ Premium dark theme UI

### Planned
- ⏳ On-chain signal publishing
- ⏳ USDC-based signal marketplace
- ⏳ Pyth oracle price verification
- ⏳ Real-time event indexing
- ⏳ Signal computation (z-score, momentum, volatility)
- ⏳ Polymarket data integration

## 🛠️ Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Solana Wallet Adapter
- TanStack Query

**Backend:**
- Node.js + TypeScript
- Express
- PostgreSQL
- WebSocket

**Blockchain:**
- Solana (Devnet)
- Anchor Framework
- Pyth Network
- SPL Token (USDC)

**External APIs:**
- Polymarket CLOB API

## 📝 Current Status

**Project Completion: ~25%**

- ✅ Frontend UI (90%)
- ⏳ Anchor Program (0% - planned)
- ⏳ Backend Services (0% - planned)
- ⏳ Integration (0%)

See [implementation_plan.md](./docs/implementation_plan.md) for detailed roadmap.

## 🤝 Contributing

This is a hackathon project. For development guidelines, see the CLAUDE.md files in each component directory.

## 📄 License

MIT

## 🔗 Links

- [Solana Docs](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Pyth Network](https://pyth.network/)
- [Polymarket](https://polymarket.com/)
