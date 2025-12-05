# PolyTerminal

Welcome to **PolyTerminal**, a professional-grade trading interface for prediction markets.

## Table of Contents
1. [Project Description](#project-description)
2. [Technical Summary](#technical-summary)
   - [Architecture](#architecture)
   - [Key Features](#key-features)
3. [Setup & Installation](#setup--installation)

---

## Project Description
PolyTerminal builds a bridge between the wild west of prediction markets and the sophisticated tooling of traditional finance. While platforms like Polymarket have revolutionized information trading, their interfaces often cater to casual betting rather than serious analysis. PolyTerminal is the answer for power users—a "Bloomberg Terminal" for the prediction economy.

It unifies real-time price action from Polymarket's CLOB, on-chain whale tracking from the Solana blockchain, and advanced technical analysis into a single, high-performance dashboard. Traders can visualize market trends with granular charts, detect volume anomalies, and track "smart money" movements in real-time. By treating outcome shares as financial assets with deep analytical needs, PolyTerminal empowers traders to make data-driven decisions in an increasingly complex market.

---

## Technical Summary

PolyTerminal is a modern, full-stack application architected for speed and data density.

### Architecture
*   **Frontend**: Built with **React**, **TypeScript**, and **Vite**, utilizing **Tailwind CSS** for a responsive, dark-mode-first UI. Data state is managed via custom hooks (`usePolymarket`, `useWhaleMovements`) that abstract complex polling and normalization logic.
*   **Backend**: A **Node.js/Express** service acting as an intelligent aggregator. It unifies data from:
    *   **Polymarket CLOB API**: For order book depth and real-time execution.
    *   **Gamma API**: For market metadata and search.
    *   **Pyth Oracles**: For high-fidelity off-chain price feeds.
*   **Blockchain**: A custom **Solana** program (written in **Rust** using the **Anchor** framework) tracks "Whale" entities, allowing decentralized registration and monitoring of high-impact traders.

### Key Features
*   **Hybrid Data Fetching**: Seamlessly stitches together on-chain and off-chain data sources.
*   **Advanced Charting**: Custom `Recharts` implementation supporting granular timeframes and technical overlays (RSI, MACD, Bollinger Bands).
*   **Signal Engine**: Client-side analysis engine that computes technical indicators in real-time based on price history.
*   **Whale Tracking**: Dedicated pipeline to monitor and display large-value transactions from known sophisticated actors.

---

## Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   pnpm
*   Rust / Anchor (for smart contracts)

### Running Locally
1.  **Install Dependencies**
    ```bash
    pnpm install
    ```

2.  **Start Backend**
    ```bash
    pnpm --filter backend run dev
    ```

3.  **Start Frontend**
    ```bash
    pnpm --filter frontend run dev
    ```

4.  **Open Browser**
    Navigate to `http://localhost:5173` to launch the terminal.
