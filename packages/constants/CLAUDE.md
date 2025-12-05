# Constants Package

Shared constants and configuration values for the Prediction Copilot monorepo.

## Purpose

To ensure consistency across the backend, frontend, and anchor-client packages by centralizing:
- Program IDs and Network Addresses
- Token Mints (USDC)
- Fee Configurations
- Computation Parameters

## Usage

```typescript
import { USDC_DECIMALS, PROGRAM_ID } from '@packages/constants';
```

## Contents

- **Addresses**: `PROGRAM_ID`, `USDC_MINT`, `PYTH_FEED_ID`
- **Fees**: `PLATFORM_FEE_BASIS_POINTS`
- **Limits**: `MAX_MARKET_ID_LENGTH`
- **Timeouts**: `PYTH_MAX_AGE`
